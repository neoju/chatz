import { vi } from "vitest";
import { writable } from "svelte/store";

export function createMockAuthStore() {
  const { subscribe, update } = writable({
    user: null,
    loading: false,
    initialized: true,
  });

  return {
    subscribe,
    init: vi.fn(),
    login: vi.fn(),
    register: vi.fn(),
    forgotPassword: vi.fn(),
    resetPassword: vi.fn(),
    logout: vi.fn(),
    // Helper to update state in tests
    setMockState: (state: Record<string, unknown>) => update((s) => ({ ...s, ...state })),
  };
}
