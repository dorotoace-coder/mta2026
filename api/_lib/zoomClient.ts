// Server-to-Server OAuth client for registering MTA "online" attendees
// directly with the configured Zoom meeting, so registrants never leave the
// site's own form. Requires ZOOM_ACCOUNT_ID / ZOOM_CLIENT_ID /
// ZOOM_CLIENT_SECRET / ZOOM_MEETING_ID — all optional at the env-var level;
// callers must treat failures here as best-effort and fall back gracefully.

const ZOOM_OAUTH_URL = "https://zoom.us/oauth/token";
const ZOOM_API_BASE = "https://api.zoom.us/v2";

type ZoomRegistrantResult = {
  registrantId: string;
  joinUrl: string;
};

function splitName(fullName: string): { firstName: string; lastName: string } {
  const parts = fullName.trim().split(/\s+/);
  const firstName = parts[0] || fullName;
  const lastName = parts.slice(1).join(" ") || firstName;
  return { firstName, lastName };
}

async function getZoomAccessToken(): Promise<string> {
  const accountId = process.env.ZOOM_ACCOUNT_ID;
  const clientId = process.env.ZOOM_CLIENT_ID;
  const clientSecret = process.env.ZOOM_CLIENT_SECRET;
  if (!accountId || !clientId || !clientSecret) {
    throw new Error("Zoom OAuth env vars not configured (ZOOM_ACCOUNT_ID/ZOOM_CLIENT_ID/ZOOM_CLIENT_SECRET)");
  }

  const basicAuth = Buffer.from(`${clientId}:${clientSecret}`).toString("base64");
  const resp = await fetch(
    `${ZOOM_OAUTH_URL}?grant_type=account_credentials&account_id=${encodeURIComponent(accountId)}`,
    {
      method: "POST",
      headers: { Authorization: `Basic ${basicAuth}` },
    }
  );

  if (!resp.ok) {
    const body = await resp.text();
    throw new Error(`Zoom OAuth token request failed (${resp.status}): ${body}`);
  }

  const data = await resp.json();
  return data.access_token as string;
}

/**
 * Registers an attendee for the configured MTA Zoom meeting and returns
 * their personal join URL. Throws on any missing config or API failure —
 * callers must catch this and fall back (e.g. to the public registration
 * link) rather than let it block the primary registration flow.
 */
export async function registerZoomAttendee(fullName: string, email: string): Promise<ZoomRegistrantResult> {
  const meetingId = process.env.ZOOM_MEETING_ID;
  if (!meetingId) {
    throw new Error("ZOOM_MEETING_ID not configured");
  }

  const accessToken = await getZoomAccessToken();
  const { firstName, lastName } = splitName(fullName);

  const resp = await fetch(`${ZOOM_API_BASE}/meetings/${meetingId}/registrants`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${accessToken}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      email,
      first_name: firstName,
      last_name: lastName,
    }),
  });

  if (!resp.ok) {
    const body = await resp.text();
    throw new Error(`Zoom registrant creation failed (${resp.status}): ${body}`);
  }

  const data = await resp.json();
  return {
    registrantId: data.registrant_id as string,
    joinUrl: data.join_url as string,
  };
}
