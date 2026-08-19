const API_BASE = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

export interface Skill {
  name: string;
  level: string;
  context: string;
}

export interface ArchitectureDiagram {
  title: string;
  mermaid_code: string;
  description: string;
}

export interface ProjectSummary {
  pitch: string;
  key_features: string[];
}

export interface DeveloperProfile {
  skills: Skill[];
  architecture_diagrams: ArchitectureDiagram[];
  summary: ProjectSummary;
}

export interface ProfileResponse {
  status: string;
  profile: string; // JSON string of DeveloperProfile
}

export interface DashboardPitch {
  id: string;
  job_title: string;
  company: string;
  pitch_message: string;
  status: string;
  created_at: string;
}

export interface DashboardProfile {
  id: string;
  github_username: string | null;
  skills_json: string;
  architecture_json: string;
  summary_json: string;
  created_at: string;
}

export interface MeResponse {
  user: {
    id: string;
    clerk_id: string;
    email: string;
    tier: string;
    stripe_cus_id: string | null;
    created_at: string;
  } | null;
  profiles: DashboardProfile[];
  pitches: DashboardPitch[];
  stats: {
    repos_ingested: number;
    pitches_drafted: number;
    pitches_pending: number;
  };
}

export interface HealthResponse {
  status: string;
  llm_reachable: boolean;
  llm_model_loaded: boolean;
  llm_model: string;
  search_provider: string;
  search_configured: boolean;
  db_connected: boolean;
  version: string;
}

export interface RecommendedJob {
  title: string;
  company: string;
  url: string;
  match_rationale: string;
}

/**
 * Single entry point for every backend call.
 *
 * A dead backend surfaces in the browser as a bare "Failed to fetch", which
 * tells the person nothing actionable. Catching the network-level failure
 * separately from an HTTP error lets us say which of the two happened.
 */
async function request<T>(path: string, init: RequestInit = {}): Promise<T> {
  let res: Response;

  try {
    res = await fetch(`${API_BASE}${path}`, init);
  } catch {
    throw new Error(
      `Can't reach the DevLeap API at ${API_BASE}. Check that the backend is running, then try again.`
    );
  }

  if (!res.ok) {
    const body = await res.json().catch(() => null);
    const detail = body && typeof body.detail === "string" ? body.detail : null;

    if (res.status === 429) {
      throw new Error(detail || "Rate limit reached. Give it an hour and try again.");
    }
    if (res.status === 401 || res.status === 403) {
      throw new Error(detail || "Your session expired. Sign in again to continue.");
    }
    throw new Error(detail || `Request failed (HTTP ${res.status}).`);
  }

  return res.json() as Promise<T>;
}

function authHeaders(token: string, json = false): HeadersInit {
  return json
    ? { "Content-Type": "application/json", Authorization: `Bearer ${token}` }
    : { Authorization: `Bearer ${token}` };
}

/** Current user's dashboard data (profiles, pitches, stats). */
export function getMe(token: string): Promise<MeResponse> {
  return request<MeResponse>("/api/v1/me", { headers: authHeaders(token) });
}

export function ingestRepository(
  repoUrl: string,
  token: string,
  userId: string
): Promise<ProfileResponse> {
  return request<ProfileResponse>("/api/v1/ingest", {
    method: "POST",
    headers: authHeaders(token, true),
    body: JSON.stringify({ repo_url: repoUrl, user_id: userId }),
  });
}

export function quickProfile(
  githubUsername: string,
  token: string,
  userId: string
): Promise<ProfileResponse> {
  return request<ProfileResponse>("/api/v1/quick-profile", {
    method: "POST",
    headers: authHeaders(token, true),
    body: JSON.stringify({ github_username: githubUsername, user_id: userId }),
  });
}

export function healthCheck(): Promise<HealthResponse> {
  return request<HealthResponse>("/health");
}

export function draftPitch(
  jobUrl: string,
  token: string
): Promise<{ status: string; pitch: DashboardPitch }> {
  return request("/api/v1/draft-pitch", {
    method: "POST",
    headers: authHeaders(token, true),
    body: JSON.stringify({ job_url: jobUrl }),
  });
}

export function findMatchingJobs(
  token: string
): Promise<{ status: string; jobs: RecommendedJob[] }> {
  return request("/api/v1/jobs/find", {
    method: "GET",
    headers: authHeaders(token),
  });
}

export interface ContactFormValues {
  firstName: string;
  lastName: string;
  email: string;
  message: string;
}

/** Public contact form -- no Clerk session required. */
export function submitContactMessage(values: ContactFormValues): Promise<{ status: string }> {
  return request("/api/v1/contact", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      first_name: values.firstName,
      last_name: values.lastName,
      email: values.email,
      message: values.message,
    }),
  });
}
