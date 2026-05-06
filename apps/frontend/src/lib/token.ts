export function getToken() {
  if (!window) return null;

  return localStorage.getItem("token");
}

export function setToken(token: string) {
  if (!window) return;

  localStorage.setItem("token", token);
}

export function removeToken() {
  if (!window) return;

  localStorage.removeItem("token");
}
