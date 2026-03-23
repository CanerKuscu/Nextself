export interface ValidationResult {
  isValid: boolean;
  errors: string[];
}

export class ValidationUtils {
  // Email validation
  static validateEmail(email: string): ValidationResult {
    const errors: string[] = [];

    if (!email) {
      errors.push('Email is required');
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      errors.push('Please enter a valid email address');
    }

    return {
      isValid: errors.length === 0,
      errors,
    };
  }

  // Password validation
  static validatePassword(password: string): ValidationResult {
    const errors: string[] = [];

    if (!password) {
      errors.push('Password is required');
    } else {
      if (password.length < 8) {
        errors.push('Password must be at least 8 characters long');
      }
      if (!/(?=.*[a-z])/.test(password)) {
        errors.push('Password must contain at least one lowercase letter');
      }
      if (!/(?=.*[A-Z])/.test(password)) {
        errors.push('Password must contain at least one uppercase letter');
      }
      if (!/(?=.*\d)/.test(password)) {
        errors.push('Password must contain at least one number');
      }
      if (!/(?=.*[@$!%*?&])/.test(password)) {
        errors.push('Password must contain at least one special character');
      }
    }

    return {
      isValid: errors.length === 0,
      errors,
    };
  }

  // Username validation
  static validateUsername(username: string): ValidationResult {
    const errors: string[] = [];

    if (!username) {
      errors.push('Username is required');
    } else {
      if (username.length < 3) {
        errors.push('Username must be at least 3 characters long');
      }
      if (username.length > 20) {
        errors.push('Username must be no more than 20 characters long');
      }
      if (!/^[a-zA-Z0-9_]+$/.test(username)) {
        errors.push('Username can only contain letters, numbers, and underscores');
      }
      if (/^[0-9]/.test(username)) {
        errors.push('Username cannot start with a number');
      }
    }

    return {
      isValid: errors.length === 0,
      errors,
    };
  }

