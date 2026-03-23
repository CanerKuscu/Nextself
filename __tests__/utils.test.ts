import { ValidationUtils } from '@nextself/shared';
import { SecurityUtils } from '../utils/security';

describe('ValidationUtils', () => {
    describe('validateEmail', () => {
        it('should validate correct email', () => {
            const result = ValidationUtils.validateEmail('test@example.com');
            expect(result.isValid).toBe(true);
            expect(result.errors).toHaveLength(0);
        });

        it('should reject invalid email', () => {
            const result = ValidationUtils.validateEmail('invalid-email');
            expect(result.isValid).toBe(false);
            expect(result.errors).toContain('Please enter a valid email address');
        });

        it('should reject empty email', () => {
            const result = ValidationUtils.validateEmail('');
            expect(result.isValid).toBe(false);
            expect(result.errors).toContain('Email is required');
        });
    });

    describe('validatePassword', () => {
        it('should validate strong password', () => {
            const result = ValidationUtils.validatePassword('StrongPass123!');
            expect(result.isValid).toBe(true);
            expect(result.errors).toHaveLength(0);
        });

        it('should reject weak password', () => {
            const result = ValidationUtils.validatePassword('weak');
            expect(result.isValid).toBe(false);
            expect(result.errors).toContain('Password must be at least 8 characters long');
        });

        it('should reject password without uppercase', () => {
            const result = ValidationUtils.validatePassword('lowercase1!');
            expect(result.isValid).toBe(false);
            expect(result.errors).toContain('Password must contain at least one uppercase letter');
        });

        it('should reject password without special character', () => {
            const result = ValidationUtils.validatePassword('StrongPass1');
            expect(result.isValid).toBe(false);
            expect(result.errors).toContain('Password must contain at least one special character');
        });

        it('should reject empty password', () => {
            const result = ValidationUtils.validatePassword('');
            expect(result.isValid).toBe(false);
            expect(result.errors).toContain('Password is required');
        });
    });

    describe('validateUsername', () => {
        it('should validate valid username', () => {
            const result = ValidationUtils.validateUsername('user123');
            expect(result.isValid).toBe(true);
            expect(result.errors).toHaveLength(0);
        });

        it('should reject username starting with number', () => {
            const result = ValidationUtils.validateUsername('123user');
            expect(result.isValid).toBe(false);
            expect(result.errors).toContain('Username cannot start with a number');
        });

        it('should reject short username', () => {
            const result = ValidationUtils.validateUsername('ab');
            expect(result.isValid).toBe(false);
            expect(result.errors).toContain('Username must be at least 3 characters long');
        });

        it('should reject long username', () => {
            const result = ValidationUtils.validateUsername('a'.repeat(21));
            expect(result.isValid).toBe(false);
            expect(result.errors).toContain('Username must be no more than 20 characters long');
        });

        it('should reject username with special characters', () => {
            const result = ValidationUtils.validateUsername('user@name!');
            expect(result.isValid).toBe(false);
            expect(result.errors).toContain('Username can only contain letters, numbers, and underscores');
        });

        it('should accept username with underscores', () => {
            const result = ValidationUtils.validateUsername('user_name');
            expect(result.isValid).toBe(true);
        });

        it('should reject empty username', () => {
            const result = ValidationUtils.validateUsername('');
            expect(result.isValid).toBe(false);
            expect(result.errors).toContain('Username is required');
        });
    });

    describe('validateName', () => {
        it('should validate valid name', () => {
            const result = ValidationUtils.validateName('John');
            expect(result.isValid).toBe(true);
        });

        it('should reject short name', () => {
            const result = ValidationUtils.validateName('J');
            expect(result.isValid).toBe(false);
        });

        it('should accept hyphenated names', () => {
            const result = ValidationUtils.validateName("Jean-Pierre");
            expect(result.isValid).toBe(true);
        });

        it('should reject names with numbers', () => {
            const result = ValidationUtils.validateName('John123');
            expect(result.isValid).toBe(false);
        });

        it('should use custom field name in error', () => {
            const result = ValidationUtils.validateName('', 'First name');
            expect(result.errors).toContain('First name is required');
        });
    });

    describe('validateHeight', () => {
        it('should validate normal height', () => {
            const result = ValidationUtils.validateHeight('175');
            expect(result.isValid).toBe(true);
        });

        it('should reject too short height', () => {
            const result = ValidationUtils.validateHeight('30');
            expect(result.isValid).toBe(false);
            expect(result.errors).toContain('Height must be at least 50 cm');
        });

        it('should reject too tall height', () => {
            const result = ValidationUtils.validateHeight('350');
            expect(result.isValid).toBe(false);
            expect(result.errors).toContain('Height must be no more than 300 cm');
        });

        it('should reject non-numeric height', () => {
            const result = ValidationUtils.validateHeight('abc');
            expect(result.isValid).toBe(false);
            expect(result.errors).toContain('Height must be a valid number');
        });
    });

    describe('validateWeight', () => {
        it('should validate normal weight', () => {
            const result = ValidationUtils.validateWeight('75');
            expect(result.isValid).toBe(true);
        });

        it('should reject too low weight', () => {
            const result = ValidationUtils.validateWeight('10');
            expect(result.isValid).toBe(false);
            expect(result.errors).toContain('Weight must be at least 20 kg');
        });

        it('should reject too high weight', () => {
            const result = ValidationUtils.validateWeight('600');
            expect(result.isValid).toBe(false);
            expect(result.errors).toContain('Weight must be no more than 500 kg');
        });
    });

    describe('validateDateOfBirth', () => {
        it('should validate valid date of birth', () => {
            const result = ValidationUtils.validateDateOfBirth('2000-01-01');
            expect(result.isValid).toBe(true);
        });

        it('should reject underage user', () => {
            const today = new Date();
            const underageDate = new Date(today.getFullYear() - 10, today.getMonth(), today.getDate());
            const result = ValidationUtils.validateDateOfBirth(underageDate.toISOString().split('T')[0]);
            expect(result.isValid).toBe(false);
            expect(result.errors).toContain('You must be at least 13 years old');
        });

        it('should reject empty date', () => {
            const result = ValidationUtils.validateDateOfBirth('');
            expect(result.isValid).toBe(false);
            expect(result.errors).toContain('Date of birth is required');
        });

        it('should reject invalid date string', () => {
            const result = ValidationUtils.validateDateOfBirth('not-a-date');
            expect(result.isValid).toBe(false);
        });
    });

    describe('validateCalorieTarget', () => {
        it('should validate normal calorie target', () => {
            const result = ValidationUtils.validateCalorieTarget('2000');
            expect(result.isValid).toBe(true);
        });

        it('should reject too low calorie target', () => {
            const result = ValidationUtils.validateCalorieTarget('500');
            expect(result.isValid).toBe(false);
            expect(result.errors).toContain('Calorie target must be at least 800 calories');
        });

        it('should reject too high calorie target', () => {
            const result = ValidationUtils.validateCalorieTarget('6000');
            expect(result.isValid).toBe(false);
            expect(result.errors).toContain('Calorie target must be no more than 5000 calories');
        });
    });

    describe('sanitizeInput', () => {
        it('should escape HTML entities', () => {
            const result = ValidationUtils.sanitizeInput('<script>alert("xss")</script>');
            expect(result).not.toContain('<script>');
            expect(result).toContain('&lt;');
        });

        it('should trim whitespace', () => {
            const result = ValidationUtils.sanitizeInput('  hello  ');
            expect(result).toBe('hello');
        });

        it('should return empty string for empty input', () => {
            const result = ValidationUtils.sanitizeInput('');
            expect(result).toBe('');
        });
    });

    describe('validateRegistrationForm', () => {
        const validForm = {
            username: 'testuser',
            firstName: 'John',
            lastName: 'Doe',
            email: 'john@example.com',
            password: 'StrongPass1!',
            confirmPassword: 'StrongPass1!',
            dateOfBirth: '2000-01-01',
            height: '175',
            weight: '75',
        };

        it('should validate a complete valid form', () => {
            const result = ValidationUtils.validateRegistrationForm(validForm);
            expect(result.isValid).toBe(true);
            expect(result.errors).toHaveLength(0);
        });

        it('should reject mismatched passwords', () => {
            const result = ValidationUtils.validateRegistrationForm({
                ...validForm,
                confirmPassword: 'DifferentPass1!',
            });
            expect(result.isValid).toBe(false);
            expect(result.errors).toContain('Passwords do not match');
        });

        it('should collect errors from all fields', () => {
            const result = ValidationUtils.validateRegistrationForm({
                username: '',
                firstName: '',
                lastName: '',
                email: '',
                password: '',
                confirmPassword: '',
                dateOfBirth: '',
                height: '',
                weight: '',
            });
            expect(result.isValid).toBe(false);
            expect(result.errors.length).toBeGreaterThan(3);
        });
    });

    describe('SQL injection validation', () => {
        it('should accept safe input', () => {
            const result = ValidationUtils.validateSQLInjection('safe input');
            expect(result.isValid).toBe(true);
            expect(result.errors).toHaveLength(0);
        });

        it('should detect SQL comment --', () => {
            const result = ValidationUtils.validateSQLInjection('test -- comment');
            expect(result.isValid).toBe(false);
            expect(result.errors).toContain('Input contains potential SQL injection characters');
        });

        it('should detect SQL comment /* */', () => {
            const result = ValidationUtils.validateSQLInjection('/* comment */');
            expect(result.isValid).toBe(false);
        });

        it('should detect semicolon', () => {
            const result = ValidationUtils.validateSQLInjection('test; DROP TABLE users');
            expect(result.isValid).toBe(false);
        });

        it('should detect excessive quotes', () => {
            const result = ValidationUtils.validateSQLInjection("''''''''");
            expect(result.isValid).toBe(false);
            expect(result.errors).toContain('Input contains excessive quotes which could indicate SQL injection attempt');
        });

        it('should escape LIKE wildcards', () => {
            const escaped = ValidationUtils.escapeLike('test%_\\');
            expect(escaped).toBe('test\\%\\_\\\\');
        });

        it('should sanitize SQL input', () => {
            const sanitized = ValidationUtils.sanitizeSQL("test'; DROP TABLE users--");
            // Expect single quotes doubled, semicolon removed, comment removed
            expect(sanitized).not.toContain(';');
            expect(sanitized).not.toContain('--');
            expect(sanitized).toContain("test''");
        });

        it('should validate and sanitize SQL', () => {
            const { sanitized, validation } = ValidationUtils.validateAndSanitizeSQL("test' OR 1=1--");
            expect(validation.isValid).toBe(false);
            expect(sanitized).not.toContain('--');
        });
    });
});

