export interface ValidationResult {
  isValid: boolean
  errors: string[]
}

export function validateString(value: any, fieldName: string, maxLength: number = 1000): ValidationResult {
  const errors: string[] = []
  
  if (typeof value !== 'string') {
    errors.push(`${fieldName} must be a string`)
    return { isValid: false, errors }
  }
  
  if (value.length === 0) {
    errors.push(`${fieldName} cannot be empty`)
  }
  
  if (value.length > maxLength) {
    errors.push(`${fieldName} cannot exceed ${maxLength} characters`)
  }
  
  // Check for potential XSS patterns
  const xssPatterns = [/<script/i, /javascript:/i, /on\w+=/i]
  if (xssPatterns.some(pattern => pattern.test(value))) {
    errors.push(`${fieldName} contains potentially unsafe content`)
  }
  
  return { isValid: errors.length === 0, errors }
}

export function validateEmail(email: any): ValidationResult {
  const errors: string[] = []
  
  if (typeof email !== 'string') {
    errors.push('Email must be a string')
    return { isValid: false, errors }
  }
  
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
  if (!emailRegex.test(email)) {
    errors.push('Invalid email format')
  }
  
  return { isValid: errors.length === 0, errors }
}

export function validateNumber(value: any, fieldName: string, min: number = 0, max: number = 1000000): ValidationResult {
  const errors: string[] = []
  
  if (typeof value !== 'number') {
    errors.push(`${fieldName} must be a number`)
    return { isValid: false, errors }
  }
  
  if (value < min) {
    errors.push(`${fieldName} cannot be less than ${min}`)
  }
  
  if (value > max) {
    errors.push(`${fieldName} cannot exceed ${max}`)
  }
  
  return { isValid: errors.length === 0, errors }
}

export function sanitizeString(value: string): string {
  return value
    .trim()
    .replace(/[<>]/g, '') // Remove potential HTML tags
    .replace(/javascript:/gi, '') // Remove javascript: protocol
    .replace(/on\w+=/gi, '') // Remove event handlers
}