  // Name validation
  static validateName(name: string, field: string = 'Name'): ValidationResult {
    const errors: string[] = [];

    if (!name) {
      errors.push(`${field} is required`);
    } else {
      if (name.length < 2) {
        errors.push(`${field} must be at least 2 characters long`);
      }
      if (name.length > 50) {
        errors.push(`${field} must be no more than 50 characters long`);
      }
      if (!/^[a-zA-Z\s'-]+$/.test(name)) {
        errors.push(`${field} can only contain letters, spaces, hyphens, and apostrophes`);
      }
    }

    return {
      isValid: errors.length === 0,
      errors,
    };
  }

  // Height validation
  static validateHeight(height: string): ValidationResult {
    const errors: string[] = [];

    if (!height) {
      errors.push('Height is required');
    } else {
      const heightNum = parseFloat(height);
      if (isNaN(heightNum)) {
        errors.push('Height must be a valid number');
      } else if (heightNum < 50) {
        errors.push('Height must be at least 50 cm');
      } else if (heightNum > 300) {
        errors.push('Height must be no more than 300 cm');
      }
    }

    return {
      isValid: errors.length === 0,
      errors,
    };
  }

  // Weight validation
  static validateWeight(weight: string): ValidationResult {
    const errors: string[] = [];

    if (!weight) {
      errors.push('Weight is required');
    } else {
      const weightNum = parseFloat(weight);
      if (isNaN(weightNum)) {
        errors.push('Weight must be a valid number');
      } else if (weightNum < 20) {
        errors.push('Weight must be at least 20 kg');
      } else if (weightNum > 500) {
        errors.push('Weight must be no more than 500 kg');
      }
    }

    return {
      isValid: errors.length === 0,
      errors,
    };
  }

  // Date of birth validation
  static validateDateOfBirth(dateOfBirth: string): ValidationResult {
    const errors: string[] = [];

    if (!dateOfBirth) {
      errors.push('Date of birth is required');
    } else {
      const date = new Date(dateOfBirth);
      const now = new Date();
      const minAge = 13;
      const maxAge = 120;

      if (isNaN(date.getTime())) {
        errors.push('Please enter a valid date');
      } else {
        const age = Math.floor((now.getTime() - date.getTime()) / (365.25 * 24 * 60 * 60 * 1000));

        if (age < minAge) {
          errors.push(`You must be at least ${minAge} years old`);
        } else if (age > maxAge) {
          errors.push(`Please enter a valid date of birth`);
        }
      }
    }

    return {
      isValid: errors.length === 0,
      errors,
    };
  }

  // Phone number validation
  static validatePhoneNumber(phone: string): ValidationResult {
    const errors: string[] = [];

    if (phone) {
      // Remove all non-digit characters
      const cleanPhone = phone.replace(/\D/g, '');

      if (cleanPhone.length < 10) {
        errors.push('Phone number must be at least 10 digits');
      } else if (cleanPhone.length > 15) {
        errors.push('Phone number must be no more than 15 digits');
      }
    }

    return {
      isValid: errors.length === 0,
      errors,
    };
  }

  // Calorie target validation
  static validateCalorieTarget(calories: string): ValidationResult {
    const errors: string[] = [];

    if (!calories) {
      errors.push('Calorie target is required');
    } else {
      const caloriesNum = parseInt(calories);
      if (isNaN(caloriesNum)) {
        errors.push('Calorie target must be a valid number');
      } else if (caloriesNum < 800) {
        errors.push('Calorie target must be at least 800 calories');
      } else if (caloriesNum > 5000) {
        errors.push('Calorie target must be no more than 5000 calories');
      }
    }

    return {
      isValid: errors.length === 0,
      errors,
    };
  }

  // Protein target validation
  static validateProteinTarget(protein: string): ValidationResult {
    const errors: string[] = [];

    if (!protein) {
      errors.push('Protein target is required');
    } else {
      const proteinNum = parseInt(protein);
      if (isNaN(proteinNum)) {
        errors.push('Protein target must be a valid number');
      } else if (proteinNum < 10) {
        errors.push('Protein target must be at least 10 grams');
      } else if (proteinNum > 500) {
        errors.push('Protein target must be no more than 500 grams');
      }
    }

    return {
      isValid: errors.length === 0,
      errors,
    };
  }

  // Exercise name validation
  static validateExerciseName(name: string): ValidationResult {
    const errors: string[] = [];

    if (!name) {
      errors.push('Exercise name is required');
    } else {
      if (name.length < 2) {
        errors.push('Exercise name must be at least 2 characters long');
      }
      if (name.length > 100) {
        errors.push('Exercise name must be no more than 100 characters long');
      }
    }

    return {
      isValid: errors.length === 0,
      errors,
    };
  }

  // Food item validation
  static validateFoodItem(foodItem: {
    name: string;
    calories: string;
    protein: string;
    carbs: string;
    fat: string;
  }): ValidationResult {
    const errors: string[] = [];

    // Validate name
    const nameValidation = this.validateExerciseName(foodItem.name);
    errors.push(...nameValidation.errors);

    // Validate calories
    const caloriesValidation = this.validateCalorieTarget(foodItem.calories);
    if (caloriesValidation.errors.length > 0) {
      errors.push('Calories must be a valid number between 0 and 5000');
    }

    // Validate macronutrients
    ['protein', 'carbs', 'fat'].forEach((macro) => {
      const value = foodItem[macro as keyof typeof foodItem];
      if (value) {
        const num = parseFloat(value);
        if (isNaN(num) || num < 0 || num > 1000) {
          errors.push(`${macro.charAt(0).toUpperCase() + macro.slice(1)} must be a valid number between 0 and 1000`);
        }
      }
    });

    return {
      isValid: errors.length === 0,
      errors,
    };
  }

  // Sanitize input to prevent XSS
  static sanitizeInput(input: string): string {
    if (!input) return '';
    return input
      .trim()
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#x27;')
      .replace(/\//g, '&#x2F;');
  }

  // Validate complete registration form
  static validateRegistrationForm(formData: {
    username: string;
    firstName: string;
    lastName: string;
    email: string;
    password: string;
    confirmPassword: string;
    dateOfBirth: string;
    height: string;
    weight: string;
  }): ValidationResult {
    const errors: string[] = [];

    // Validate each field
    const validations = [
      this.validateUsername(formData.username),
      this.validateName(formData.firstName, 'First name'),
      this.validateName(formData.lastName, 'Last name'),
      this.validateEmail(formData.email),
      this.validatePassword(formData.password),
      this.validateDateOfBirth(formData.dateOfBirth),
      this.validateHeight(formData.height),
      this.validateWeight(formData.weight),
    ];

    validations.forEach(validation => {
      errors.push(...validation.errors);
    });

    // Check if passwords match
    if (formData.password !== formData.confirmPassword) {
      errors.push('Passwords do not match');
    }

    return {
      isValid: errors.length === 0,
      errors,
    };
  }

  // SQL injection validation: check for dangerous SQL characters
  static validateSQLInjection(input: string): ValidationResult {
    const errors: string[] = [];
    if (!input) return { isValid: true, errors };

    // SQL injection dangerous patterns
    const dangerousPatterns = [
      /(\-\-)/g,           // SQL comment
      /(\/\*)/g,           /* SQL comment start */
      /(\*\/)/g,           /* SQL comment end */
      /(\;)/g,             // Query delimiter
      /(\b(SELECT|INSERT|UPDATE|DELETE|DROP|UNION|ALTER|CREATE|EXEC|EXECUTE|TRUNCATE)\b)/gi, // SQL keywords (optional)
      /(\b(OR|AND)\s+['"\d])/gi, // OR/AND injection
      /(\b(WHERE|SET|VALUES)\s*['"])/gi, // SQL clause injection
    ];

    // Check for single quotes, double quotes that could break queries
    const singleQuoteCount = (input.match(/'/g) || []).length;
    const doubleQuoteCount = (input.match(/"/g) || []).length;
    const semicolonCount = (input.match(/;/g) || []).length;

    // If there are too many quotes, could be injection attempt
    if (singleQuoteCount > 5 || doubleQuoteCount > 5) {
      errors.push('Input contains excessive quotes which could indicate SQL injection attempt');
    }

    // Check patterns
    dangerousPatterns.forEach((pattern, index) => {
      if (pattern.test(input)) {
        errors.push('Input contains potential SQL injection characters');
        // break after first detection
      }
    });

    return {
      isValid: errors.length === 0,
      errors,
    };
  }

  // Sanitize SQL input by escaping dangerous characters (for LIKE/ILIKE)
  static escapeLike(input: string): string {
    if (!input) return '';
    // Escape PostgreSQL LIKE/ILIKE wildcard characters: %, _, \
    return input.replace(/[%_\\]/g, '\\$&');
  }

  // Sanitize input for use in raw SQL (parameterized queries are preferred)
  static sanitizeSQL(input: string): string {
    if (!input) return '';
    // Remove or escape dangerous SQL characters (basic)
    let sanitized = input
      .replace(/'/g, "''") // Escape single quotes by doubling (for PostgreSQL)
      .replace(/\\/g, '\\\\') // Escape backslashes
      .replace(/\-\-/g, '') // Remove SQL comments
      .replace(/;/g, '') // Remove semicolons
      .replace(/\/\*/g, '') // Remove block comment start
      .replace(/\*\//g, ''); // Remove block comment end
    // Trim extra spaces
    sanitized = sanitized.trim();
    return sanitized;
  }

  // Combined validation and sanitization for SQL input
  static validateAndSanitizeSQL(input: string): { sanitized: string; validation: ValidationResult } {
    const validation = this.validateSQLInjection(input);
    const sanitized = this.sanitizeSQL(input);
    return { sanitized, validation };
  }
}
