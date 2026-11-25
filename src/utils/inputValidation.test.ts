import { describe, expect, it } from 'vitest'
import { cleanText, isTextWithin, isValidPhone } from './inputValidation'

describe('inputValidation', () => {
  it('accepts normal phone formats', () => {
    expect(isValidPhone('0971234567')).toBe(true)
    expect(isValidPhone('+260 97 1234567')).toBe(true)
  })
  it('rejects letters and short numbers', () => {
    expect(isValidPhone('abc123456789')).toBe(false)
    expect(isValidPhone('12345')).toBe(false)
  })
  it('checks text length after trimming', () => {
    expect(isTextWithin('   ', 1, 10)).toBe(false)
    expect(isTextWithin('hello', 1, 10)).toBe(true)
    expect(isTextWithin('x'.repeat(11), 1, 10)).toBe(false)
  })
  it('strips control characters', () => {
    expect(cleanText(' a\u0000b ')).toBe('ab')
  })
})
