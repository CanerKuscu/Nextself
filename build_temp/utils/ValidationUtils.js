"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ValidationUtils = void 0;
class ValidationUtils {
    /**
     * Sanitizes user input to prevent prompt injection attacks.
     * Removes potentially harmful instructions or commands.
     * @param input The user-provided string to sanitize.
     * @returns A sanitized string.
     */
    static sanitizeInput(input) {
        const forbiddenPatterns = [
            /ignore\s+previous\s+instructions/gi,
            /system:/gi,
            /output\s+as\s+raw\s+code/gi,
            /\{\{.*?\}\}/g, // Template injection
        ];
        let sanitized = input;
        forbiddenPatterns.forEach((pattern) => {
            sanitized = sanitized.replace(pattern, "");
        });
        // Trim excessive whitespace
        return sanitized.trim();
    }
    /**
     * Validates input length and type.
     * @param input The user-provided input.
     * @param maxLength Maximum allowed length.
     * @returns True if valid, false otherwise.
     */
    static validateLength(input, maxLength) {
        return typeof input === "string" && input.length <= maxLength;
    }
    /**
     * Validates an array of strings for length and sanitization.
     * @param inputs Array of user-provided strings.
     * @param maxLength Maximum allowed length for each string.
     * @returns An array of sanitized strings.
     */
    static validateAndSanitizeArray(inputs, maxLength) {
        return inputs.map((input) => {
            if (!this.validateLength(input, maxLength)) {
                throw new Error(`Input exceeds maximum length of ${maxLength} characters.`);
            }
            return this.sanitizeInput(input);
        });
    }
}
exports.ValidationUtils = ValidationUtils;
