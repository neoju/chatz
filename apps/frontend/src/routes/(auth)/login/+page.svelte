<script lang="ts">
  import { goto } from '$app/navigation';
  import { auth } from '$lib/stores/auth';

  import { Button } from '$lib/components/ui/button';
  import { Input } from '$lib/components/ui/input';
  import { Label } from '$lib/components/ui/label';

  import { LoginRequestSchema } from '@chatz/dto';

  let email = $state('');
  let password = $state('');
  let fieldErrors = $state<Record<string, string>>({});
  let apiError = $state('');
  let loading = $state(false);

  function validate() {
    const result = LoginRequestSchema.safeParse({ email, password });

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

    loading = true;
    try {
      await auth.login({ email, password });
      goto('/');
    } catch (err: unknown) {
      apiError = err instanceof Error ? err.message : 'Login failed';
    } finally {
      loading = false;
    }
  }
</script>

<svelte:head>
  <title>Login — chatz</title>
</svelte:head>

<main>
  <div class="card">
    <h1>Sign in</h1>
    <p class="subtitle">Welcome back to chatz</p>

    <form onsubmit={handleSubmit} novalidate>
      <div class="field">
        <Label for="email">Email</Label>
        <Input
          id="email"
          type="email"
          autocomplete="off"
          bind:value={email}
          placeholder="you@example.com"
          aria-invalid={!!fieldErrors.email}
        />
        {#if fieldErrors.email}
          <span class="error">{fieldErrors.email}</span>
        {/if}
      </div>

      <div class="field">
        <Label for="password">Password</Label>
        <Input
          id="password"
          type="password"
          autocomplete="off"
          bind:value={password}
          placeholder="••••••••"
          aria-invalid={!!fieldErrors.password}
        />
        {#if fieldErrors.password}
          <span class="error">{fieldErrors.password}</span>
        {/if}
      </div>

      {#if apiError}
        <p class="api-error">{apiError}</p>
      {/if}

      <Button type="submit" class="submit-btn" disabled={loading}>
        {loading ? 'Signing in…' : 'Sign in'}
      </Button>
    </form>

    <p class="footer-link">
      Don't have an account? <a href="/register">Register</a>
    </p>
    <p class="footer-link">
      <a href="/forgot-password">Forgot password?</a>
    </p>
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

  :global(.submit-btn) {
    width: 100%;
    margin-top: 0.5rem;
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
