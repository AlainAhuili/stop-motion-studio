/** Runtime configuration, written next to the bundle by scripts/deploy.sh. Never compiled in. */
export interface AppConfig {
  environment: string;
  features: Record<string, boolean>;
}

const DEFAULTS: AppConfig = { environment: 'local', features: {} };

export async function loadConfig(): Promise<AppConfig> {
  try {
    const response = await fetch('./config.json', { cache: 'no-store' });
    if (!response.ok) return DEFAULTS;
    return { ...DEFAULTS, ...(await response.json()) };
  } catch {
    return DEFAULTS;
  }
}
