import {
  AnalyzeBoardResponseSchema,
  type AnalyzeBoardRequest,
  type AnalyzeBoardResponse,
} from "../../shared/board-recognition-schema";

export function getApiBaseUrl(): string {
  const url = import.meta.env.VITE_API_URL as string | undefined;
  return url?.replace(/\/$/, "") ?? "";
}

export async function analyzeBoardImage(
  payload: AnalyzeBoardRequest,
): Promise<AnalyzeBoardResponse> {
  const base = getApiBaseUrl();
  if (!base) {
    return {
      success: false,
      error: {
        code: "missing_api_url",
        message: "API-adresse mangler. Sett VITE_API_URL.",
      },
    };
  }

  let response: Response;
  try {
    response = await fetch(`${base}/api/analyze-board`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
  } catch {
    return {
      success: false,
      error: {
        code: "network_error",
        message: "Nettverksfeil. Sjekk tilkoblingen og prøv igjen.",
      },
    };
  }

  let json: unknown;
  try {
    json = await response.json();
  } catch {
    return {
      success: false,
      error: {
        code: "invalid_response",
        message: "Ugyldig svar fra serveren.",
      },
    };
  }

  const parsed = AnalyzeBoardResponseSchema.safeParse(json);
  if (parsed.success) {
    return parsed.data;
  }

  return {
    success: false,
    error: {
      code: "invalid_recognition",
      message: "Gjenkjenningsresultatet var ugyldig.",
    },
  };
}

// Re-export schema parse helper for tests
export { AnalyzeBoardResponseSchema };
