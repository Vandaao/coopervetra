export function sanitizeString(input: string, maxLength = 255): string {
  return input.trim().substring(0, maxLength).replace(/[<>]/g, "") // Remove caracteres perigosos
}

export function validateEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
  return emailRegex.test(email)
}

export function validateUsername(username: string): { valid: boolean; error?: string } {
  if (!username || username.length < 3) {
    return { valid: false, error: "Usuário deve ter pelo menos 3 caracteres" }
  }
  if (username.length > 50) {
    return { valid: false, error: "Usuário deve ter no máximo 50 caracteres" }
  }
  if (!/^[a-zA-Z0-9_-]+$/.test(username)) {
    return { valid: false, error: "Usuário deve conter apenas letras, números, _ e -" }
  }
  return { valid: true }
}

export function validatePassword(password: string): { valid: boolean; error?: string } {
  if (!password || password.length < 6) {
    return { valid: false, error: "Senha deve ter pelo menos 6 caracteres" }
  }
  if (password.length > 100) {
    return { valid: false, error: "Senha muito longa" }
  }
  return { valid: true }
}

export function validateNumber(value: any, min?: number, max?: number): { valid: boolean; error?: string } {
  const num = Number(value)
  if (isNaN(num)) {
    return { valid: false, error: "Valor deve ser um número" }
  }
  if (min !== undefined && num < min) {
    return { valid: false, error: `Valor deve ser maior ou igual a ${min}` }
  }
  if (max !== undefined && num > max) {
    return { valid: false, error: `Valor deve ser menor ou igual a ${max}` }
  }
  return { valid: true }
}

export function validateDate(dateStr: string): { valid: boolean; error?: string } {
  const date = new Date(dateStr)
  if (isNaN(date.getTime())) {
    return { valid: false, error: "Data inválida" }
  }
  return { valid: true }
}
