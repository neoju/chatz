<script lang="ts">
    import * as Avatar from '$lib/components/ui/avatar';
    import { cn } from '@/utils';

    interface Props {
      classname?: string;
      username: string;
      avatarUrl?: string | null;
      online?: boolean;
      onlineIndicator?: boolean;
    }

    let {
      classname = "",
      avatarUrl,
      online = false,
      onlineIndicator = false,
      username,
    }: Props = $props();

</script>

<Avatar.Root class={cn("border-2 border-white size-11 transition-all",
  "group-data-[collapsible=icon]:size-9",
  classname)}>
  {#if avatarUrl}
    <Avatar.Image src={avatarUrl} alt={username} />
  {:else}
    <Avatar.Fallback class="bg-blue-100 text-blue-600 font-medium">
      {username.charAt(0).toUpperCase()}
    </Avatar.Fallback>
  {/if}
  {#if onlineIndicator && online}
    <Avatar.Badge class="bg-green-500" />
  {/if}
</Avatar.Root>

