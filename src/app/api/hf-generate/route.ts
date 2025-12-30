import type { NextRequest } from "next/server";

const HF_MODEL = "black-forest-labs/FLUX.1-schnell";
const HF_ENDPOINT = `https://api-inference.huggingface.co/models/${HF_MODEL}`;

export async function POST(req: NextRequest) {
  const token = process.env.HF_TOKEN || process.env.HUGGINGFACE_TOKEN;
  if (!token) {
    return Response.json(
      { error: "HF_TOKEN ยังไม่ถูกตั้งค่าใน env" },
      { status: 500 }
    );
  }

  try {
    const body = await req.json();
    const prompt: string = body?.prompt?.toString?.().trim?.() || "";
    const width = Number(body?.width) || 960;
    const height = Number(body?.height) || 1200;
    const seed = Number(body?.seed) || Math.floor(Math.random() * 1_000_000);

    if (!prompt) {
      return Response.json({ error: "prompt ว่าง" }, { status: 400 });
    }

    const fullPrompt = [
      prompt,
      "hyperrealistic photo, realistic vision, ultra detailed, sharp focus, cinematic lighting",
      `${width}x${height}`,
    ].join(", ");

    const negativePrompt = [
      "text, watermark, logo, caption, subtitles",
      "cartoon, illustration, anime, painting, cgi",
      "distorted hands or fingers, extra limbs, blurry, lowres, low quality",
    ].join(", ");

    const response = await fetch(HF_ENDPOINT, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        inputs: fullPrompt,
        parameters: {
          negative_prompt: negativePrompt,
          width,
          height,
          num_inference_steps: 28,
          guidance_scale: 3.5,
          seed,
        },
      }),
    });

    if (!response.ok) {
      let errMsg = `HF error ${response.status}`;
      try {
        const detail = await response.json();
        errMsg = detail?.error || errMsg;
      } catch (e) {
        // ignore JSON parse errors
      }
      return Response.json({ error: errMsg }, { status: 502 });
    }

    const arrayBuffer = await response.arrayBuffer();
    const base64 = Buffer.from(arrayBuffer).toString("base64");
    const dataUrl = `data:image/png;base64,${base64}`;

    return Response.json({ image: dataUrl });
  } catch (error) {
    return Response.json(
      { error: "hf-generate: unexpected error" },
      { status: 500 }
    );
  }
}
