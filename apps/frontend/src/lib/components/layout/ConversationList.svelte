<script lang="ts">
  import { onMount } from 'svelte';
  import { ArrowUp, Loader2 } from '@lucide/svelte';
  import { conversationApi } from '$lib/api/conversation';
  import { chatStore } from '$lib/stores/chat.svelte';
  import type { ListConversationsResponse } from '@chatz/dto';
  import { ConversationType } from '@chatz/shared';
  import ConversationItem from './ConversationItem.svelte';
  import * as Tooltip from '$lib/components/ui/tooltip';
  import { SidebarMenu, SidebarMenuItem, useSidebar } from '$lib/components/ui/sidebar';

  interface Props {
    activeFilter: string;
  }

  let { activeFilter }: Props = $props();

  const sidebar = useSidebar();
  let conversations = $state<ListConversationsResponse>([]);
  let nextCursor = $state<string | null>(null);
  let loading = $state(false);
  let error = $state<string | null>(null);
  let showGoTop = $state(false);
  let listContainer: HTMLDivElement | undefined = $state();

  function selectConversation(id: string) {
    chatStore.activeConversationId = id;
    if (sidebar.isMobile) {
      sidebar.setOpenMobile(false);
    }
  }

  function formatTimestamp(isoString: string): string {
    const date = new Date(isoString);
    const now = new Date();
    const isToday = date.toDateString() === now.toDateString();

    if (isToday) {
      return date.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: true });
    }

    const isYesterday = new Date(now.getTime() - 86400000).toDateString() === date.toDateString();
    const timeStr = date.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: true });

    if (isYesterday) {
      return `Yesterday, ${timeStr}`;
    }

    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  }

  async function loadConversations(reset = false) {
    if (loading) return;
    if (!reset && nextCursor === null) return;

    loading = true;
    error = null;

    try {
      const response = await conversationApi.getConversations({
        limit: 20,
        cursor: reset ? undefined : (nextCursor ?? undefined)
      });

      const items = Array.isArray(response?.items) ? response.items : [];
      
      if (reset) {
        conversations = items;
      } else {
        // Prevent duplicates if any
        const existingIds = new Set(conversations.map(c => c.id));
        const newItems = items.filter(item => !existingIds.has(item.id));
        conversations = [...conversations, ...newItems];
      }

      nextCursor = response.nextCursor;
    } catch (err) {
      console.error('[ConversationList] API error:', err);
      error = err instanceof Error ? err.message : 'Failed to load conversations';
    } finally {
      loading = false;
    }
  }

  $effect(() => {
    // Reload when activeFilter changes? 
    // Actually the current API doesn't support filtering by type yet in the backend (from what I saw in listConversations).
    // The previous implementation filtered in memory.
    // If we want real infinite scroll with filters, the backend should handle it.
    // But for now, I'll keep the in-memory filtering logic as before, but it might break with infinite scroll (e.g. page 1 has no Groups, page 2 has).
  });

  onMount(() => {
    loadConversations(true);
  });

  function handleScroll(e: Event) {
    const target = e.target as HTMLDivElement;
    showGoTop = target.scrollTop > 300;

    if (target.scrollHeight - target.scrollTop - target.clientHeight < 50) {
      loadConversations();
    }
  }

  function scrollToTop() {
    listContainer?.scrollTo({ top: 0, behavior: 'smooth' });
  }

  const safeConversations = $derived(Array.isArray(conversations) ? conversations : []);

  const filteredConversations = $derived(
    safeConversations.filter((c) => {
      if (activeFilter === 'Personal') return c.type === ConversationType.DM;
      if (activeFilter === 'Groups') return c.type === ConversationType.GROUP;
      return true;
    })
  );

  const pinnedConversations = $derived(filteredConversations.filter((c) => c.pinned));
  const regularConversations = $derived(filteredConversations.filter((c) => !c.pinned));
  const allConversations = $derived([...pinnedConversations, ...regularConversations]);
</script>

<div 
  class="relative flex flex-1 flex-col overflow-hidden"
>
  {#if showGoTop}
    <button
      onclick={scrollToTop}
      class="absolute top-4 left-1/2 z-20 -translate-x-1/2 rounded-full bg-white p-2 shadow-md border border-gray-100 text-gray-500 hover:text-gray-900 transition-all active:scale-95"
      aria-label="Go to top"
    >
      <ArrowUp size={16} />
    </button>
  {/if}

  <div 
    bind:this={listContainer}
    onscroll={handleScroll}
    class="flex-1 overflow-y-auto px-2 pb-4 scrollbar-modern"
  >
    {#if error}
      <div class="p-4 text-center text-sm text-red-500">{error}</div>
    {:else if allConversations.length === 0 && !loading}
      <div class="p-4 text-center text-sm text-gray-400">No conversations yet</div>
    {:else}
      <SidebarMenu>
        {#each allConversations as conv (conv.id)}
          <SidebarMenuItem>
            <Tooltip.Root>
              <Tooltip.Trigger class="w-full">
                <ConversationItem
                  conversation={{ ...conv, unreadCount: chatStore.unreadOverrides[conv.id] ?? conv.unreadCount }}
                  timestamp={formatTimestamp(conv.lastActivityAt)}
                  isActive={chatStore.activeConversationId === conv.id}
                  onclick={() => selectConversation(conv.id)}
                />
              </Tooltip.Trigger>
              <Tooltip.Content side="right" align="center" class="group-data-[collapsible=icon]:block hidden">
                {conv.displayName}
              </Tooltip.Content>
            </Tooltip.Root>
          </SidebarMenuItem>
        {/each}
      </SidebarMenu>
    {/if}

    {#if loading}
      <div class="flex justify-center p-4">
        <Loader2 class="animate-spin text-gray-400" size={20} />
      </div>
    {:else if nextCursor !== null}
      <div class="flex justify-center p-4">
         <Loader2 class="text-gray-200" size={20} />
      </div>
    {/if}
  </div>
</div>

<style lang="postcss">
  .scrollbar-modern {
    scrollbar-width: thin;
    scrollbar-color: var(--color-gray-200) transparent;
  }

  .scrollbar-modern::-webkit-scrollbar {
    width: 4px;
  }

  .scrollbar-modern::-webkit-scrollbar-track {
    background: transparent;
  }

  .scrollbar-modern::-webkit-scrollbar-thumb {
    background: var(--color-gray-200);
    border-radius: 20px;
  }

  .scrollbar-modern:hover::-webkit-scrollbar-thumb {
    background: var(--color-gray-300);
  }
</style>
