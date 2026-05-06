<script lang="ts">
  import { Search } from '@lucide/svelte';
  import * as Avatar from '$lib/components/ui/avatar';
  import { Button } from '$lib/components/ui/button';
  import {
    SidebarMenu,
    SidebarMenuItem,
    SidebarMenuButton,
  } from '$lib/components/ui/sidebar';

  interface Props {
    name: string;
    subtitle?: string;
    avatarUrl?: string;
    online?: boolean;
    onSearch?: () => void;
  }

  const { name, subtitle = '', avatarUrl, online = false, onSearch }: Props = $props();
</script>

<SidebarMenu>
  <SidebarMenuItem>
    <SidebarMenuButton size="lg" class="user-header-btn">
      <Avatar.Root size="lg" class="shrink-0">
        {#if avatarUrl}
          <Avatar.Image src={avatarUrl} alt={name} />
        {:else if name}
          <Avatar.Fallback class="user-avatar-fallback">
            {name.charAt(0).toUpperCase()}
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
        <Button
          variant="ghost"
          size="icon"
          class="search-btn"
          onclick={(e) => {
            e.stopPropagation();
            onSearch?.();
          }}
          aria-label="Search"
        >
          <Search size={18} />
        </Button>
      </div>
    </SidebarMenuButton>
  </SidebarMenuItem>
</SidebarMenu>

<style lang="postcss">
  @reference "../../../routes/layout.css";

  .user-header-btn {
    @apply transition-all hover:bg-transparent;
    @apply group-data-[collapsible=icon]:!justify-center group-data-[collapsible=icon]:!p-0;
  }

  .user-info {
    @apply grid flex-1 text-left text-sm leading-tight;
  }

  .user-name {
    @apply truncate font-semibold text-gray-900;
  }

  .user-subtitle {
    @apply truncate text-xs text-gray-500;
  }

  .search-action {
    @apply flex items-center gap-1 transition-all duration-200 overflow-hidden;
    @apply group-data-[collapsible=icon]:opacity-0 group-data-[collapsible=icon]:w-0;
  }

  .user-avatar-fallback {
    @apply bg-orange-400 text-white font-semibold;
  }

  /* Ensure the large button doesn't crop the 40px avatar in collapsed mode */
  :global(.group-data-[collapsible=icon] [data-sidebar="menu-button"][data-size="lg"]) {
    height: auto !important;
    padding: 0 !important;
    justify-content: center !important;
  }
</style>
