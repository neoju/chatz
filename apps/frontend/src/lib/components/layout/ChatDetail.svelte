<script lang="ts">
  import { Avatar, AvatarFallback, AvatarImage } from "$lib/components/ui/avatar";
  import { Button } from "$lib/components/ui/button";
  import { ScrollArea } from "$lib/components/ui/scroll-area";
  import * as Accordion from "$lib/components/ui/accordion";
  import { Bell, BellOff, PinOff, Users, ChevronDown, File, Link, Play } from "lucide-svelte";
  import { IsMobile } from "$lib/hooks/is-mobile.svelte.js";
  import * as Sheet from "$lib/components/ui/sheet/index.js";

  let { showDetail = $bindable(false) } = $props();
  const isMobile = new IsMobile();
</script>

{#snippet content()}
  <ScrollArea class="flex-1 overflow-y-auto">
    <div class="flex flex-col items-center p-6 pb-2 border-b shrink-0">
      <Avatar class="h-20 w-20 mb-3">
        <AvatarImage src="https://github.com/shadcn.png" alt="@shadcn" />
        <AvatarFallback>CN</AvatarFallback>
      </Avatar>
      <h2 class="text-xl font-semibold text-foreground">Conversation Info</h2>
      <div class="flex items-center gap-1 mt-1 mb-4">
        <span class="w-2 h-2 rounded-full bg-green-500"></span>
        <span class="text-xs text-muted-foreground">Active now</span>
      </div>

      <div class="flex w-full justify-around mt-2 pb-4 shrink-0">
        <div class="flex flex-col items-center gap-1 cursor-pointer">
          <div class="h-10 w-10 rounded-full bg-secondary flex items-center justify-center hover:bg-secondary/80 transition-colors">
            <Bell class="h-5 w-5 text-foreground" />
          </div>
          <span class="text-xs text-muted-foreground">Mute</span>
        </div>
        <div class="flex flex-col items-center gap-1 cursor-pointer">
          <div class="h-10 w-10 rounded-full bg-secondary flex items-center justify-center hover:bg-secondary/80 transition-colors">
            <PinOff class="h-5 w-5 text-foreground" />
          </div>
          <span class="text-xs text-muted-foreground">Unpin</span>
        </div>
        <div class="flex flex-col items-center gap-1 cursor-pointer">
          <div class="h-10 w-10 rounded-full bg-secondary flex items-center justify-center hover:bg-secondary/80 transition-colors">
            <Users class="h-5 w-5 text-foreground" />
          </div>
          <span class="text-xs text-muted-foreground text-center leading-tight">Create<br/>group</span>
        </div>
      </div>
    </div>

    <Accordion.Root type="multiple" class="w-full">
      <Accordion.Item value="photos">
        <Accordion.Trigger class="px-4 py-3 hover:no-underline hover:bg-accent/50 transition-colors">
          <span class="font-medium">Photos/Videos</span>
        </Accordion.Trigger>
        <Accordion.Content class="px-4 pb-4">
          <div class="grid grid-cols-3 gap-1 mb-2">
            <div class="aspect-square bg-muted rounded-md overflow-hidden relative group cursor-pointer">
              <img src="https://images.unsplash.com/photo-1517849845537-4d257902454a?w=100&h=100&fit=crop" alt="Dog" class="w-full h-full object-cover group-hover:opacity-90 transition-opacity" />
            </div>
            <div class="aspect-square bg-muted rounded-md overflow-hidden relative group cursor-pointer">
              <img src="https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?w=100&h=100&fit=crop" alt="Person" class="w-full h-full object-cover group-hover:opacity-90 transition-opacity" />
            </div>
            <div class="aspect-square bg-muted rounded-md overflow-hidden relative group cursor-pointer">
               <img src="https://images.unsplash.com/photo-1498050108023-c5249f4df085?w=100&h=100&fit=crop" alt="Code" class="w-full h-full object-cover group-hover:opacity-90 transition-opacity" />
            </div>
            <div class="aspect-square bg-muted rounded-md overflow-hidden relative group cursor-pointer">
               <img src="https://images.unsplash.com/photo-1507238691740-187a5b1d37b8?w=100&h=100&fit=crop" alt="Website" class="w-full h-full object-cover group-hover:opacity-90 transition-opacity" />
            </div>
            <div class="aspect-square bg-muted rounded-md overflow-hidden relative group cursor-pointer">
               <img src="https://images.unsplash.com/photo-1481481600674-e9356cb12035?w=100&h=100&fit=crop" alt="Street" class="w-full h-full object-cover group-hover:opacity-90 transition-opacity" />
            </div>
            <div class="aspect-square bg-muted rounded-md overflow-hidden relative flex items-center justify-center group cursor-pointer">
              <img src="https://images.unsplash.com/photo-1611162617474-5b21e879e113?w=100&h=100&fit=crop" alt="Bokeh" class="w-full h-full object-cover group-hover:opacity-90 transition-opacity" />
              <div class="absolute inset-0 bg-black/20 flex items-center justify-center">
                 <Play class="h-6 w-6 text-white fill-white" />
              </div>
            </div>
          </div>
          <Button variant="secondary" class="w-full h-9 text-xs">View all</Button>
        </Accordion.Content>
      </Accordion.Item>

      <Accordion.Item value="files">
        <Accordion.Trigger class="px-4 py-3 hover:no-underline hover:bg-accent/50 transition-colors">
          <span class="font-medium">File</span>
        </Accordion.Trigger>
        <Accordion.Content class="px-4 pb-4 flex flex-col gap-3">
          <div class="flex items-start gap-3 p-2 hover:bg-accent rounded-md cursor-pointer transition-colors">
            <div class="h-10 w-10 rounded bg-red-100 text-red-600 flex items-center justify-center shrink-0">
               <span class="text-xs font-bold">PDF</span>
            </div>
            <div class="flex-1 overflow-hidden">
              <p class="text-sm font-medium truncate">DIEN_DU_LICH.pdf</p>
              <div class="flex items-center justify-between mt-1">
                 <span class="text-xs text-muted-foreground">426.23 KB</span>
                 <span class="text-[10px] text-muted-foreground">12/03/2026</span>
              </div>
            </div>
          </div>

          <div class="flex items-start gap-3 p-2 hover:bg-accent rounded-md cursor-pointer transition-colors">
            <div class="h-10 w-10 rounded bg-purple-100 text-purple-600 flex items-center justify-center shrink-0">
               <Play class="h-5 w-5 fill-current" />
            </div>
            <div class="flex-1 overflow-hidden">
              <p class="text-sm font-medium truncate">screenrecording-2026-02-10...</p>
              <div class="flex items-center justify-between mt-1">
                 <span class="text-xs text-muted-foreground">5.39 MB</span>
                 <span class="text-[10px] text-muted-foreground">10/02/2026</span>
              </div>
            </div>
          </div>
          
           <div class="flex items-start gap-3 p-2 hover:bg-accent rounded-md cursor-pointer transition-colors">
            <div class="h-10 w-10 rounded bg-red-100 text-red-600 flex items-center justify-center shrink-0">
               <span class="text-xs font-bold">PDF</span>
            </div>
            <div class="flex-1 overflow-hidden">
              <p class="text-sm font-medium truncate">TranPhuongNam_Resume.pdf</p>
              <div class="flex items-center justify-between mt-1">
                 <span class="text-xs text-muted-foreground">110.21 KB</span>
                 <span class="text-[10px] text-muted-foreground">08/01/2026</span>
              </div>
            </div>
          </div>

          <Button variant="secondary" class="w-full h-9 text-xs mt-1">View all</Button>
        </Accordion.Content>
      </Accordion.Item>

      <Accordion.Item value="links">
        <Accordion.Trigger class="px-4 py-3 hover:no-underline hover:bg-accent/50 transition-colors">
          <span class="font-medium">Link</span>
        </Accordion.Trigger>
        <Accordion.Content class="px-4 pb-4 flex flex-col gap-2">
           <div class="flex items-start gap-3 p-2 hover:bg-accent rounded-md cursor-pointer transition-colors">
            <div class="h-10 w-10 rounded-full bg-secondary flex items-center justify-center shrink-0">
               <Link class="h-4 w-4 text-muted-foreground" />
            </div>
            <div class="flex-1 overflow-hidden">
              <p class="text-sm font-medium truncate">TikTok - Navi</p>
              <div class="flex items-center justify-between mt-0.5">
                 <span class="text-xs text-blue-500 hover:underline truncate mr-2">www.tiktok.com</span>
                 <span class="text-[10px] text-muted-foreground shrink-0">07/05</span>
              </div>
            </div>
          </div>
          
          <div class="flex items-start gap-3 p-2 hover:bg-accent rounded-md cursor-pointer transition-colors">
            <div class="h-10 w-10 rounded-full bg-secondary flex items-center justify-center shrink-0">
               <Link class="h-4 w-4 text-muted-foreground" />
            </div>
            <div class="flex-1 overflow-hidden">
              <p class="text-sm font-medium truncate">TikTok - VIETIZEN NEWS</p>
              <div class="flex items-center justify-between mt-0.5">
                 <span class="text-xs text-blue-500 hover:underline truncate mr-2">www.tiktok.com</span>
                 <span class="text-[10px] text-muted-foreground shrink-0">06/05</span>
              </div>
            </div>
          </div>

          <div class="flex items-start gap-3 p-2 hover:bg-accent rounded-md cursor-pointer transition-colors">
            <div class="h-10 w-10 rounded-full bg-secondary flex items-center justify-center shrink-0">
               <Link class="h-4 w-4 text-muted-foreground" />
            </div>
            <div class="flex-1 overflow-hidden">
              <p class="text-sm font-medium truncate">TikTok - noibencon</p>
              <div class="flex items-center justify-between mt-0.5">
                 <span class="text-xs text-blue-500 hover:underline truncate mr-2">www.tiktok.com</span>
                 <span class="text-[10px] text-muted-foreground shrink-0">06/05</span>
              </div>
            </div>
          </div>

          <Button variant="secondary" class="w-full h-9 text-xs mt-1">View all</Button>
        </Accordion.Content>
      </Accordion.Item>
    </Accordion.Root>
  </ScrollArea>
{/snippet}

{#if isMobile.current}
  <Sheet.Root bind:open={showDetail}>
    <Sheet.Content side="right" class="w-[300px] sm:w-[340px] p-0 flex flex-col h-[100dvh] bg-background [&>button]:hidden">
      {@render content()}
    </Sheet.Content>
  </Sheet.Root>
{:else if showDetail}
  <aside class="chat-detail h-full flex flex-col bg-background overflow-hidden border-l border-border w-[300px] shrink-0">
    {@render content()}
  </aside>
{/if}
