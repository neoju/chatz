<script lang="ts">
  import { ChatLayout, Sidebar, ChatContainer, ChatDetail } from '$lib/components/layout';
</script>

<ChatLayout showDetail={true}>
  {#snippet sidebar()}
    <Sidebar />
  {/snippet}

  {#snippet chat()}
    <ChatContainer />
  {/snippet}

  {#snippet detail()}
    <ChatDetail />
  {/snippet}
</ChatLayout>
