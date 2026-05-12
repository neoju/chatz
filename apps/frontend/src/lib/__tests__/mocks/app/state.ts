export const page = {
  url: new URL("http://localhost"),
  params: {},
  route: { id: "/" },
  status: 200,
  error: null,
  data: {},
  form: null,
};

export function setPageUrl(url: string) {
  page.url = new URL(url);
}
