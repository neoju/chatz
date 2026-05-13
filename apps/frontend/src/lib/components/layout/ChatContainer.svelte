<script lang="ts">
  import { SidebarTrigger, useSidebar } from '$lib/components/ui/sidebar';
  import type { ChatMessage } from "$lib/types/chat";
  import MessageList from "$lib/components/chat/MessageList.svelte";
  import ChatInput from "$lib/components/chat/ChatInput.svelte";
  import { Button } from "$lib/components/ui/button";
  import { Info, MessageSquare, Loader } from "@lucide/svelte";
  import { chatStore } from "$lib/stores/chat.svelte";
  import { messageApi } from "$lib/api/message";
  import { conversationApi } from "$lib/api/conversation";
  import { auth } from "$lib/stores/auth";
  import { get } from "svelte/store";

  interface Props {
    toggleDetail?: () => void;
  }

  const { toggleDetail }: Props = $props();
  const sidebar = useSidebar();

  let messages = $state<ChatMessage[]>([]);
  let nextCursor = $state<string | null>(null);
  let loading = $state(false);
  let loadingMore = $state(false);
  let lastMarkedReadId = $state<string | null>(null);

  async function loadMessages(conversationId: string, cursor?: string) {
    if (cursor) {
      loadingMore = true;
    } else {
      loading = true;
      messages = [];
    }

    try {
      const response = await messageApi.getMessages({
        conversationId,
        cursor,
        limit: 20
      });

      const user = get(auth).user;
      const newMessages: ChatMessage[] = response.items.map(m => ({
        id: m.id,
        content: m.content,
        role: m.sender.id === user?.id ? 'user' : 'assistant',
        sender: {
          id: m.sender.id,
          name: m.sender.name,
          avatarUrl: m.sender.avatarUrl
        },
        createdAt: new Date(m.sentAt)
      }));

      if (cursor) {
        messages = [...newMessages, ...messages];
      } else {
        messages = newMessages;
      }

      nextCursor = response.nextCursor;
    } catch (err) {
      console.error("Failed to load messages:", err);
    } finally {
      loading = false;
      loadingMore = false;
    }
  }

  $effect(() => {
    if (chatStore.activeConversationId) {
      lastMarkedReadId = null;
      loadMessages(chatStore.activeConversationId);
    } else {
      messages = [];
      nextCursor = null;
    }
  });

  $effect(() => {
    const activeId = chatStore.activeConversationId;
    if (activeId && messages.length > 0) {
      const latestMsg = messages[messages.length - 1];
      if (latestMsg && latestMsg.id !== lastMarkedReadId) {
        lastMarkedReadId = latestMsg.id;
        conversationApi.markAsRead(activeId, { lastReadMessageId: latestMsg.id })
          .catch(err => console.error("Failed to mark as read:", err));
        chatStore.unreadOverrides[activeId] = 0;
      }
    }
  });

  function handleLoadMore() {
    if (chatStore.activeConversationId && nextCursor && !loadingMore) {
      loadMessages(chatStore.activeConversationId, nextCursor);
    }
  }

  function handleSend(content: string) {
    const user = get(auth).user;
    if (!user) return;

    const userMsg: ChatMessage = {
      id: crypto.randomUUID(),
      content,
      role: 'user',
      sender: {
        id: user.id,
        name: user.nickname,
        avatarUrl: user.avatarUrl ?? null
      },
      createdAt: new Date()
    };
    messages = [...messages, userMsg];
  }

  function startNewConversation(e: MouseEvent) {
    e.stopPropagation();
    chatStore.isSearching = true;
    if (sidebar.isMobile) {
      sidebar.setOpenMobile(true);
    } else {
      sidebar.setOpen(true);
    }
  }
</script>

<div class="chat-container bg-background">
  <header class="chat-header" class:welcome-header={!chatStore.activeConversationId}>
    <div class="mobile-trigger">
      <SidebarTrigger />
    </div>
    {#if chatStore.activeConversationId}
      <div class="chat-info">
        <h2 class="text-sm font-semibold">Conversation</h2>
        <p class="text-xs text-muted-foreground">Active</p>
      </div>
      <div class="header-actions">
        <Button variant="ghost" size="icon" onclick={toggleDetail}>
          <Info class="h-5 w-5" />
        </Button>
      </div>
    {/if}
  </header>

  {#if !chatStore.activeConversationId}
    <div class="flex flex-1 flex-col items-center justify-center p-8 text-center">
      <div class="mb-4 rounded-full bg-muted p-6">
        <MessageSquare class="h-12 w-12 text-muted-foreground" />
      </div>
      <h3 class="text-xl font-semibold">Welcome to Chatz</h3>
      <p class="mt-2 text-muted-foreground">Select a conversation from the sidebar to start chatting.</p>
      <div class="mt-6 flex items-center gap-2">
        <span class="text-sm text-muted-foreground">or</span>
        <Button variant="outline" onclick={startNewConversation}>
          start new conversation
        </Button>
      </div>
    </div>
  {:else}
    <div class="chat-content border-t">
      {#if loading}
        <div class="flex flex-1 items-center justify-center">
          <Loader class="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
      {:else}
        <MessageList 
          {messages} 
          onLoadMore={handleLoadMore} 
          {loadingMore} 
          hasMore={nextCursor !== null} 
        />
      {/if}
      <ChatInput onSend={handleSend} />
    </div>
  {/if}
</div>

<style>
  .chat-container {
    display: flex;
    flex-direction: column;
    height: 100%;
    overflow: hidden;
  }

  .chat-header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 0.5rem 1rem;
    border-bottom: 1px solid hsl(var(--border));
    height: 60px;
    gap: 1rem;
    background-color: hsl(var(--background));
  }

  .welcome-header {
    display: none;
  }

  .chat-info {
    flex: 1;
  }

  .header-actions {
    display: flex;
    align-items: center;
    gap: 0.5rem;
  }

  .chat-content {
    flex: 1;
    display: flex;
    flex-direction: column;
    overflow: hidden;
  }

  .mobile-trigger {
    display: none;
  }

  @media (max-width: 768px) {
    .mobile-trigger {
      display: block;
    }

    .welcome-header {
      display: flex;
    }
  }
</style>
