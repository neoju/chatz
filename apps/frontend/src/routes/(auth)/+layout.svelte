<script lang="ts">
  import { goto } from '$app/navigation';
  import { auth } from '$lib/stores/auth';

  const { children } = $props();

  $effect(() => {
    if ($auth.initialized && $auth.user) {
      goto('/');
    }
  });
</script>

{#if $auth.initialized && !$auth.user}
  {@render children()}
{/if}
