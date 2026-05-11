<script lang="ts">
  import type { ChatMessage } from "$lib/types/chat";
  import * as Avatar from "$lib/components/ui/avatar";
  import { cn } from "$lib/utils";

  let { message }: { message: ChatMessage } = $props();

  let isUser = $derived(message.role === "user");
</script>

<div
  class={cn(
    "flex w-full gap-4 p-4",
    isUser ? "flex-row-reverse" : "flex-row"
  )}
>
  <Avatar.Root class="h-8 w-8 shrink-0">
    <Avatar.Fallback class={isUser ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground"}>
      {isUser ? "U" : "B"}
    </Avatar.Fallback>
  </Avatar.Root>

  <div class={cn(
    "flex flex-col max-w-[80%] gap-1",
    isUser ? "items-end" : "items-start"
  )}>
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
