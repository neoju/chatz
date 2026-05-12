<script lang="ts">
  import { auth } from '$lib/stores/auth';
  import { Button } from '$lib/components/ui/button';
  import { Input } from '$lib/components/ui/input';
  import { Label } from '$lib/components/ui/label';
  import { ForgotPasswordRequestSchema } from '@chatz/dto';

  let email = $state('');
  let fieldErrors = $state<Record<string, string>>({});
  let apiError = $state('');
  let loading = $state(false);
  let sent = $state(false);

  function validate() {
    const result = ForgotPasswordRequestSchema.safeParse({ email });

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
      await auth.forgotPassword(email);
      sent = true;
      sessionStorage.setItem('pw_reset_email', email);
    } catch (err: unknown) {
      apiError = err instanceof Error ? err.message : 'Request failed';
    } finally {
      loading = false;
    }
  }
</script>

<svelte:head>
  <title>Forgot Password — chatz</title>
</svelte:head>

<main>
  <div class="card">
    <h1>Reset your password</h1>
    <p class="subtitle">Enter your email and we'll send you a reset link</p>

    {#if sent}
      <p class="text-center">If your email is registered, you will receive a reset link.</p>
      <p class="footer-link">
        <Button variant="link" href="/login">Back to sign in</Button>
      </p>
    {:else}
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

        {#if apiError}
          <p class="api-error">{apiError}</p>
        {/if}

        <Button type="submit" class="submit-btn cursor-pointer" disabled={loading}>
          {loading ? 'Sending…' : 'Send reset link'}
        </Button>
      </form>

      <p class="footer-link">
        <Button variant="link" href="/login">Back to sign in</Button>
      </p>
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
</style>
