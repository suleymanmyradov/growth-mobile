/**
 * Tests for auth request schemas (form validation).
 */
import { describe, it, expect } from '@jest/globals';

import { LoginRequestSchema, RegisterRequestSchema, ResetPasswordRequestSchema } from '../schemas';

describe('LoginRequestSchema', () => {
  it('parses valid login data', () => {
    const parsed = LoginRequestSchema.parse({
      email: 'john@example.com',
      password: 'password123',
    });
    expect(parsed.email).toBe('john@example.com');
  });

  it('rejects invalid email', () => {
    expect(() =>
      LoginRequestSchema.parse({ email: 'not-an-email', password: 'password123' }),
    ).toThrow();
  });

  it('rejects short password', () => {
    expect(() =>
      LoginRequestSchema.parse({ email: 'john@example.com', password: 'short' }),
    ).toThrow();
  });
});

describe('RegisterRequestSchema', () => {
  it('parses valid registration data', () => {
    const parsed = RegisterRequestSchema.parse({
      username: 'johndoe',
      email: 'john@example.com',
      password: 'Password1!',
      fullName: 'John Doe',
    });
    expect(parsed.username).toBe('johndoe');
  });

  it('rejects uppercase username', () => {
    expect(() =>
      RegisterRequestSchema.parse({
        username: 'JohnDoe',
        email: 'john@example.com',
        password: 'Password1!',
        fullName: 'John Doe',
      }),
    ).toThrow();
  });

  it('rejects username starting with a number', () => {
    expect(() =>
      RegisterRequestSchema.parse({
        username: '1john',
        email: 'john@example.com',
        password: 'Password1!',
        fullName: 'John Doe',
      }),
    ).toThrow();
  });

  it('rejects short username', () => {
    expect(() =>
      RegisterRequestSchema.parse({
        username: 'ab',
        email: 'john@example.com',
        password: 'Password1!',
        fullName: 'John Doe',
      }),
    ).toThrow();
  });

  it('rejects password without uppercase', () => {
    expect(() =>
      RegisterRequestSchema.parse({
        username: 'johndoe',
        email: 'john@example.com',
        password: 'password1!',
        fullName: 'John Doe',
      }),
    ).toThrow();
  });

  it('rejects password without number', () => {
    expect(() =>
      RegisterRequestSchema.parse({
        username: 'johndoe',
        email: 'john@example.com',
        password: 'Password!',
        fullName: 'John Doe',
      }),
    ).toThrow();
  });

  it('rejects password without special character', () => {
    expect(() =>
      RegisterRequestSchema.parse({
        username: 'johndoe',
        email: 'john@example.com',
        password: 'Password1',
        fullName: 'John Doe',
      }),
    ).toThrow();
  });

  it('rejects empty fullName', () => {
    expect(() =>
      RegisterRequestSchema.parse({
        username: 'johndoe',
        email: 'john@example.com',
        password: 'Password1!',
        fullName: '',
      }),
    ).toThrow();
  });
});

describe('ResetPasswordRequestSchema', () => {
  it('parses valid reset data', () => {
    const parsed = ResetPasswordRequestSchema.parse({
      token: 'reset-token',
      newPassword: 'NewPassword1!',
    });
    expect(parsed.token).toBe('reset-token');
  });

  it('rejects empty token', () => {
    expect(() =>
      ResetPasswordRequestSchema.parse({ token: '', newPassword: 'NewPassword1!' }),
    ).toThrow();
  });

  it('rejects weak password', () => {
    expect(() =>
      ResetPasswordRequestSchema.parse({ token: 'reset-token', newPassword: 'weak' }),
    ).toThrow();
  });
});
