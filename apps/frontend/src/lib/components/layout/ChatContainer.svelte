<script lang="ts">
  import { SidebarTrigger } from '$lib/components/ui/sidebar';
</script>

<div class="chat-container">
  <header class="chat-header">
    <div class="mobile-trigger">
      <SidebarTrigger />
    </div>
    <div class="chat-info">
      <h2 class="text-sm font-semibold">Chat Name</h2>
      <p class="text-xs text-gray-500">Online</p>
    </div>
  </header>
  
  <div class="chat-messages">
    <!-- Messages go here -->
  </div>
</div>

<style>
  .chat-container {
    display: flex;
    flex-direction: column;
    height: 100%;
    background-color: #f0f2f5;
    overflow: hidden;
  }

  .chat-header {
    display: flex;
    align-items: center;
    padding: 0.5rem 1rem;
    background-color: #ffffff;
    border-bottom: 1px solid #e5e7eb;
    height: 60px;
    gap: 1rem;
  }

  .chat-messages {
    flex: 1;
    overflow-y: auto;
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
