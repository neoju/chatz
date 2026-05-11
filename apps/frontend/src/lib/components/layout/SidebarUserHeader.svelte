<script lang="ts">
  import { Search, X } from '@lucide/svelte';
  import * as Avatar from '$lib/components/ui/avatar';
  import { Button } from '$lib/components/ui/button';
  import { Input } from '$lib/components/ui/input';
  import {
    SidebarMenu,
    SidebarMenuItem,
    SidebarMenuButton,
  } from '$lib/components/ui/sidebar';
  import { slide, fly, fade } from 'svelte/transition';

  interface Props {
    name: string;
    subtitle?: string;
    avatarUrl?: string;
    online?: boolean;
    onSearch?: (_value: string) => void;
  }

  const { name, subtitle = '', avatarUrl, online = false, onSearch }: Props = $props();

  let isSearching = $state(false);
  let searchQuery = $state('');
  let headerContainer: HTMLElement | undefined = $state();

  function toggleSearch(e?: Event) {
    e?.stopPropagation();
    isSearching = !isSearching;
    if (!isSearching) searchQuery = '';
  }

  function handleCloseSearch() {
    isSearching = false;
    searchQuery = '';
    // TODO: Handle search result click here
  }

  function handleIconClick() {
    if (searchQuery.length > 0) {
      searchQuery = '';
    } else {
      handleCloseSearch();
    }
  }

  // Handle click outside
  $effect(() => {
    if (!isSearching) return;

    function handleClickOutside(event: MouseEvent) {
      const target = event.target as HTMLElement;

      // Check if click is inside the header or on filter buttons
      const isInside = headerContainer?.contains(target);
      const isFilterButton = target.closest('.filter-container');

      if (!isInside && !isFilterButton) {
        handleCloseSearch();
      }
    }

    document.addEventListener('click', handleClickOutside);
    return () => document.removeEventListener('click', handleClickOutside);
  });

  $effect(() => {
    onSearch?.(searchQuery);
  });
</script>

<div class="user-header-container" bind:this={headerContainer}>
  <SidebarMenu>
    <SidebarMenuItem>
      <SidebarMenuButton size="lg" class="user-header-btn">
        <Avatar.Root size="lg" class="shrink-0">
          {#if avatarUrl}
            <Avatar.Image src={avatarUrl} alt={name} />
          {:else if name}
            <Avatar.Fallback class="user-avatar-fallback">
              {name?.charAt(0).toUpperCase()}
            </Avatar.Fallback>
          {/if}
          {#if online}
            <Avatar.Badge class="bg-green-500" />
          {/if}
        </Avatar.Root>

        <div class="user-info">
          <span class="user-name">{name}</span>
          {#if subtitle}
            <span class="user-subtitle">{subtitle}</span>
          {/if}
        </div>

        <div class="search-action">
          {#if !isSearching}
            <div in:fly={{ y: 44, duration: 400 }} out:fly={{ y: 44, duration: 400 }}>
              <Button
                variant="ghost"
                size="icon"
                class="search-btn z-10 hover:cursor-pointer"
                onclick={toggleSearch}
                aria-label="Search"
              >
                <Search size={18} />
              </Button>
            </div>
          {/if}
        </div>
      </SidebarMenuButton>
    </SidebarMenuItem>
  </SidebarMenu>

  {#if isSearching}
    <div transition:slide={{ duration: 400 }} class="search-bar">
      <div class="search-bar-inner">
        <div class="search-input-wrapper">
          <Input
            bind:value={searchQuery}
            placeholder="Search conversation..."
            class="search-input"
            autofocus
          />
          <button 
            class="search-icon-suffix" 
            onclick={handleIconClick}
            in:fly={{ y: -44, duration: 400 }}
            out:fly={{ y: -44, duration: 400 }}
          >
            {#if searchQuery.length > 0}
              <div in:fade={{ duration: 150 }}>
                <X size={18} class="hover:cursor-pointer" />
              </div>
            {:else}
              <Search size={18} class="hover:cursor-pointer" />
            {/if}
          </button>
        </div>
      </div>
    </div>
  {/if}
</div>

<style lang="postcss">
  @reference "../../../routes/layout.css";

  .user-header-container {
    @apply flex flex-col;
  }

  :global(.user-header-btn) {
    @apply transition-colors hover:bg-transparent;
    @apply group-data-[collapsible=icon]:!justify-center group-data-[collapsible=icon]:!p-0;
  }

  .user-info {
    @apply grid flex-1 text-left text-sm leading-tight transition-all;
    @apply group-data-[collapsible=icon]:hidden;
  }

  .user-name {
    @apply truncate font-semibold text-gray-900;
  }

  .user-subtitle {
    @apply truncate text-xs text-gray-500;
  }

  .search-action {
    @apply relative z-20 flex size-9 items-center justify-center;
    @apply group-data-[collapsible=icon]:hidden;
  }

  :global(.search-btn) {
    @apply shrink-0 rounded-full text-muted-foreground;
  }

  .search-bar {
    @apply mt-2 group-data-[collapsible=icon]:hidden overflow-hidden;
  }

  .search-bar-inner {
    @apply px-1 pb-1;
  }

  .search-input-wrapper {
    @apply relative flex w-full;
  }

  :global(.search-input) {
    @apply h-9 pr-9 bg-gray-50/50 border-gray-100 focus-visible:ring-0 focus-visible:border-gray-200 transition-all;
  }

  .search-icon-suffix {
    @apply absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-gray-600 outline-none;
  }

  :global(.user-avatar-fallback) {
    @apply bg-orange-400 text-white font-semibold;
  }

  /* Ensure the large button doesn't crop the 40px avatar in collapsed mode */
  :global(.group-data-[collapsible=icon] [data-sidebar="menu-button"][data-size="lg"]) {
    height: auto !important;
    padding: 0 !important;
    justify-content: center !important;
  }
</style>
