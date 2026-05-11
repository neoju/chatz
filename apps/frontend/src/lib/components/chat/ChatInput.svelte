<script lang="ts">
  import { Button } from "$lib/components/ui/button";
  import { Send } from "lucide-svelte";
  import { Textarea } from "$lib/components/ui/textarea";

  let { onSend }: { onSend: (content: string) => void } = $props();

  let content = $state("");

  function handleSend() {
    const trimmed = content.trim();
    if (trimmed) {
      onSend(trimmed);
      content = "";
    }
  }

  function handleKeydown(event: KeyboardEvent) {
    if (event.key === "Enter" && !event.shiftKey) {
      event.preventDefault();
      handleSend();
    }
  }
</script>

<div class="p-4 bg-background border-t">
  <div class="max-w-3xl mx-auto relative flex items-end gap-2">
    <Textarea
      placeholder="Type your message..."
      bind:value={content}
      onkeydown={handleKeydown}
      class="min-h-[60px] max-h-[200px] resize-none pr-12"
    />
    <Button 
      size="icon" 
      class="absolute right-2 bottom-2 h-8 w-8" 
      onclick={handleSend}
      disabled={!content.trim()}
    >
      <Send class="h-4 w-4" />
      <span class="sr-only">Send</span>
    </Button>
  </div>
</div>
