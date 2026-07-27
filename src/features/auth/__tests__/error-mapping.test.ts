/**
 * Tests for auth error code → i18n key mapping.
 */
import { describe, it, expect } from '@jest/globals';

import { authErrorKey } from '../hooks';

describe('authErrorKey', () => {
  it('maps invalid_credentials', () => {
    expect(authErrorKey('invalid_credentials')).toBe('auth.errors.invalidCredentials');
  });

  it('maps unauthenticated', () => {
    expect(authErrorKey('unauthenticated')).toBe('auth.errors.invalidCredentials');
  });

  it('maps email_taken', () => {
    expect(authErrorKey('email_taken')).toBe('auth.errors.emailTaken');
  });

  it('maps email_already_exists', () => {
    expect(authErrorKey('email_already_exists')).toBe('auth.errors.emailTaken');
  });

  it('maps username_taken', () => {
    expect(authErrorKey('username_taken')).toBe('auth.errors.usernameTaken');
  });

  it('maps verification_failed', () => {
    expect(authErrorKey('verification_failed')).toBe('auth.errors.verificationFailed');
  });

  it('maps invalid_token', () => {
    expect(authErrorKey('invalid_token')).toBe('auth.errors.verificationFailed');
  });

  it('maps reset_failed', () => {
    expect(authErrorKey('reset_failed')).toBe('auth.errors.resetFailed');
  });

  it('returns null for unknown codes', () => {
    expect(authErrorKey('unknown_error')).toBeNull();
  });

  it('returns null for empty string', () => {
    expect(authErrorKey('')).toBeNull();
  });
});
