export type MessageRole = "user" | "assistant" | "system";

export interface ChatMessage {
  id: string;
  content: string;
  role: MessageRole;
  sender: {
    id: string;
    name: string;
    avatarUrl: string | null;
  };
  createdAt: Date;
}
