import { writable, derived } from 'svelte/store';
import { authApi } from '$lib/api/auth';
import { userApi, type UserProfile } from '$lib/api/user';
import { getToken, removeToken, setToken } from '$lib/token';
import type { LoginRequest, RegisterRequest } from '@chatz/dto';
import type { ResetPasswordRequest } from '@chatz/dto';

type AuthState = {
  user: UserProfile | null;
  loading: boolean;
  initialized: boolean;
};

function createAuthStore() {
  const { subscribe, set, update } = writable<AuthState>({
    user: null,
    loading: false,
    initialized: false
  });

  async function init() {
    if (!getToken()) {
      update((s) => ({ ...s, initialized: true }));
      return;
    }

    update((s) => ({ ...s, loading: true }));
    try {
      const user = await userApi.me();
      update((s) => ({ ...s, user, initialized: true }));
    } catch {
      removeToken();
      update((s) => ({ ...s, initialized: true }));
    } finally {
      update((s) => ({ ...s, loading: false }));
    }
  }

  async function login(data: LoginRequest) {
    const { token } = await authApi.login(data);
    setToken(token);
    const user = await userApi.me();
    set({ user, loading: false, initialized: true });
  }

  async function register(data: RegisterRequest) {
    const { token } = await authApi.register(data);
    setToken(token);
    const user = await userApi.me();
    set({ user, loading: false, initialized: true });
  }

  async function forgotPassword(email: string) {
    return authApi.forgotPassword(email);
  }

  async function resetPassword(data: ResetPasswordRequest) {
    return authApi.resetPassword(data);
  }

  function logout() {
    removeToken();
    set({ user: null, loading: false, initialized: true });
  }

  return {
    subscribe,
    init,
    login,
    register,
    forgotPassword,
    resetPassword,
    logout
  };
}

export const auth = createAuthStore();

export const isAuthenticated = derived(auth, ($auth) => $auth.user !== null);
