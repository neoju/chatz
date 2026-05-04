<script lang="ts">
  let count = $state(0);
</script>

<svelte:head>
  <title>chatz</title>
</svelte:head>

<main>
  <h1>chatz</h1>
  <p>Phase 1 scaffold is up.</p>
  <button onclick={() => count++}>clicked {count} times</button>
</main>

<style>
  main {
    font-family: system-ui, sans-serif;
    max-width: 40rem;
    margin: 4rem auto;
    padding: 0 1rem;
  }
</style>
