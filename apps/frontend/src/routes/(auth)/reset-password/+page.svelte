<script lang="ts">
  import { goto } from '$app/navigation';
  import { page } from '$app/state';
  import { auth } from '$lib/stores/auth';
  import { ApiError } from '$lib/api/api-client';

  import { Button } from '$lib/components/ui/button';
  import { Input } from '$lib/components/ui/input';
  import { Label } from '$lib/components/ui/label';

  import { createResetPasswordSchema } from '$lib/validation/password';

  const token = page.url.searchParams.get('token');

  let newPassword = $state('');
  let confirmPassword = $state('');
  let fieldErrors = $state<Record<string, string>>({});
  let apiError = $state('');
  let loading = $state(false);
  let success = $state(false);

  function validate() {
    const schema = createResetPasswordSchema();
    const result = schema.safeParse({ newPassword, confirmPassword });

    if (!result.success) {
      const map: Record<string, string> = {};

      for (const issue of result.error.issues) {
        const key = String(issue.path[0]);
        if (!map[key]) map[key] = issue.message;
      }

      fieldErrors = map;
      return false;
    }

    fieldErrors = {};

    return true;
  }

  async function handleSubmit(e: SubmitEvent) {
    e.preventDefault();
    apiError = '';

    if (!validate()) return;
    if (!token) return;

    loading = true;
    try {
      await auth.resetPassword({ token, newPassword });
      
      const email = sessionStorage.getItem('pw_reset_email');
      sessionStorage.removeItem('pw_reset_email');
      
      if (email) {
        await auth.login({ email, password: newPassword });
        goto('/');
      } else {
        success = true;
      }
    } catch (err: unknown) {
      if (err instanceof ApiError && err.statusCode === 400) {
        apiError = 'Invalid or expired reset link';
      } else {
        apiError = err instanceof Error ? err.message : 'Reset failed';
      }
    } finally {
      loading = false;
    }
  }
</script>

<svelte:head>
  <title>Reset Password — chatz</title>
</svelte:head>

<main>
  <div class="card">
    <h1>Reset Password</h1>
    <p class="subtitle">Enter your new password below</p>

    {#if !token}
      <p class="api-error">Invalid or missing reset link</p>
      <p class="footer-link">
        <a href="/forgot-password">Request a new reset link</a>
      </p>
    {:else if success}
      <p>Password reset successfully. <a href="/login">Sign in</a></p>
    {:else}
      <form onsubmit={handleSubmit} novalidate>
        <div class="field">
          <Label for="newPassword">New Password</Label>
          <Input
            id="newPassword"
            type="password"
            autocomplete="off"
            bind:value={newPassword}
            placeholder="••••••••"
            aria-invalid={!!fieldErrors.newPassword}
          />
          {#if fieldErrors.newPassword}
            <span class="error">{fieldErrors.newPassword}</span>
          {/if}
        </div>

        <div class="field">
          <Label for="confirmPassword">Confirm Password</Label>
          <Input
            id="confirmPassword"
            type="password"
            autocomplete="off"
            bind:value={confirmPassword}
            placeholder="••••••••"
            aria-invalid={!!fieldErrors.confirmPassword}
          />
          {#if fieldErrors.confirmPassword}
            <span class="error">{fieldErrors.confirmPassword}</span>
          {/if}
        </div>

        {#if apiError}
          <p class="api-error">{apiError}</p>
        {/if}

        <Button type="submit" class="submit-btn" disabled={loading}>
          {loading ? 'Resetting…' : 'Reset password'}
        </Button>
      </form>
    {/if}
  </div>
</main>

<style>
  main {
    min-height: 100vh;
    display: flex;
    align-items: center;
    justify-content: center;
    padding: 1rem;
  }

  .card {
    width: 100%;
    max-width: 24rem;
    background: var(--card);
    color: var(--card-foreground);
    border: 1px solid var(--border);
    border-radius: var(--radius-lg);
    padding: 2rem;
  }

  h1 {
    font-size: 1.5rem;
    font-weight: 700;
    margin: 0 0 0.25rem;
  }

  .subtitle {
    color: var(--muted-foreground);
    font-size: 0.875rem;
    margin: 0 0 1.5rem;
  }

  form {
    display: flex;
    flex-direction: column;
    gap: 1rem;
  }

  .field {
    display: flex;
    flex-direction: column;
    gap: 0.375rem;
  }

  .error {
    font-size: 0.8rem;
    color: var(--destructive);
  }

  .api-error {
    font-size: 0.875rem;
    color: var(--destructive);
    margin: 0;
    padding: 0.5rem 0.75rem;
    border: 1px solid var(--destructive);
    border-radius: var(--radius-sm);
    background: color-mix(in oklch, var(--destructive) 10%, transparent);
  }

  .footer-link {
    margin: 0.75rem 0 0;
    font-size: 0.875rem;
    color: var(--muted-foreground);
    text-align: center;
  }

  .footer-link a {
    color: var(--foreground);
    text-decoration: underline;
    text-underline-offset: 2px;
  }
</style>
