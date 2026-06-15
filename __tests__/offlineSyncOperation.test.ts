import { processOfflineMutation, MutationRecord } from '../services/offlineSyncService';

interface ChainBuilder {
    from: jest.Mock;
    insert: jest.Mock;
    update: jest.Mock;
    delete: jest.Mock;
    select: jest.Mock;
    eq: jest.Mock;
    maybeSingle: jest.Mock;
    _result: { error: unknown };
}

function makeMockSupabase(): ChainBuilder {
    const chain: any = {
        _result: { error: null },
        from: jest.fn(),
        insert: jest.fn(),
        update: jest.fn(),
        delete: jest.fn(),
        select: jest.fn(),
        eq: jest.fn(),
        maybeSingle: jest.fn(),
    };
    chain.from.mockReturnValue(chain);
    chain.insert.mockImplementation(async () => chain._result);
    chain.update.mockReturnValue(chain);
    chain.delete.mockReturnValue(chain);
    chain.select.mockReturnValue(chain);
    chain.eq.mockImplementation(() => {
        // Allow being awaited at the end of an .update/.delete chain
        const thenable: any = Object.assign(Promise.resolve(chain._result), chain);
        return thenable;
    });
    chain.maybeSingle.mockResolvedValue({ data: null, error: null });
    return chain;
}

describe('processOfflineMutation', () => {
    let warnSpy: jest.SpyInstance;
    beforeEach(() => {
        warnSpy = jest.spyOn(console, 'warn').mockImplementation(() => undefined);
    });
    afterEach(() => {
        warnSpy.mockRestore();
    });

    it('rejects mutations without a tableName', async () => {
        const supabase = makeMockSupabase();
        const result = await processOfflineMutation(supabase as any, { operation: 'INSERT' } as MutationRecord);
        expect(result).toBe(false);
    });

    it('rejects mutations without an operation field', async () => {
        const supabase = makeMockSupabase();
        const result = await processOfflineMutation(supabase as any, { tableName: 't' } as MutationRecord);
        expect(result).toBe(false);
    });

    it('refuses unknown operations and never touches supabase (regression: previously fell through to DELETE)', async () => {
        const supabase = makeMockSupabase();
        const result = await processOfflineMutation(
            supabase as any,
            { tableName: 'profiles', operation: 'PATCH' as any, payload: { id: 'row-1' } },
            { existsById: jest.fn().mockResolvedValue(false) },
        );
        expect(result).toBe(false);
        expect(supabase.from).not.toHaveBeenCalled();
        expect(warnSpy).toHaveBeenCalledWith(expect.stringContaining('Refusing to process unknown operation'));
    });

    it('refuses empty-string operations (does not delete anything)', async () => {
        const supabase = makeMockSupabase();
        const result = await processOfflineMutation(
            supabase as any,
            { tableName: 'profiles', operation: '' as any, payload: { id: 'row-1' } },
        );
        // Empty operation string is falsy — caught by the initial guard.
        expect(result).toBe(false);
        expect(supabase.from).not.toHaveBeenCalled();
    });

    it('refuses DELETE without payload.id', async () => {
        const supabase = makeMockSupabase();
        const result = await processOfflineMutation(supabase as any, {
            tableName: 'profiles',
            operation: 'DELETE',
            payload: {},
        });
        expect(result).toBe(false);
        expect(supabase.delete).not.toHaveBeenCalled();
    });

    it('processes a DELETE with a payload.id', async () => {
        const supabase = makeMockSupabase();
        const result = await processOfflineMutation(supabase as any, {
            tableName: 'profiles',
            operation: 'DELETE',
            payload: { id: 'row-1' },
        });
        expect(result).toBe(true);
        expect(supabase.from).toHaveBeenCalledWith('profiles');
        expect(supabase.delete).toHaveBeenCalled();
        expect(supabase.eq).toHaveBeenCalledWith('id', 'row-1');
    });

    it('processes an INSERT and skips when row already exists', async () => {
        const supabase = makeMockSupabase();
        const existsById = jest.fn().mockResolvedValue(true);
        const result = await processOfflineMutation(
            supabase as any,
            { tableName: 'profiles', operation: 'INSERT', payload: { id: 'row-1' } },
            { existsById },
        );
        expect(result).toBe(true);
        expect(supabase.insert).not.toHaveBeenCalled();
        expect(existsById).toHaveBeenCalledWith(supabase, 'profiles', { id: 'row-1' });
    });

    it('runs INSERT against supabase when row does not exist', async () => {
        const supabase = makeMockSupabase();
        const existsById = jest.fn().mockResolvedValue(false);
        const result = await processOfflineMutation(
            supabase as any,
            { tableName: 'profiles', operation: 'INSERT', payload: { id: 'row-2' } },
            { existsById },
        );
        expect(result).toBe(true);
        expect(supabase.insert).toHaveBeenCalledWith({ id: 'row-2' });
    });
});
