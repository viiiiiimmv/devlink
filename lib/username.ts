export const USERNAME_PATTERN = /^[a-z][a-z0-9]*$/

export const USERNAME_VALIDATION_MESSAGE =
  'Username must start with a letter and contain only lowercase letters and numbers.'

export const normalizeUsernameInput = (value: unknown): string => {
  if (typeof value !== 'string') {
    return ''
  }

  return value.trim().toLowerCase().replace(/[^a-z0-9]/g, '')
}

export const isValidUsername = (value: string): boolean => {
  return USERNAME_PATTERN.test(value)
}
