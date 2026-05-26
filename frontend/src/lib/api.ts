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
  gemini_configured: boolean;
  db_connected: boolean;
  version: string;
}

/**
 * Get the current user's dashboard data (profiles, pitches, stats).
 */
export async function getMe(token: string): Promise<MeResponse> {
  const res = await fetch(`${API_BASE}/api/v1/me`, {
    headers: {
      "Authorization": `Bearer ${token}`
    },
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({ detail: "Unknown error" }));
    throw new Error(err.detail || `HTTP ${res.status}`);
  }

  return res.json();
}

export async function ingestRepository(repoUrl: string, token: string, userId: string): Promise<ProfileResponse> {
  const res = await fetch(`${API_BASE}/api/v1/ingest`, {
    method: "POST",
    headers: { 
      "Content-Type": "application/json",
      "Authorization": `Bearer ${token}`
    },
    body: JSON.stringify({ repo_url: repoUrl, user_id: userId }),
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({ detail: "Unknown error" }));
    throw new Error(err.detail || `HTTP ${res.status}`);
  }

  return res.json();
}

export async function quickProfile(githubUsername: string, token: string, userId: string): Promise<ProfileResponse> {
  const res = await fetch(`${API_BASE}/api/v1/quick-profile`, {
    method: "POST",
    headers: { 
      "Content-Type": "application/json",
      "Authorization": `Bearer ${token}`
    },
    body: JSON.stringify({ github_username: githubUsername, user_id: userId }),
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({ detail: "Unknown error" }));
    throw new Error(err.detail || `HTTP ${res.status}`);
  }

  return res.json();
}

export async function healthCheck(): Promise<HealthResponse> {
  const res = await fetch(`${API_BASE}/health`);
  if (!res.ok) throw new Error(`Health check failed: ${res.status}`);
  return res.json();
}

export async function draftPitch(jobUrl: string, token: string): Promise<{ status: string, pitch: DashboardPitch }> {
  const res = await fetch(`${API_BASE}/api/v1/draft-pitch`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Authorization": `Bearer ${token}`
    },
    body: JSON.stringify({ job_url: jobUrl }),
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({ detail: "Unknown error" }));
    throw new Error(err.detail || `HTTP ${res.status}`);
  }

  return res.json();
}

export interface RecommendedJob {
  title: string;
  company: string;
  url: string;
  match_rationale: string;
}

export async function findMatchingJobs(token: string): Promise<{ status: string, jobs: RecommendedJob[] }> {
  const res = await fetch(`${API_BASE}/api/v1/jobs/find`, {
    method: "GET",
    headers: {
      "Authorization": `Bearer ${token}`
    }
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({ detail: "Unknown error" }));
    throw new Error(err.detail || `HTTP ${res.status}`);
  }

  return res.json();
}
