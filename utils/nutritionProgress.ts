export interface MacroProgressResult {
    /** True when the user has set a positive numeric goal. */
    hasGoal: boolean;
    /** Progress fraction in [0, 1]. Always 0 when there is no goal. */
    progressFraction: number;
}

/**
 * Compute the macro progress bar fraction.
 *
 * Previously the screen substituted `safeGoal = 1` when goal <= 0, which caused
 * the progress bar to fill to 100% as soon as the user logged any food — even
 * though no goal had been set. We now return `{ hasGoal: false, progressFraction: 0 }`
 * so callers can render an explicit "no goal set" state.
 */
export function computeMacroProgress(value: unknown, goal: unknown): MacroProgressResult {
    const hasGoal = typeof goal === 'number' && Number.isFinite(goal) && goal > 0;
    const safeValue = typeof value === 'number' && Number.isFinite(value) ? value : 0;
    return {
        hasGoal,
        progressFraction: hasGoal ? Math.min(safeValue / (goal as number), 1) : 0,
    };
}
