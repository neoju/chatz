import { describe, it, expect } from 'vitest';
import { createRegisterSchema, createResetPasswordSchema } from '../password';

describe('password validation', () => {
  describe('createRegisterSchema', () => {
    const schema = createRegisterSchema();

    it('should pass with valid data', () => {
      const data = {
        email: 'test@example.com',
        nickname: 'TestUser',
        password: 'password123',
        confirmPassword: 'password123'
      };
      const result = schema.safeParse(data);
      expect(result.success).toBe(true);
    });

    it('should fail if passwords do not match', () => {
      const data = {
        email: 'test@example.com',
        nickname: 'TestUser',
        password: 'password123',
        confirmPassword: 'differentpassword'
      };
      const result = schema.safeParse(data);
      expect(result.success).toBe(false);
      if (!result.success) {
        const issue = result.error.issues.find((i) => i.path[0] === 'confirmPassword');
        expect(issue).toBeDefined();
        expect(issue?.message).toBe('Passwords do not match');
      }
    });

    it('should fail if password is too short', () => {
      const data = {
        email: 'test@example.com',
        nickname: 'TestUser',
        password: '12345',
        confirmPassword: '12345'
      };
      const result = schema.safeParse(data);
      expect(result.success).toBe(false);
      if (!result.success) {
        const issue = result.error.issues.find((i) => i.path[0] === 'password');
        expect(issue).toBeDefined();
      }
    });

    it('should fail if email is invalid', () => {
      const data = {
        email: 'notanemail',
        nickname: 'TestUser',
        password: 'password123',
        confirmPassword: 'password123'
      };
      const result = schema.safeParse(data);
      expect(result.success).toBe(false);
      if (!result.success) {
        const issue = result.error.issues.find((i) => i.path[0] === 'email');
        expect(issue).toBeDefined();
      }
    });

    it('should fail if nickname is empty', () => {
      const data = {
        email: 'test@example.com',
        nickname: '',
        password: 'password123',
        confirmPassword: 'password123'
      };
      const result = schema.safeParse(data);
      expect(result.success).toBe(false);
      if (!result.success) {
        const issue = result.error.issues.find((i) => i.path[0] === 'nickname');
        expect(issue).toBeDefined();
      }
    });
  });

  describe('createResetPasswordSchema', () => {
    const schema = createResetPasswordSchema();

    it('should pass with valid data', () => {
      const data = {
        newPassword: 'newpass123',
        confirmPassword: 'newpass123'
      };
      const result = schema.safeParse(data);
      expect(result.success).toBe(true);
    });

    it('should fail if passwords do not match', () => {
      const data = {
        newPassword: 'newpass123',
        confirmPassword: 'differentpass'
      };
      const result = schema.safeParse(data);
      expect(result.success).toBe(false);
      if (!result.success) {
        const issue = result.error.issues.find((i) => i.path[0] === 'confirmPassword');
        expect(issue).toBeDefined();
        expect(issue?.message).toBe('Passwords do not match');
      }
    });

    it('should fail if newPassword is too short', () => {
      const data = {
        newPassword: '12345',
        confirmPassword: '12345'
      };
      const result = schema.safeParse(data);
      expect(result.success).toBe(false);
      if (!result.success) {
        const issue = result.error.issues.find((i) => i.path[0] === 'newPassword');
        expect(issue).toBeDefined();
      }
    });
  });
});
