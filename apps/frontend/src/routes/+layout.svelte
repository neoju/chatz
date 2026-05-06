<script lang="ts">
  import './layout.css';
  import { onMount } from 'svelte';
  import { auth } from '$lib/stores/auth';

  const { children } = $props();

  onMount(() => auth.init());
</script>

{@render children()}
