<script lang="ts">
  import { ChatLayout, Sidebar, ChatContainer, ChatDetail } from '$lib/components/layout';

  let showDetail = $state(false);

  function toggleDetail() {
    showDetail = !showDetail;
  }
</script>

<ChatLayout {showDetail}>
  {#snippet sidebar()}
    <Sidebar />
  {/snippet}

  {#snippet chat()}
    <ChatContainer {toggleDetail} />
  {/snippet}

  {#snippet detail()}
    <ChatDetail bind:showDetail />
  {/snippet}
</ChatLayout>
