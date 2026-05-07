<script lang="ts">
  import type { Snippet } from 'svelte';
  import { SidebarProvider, SidebarInset } from '$lib/components/ui/sidebar';

  interface Props {
    sidebar: Snippet;
    chat: Snippet;
    detail?: Snippet;
    showDetail?: boolean;
  }

  const { sidebar, chat, detail, showDetail = false }: Props = $props();
</script>

<SidebarProvider style="--sidebar-width: 340px;">
  {@render sidebar()}
  <SidebarInset>
    <div class="chat-layout">
      <main class="chat-panel">
        {@render chat()}
      </main>

      {#if showDetail && detail}
        <aside class="detail-panel">
          {@render detail()}
        </aside>
      {/if}
    </div>
  </SidebarInset>
</SidebarProvider>

<style>
  .chat-layout {
    display: grid;
    grid-template-columns: 1fr;
    grid-template-rows: 100%;
    height: 100vh;
    width: 100%;
    background-color: #f0f2f5;
    overflow: hidden;
  }

  .chat-layout:has(.detail-panel) {
    grid-template-columns: 1fr 300px;
  }

  .chat-panel {
    display: flex;
    flex-direction: column;
    overflow: hidden;
    background-color: #f0f2f5;
  }

  .detail-panel {
    background-color: #ffffff;
    border-left: 1px solid #e5e7eb;
    overflow-y: auto;
    overflow-x: hidden;
  }

  /* Mobile Responsive */
  @media (max-width: 768px) {
    .chat-layout {
      grid-template-columns: 1fr !important;
    }

    .detail-panel {
      display: none;
    }
  }
</style>
