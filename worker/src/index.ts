import type { Env } from "./env";
import { corsHeaders, isOriginAllowed, parseAllowedOrigins } from "./cors";
import { analyzeBoardWithOpenAI } from "./openai";

const MAX_BODY_BYTES = 2_500_000;

type AnalyzeBody = {
  imageDataUrl?: string;
};

function jsonResponse(
  body: unknown,
  status: number,
  origin: string | null,
  allowed: string[],
): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: {
      "Content-Type": "application/json",
      ...corsHeaders(origin, allowed),
    },
  });
}

function validateImageDataUrl(dataUrl: string): string | null {
  const match = /^data:(image\/(?:jpeg|png|webp));base64,([A-Za-z0-9+/=]+)$/.exec(
    dataUrl,
  );
  if (!match) return "Ugyldig bildedata.";
  const base64 = match[2];
  const bytes = Math.floor((base64.length * 3) / 4);
  if (bytes > MAX_BODY_BYTES) return "For stor request.";
  return null;
}

export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    const allowed = parseAllowedOrigins(env.ALLOWED_ORIGINS || "");
    const origin = request.headers.get("Origin");

    if (request.method === "GET" && new URL(request.url).pathname === "/health") {
      return jsonResponse({ ok: true }, 200, origin, allowed);
    }

    const url = new URL(request.url);
    if (url.pathname === "/api/analyze-board") {
      if (request.method === "OPTIONS") {
        if (!isOriginAllowed(origin, allowed)) {
          return new Response(null, { status: 403, headers: corsHeaders(origin, allowed) });
        }
        return new Response(null, { status: 204, headers: corsHeaders(origin, allowed) });
      }

      if (request.method !== "POST") {
        return jsonResponse(
          {
            success: false,
            error: { code: "method_not_allowed", message: "Metode ikke tillatt." },
          },
          405,
          origin,
          allowed,
        );
      }

      if (!isOriginAllowed(origin, allowed)) {
        return jsonResponse(
          {
            success: false,
            error: { code: "origin_not_allowed", message: "Ikke-tillatt origin." },
          },
          403,
          origin,
          allowed,
        );
      }

      const contentType = request.headers.get("Content-Type") || "";
      if (!contentType.includes("application/json")) {
        return jsonResponse(
          {
            success: false,
            error: { code: "invalid_content_type", message: "Ugyldig innholdstype." },
          },
          415,
          origin,
          allowed,
        );
      }

      const contentLength = request.headers.get("Content-Length");
      if (contentLength && parseInt(contentLength, 10) > MAX_BODY_BYTES) {
        return jsonResponse(
          {
            success: false,
            error: { code: "payload_too_large", message: "For stor request." },
          },
          413,
          origin,
          allowed,
        );
      }

      let body: AnalyzeBody;
      try {
        body = (await request.json()) as AnalyzeBody;
      } catch {
        return jsonResponse(
          {
            success: false,
            error: { code: "invalid_json", message: "Ugyldig JSON." },
          },
          400,
          origin,
          allowed,
        );
      }

      const imageDataUrl = body.imageDataUrl?.trim();

      if (!imageDataUrl) {
        return jsonResponse(
          {
            success: false,
            error: { code: "missing_image", message: "Bilde mangler." },
          },
          400,
          origin,
          allowed,
        );
      }

      const imageErr = validateImageDataUrl(imageDataUrl);
      if (imageErr) {
        return jsonResponse(
          {
            success: false,
            error: { code: "invalid_image", message: imageErr },
          },
          400,
          origin,
          allowed,
        );
      }

      const result = await analyzeBoardWithOpenAI(env, imageDataUrl);
      if (!result.ok) {
        return jsonResponse(
          { success: false, error: { code: result.code, message: result.message } },
          result.code === "rate_limit" ? 429 : 500,
          origin,
          allowed,
        );
      }

      return jsonResponse({ success: true, result: result.result }, 200, origin, allowed);
    }

    return jsonResponse(
      { success: false, error: { code: "not_found", message: "Ikke funnet." } },
      404,
      origin,
      allowed,
    );
  },
};
