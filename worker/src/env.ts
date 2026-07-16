export interface Env {
  OPENAI_API_KEY: string;
  OPENAI_MODEL: string;
  TURNSTILE_SECRET: string;
  ALLOWED_ORIGINS: string;
  DEV_ALLOW_TURNSTILE_BYPASS?: string;
}
