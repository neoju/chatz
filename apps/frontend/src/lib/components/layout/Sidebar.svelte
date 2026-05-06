<script lang="ts">
  import {
    Sidebar,
    SidebarContent,
    SidebarHeader,
    SidebarRail,
    SidebarGroup,
    SidebarGroupContent,
    SidebarMenu,
    SidebarMenuItem,
  } from '$lib/components/ui/sidebar';
  import SidebarUserHeader from './SidebarUserHeader.svelte';
  import ConversationItem from './ConversationItem.svelte';
  import * as Tooltip from '$lib/components/ui/tooltip';
  import { cn } from '$lib/utils';

  const filters = ['All', 'Personal', 'Groups'];
  let activeFilter = $state('All');

  const pinnedMessages = [
    {
      id: '1',
      name: 'Harry Maguire',
      lastMessage: 'You need to improve now',
      timestamp: '09:12 AM',
      online: true,
      isSent: true,
      isRead: true,
    },
    {
      id: '2',
      name: 'United Family',
      lastMessage: 'Rashford is typing...',
      timestamp: '06:25 AM',
      online: false,
      isTyping: true,
    },
    {
      id: '3',
      name: 'Ramsus Højlund',
      lastMessage: 'Bos, I need to talk today',
      timestamp: '03:11 AM',
      online: true,
      unreadCount: 2,
    },
  ];

  const messages = [
    {
      id: '4',
      name: 'Andre Onana',
      lastMessage: 'I need more time bos',
      timestamp: '11:34 AM',
      online: true,
    },
    {
      id: '5',
      name: 'Reguilon',
      lastMessage: 'Great performance lad 🔥',
      timestamp: '09:12 AM',
      online: false,
      isSent: true,
      isRead: true,
    },
    {
      id: '6',
      name: 'Bruno Fernandes',
      lastMessage: 'Play the game Bruno!',
      timestamp: '10:21 AM',
      online: true,
      isSent: true,
      isRead: false,
    },
    {
      id: '7',
      name: 'Mason Mount',
      lastMessage: 'How about your injury?',
      timestamp: '10:11 AM',
      online: true,
      isSent: true,
      isRead: true,
    },
    {
      id: '8',
      name: 'Lisandro Martinez',
      lastMessage: 'I need a great partner sir',
      timestamp: '09:12 AM',
      online: false,
      unreadCount: 1,
    },
    {
      id: '9',
      name: 'Gamacho',
      lastMessage: '...',
      timestamp: '08:19 AM',
      online: false,
    },
  ];
  const allMessages = [...pinnedMessages, ...messages];
</script>

<Sidebar collapsible="icon" class="border-r border-gray-100 bg-white rounded-2xl">
  <SidebarHeader class="sidebar-header">
    <SidebarUserHeader name="Erik Ten Hag" subtitle="Info account" online={true} />

    <div class="filter-container">
      {#each filters as filter}
        <button
          class={cn("filter-btn", activeFilter === filter && "is-active")}
          onclick={() => activeFilter = filter}
        >
          {filter}
        </button>
      {/each}
    </div>
  </SidebarHeader>

  <SidebarContent>
    <SidebarGroup>
      <SidebarGroupContent>
        <SidebarMenu>
          {#each allMessages as msg}
            <SidebarMenuItem>
              <Tooltip.Root>
                <Tooltip.Trigger class="w-full">
                  <ConversationItem {...msg} />
                </Tooltip.Trigger>
                <Tooltip.Content side="right" align="center" class="group-data-[collapsible=icon]:block hidden">
                  {msg.name}
                </Tooltip.Content>
              </Tooltip.Root>
            </SidebarMenuItem>
          {/each}
        </SidebarMenu>
      </SidebarGroupContent>
    </SidebarGroup>
  </SidebarContent>

  <SidebarRail />
</Sidebar>

<style lang="postcss">
  @reference "../../../routes/layout.css";

  .sidebar-header {
    @apply p-4 pb-2 transition-all duration-200;
    @apply group-data-[collapsible=icon]:p-0;
  }

  .filter-container {
    @apply mt-4 flex gap-1 rounded-xl bg-gray-50/80 p-1 transition-all duration-200;
    @apply group-data-[collapsible=icon]:hidden;
  }

  .filter-btn {
    @apply flex-1 rounded-lg py-1.5 text-xs font-medium transition-all text-gray-500 hover:text-gray-700;
  }

  .filter-btn.is-active {
    @apply bg-white text-gray-900 shadow-sm;
  }
</style>
