<script lang="ts">
  import type { ChatMessage } from "$lib/types/chat";
  import { cn } from "$lib/utils";
  import UserAvatar from "../UserAvatar.svelte";

  let { message }: { message: ChatMessage } = $props();

  let isUser = $derived(message.role === "user");
</script>

<div
  class={cn(
    "flex w-full gap-4 p-4",
    isUser ? "flex-row-reverse" : "flex-row"
  )}
>
  {#if !isUser}
    <UserAvatar username={message.sender.name} avatarUrl={message.sender.avatarUrl} />
  {/if}

  <div class={cn(
    "flex flex-col max-w-[80%] gap-1",
    isUser ? "items-end" : "items-start"
  )}>
    {#if !isUser}
      <span class="text-[11px] font-medium text-muted-foreground ml-1">
        {message.sender.name}
      </span>
    {/if}
    <div class={cn(
      "rounded-lg p-3 text-sm whitespace-pre-wrap shadow-sm",
      isUser ? "bg-primary text-primary-foreground rounded-tr-none" : "bg-muted text-foreground rounded-tl-none"
    )}>
      {message.content}
    </div>
    <span class="text-xs text-muted-foreground">
      {message.createdAt.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
    </span>
  </div>
</div>
