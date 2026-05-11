export const chatStore = $state<{
  activeConversationId: string | null;
  unreadOverrides: Record<string, number>;
}>({
  activeConversationId: null,
  unreadOverrides: {},
});
