"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.HealthValidator = void 0;
class HealthValidator {
    // Define safe ranges for nutritional data
    static validateNutritionalData(data) {
        const { calories, macros } = data;
        const totalMacros = macros.p + macros.c + macros.f;
        if (calories < 0 || calories > 900) {
            console.error('Calories out of safe range:', calories);
            return false;
        }
        if (totalMacros > calories) {
            console.error('Macros exceed calorie value:', totalMacros, calories);
            return false;
        }
        return true;
    }
    // Define safe ranges for workout data
    static validateWorkoutData(data) {
        const { reps, restTime } = data;
        if (reps < 1 || reps > 500) {
            console.error('Reps out of safe range:', reps);
            return false;
        }
        if (restTime < 0 || restTime > 600) {
            console.error('Rest time out of safe range:', restTime);
            return false;
        }
        return true;
    }
    // Validate output schema using Zod
    static validateOutputSchema(schema, data) {
        try {
            return schema.parse(data);
        }
        catch (error) {
            console.error('Output schema validation failed:', error);
            return null;
        }
    }
}
exports.HealthValidator = HealthValidator;
