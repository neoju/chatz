<script lang="ts">
  import {
    Sidebar,
    SidebarContent,
    SidebarHeader,
    SidebarRail,
    SidebarGroup,
    SidebarGroupContent,
  } from '$lib/components/ui/sidebar';
  import SidebarUserHeader from './SidebarUserHeader.svelte';
  import ConversationList from './ConversationList.svelte';
  import { cn } from '$lib/utils';

  const filters = ['All', 'Personal', 'Groups'];
  let activeFilter = $state('All');
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

  <SidebarContent class="flex flex-col overflow-hidden">
    <SidebarGroup class="flex flex-1 flex-col overflow-hidden p-0">
      <SidebarGroupContent class="flex flex-1 flex-col overflow-hidden">
        <ConversationList {activeFilter} />
      </SidebarGroupContent>
    </SidebarGroup>
  </SidebarContent>

  <SidebarRail />
</Sidebar>

<style lang="postcss">
  @reference "../../../routes/layout.css";

  .sidebar-header {
    @apply p-4 pb-2 transition-[padding,margin] duration-200;
    @apply group-data-[collapsible=icon]:p-0;
  }

  .filter-container {
    @apply mt-4 flex gap-1 rounded-xl bg-gray-50/80 p-1 transition-[padding,margin,background-color] duration-200;
    @apply group-data-[collapsible=icon]:hidden;
  }

  .filter-btn {
    @apply flex-1 rounded-lg py-1.5 text-xs font-medium transition-all text-gray-500 hover:text-gray-700;
  }

  .filter-btn.is-active {
    @apply bg-white text-gray-900 shadow-sm;
  }
</style>
