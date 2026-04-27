export type Plan = 'free' | 'pro' | 'enterprise';

export interface PlanConfig {
  /** Max UI checks per window. null = unlimited. */
  uiChecksPerWindow: number | null;
  /** Duration of the UI check window in ms. */
  uiWindowMs: number;
  /** API requests per hour via Bearer key. null = no API access. */
  apiRequestsPerHour: number | null;
}

export const PLAN_CONFIG: Record<Plan, PlanConfig> = {
  free:       { uiChecksPerWindow: 10,   uiWindowMs: 4 * 60 * 60 * 1000, apiRequestsPerHour: null },
  pro:        { uiChecksPerWindow: null, uiWindowMs: 0,                   apiRequestsPerHour: 60   },
  enterprise: { uiChecksPerWindow: null, uiWindowMs: 0,                   apiRequestsPerHour: 1000 },
};
