import { api } from "./api-client";

export type UserProfile = {
  id: string;
  email: string;
  nickname: string;
  avatarUrl: string | null;
};

export const userApi = {
  me: () => api.get<UserProfile>("/users/me"),
};
