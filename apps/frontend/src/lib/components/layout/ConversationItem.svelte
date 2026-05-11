<script lang="ts">
  import * as Avatar from '$lib/components/ui/avatar';
  import { cn } from '$lib/utils';
  import { Check, CheckCheck } from '@lucide/svelte';
  import type { ListConversationsResponse } from '@chatz/dto';
  import { ConversationType } from '@chatz/shared';

  interface Props {
    conversation: ListConversationsResponse[number];
    timestamp: string;
    online?: boolean;
    isRead?: boolean;
    isSent?: boolean;
    isDelivered?: boolean;
    isActive?: boolean;
    isTyping?: boolean;
    onclick?: (e: MouseEvent) => void;
  }

  const {
    conversation,
    timestamp,
    online = false,
    isRead = false,
    isSent = false,
    isDelivered = false,
    isActive = false,
    isTyping = false,
    onclick,
  }: Props = $props();

  const isDM = $derived(conversation.type === ConversationType.DM);
  const name = $derived(conversation.displayName);
  const avatarUrl = $derived(conversation.avatarUrl);
  const lastMessage = $derived(conversation.lastMessage?.content ?? 'No messages yet');
  const lastMessageSenderName = $derived(conversation.lastMessage?.sender?.name);
  const lastMessageSenderAvatarUrl = $derived(conversation.lastMessage?.sender?.avatarUrl);
  const unreadCount = $derived(conversation.unreadCount);
  const hasUnread = $derived(unreadCount > 0);
</script>

<button
  class={cn(
    "conversation-item",
    isActive && "is-active",
    hasUnread && "has-unread"
  )}
  {onclick}
>
  <div class="relative flex-shrink-0">
    <Avatar.Root class="avatar transition-all">
      {#if avatarUrl}
        <Avatar.Image src={avatarUrl} alt={name} />
      {:else}
        <Avatar.Fallback class="avatar-fallback">
          {name?.charAt(0).toUpperCase()}
        </Avatar.Fallback>
      {/if}
    </Avatar.Root>
    {#if online}
      <div class="online-indicator"></div>
    {/if}
  </div>

  <div class="content-wrapper">
    <div class="flex items-center justify-between">
      <span class="truncate font-semibold text-gray-900">{name}</span>
      <span class="timestamp">{timestamp}</span>
    </div>
    <div class="flex items-center justify-between gap-2">
      <p class={cn("truncate text-xs flex items-center gap-1.5", isTyping ? "text-green-500" : "text-gray-500")}>
        {#if !isDM && lastMessageSenderName}
          <Avatar.Root class="size-4">
            {#if lastMessageSenderAvatarUrl}
              <Avatar.Image src={lastMessageSenderAvatarUrl} alt={lastMessageSenderName} />
            {:else}
              <Avatar.Fallback class="text-[8px] bg-blue-100 text-blue-600">
                {lastMessageSenderName.charAt(0).toUpperCase()}
              </Avatar.Fallback>
            {/if}
          </Avatar.Root>
          <span class="truncate font-medium text-gray-700">{lastMessageSenderName}:</span>
        {/if}
        <span class="truncate">{lastMessage}</span>
      </p>
      <div class="flex shrink-0 items-center gap-1">
        {#if unreadCount > 0}
          <div class="unread-badge">
            {unreadCount}
          </div>
        {:else if isSent}
          {#if isRead}
            <CheckCheck size={14} class="text-blue-500" />
          {:else if isDelivered}
            <CheckCheck size={14} class="text-gray-400" />
          {:else}
            <Check size={14} class="text-gray-400" />
          {/if}
        {/if}
      </div>
    </div>
  </div>
</button>

<style lang="postcss">
  @reference "../../../routes/layout.css";

  .conversation-item {
    @apply flex w-full items-center gap-3 rounded-xl p-3 text-left transition-all hover:bg-gray-50;
    @apply group-data-[collapsible=icon]:justify-center group-data-[collapsible=icon]:p-2;
  }

  .conversation-item.is-active {
    @apply bg-gray-100;
  }

  .conversation-item.has-unread {
    @apply bg-blue-50/60;
  }

  .avatar {
    @apply size-11 border-2 border-white;
    @apply group-data-[collapsible=icon]:size-9;
  }

  .avatar-fallback {
    @apply bg-blue-100 text-blue-600 font-medium;
  }

  .online-indicator {
    @apply absolute bottom-0 right-0 size-3 rounded-full border-2 border-white bg-green-500 transition-all;
    @apply group-data-[collapsible=icon]:size-2.5;
  }

  .content-wrapper {
    @apply flex min-w-0 flex-1 flex-col gap-0.5 transition-all duration-200 overflow-hidden;
    @apply group-data-[collapsible=icon]:hidden group-data-[collapsible=icon]:w-0 group-data-[collapsible=icon]:opacity-0;
  }

  .timestamp {
    @apply text-[11px] text-gray-400 font-medium;
  }

  .unread-badge {
    @apply flex size-4 items-center justify-center rounded-full bg-red-500 text-[10px] font-bold text-white;
  }
</style>
