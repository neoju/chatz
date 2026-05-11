import { api } from "./api-client";

export type UserProfile = {
  id: string;
  email: string;
};

export const userApi = {
  me: () => api.get<UserProfile>("/users/me"),
};
