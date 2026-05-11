import { api } from "./api-client";
import type {
  ListConversationsPaginatedResponse,
  ListConversationsQuery,
} from "@chatz/dto";

export const conversationApi = {
  getConversations: (query?: ListConversationsQuery) => {
    const params = new URLSearchParams();

    if (query?.cursor) params.append("cursor", query.cursor);
    if (query?.limit !== undefined) params.append("limit", String(query.limit));

    let queryString = "";
    if (params.toString()) {
      queryString = `?${params.toString()}`;
    }

    return api.get<ListConversationsPaginatedResponse>(
      `/v1/conversations${queryString}`,
    );
  },
};
