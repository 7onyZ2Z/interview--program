import OpenAI from "openai";
import { NextRequest, NextResponse } from "next/server";

const ALLOWED_TYPES = ["image/jpeg", "image/png", "image/webp"];
const MAX_SIZE = 10 * 1024 * 1024; // 10MB

export async function POST(request: NextRequest) {
  let formData: FormData;
  try {
    formData = await request.formData();
  } catch {
    return NextResponse.json(
      { success: false, error: "请上传图片文件" },
      { status: 400 }
    );
  }
  const file = formData.get("image");

  if (!file || !(file instanceof File)) {
    return NextResponse.json(
      { success: false, error: "请上传图片文件" },
      { status: 400 }
    );
  }

  if (!ALLOWED_TYPES.includes(file.type)) {
    return NextResponse.json(
      { success: false, error: "仅支持 JPG、PNG、WebP 格式" },
      { status: 400 }
    );
  }

  if (file.size > MAX_SIZE) {
    return NextResponse.json(
      { success: false, error: "图片大小不能超过 10MB" },
      { status: 400 }
    );
  }

  const buffer = Buffer.from(await file.arrayBuffer());
  const base64 = buffer.toString("base64");
  const dataUrl = `data:${file.type};base64,${base64}`;

  const client = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY,
    baseURL: process.env.OPENAI_BASE_URL,
  });

  try {
    const response = await client.chat.completions.create({
      model: process.env.MODEL_NAME || "gpt-4o",
      messages: [
        {
          role: "system",
          content:
            '你是一个物品识别专家。用户会给你一张图片，你需要识别图片中的物品。请以严格的 JSON 格式返回结果，包含两个字段：name（物品名称）和 weight（估算重量，带单位）。示例：{"name":"苹果","weight":"约200g"}。只返回 JSON，不要返回其他内容。并且不要输出任何解释说明，只返回结果即可',
        },
        {
          role: "user",
          content: [
            {
              type: "image_url",
              image_url: { url: dataUrl },
            },
            {
              type: "text",
              text: "请识别这张图片中的物品名称和估算重量。",
            },
          ],
        },
      ],
      max_tokens: 1024,
    });

    const content = response.choices[0]?.message?.content?.trim() || "";

    const jsonMatch = content.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      return NextResponse.json(
        { success: false, error: `模型返回格式异常: ${content.slice(0, 200)}` },
        { status: 500 }
      );
    }

    let result: { name?: string; weight?: string };
    try {
      result = JSON.parse(jsonMatch[0]);
    } catch {
      return NextResponse.json(
        { success: false, error: `JSON 解析失败: ${jsonMatch[0].slice(0, 200)}` },
        { status: 500 }
      );
    }

    if (!result.name || !result.weight) {
      return NextResponse.json(
        { success: false, error: `返回数据缺少字段: ${JSON.stringify(result)}` },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      data: { name: result.name, weight: result.weight },
    });
  } catch (error: unknown) {
    console.error("Recognition error:", error);
    const message = error instanceof Error ? error.message : "识别失败，请稍后重试";
    return NextResponse.json(
      { success: false, error: message },
      { status: 500 }
    );
  }
}
