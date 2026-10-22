import { NextRequest, NextResponse } from "next/server";
import { createHmac, randomBytes } from "node:crypto";

export const runtime = "nodejs";
export const maxDuration = 30;

const fallback = {
  mode: "demo",
  score: null,
  summary: "AI analysis is not configured yet. This is guidance only, not an analysis of your selfie.",
  concerns: [],
  ingredients: [],
  morning: ["Gentle cleanser", "Moisturizer suited to your skin", "Broad-spectrum SPF 30+ sunscreen"],
  evening: ["Gentle cleanser", "Moisturizer"],
  caution: "Sample guidance only. No score or skin findings were generated."
};

export async function POST(req: NextRequest) {
  const key = process.env.OPENAI_API_KEY;
  if (!key) {
    return NextResponse.json({
      ...fallback,
      summary: "Real AI is not configured. Add OPENAI_API_KEY on the server to enable selfie analysis.",
      setupRequired: true
    });
  }

  try {
    const body = await req.json();
    const image = body?.image;
    const answers = body?.answers ?? {};
    if (typeof image !== "string" || !/^data:image\/(jpeg|jpg|png|webp);base64,/.test(image)) {
      return NextResponse.json({ error: "Please upload a JPG, PNG, or WebP selfie." }, { status: 400 });
    }
    if (image.length > 7_000_000) {
      return NextResponse.json({ error: "Image is too large. Please use an image under about 5 MB." }, { status: 413 });
    }

    const model = process.env.OPENAI_VISION_MODEL || "gpt-4o-mini";
    const prompt = `You are a cautious cosmetic skincare education assistant. Inspect only visible, non-diagnostic skin features in this image. Do not infer identity, age, ethnicity, health status, or hidden medical conditions. Image lighting, makeup, camera quality, angle, blur, occlusion and skin tone can affect observations. The server performs no clinical-grade skin measurement. Never describe the score as an objective measure of beauty or health, and do not claim guaranteed accuracy. Use the user context if supplied: ${JSON.stringify(answers)}. Treat userMessage as self-reported context only, not verified facts. If the image is not clearly a single front-facing face, has poor quality, strong filter/makeup, or insufficient detail, set score null and explain that a reliable observation is not possible.
Return ONLY valid JSON with schema:
{"mode":"real_ai","score":number|null,"scoreLabel":"estimated visible-skin appearance indicator","summary":"short caveated summary","concerns":[{"name":"...","level":"low|moderate|uncertain","detail":"visible observation only"}],"ingredients":[{"name":"...","why":"...","howToStart":"...","caution":"..."}],"morning":["..."],"evening":["..."],"productTypes":["..."],"limitations":["..."]}.
Score 0-100 is an optional rough appearance indicator only; set null if image quality is insufficient. Avoid strong claims. Recommend simple routine first, patch testing, and daily broad-spectrum SPF 30+. Do not recommend prescription drugs, harsh bleaching agents, or diagnosing acne/rosacea/eczema. For persistent, painful, scarring, or worsening concerns advise a qualified dermatologist. Avoid multiple new actives at once. Mention that photo analysis is not medical advice. Keep each list concise.`;
    const upstream = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: { Authorization: `Bearer ${key}`, "Content-Type": "application/json" },
      body: JSON.stringify({
        model,
        temperature: 0.2,
        response_format: { type: "json_object" },
        messages: [{
          role: "user",
          content: [
            { type: "text", text: prompt },
            { type: "image_url", image_url: { url: image, detail: "high" } }
          ]
        }]
      })
    });
    if (!upstream.ok) {
      const detail = await upstream.text();
      console.error("Vision API request failed", upstream.status, detail.slice(0, 500));
      return NextResponse.json({ error: "AI analysis could not be completed. Check the server API configuration and try again." }, { status: 502 });
    }
    const data = await upstream.json();
    const content = data?.choices?.[0]?.message?.content;
    if (!content) throw new Error("No analysis content returned");
    const parsed = JSON.parse(content);
    const normalizedScore = typeof parsed.score === "number" ? Math.max(0, Math.min(100, Math.round(parsed.score))) : null;
    let leaderboardToken: string | null = null;
    const signingSecret = process.env.GLOWSCAN_LEADERBOARD_SECRET;
    if (normalizedScore !== null && signingSecret) {
      const payload = Buffer.from(JSON.stringify({
        score: normalizedScore,
        exp: Date.now() + 10 * 60 * 1000,
        nonce: randomBytes(18).toString("hex")
      })).toString("base64url");
      const signature = createHmac("sha256", signingSecret).update(payload).digest("base64url");
      leaderboardToken = `${payload}.${signature}`;
    }
    return NextResponse.json({
      mode: "real_ai",
      leaderboardToken,
      score: normalizedScore,
      scoreLabel: parsed.scoreLabel || "Estimated visible-skin appearance indicator",
      summary: String(parsed.summary || "The image was reviewed for visible skin features."),
      concerns: Array.isArray(parsed.concerns) ? parsed.concerns.slice(0, 6) : [],
      ingredients: Array.isArray(parsed.ingredients) ? parsed.ingredients.slice(0, 6) : [],
      morning: Array.isArray(parsed.morning) ? parsed.morning.slice(0, 6) : [],
      evening: Array.isArray(parsed.evening) ? parsed.evening.slice(0, 6) : [],
      productTypes: Array.isArray(parsed.productTypes) ? parsed.productTypes.slice(0, 6) : [],
      limitations: Array.isArray(parsed.limitations) ? parsed.limitations.slice(0, 5) : [],
      caution: "AI-generated cosmetic guidance only, not a medical diagnosis. Results can be affected by lighting, makeup, image quality and skin tone."
    }, { headers: { "Cache-Control": "no-store" } });
  } catch (error) {
    console.error("Analysis error", error);
    return NextResponse.json({ error: "Something went wrong while analyzing the image. Please try again." }, { status: 500 });
  }
}
