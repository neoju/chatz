import { api } from "./api-client";
import type {
  ListMessagesQuery,
  ListMessagesResponse,
} from "@chatz/dto";

export const messageApi = {
  getMessages: (query: ListMessagesQuery) => {
    const params = new URLSearchParams();

    params.append("conversationId", query.conversationId);
    if (query.cursor) params.append("cursor", query.cursor);
    if (query.limit !== undefined) params.append("limit", String(query.limit));

    return api.get<ListMessagesResponse>(
      `/v1/messages?${params.toString()}`,
    );
  },
};
