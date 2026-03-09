import { SecurityMiddleware } from '../utils/securityMiddleware';

describe('SecurityMiddleware', () => {
    describe('sanitizeInput', () => {
        it('should remove script tags from input', () => {
            const input = '<script>alert("xss")</script>Hello';
            const result = SecurityMiddleware.sanitizeInput(input);
            expect(result).toBe('Hello');
        });

        it('should remove javascript protocol from input', () => {
            const input = 'javascript:alert("xss")';
            const result = SecurityMiddleware.sanitizeInput(input);
            expect(result).toBe('');
        });

        it('should remove event handlers from input', () => {
            const input = '<img src="x" onerror="alert(1)" onclick="malicious()">';
            const result = SecurityMiddleware.sanitizeInput(input);
            expect(result).toBe('<img src="x" >');
        });

        it('should trim whitespace', () => {
            const input = '  test@example.com  ';
            const result = SecurityMiddleware.sanitizeInput(input);
            expect(result).toBe('test@example.com');
        });

        it('should return empty string for null or undefined input', () => {
            expect(SecurityMiddleware.sanitizeInput('')).toBe('');
            expect(SecurityMiddleware.sanitizeInput(null as any)).toBe('');
            expect(SecurityMiddleware.sanitizeInput(undefined as any)).toBe('');
        });

        it('should collapse multiple spaces into one', () => {
            const input = 'hello    world   test';
            const result = SecurityMiddleware.sanitizeInput(input);
            expect(result).toBe('hello world test');
        });

        it('should handle nested script tags', () => {
            const input = '<script><script>alert(1)</script></script>Safe text';
            const result = SecurityMiddleware.sanitizeInput(input);
            expect(result).not.toContain('<script');
        });

        it('should handle case-insensitive script tags', () => {
            const input = '<SCRIPT>alert(1)</SCRIPT>Clean';
            const result = SecurityMiddleware.sanitizeInput(input);
            expect(result).toBe('Clean');
        });
    });

    describe('isValidEmail', () => {
        it('should validate correct email format', () => {
            expect(SecurityMiddleware.isValidEmail('test@example.com')).toBe(true);
            expect(SecurityMiddleware.isValidEmail('user.name@domain.co.uk')).toBe(true);
            expect(SecurityMiddleware.isValidEmail('user+tag@example.com')).toBe(true);
        });

        it('should reject invalid email format', () => {
            expect(SecurityMiddleware.isValidEmail('invalid-email')).toBe(false);
            expect(SecurityMiddleware.isValidEmail('@example.com')).toBe(false);
            expect(SecurityMiddleware.isValidEmail('test@.com')).toBe(false);
            expect(SecurityMiddleware.isValidEmail('test@com')).toBe(false);
        });

        it('should reject empty string', () => {
            expect(SecurityMiddleware.isValidEmail('')).toBe(false);
        });
    });

    describe('isStrongPassword', () => {
        it('should accept strong password', () => {
            const result = SecurityMiddleware.isStrongPassword('StrongPass1!');
            expect(result.valid).toBe(true);
            expect(result.message).toBe('Password is strong');
        });

        it('should reject short password', () => {
            const result = SecurityMiddleware.isStrongPassword('Ab1!');
            expect(result.valid).toBe(false);
            expect(result.message).toContain('at least 8 characters');
        });

        it('should reject password without uppercase', () => {
            const result = SecurityMiddleware.isStrongPassword('lowercase1!');
            expect(result.valid).toBe(false);
            expect(result.message).toContain('uppercase');
        });

        it('should reject password without lowercase', () => {
            const result = SecurityMiddleware.isStrongPassword('UPPERCASE1!');
            expect(result.valid).toBe(false);
            expect(result.message).toContain('lowercase');
        });

        it('should reject password without number', () => {
            const result = SecurityMiddleware.isStrongPassword('NoNumber!@');
            expect(result.valid).toBe(false);
            expect(result.message).toContain('number');
        });

        it('should reject password without special character', () => {
            const result = SecurityMiddleware.isStrongPassword('NoSpecial1A');
            expect(result.valid).toBe(false);
            expect(result.message).toContain('special character');
        });
    });

    describe('createRateLimiter', () => {
        it('should allow requests under the limit', () => {
            const limiter = SecurityMiddleware.createRateLimiter(3, 60000);
            const mockReq = { ip: '127.0.0.1' };
            const mockRes = {
                status: jest.fn().mockReturnThis(),
                json: jest.fn(),
                setHeader: jest.fn(),
                redirect: jest.fn(),
            };
            const mockNext = jest.fn();

            // First request — should pass
            limiter(mockReq, mockRes, mockNext);
            expect(mockNext).toHaveBeenCalledTimes(1);
        });

        it('should block requests over the limit', () => {
            const limiter = SecurityMiddleware.createRateLimiter(2, 60000);
            const mockReq = { ip: '192.168.1.1' };
            const mockRes = {
                status: jest.fn().mockReturnThis(),
                json: jest.fn(),
                setHeader: jest.fn(),
                redirect: jest.fn(),
            };
            const mockNext = jest.fn();

            // First and second requests
            limiter(mockReq, mockRes, mockNext);
            limiter(mockReq, mockRes, mockNext);
            expect(mockNext).toHaveBeenCalledTimes(2);

            // Third request — should be blocked
            limiter(mockReq, mockRes, mockNext);
            expect(mockRes.status).toHaveBeenCalledWith(429);
            expect(mockRes.json).toHaveBeenCalledWith(
                expect.objectContaining({ error: 'Too many requests' })
            );
        });

        it('should set rate limit headers', () => {
            const limiter = SecurityMiddleware.createRateLimiter(10, 60000);
            const mockReq = { ip: '10.0.0.1' };
            const mockRes = {
                status: jest.fn().mockReturnThis(),
                json: jest.fn(),
                setHeader: jest.fn(),
                redirect: jest.fn(),
            };
            const mockNext = jest.fn();

            limiter(mockReq, mockRes, mockNext);

            expect(mockRes.setHeader).toHaveBeenCalledWith('X-RateLimit-Limit', 10);
            expect(mockRes.setHeader).toHaveBeenCalledWith('X-RateLimit-Remaining', expect.any(Number));
            expect(mockRes.setHeader).toHaveBeenCalledWith('X-RateLimit-Reset', expect.any(Number));
        });

        it('should track different IPs separately', () => {
            const limiter = SecurityMiddleware.createRateLimiter(1, 60000);
            const mockRes = {
                status: jest.fn().mockReturnThis(),
                json: jest.fn(),
                setHeader: jest.fn(),
                redirect: jest.fn(),
            };
            const mockNext = jest.fn();

            limiter({ ip: '1.1.1.1' }, mockRes, mockNext);
            limiter({ ip: '2.2.2.2' }, mockRes, mockNext);

            // Both should pass since they have different IPs
            expect(mockNext).toHaveBeenCalledTimes(2);
        });
    });

    describe('addSecurityHeaders', () => {
        it('should set security headers', () => {
            const mockReq = {};
            const mockRes = {
                setHeader: jest.fn(),
                status: jest.fn().mockReturnThis(),
                redirect: jest.fn()
            };
            const mockNext = jest.fn();

            SecurityMiddleware.addSecurityHeaders(mockReq, mockRes, mockNext);

            expect(mockRes.setHeader).toHaveBeenCalledWith('X-Frame-Options', 'DENY');
            expect(mockRes.setHeader).toHaveBeenCalledWith('X-Content-Type-Options', 'nosniff');
            expect(mockRes.setHeader).toHaveBeenCalledWith('X-XSS-Protection', '1; mode=block');
            expect(mockRes.setHeader).toHaveBeenCalledWith('Referrer-Policy', 'strict-origin-when-cross-origin');
            expect(mockRes.setHeader).toHaveBeenCalledWith(
                'Permissions-Policy',
                'camera=(), microphone=(), geolocation=(), payment=()'
            );
            expect(mockRes.setHeader).toHaveBeenCalledWith(
                'Content-Security-Policy',
                expect.stringContaining("default-src 'self'")
            );
            expect(mockNext).toHaveBeenCalled();
        });
    });

    describe('validateCSRFToken', () => {
        it('should validate matching tokens', () => {
            const token = 'abc123';
            expect(SecurityMiddleware.validateCSRFToken(token, token)).toBe(true);
        });

        it('should reject mismatched tokens', () => {
            expect(SecurityMiddleware.validateCSRFToken('token1', 'token2')).toBe(false);
        });

        it('should reject empty tokens', () => {
            expect(SecurityMiddleware.validateCSRFToken('', 'token')).toBe(false);
            expect(SecurityMiddleware.validateCSRFToken('token', '')).toBe(false);
            expect(SecurityMiddleware.validateCSRFToken('', '')).toBe(false);
        });

        it('should reject null/undefined tokens', () => {
            expect(SecurityMiddleware.validateCSRFToken(null as any, 'token')).toBe(false);
            expect(SecurityMiddleware.validateCSRFToken('token', null as any)).toBe(false);
        });
    });

    describe('logSecurityEvent', () => {
        it('should log security events', () => {
            const consoleSpy = jest.spyOn(console, 'log').mockImplementation();

            SecurityMiddleware.logSecurityEvent('LOGIN_ATTEMPT', { userId: '123', ip: '127.0.0.1' });

            expect(consoleSpy).toHaveBeenCalledWith(
                '[SECURITY]',
                expect.stringContaining('LOGIN_ATTEMPT'),
                expect.objectContaining({ userId: '123' })
            );

            consoleSpy.mockRestore();
        });
    });
});
