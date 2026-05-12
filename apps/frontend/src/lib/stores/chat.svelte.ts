class ChatStore {
  activeConversationId = $state<string | null>(null);
  unreadOverrides = $state<Record<string, number>>({});
  isSearching = $state(false);
}

export const chatStore = new ChatStore();
