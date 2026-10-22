import { NextRequest, NextResponse } from "next/server";
import { createHmac, timingSafeEqual } from "node:crypto";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function config() {
  const url = process.env.SUPABASE_URL?.replace(/\\/$/, "");
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  const secret = process.env.GLOWSCAN_LEADERBOARD_SECRET;
  if (!url || !key || !secret) return null;
  return { url, key, secret };
}

function jsonError(error: string, status: number) {
  return NextResponse.json({ error }, { status, headers: { "Cache-Control": "no-store" } });
}

export async function GET() {
  const cfg = config();
  if (!cfg) return jsonError("Public leaderboard is not configured yet. Add the Supabase server environment variables.", 503);
  try {
    const response = await fetch(
      `${cfg.url}/rest/v1/leaderboard_entries?select=id,display_name,score,certificate_eligible,created_at&order=score.desc,certificate_eligible.desc,created_at.asc&limit=50`,
      { headers: { apikey: cfg.key, Authorization: `Bearer ${cfg.key}` }, cache: "no-store" }
    );
    if (!response.ok) {
      console.error("Leaderboard read failed", response.status, (await response.text()).slice(0, 300));
      return jsonError("Could not load the public leaderboard.", 502);
    }
    const rows = await response.json();
    return NextResponse.json({ entries: rows }, { headers: { "Cache-Control": "no-store" } });
  } catch {
    return jsonError("Could not connect to the public leaderboard.", 502);
  }
}

export async function POST(req: NextRequest) {
  const cfg = config();
  if (!cfg) return jsonError("Public leaderboard is not configured yet. Add the Supabase server environment variables.", 503);
  try {
    const body = await req.json();
    const displayName = typeof body.displayName === "string" ? body.displayName.trim().replace(/[<>]/g, "").slice(0, 32) : "";
    const token = typeof body.token === "string" ? body.token : "";
    if (!displayName) return jsonError("Enter a display name (1–32 characters).", 400);
    if (token.length > 2000 || !token.includes(".")) return jsonError("A valid recent AI analysis is required.", 400);
    const [payload, signature] = token.split(".");
    const expected = createHmac("sha256", cfg.secret).update(payload).digest("base64url");
    const suppliedBuffer = Buffer.from(signature || "");
    const expectedBuffer = Buffer.from(expected);
    if (suppliedBuffer.length !== expectedBuffer.length || !timingSafeEqual(suppliedBuffer, expectedBuffer)) {
      return jsonError("The score verification token is invalid. Run a new AI scan.", 401);
    }
    const decoded = JSON.parse(Buffer.from(payload, "base64url").toString("utf8"));
    if (!Number.isInteger(decoded.score) || decoded.score < 0 || decoded.score > 100 || !Number.isFinite(decoded.exp) || decoded.exp < Date.now() || typeof decoded.nonce !== "string") {
      return jsonError("The score token has expired or is invalid. Run a new AI scan.", 401);
    }

    const response = await fetch(`${cfg.url}/rest/v1/leaderboard_entries`, {
      method: "POST",
      headers: {
        apikey: cfg.key,
        Authorization: `Bearer ${cfg.key}`,
        "Content-Type": "application/json",
        Prefer: "return=representation"
      },
      body: JSON.stringify({
        display_name: displayName,
        score: decoded.score,
        certificate_eligible: decoded.score >= 80,
        token_nonce: decoded.nonce
      }),
      cache: "no-store"
    });
    if (response.status === 409 || response.status === 400) {
      const detail = await response.text();
      if (detail.includes("token_nonce") || detail.includes("duplicate key")) return jsonError("This scan has already been submitted to the leaderboard.", 409);
      console.error("Leaderboard insert rejected", detail.slice(0, 300));
      return jsonError("Could not submit this entry. Check the database setup.", 400);
    }
    if (!response.ok) {
      console.error("Leaderboard insert failed", response.status, (await response.text()).slice(0, 300));
      return jsonError("Could not submit your score to the public leaderboard.", 502);
    }
    const inserted = await response.json();
    return NextResponse.json({ entry: inserted?.[0] ?? null }, { status: 201, headers: { "Cache-Control": "no-store" } });
  } catch (error) {
    console.error("Leaderboard submission error", error);
    return jsonError("Could not submit this entry. Please try again.", 500);
  }
}
