import { describe, it, expect } from "vitest";

describe("Smoke Test", () => {
  it("should pass", () => {
    expect(true).toBe(true);
  });

  it("should have access to jsdom", () => {
    const div = document.createElement("div");
    div.innerHTML = "<span>Hello World</span>";
    expect(div.querySelector("span")?.textContent).toBe("Hello World");
  });
});
