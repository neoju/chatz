<script lang="ts">
  import type { ChatMessage } from "$lib/types/chat";
  import MessageItem from "./MessageItem.svelte";



  let { messages }: { messages: ChatMessage[] } = $props();

  let viewport: HTMLDivElement | undefined = $state();

  function scrollToBottom() {
    if (viewport) {
      viewport.scrollTop = viewport.scrollHeight;
    }
  }

  $effect(() => {
    // This effect runs whenever messages change
    // Using setTimeout to wait for DOM update before scrolling
    if (messages && messages.length > 0) {
      setTimeout(scrollToBottom, 0);
    }
  });

</script>

<div class="flex-1 overflow-y-auto w-full" bind:this={viewport}>
  <div class="flex flex-col py-4 w-full max-w-3xl mx-auto">
    {#if messages.length === 0}
      <div class="flex flex-col items-center justify-center h-full text-muted-foreground mt-20">
        <p>No messages yet.</p>
        <p class="text-sm">Start the conversation below!</p>
      </div>
    {:else}
      {#each messages as msg (msg.id)}
        <MessageItem message={msg} />
      {/each}
    {/if}
  </div>
</div>
