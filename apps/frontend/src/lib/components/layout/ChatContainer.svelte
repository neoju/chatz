<script lang="ts">
  import { SidebarTrigger } from '$lib/components/ui/sidebar';
  import type { ChatMessage } from "$lib/types/chat";
  import MessageList from "$lib/components/chat/MessageList.svelte";
  import ChatInput from "$lib/components/chat/ChatInput.svelte";
  import { Button } from "$lib/components/ui/button";
  import { Info } from "lucide-svelte";

  interface Props {
    toggleDetail?: () => void;
  }

  const { toggleDetail }: Props = $props();

  let messages: ChatMessage[] = $state([]);

  function handleSend(content: string) {
    const userMsg: ChatMessage = {
      id: crypto.randomUUID(),
      content,
      role: 'user',
      createdAt: new Date()
    };
    messages = [...messages, userMsg];

    setTimeout(() => {
      const botMsg: ChatMessage = {
        id: crypto.randomUUID(),
        content: `I received your message: "${content}"\nThis is a mock response.`,
        role: 'assistant',
        createdAt: new Date()
      };
      messages = [...messages, botMsg];
    }, 500);
  }
</script>

<div class="chat-container bg-background">
  <header class="chat-header">
    <div class="mobile-trigger">
      <SidebarTrigger />
    </div>
    <div class="chat-info">
      <h2 class="text-sm font-semibold">Chat Name</h2>
      <p class="text-xs text-muted-foreground">Online</p>
    </div>
    <div class="header-actions">
      <Button variant="ghost" size="icon" onclick={toggleDetail}>
        <Info class="h-5 w-5" />
      </Button>
    </div>
  </header>
  
  <div class="chat-content border-t">
    <MessageList {messages} />
    <ChatInput onSend={handleSend} />
  </div>
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
  }
</style>
