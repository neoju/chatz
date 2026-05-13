<script lang="ts">
  import { tick } from "svelte";
  import { Loader } from "@lucide/svelte";
  import type { ChatMessage } from "$lib/types/chat";
  import MessageItem from "./MessageItem.svelte";

  interface Props {
    messages: ChatMessage[];
    onLoadMore?: () => void;
    loadingMore?: boolean;
    hasMore?: boolean;
  }

  let { 
    messages, 
    onLoadMore, 
    loadingMore = false, 
    hasMore = false 
  }: Props = $props();

  let viewport: HTMLDivElement | undefined = $state();
  let prevScrollHeight = 0;
  let prevMessages: ChatMessage[] = [];
  let isInitialLoad = true;

  function isSameDay(d1: Date, d2: Date) {
    return (
      d1.getFullYear() === d2.getFullYear() &&
      d1.getMonth() === d2.getMonth() &&
      d1.getDate() === d2.getDate()
    );
  }

  function formatDate(d: Date) {
    const day = d.getDate().toString().padStart(2, '0');
    const month = (d.getMonth() + 1).toString().padStart(2, '0');
    const year = d.getFullYear();
    return `${day}/${month}/${year}`;
  }

  function scrollToBottom(behavior: ScrollBehavior = 'auto') {
    if (viewport) {
      viewport.scrollTo({
        top: viewport.scrollHeight,
        behavior
      });
    }
  }

  function handleScroll() {
    if (!viewport || loadingMore || !hasMore || !onLoadMore) return;

    // Trigger load more when near the top
    if (viewport.scrollTop <= 50) {
      prevScrollHeight = viewport.scrollHeight;
      onLoadMore();
    }
  }

  $effect(() => {
    const currentMessages = messages;
    
    if (currentMessages.length > prevMessages.length) {
      const isPrepend = prevMessages.length > 0 && currentMessages[currentMessages.length - 1]?.id === prevMessages[prevMessages.length - 1]?.id;
      
      tick().then(() => {
        if (!viewport) return;

        if (isInitialLoad) {
          // Jump to bottom immediately on first load
          scrollToBottom('auto');
          isInitialLoad = false;
        } else if (isPrepend && prevScrollHeight > 0) {
          // Preserve scroll position when loading history
          const newScrollHeight = viewport.scrollHeight;
          viewport.scrollTop = newScrollHeight - prevScrollHeight;
          prevScrollHeight = 0;
        } else if (!isPrepend) {
          // New message appended (likely sent by user or incoming)
          scrollToBottom('smooth');
        }
      });
    } else if (currentMessages.length === 0) {
      isInitialLoad = true;
    }
    
    prevMessages = [...currentMessages];
  });

</script>

<div 
  class="flex-1 overflow-y-auto w-full" 
  bind:this={viewport}
  onscroll={handleScroll}
>
  <div class="flex flex-col py-4 w-full max-w-3xl mx-auto">
    {#if hasMore}
      <div class="flex justify-center p-4">
        {#if loadingMore}
          <Loader class="animate-spin text-muted-foreground" size={20} />
        {:else}
          <div class="h-1"></div>
        {/if}
      </div>
    {/if}

    {#if messages.length === 0 && !loadingMore}
      <div class="flex flex-col items-center justify-center h-full text-muted-foreground mt-20">
        <p>No messages yet.</p>
        <p class="text-sm">Start the conversation below!</p>
      </div>
    {:else}
      {#each messages as msg, i (msg.id)}
        {@const showDivider = i === 0 || !isSameDay(msg.createdAt, messages[i - 1]!.createdAt)}
        {#if showDivider}
          <div class="relative flex items-center justify-center my-6">
            <div class="absolute inset-x-0 border-t border-muted/50"></div>
            <span class="relative bg-background px-3 text-[11px] text-muted-foreground font-medium rounded-full border border-border">
              {formatDate(msg.createdAt)}
            </span>
          </div>
        {/if}
        <MessageItem message={msg} />
      {/each}
    {/if}
  </div>
</div>
