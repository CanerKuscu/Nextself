import { computeMacroProgress } from '../utils/nutritionProgress';

describe('computeMacroProgress', () => {
    it('reports a normal mid-way progress fraction when goal is positive', () => {
        const result = computeMacroProgress(50, 100);
        expect(result.hasGoal).toBe(true);
        expect(result.progressFraction).toBe(0.5);
    });

    it('caps the fraction at 1 when value exceeds goal', () => {
        const result = computeMacroProgress(250, 100);
        expect(result.progressFraction).toBe(1);
    });

    it('returns no-goal + zero fraction when goal is 0 (regression: previously showed 100%)', () => {
        // Before the fix, MacroBar substituted safeGoal=1 when goal<=0 — so any
        // logged calories would render as 100% even though no goal was set.
        const result = computeMacroProgress(125, 0);
        expect(result.hasGoal).toBe(false);
        expect(result.progressFraction).toBe(0);
    });

    it('returns no-goal when goal is negative', () => {
        const result = computeMacroProgress(50, -5);
        expect(result.hasGoal).toBe(false);
        expect(result.progressFraction).toBe(0);
    });

    it('returns no-goal when goal is NaN', () => {
        const result = computeMacroProgress(50, Number.NaN);
        expect(result.hasGoal).toBe(false);
        expect(result.progressFraction).toBe(0);
    });

    it('returns no-goal when goal is non-numeric', () => {
        const result = computeMacroProgress(50, '120' as unknown as number);
        expect(result.hasGoal).toBe(false);
        expect(result.progressFraction).toBe(0);
    });

    it('treats non-finite value as 0', () => {
        const result = computeMacroProgress(Number.NaN, 100);
        expect(result.hasGoal).toBe(true);
        expect(result.progressFraction).toBe(0);
    });

    it('treats non-numeric value as 0', () => {
        const result = computeMacroProgress(undefined, 100);
        expect(result.progressFraction).toBe(0);
    });
});
