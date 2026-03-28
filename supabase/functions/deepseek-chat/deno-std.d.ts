declare module 'https://deno.land/std@0.168.0/http/server.ts' {
    export function serve(handler: (req: any) => Promise<any> | any): void;
}

declare module 'https://esm.sh/@supabase/supabase-js@2' {
    export function createClient(url: string, key: string): {
        auth: {
            getUser(token: string): Promise<{
                data: { user: unknown | null };
                error: unknown;
            }>;
        };
    };
}
