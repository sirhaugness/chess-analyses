import { describe, expect, it, vi } from "vitest";

vi.mock("openai", () => {
  return {
    default: class OpenAI {
      responses = {
        parse: vi.fn(),
      };
    },
  };
});

describe("OpenAI worker integration", () => {
  it("uses mocked SDK without real API key", async () => {
    const { analyzeBoardWithOpenAI } = await import("../worker/src/openai");
    const result = await analyzeBoardWithOpenAI(
      {
        OPENAI_API_KEY: "",
        OPENAI_MODEL: "gpt-5.6",
        TURNSTILE_SECRET: "x",
        ALLOWED_ORIGINS: "http://localhost:5173",
      },
      "data:image/jpeg;base64,abcd",
    );
    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.code).toBe("server_misconfigured");
    }
  });
});
