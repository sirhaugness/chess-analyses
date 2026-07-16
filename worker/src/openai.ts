import OpenAI from "openai";
import { zodTextFormat } from "openai/helpers/zod";
import type { BoardRecognitionResult } from "../../shared/board-recognition-schema";
import type { Env } from "./env";
import {
  BoardRecognitionSchema,
  SYSTEM_PROMPT,
  USER_PROMPT,
  validateRecognitionResult,
} from "./responses";

const OPENAI_TIMEOUT_MS = 90_000;

export async function analyzeBoardWithOpenAI(
  env: Env,
  imageDataUrl: string,
): Promise<
  | { ok: true; result: BoardRecognitionResult }
  | { ok: false; code: string; message: string }
> {
  if (!env.OPENAI_API_KEY) {
    return {
      ok: false,
      code: "server_misconfigured",
      message: "Serveren er ikke riktig konfigurert.",
    };
  }

  const openai = new OpenAI({
    apiKey: env.OPENAI_API_KEY,
    timeout: OPENAI_TIMEOUT_MS,
  });

  const model = env.OPENAI_MODEL || "gpt-5.6";

  try {
    const response = await openai.responses.parse({
      model,
      input: [
        { role: "system", content: SYSTEM_PROMPT },
        {
          role: "user",
          content: [
            { type: "input_text", text: USER_PROMPT },
            {
              type: "input_image",
              image_url: imageDataUrl,
              detail: "original",
            },
          ],
        },
      ],
      text: {
        format: zodTextFormat(BoardRecognitionSchema, "board_recognition"),
      },
    });

    if (response.status === "incomplete") {
      return {
        ok: false,
        code: "openai_incomplete",
        message: "Analysen ble ikke fullført. Prøv igjen.",
      };
    }

    const parsed = response.output_parsed;
    if (!parsed) {
      return {
        ok: false,
        code: "invalid_openai_response",
        message: "Ugyldig svar fra bildegjenkjenning.",
      };
    }

    const zodCheck = BoardRecognitionSchema.safeParse(parsed);
    if (!zodCheck.success) {
      return {
        ok: false,
        code: "invalid_openai_response",
        message: "Ugyldig strukturert svar fra bildegjenkjenning.",
      };
    }

    const extra = validateRecognitionResult(zodCheck.data);
    if (extra) {
      return {
        ok: false,
        code: "invalid_openai_response",
        message: "Gjenkjenningsresultatet var ugyldig.",
      };
    }

    return { ok: true, result: zodCheck.data };
  } catch (e: unknown) {
    const err = e as { status?: number; code?: string; message?: string };
    if (err.status === 429) {
      return {
        ok: false,
        code: "rate_limit",
        message: "For mange forespørsler. Vent litt og prøv igjen.",
      };
    }
    if (err.code === "ETIMEDOUT" || err.message?.includes("timeout")) {
      return {
        ok: false,
        code: "openai_timeout",
        message: "Analysen tok for lang tid. Prøv igjen.",
      };
    }
    return {
      ok: false,
      code: "server_error",
      message: "Generell serverfeil. Prøv igjen senere.",
    };
  }
}