describe('SecurityUtils', () => {
    describe('encrypt and decrypt', () => {
        it('should encrypt and decrypt data correctly', () => {
            const original = 'sensitive data';
            const key = 'test-encryption-key';
            const encrypted = SecurityUtils.encrypt(original, key);
            const decrypted = SecurityUtils.decrypt(encrypted, key);
            expect(decrypted).toBe(original);
        });

        it('should produce different ciphertext for same plaintext', () => {
            const data = 'test data';
            const key = 'test-key';
            const encrypted1 = SecurityUtils.encrypt(data, key);
            const encrypted2 = SecurityUtils.encrypt(data, key);
            // CryptoJS AES uses random IV, so ciphertexts differ
            expect(encrypted1).not.toBe(encrypted2);
        });
    });

    describe('hashData', () => {
        it('should consistently hash the same data', () => {
            const data = 'someDataToHash123!';
            const hash1 = SecurityUtils.hashData(data);
            const hash2 = SecurityUtils.hashData(data);
            expect(hash1).toBe(hash2);
        });

        it('should generate different hashes for different data', () => {
            const hash1 = SecurityUtils.hashData('data1');
            const hash2 = SecurityUtils.hashData('data2');
            expect(hash1).not.toBe(hash2);
        });

        it('should return a non-empty string', () => {
            const hash = SecurityUtils.hashData('test');
            expect(typeof hash).toBe('string');
            expect(hash.length).toBeGreaterThan(0);
        });
    });

    describe('generateSecureToken', () => {
        it('should generate token of specified length', () => {
            const token = SecurityUtils.generateSecureToken(16);
            expect(token).toHaveLength(16);
        });

        it('should generate default 32-char token', () => {
            const token = SecurityUtils.generateSecureToken();
            expect(token).toHaveLength(32);
        });

        it('should only contain alphanumeric characters', () => {
            const token = SecurityUtils.generateSecureToken(100);
            expect(/^[a-zA-Z0-9]+$/.test(token)).toBe(true);
        });
    });

    describe('validatePasswordStrength', () => {
        it('should give 100 score for strong password', () => {
            const result = SecurityUtils.validatePasswordStrength('StrongP@ss1');
            expect(result.score).toBe(100);
            expect(result.feedback).toHaveLength(0);
        });

        it('should give lower score for weak password', () => {
            const result = SecurityUtils.validatePasswordStrength('weak');
            expect(result.score).toBeLessThan(100);
            expect(result.feedback.length).toBeGreaterThan(0);
        });

        it('should provide feedback for missing criteria', () => {
            const result = SecurityUtils.validatePasswordStrength('alllowercase');
            expect(result.feedback).toContain('Password should contain at least one uppercase letter');
            expect(result.feedback).toContain('Password should contain at least one number');
            expect(result.feedback).toContain('Password should contain at least one special character');
        });
    });

    describe('sanitizeInput', () => {
        it('should remove script tags', () => {
            const result = SecurityUtils.sanitizeInput('<script>alert(1)</script>Clean');
            expect(result).not.toContain('<script>');
        });

        it('should remove event handlers', () => {
            const result = SecurityUtils.sanitizeInput('<img onerror="hack()">');
            expect(result).not.toContain('onerror');
        });

        it('should remove javascript protocol', () => {
            const result = SecurityUtils.sanitizeInput('javascript:alert(1)');
            expect(result).not.toContain('javascript:');
        });
    });

    describe('validateApiRequest', () => {
        it('should accept clean request', () => {
            const result = SecurityUtils.validateApiRequest({
                method: 'GET',
                url: '/api/users',
            });
            expect(result).toBe(true);
        });

        it('should reject request with script in URL', () => {
            const result = SecurityUtils.validateApiRequest({
                method: 'GET',
                url: '/api/<script>alert(1)</script>',
            });
            expect(result).toBe(false);
        });

        it('should reject request with suspicious body', () => {
            const result = SecurityUtils.validateApiRequest({
                method: 'POST',
                url: '/api/data',
                body: 'document.cookie',
            });
            expect(result).toBe(false);
        });

        it('should reject request with malicious headers', () => {
            const result = SecurityUtils.validateApiRequest({
                method: 'GET',
                url: '/api/data',
                headers: { 'X-Custom': 'javascript:void(0)' },
            });
            expect(result).toBe(false);
        });
    });

    describe('createRateLimiter', () => {
        it('should allow requests under the limit', () => {
            const limiter = SecurityUtils.createRateLimiter(3, 60000);
            expect(limiter.isAllowed()).toBe(true);
            expect(limiter.isAllowed()).toBe(true);
            expect(limiter.isAllowed()).toBe(true);
        });

        it('should block requests over the limit', () => {
            const limiter = SecurityUtils.createRateLimiter(2, 60000);
            limiter.isAllowed();
            limiter.isAllowed();
            expect(limiter.isAllowed()).toBe(false);
        });
    });

    describe('isCommonPassword', () => {
        it('should detect common passwords', () => {
            expect(SecurityUtils.isCommonPassword('password')).toBe(true);
            expect(SecurityUtils.isCommonPassword('123456')).toBe(true);
            expect(SecurityUtils.isCommonPassword('qwerty')).toBe(true);
        });

        it('should accept uncommon passwords', () => {
            expect(SecurityUtils.isCommonPassword('xK9#mP2$vL')).toBe(false);
        });

        it('should be case-insensitive', () => {
            expect(SecurityUtils.isCommonPassword('PASSWORD')).toBe(true);
            expect(SecurityUtils.isCommonPassword('Qwerty')).toBe(true);
        });
    });

    describe('validateCSRFToken', () => {
        it('should validate matching tokens', () => {
            expect(SecurityUtils.validateCSRFToken('token123', 'token123')).toBe(true);
        });

        it('should reject mismatched tokens', () => {
            expect(SecurityUtils.validateCSRFToken('token1', 'token2')).toBe(false);
        });

        it('should reject empty tokens', () => {
            expect(SecurityUtils.validateCSRFToken('', 'token')).toBe(false);
            expect(SecurityUtils.validateCSRFToken('token', '')).toBe(false);
        });
    });

    describe('validateSession', () => {
        it('should accept valid session', () => {
            const result = SecurityUtils.validateSession({
                token: 'valid-token-string-here',
                expiresAt: Date.now() + 3600000,
                userId: 'user-123',
            });
            expect(result).toBe(true);
        });

        it('should reject expired session', () => {
            const result = SecurityUtils.validateSession({
                token: 'valid-token-string-here',
                expiresAt: Date.now() - 1000,
                userId: 'user-123',
            });
            expect(result).toBe(false);
        });

        it('should reject session with short token', () => {
            const result = SecurityUtils.validateSession({
                token: 'short',
                expiresAt: Date.now() + 3600000,
                userId: 'user-123',
            });
            expect(result).toBe(false);
        });

        it('should reject session with empty userId', () => {
            const result = SecurityUtils.validateSession({
                token: 'valid-token-string-here',
                expiresAt: Date.now() + 3600000,
                userId: '',
            });
            expect(result).toBe(false);
        });
    });

    describe('validateEmailSecure', () => {
        it('should validate normal email as low risk', () => {
            const result = SecurityUtils.validateEmailSecure('user@gmail.com');
            expect(result.isValid).toBe(true);
            expect(result.risk).toBe('low');
            expect(result.isDisposable).toBe(false);
        });

        it('should flag disposable email as high risk', () => {
            const result = SecurityUtils.validateEmailSecure('test@mailinator.com');
            expect(result.isValid).toBe(true);
            expect(result.isDisposable).toBe(true);
            expect(result.risk).toBe('high');
        });

        it('should reject invalid email format', () => {
            const result = SecurityUtils.validateEmailSecure('not-an-email');
            expect(result.isValid).toBe(false);
            expect(result.risk).toBe('high');
        });
    });
});
