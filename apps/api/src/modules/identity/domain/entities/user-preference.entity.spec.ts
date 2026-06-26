import { describe, expect, it } from 'vitest';
import { UserPreference } from './user-preference.entity';

describe('UserPreference', () => {
  describe('createDefault', () => {
    it('aplica los defaults del MVP: es-PE, sin marketing, recordatorios on, onboarding off', () => {
      const p = UserPreference.createDefault({ id: 'p1', userId: 'u1' });
      expect(p.id).toBe('p1');
      expect(p.userId).toBe('u1');
      expect(p.preferredLocale).toBe('es-PE');
      expect(p.acceptsMarketing).toBe(false);
      expect(p.acceptsReminders).toBe(true);
      expect(p.onboardingCompleted).toBe(false);
    });

    it('respeta el consentimiento de marketing y el locale provistos', () => {
      const p = UserPreference.createDefault({
        id: 'p2',
        userId: 'u2',
        acceptsMarketing: true,
        preferredLocale: 'en-US',
      });
      expect(p.acceptsMarketing).toBe(true);
      expect(p.preferredLocale).toBe('en-US');
    });
  });

  describe('completeOnboarding', () => {
    it('marca el onboarding como completado', () => {
      const p = UserPreference.createDefault({ id: 'p3', userId: 'u3' });
      p.completeOnboarding();
      expect(p.onboardingCompleted).toBe(true);
    });
  });

  describe('update', () => {
    it('aplica solo los campos presentes en el patch', () => {
      const p = UserPreference.createDefault({ id: 'p4', userId: 'u4' });

      p.update({ acceptsReminders: false });
      expect(p.acceptsReminders).toBe(false);
      expect(p.acceptsMarketing).toBe(false);
      expect(p.preferredLocale).toBe('es-PE');

      p.update({ acceptsMarketing: true, preferredLocale: 'es-MX' });
      expect(p.acceptsMarketing).toBe(true);
      expect(p.preferredLocale).toBe('es-MX');
      expect(p.acceptsReminders).toBe(false);
    });

    it('un patch vacío no altera el estado', () => {
      const p = UserPreference.createDefault({ id: 'p5', userId: 'u5', acceptsMarketing: true });
      p.update({});
      expect(p.acceptsMarketing).toBe(true);
      expect(p.acceptsReminders).toBe(true);
      expect(p.preferredLocale).toBe('es-PE');
    });
  });

  it('hidrata desde persistencia', () => {
    const p = UserPreference.fromPersistence({
      id: 'p6',
      userId: 'u6',
      onboardingCompleted: true,
      acceptsMarketing: true,
      acceptsReminders: false,
      preferredLocale: 'es-PE',
      createdAt: new Date(),
      updatedAt: new Date(),
    });
    expect(p.id).toBe('p6');
    expect(p.onboardingCompleted).toBe(true);
    expect(p.acceptsReminders).toBe(false);
  });
});
