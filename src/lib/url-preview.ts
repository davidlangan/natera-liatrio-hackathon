/**
 * Helpers for generating a thumbnail + summary for a registered demo URL.
 *
 * Strategy:
 * 1. GitLab repo URLs → call the Projects API for name/description/avatar.
 *    Falls back to a microlink screenshot if the API call fails.
 * 2. Anything else → microlink.io (free tier, no key required).
 *
 * The demo URL is OPTIONAL on registration. Callers must only invoke
 * `generatePreview` when they actually have a non-empty URL. Both helpers
 * swallow network errors and return null/false rather than throwing, so a
 * real-but-temporarily-unreachable URL never blocks form submission.
 *
 * `isUrlReachable` is retained as an exported helper for ad-hoc tooling
 * (e.g. seed scripts) but is no longer wired into the register action.
 */

export type PreviewResult = {
  summary: string | null;
  thumbnail_url: string | null;
  source: "gitlab" | "microlink" | "fallback";
};

const MICROLINK_BASE = "https://api.microlink.io";

const GITLAB_PUBLIC_HOST = "gitlab.com";

function getGitLabHost(): string {
  const custom = process.env.GITLAB_HOST?.replace(/\/$/, "");
  return custom || `https://${GITLAB_PUBLIC_HOST}`;
}

function isGitLabUrl(url: URL): boolean {
  if (url.hostname === GITLAB_PUBLIC_HOST) return true;
  const custom = process.env.GITLAB_HOST;
  if (!custom) return false;
  try {
    return new URL(custom).hostname === url.hostname;
  } catch {
    return false;
  }
}

/**
 * Validate the URL is reachable. Server-side HEAD with a 5s timeout.
 * Returns true if any 2xx/3xx; some hosts reject HEAD so we retry with GET.
 */
export async function isUrlReachable(rawUrl: string): Promise<boolean> {
  let parsed: URL;
  try {
    parsed = new URL(rawUrl);
  } catch {
    return false;
  }
  if (!/^https?:$/.test(parsed.protocol)) return false;

  const controller = new AbortController();
  const t = setTimeout(() => controller.abort(), 5000);
  try {
    const head = await fetch(parsed.toString(), {
      method: "HEAD",
      signal: controller.signal,
      redirect: "follow",
      headers: { "User-Agent": "NateraVoting/1.0 (+reachability-check)" },
    });
    if (head.status < 400) return true;
    // Some servers (e.g. Vercel previews) 405 HEAD — retry GET.
    if (head.status === 405 || head.status === 501) {
      const get = await fetch(parsed.toString(), {
        method: "GET",
        signal: controller.signal,
        redirect: "follow",
        headers: { "User-Agent": "NateraVoting/1.0 (+reachability-check)" },
      });
      return get.status < 400;
    }
    return false;
  } catch {
    return false;
  } finally {
    clearTimeout(t);
  }
}

/**
 * For URLs like https://gitlab.com/group/sub/project, encode the path
 * after the host as a project id for the GitLab API. We strip query/hash
 * and trailing slashes.
 */
function extractGitLabProjectPath(url: URL): string {
  const path = url.pathname.replace(/^\/+|\/+$/g, "");
  // Strip a trailing ".git" or trailing tree/blob/etc.
  const cleaned = path
    .replace(/\.git$/, "")
    .replace(/\/-\/.*$/, "")
    .replace(/\/(tree|blob|merge_requests|pipelines)\/.*$/, "");
  return encodeURIComponent(cleaned);
}

async function fetchGitLabPreview(url: URL): Promise<PreviewResult | null> {
  const host = getGitLabHost();
  const projectPath = extractGitLabProjectPath(url);
  if (!projectPath) return null;
  const api = `${host}/api/v4/projects/${projectPath}`;
  const controller = new AbortController();
  const t = setTimeout(() => controller.abort(), 5000);
  try {
    const res = await fetch(api, { signal: controller.signal });
    if (!res.ok) return null;
    const data = (await res.json()) as {
      name?: string;
      description?: string;
      avatar_url?: string | null;
      readme_url?: string | null;
    };
    const summary = data.description?.trim() || data.name || null;
    const thumbnail = data.avatar_url || null;
    return { summary, thumbnail_url: thumbnail, source: "gitlab" };
  } catch {
    return null;
  } finally {
    clearTimeout(t);
  }
}

async function fetchMicrolinkPreview(url: URL): Promise<PreviewResult | null> {
  const params = new URLSearchParams({
    url: url.toString(),
    screenshot: "true",
    meta: "true",
  });
  const apiUrl = `${MICROLINK_BASE}/?${params.toString()}`;
  const headers: Record<string, string> = {};
  if (process.env.MICROLINK_API_KEY) {
    headers["x-api-key"] = process.env.MICROLINK_API_KEY;
  }
  const controller = new AbortController();
  const t = setTimeout(() => controller.abort(), 8000);
  try {
    const res = await fetch(apiUrl, { headers, signal: controller.signal });
    if (!res.ok) return null;
    const data = (await res.json()) as {
      status?: string;
      data?: {
        title?: string;
        description?: string;
        screenshot?: { url?: string };
        image?: { url?: string };
        logo?: { url?: string };
      };
    };
    if (data.status !== "success" || !data.data) return null;
    const summary = data.data.description?.trim() || data.data.title || null;
    const thumbnail =
      data.data.screenshot?.url ||
      data.data.image?.url ||
      data.data.logo?.url ||
      null;
    return { summary, thumbnail_url: thumbnail, source: "microlink" };
  } catch {
    return null;
  } finally {
    clearTimeout(t);
  }
}

export async function generatePreview(rawUrl: string): Promise<PreviewResult> {
  let url: URL;
  try {
    url = new URL(rawUrl);
  } catch {
    return { summary: null, thumbnail_url: null, source: "fallback" };
  }

  if (isGitLabUrl(url)) {
    const gl = await fetchGitLabPreview(url);
    if (gl && (gl.summary || gl.thumbnail_url)) return gl;
    const ml = await fetchMicrolinkPreview(url);
    if (ml) return ml;
    return { summary: null, thumbnail_url: null, source: "fallback" };
  }

  const ml = await fetchMicrolinkPreview(url);
  if (ml) return ml;
  return { summary: null, thumbnail_url: null, source: "fallback" };
}
