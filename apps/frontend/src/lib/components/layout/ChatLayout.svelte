<script lang="ts">
  import type { Snippet } from 'svelte';
  import { SidebarProvider, SidebarInset } from '$lib/components/ui/sidebar';

  interface Props {
    sidebar: Snippet;
    chat: Snippet;
    detail?: Snippet;
    showDetail?: boolean;
  }

  let { sidebar, chat, detail, showDetail = $bindable(false) }: Props = $props();
</script>

<SidebarProvider style="--sidebar-width: 340px;">
  {@render sidebar()}
  <SidebarInset class="overflow-hidden p-0 m-0 h-100vh w-full">
    <div class="flex h-[100dvh] w-full overflow-hidden">
      <main class="chat-panel flex-1 flex flex-col min-w-0 overflow-hidden bg-background">
        {@render chat()}
      </main>

      {#if detail}
        {@render detail()}
      {/if}
    </div>
  </SidebarInset>
</SidebarProvider>

<style>
  .chat-panel {
    height: 100vh;
  }
</style>
