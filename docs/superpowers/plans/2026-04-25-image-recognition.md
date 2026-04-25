# AI 图片识别工具 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build a single-page AI image recognition tool that identifies an item's name and estimated weight from an uploaded photo.

**Architecture:** Next.js App Router app with one page component for upload/display and one API route that proxies to an OpenAI-compatible multimodal API. Image is sent as base64 to the model, which returns structured JSON.

**Tech Stack:** Next.js 14+, TypeScript, Tailwind CSS, `openai` SDK

---

## File Structure

| File | Responsibility |
|------|---------------|
| `package.json` | Dependencies and scripts |
| `next.config.ts` | Next.js configuration |
| `tailwind.config.ts` | Tailwind CSS configuration |
| `tsconfig.json` | TypeScript configuration |
| `postcss.config.mjs` | PostCSS for Tailwind |
| `.env.local` | API credentials (baseUrl, apiKey, modelName) |
| `src/app/layout.tsx` | Root HTML layout with metadata |
| `src/app/globals.css` | Tailwind directives |
| `src/app/page.tsx` | Main page: upload, preview, results |
| `src/app/api/recognize/route.ts` | POST handler: validate image, call API, return JSON |

---

### Task 1: Scaffold Next.js Project

**Files:**
- Create: `package.json`
- Create: `next.config.ts`
- Create: `tsconfig.json`
- Create: `tailwind.config.ts`
- Create: `postcss.config.mjs`
- Create: `.env.local`

- [ ] **Step 1: Initialize Next.js project with dependencies**

```bash
cd "/Users/tony/Code/interview- program"
npx create-next-app@latest . --typescript --tailwind --eslint --app --src-dir --no-import-alias --use-npm
```

Select defaults when prompted. This creates `package.json`, `next.config.ts`, `tsconfig.json`, `tailwind.config.ts`, `postcss.config.mjs`, and the `src/app/` directory structure.

- [ ] **Step 2: Install openai SDK**

```bash
npm install openai
```

- [ ] **Step 3: Create .env.local with placeholder values**

Create `.env.local`:

```
OPENAI_BASE_URL=https://api.openai.com/v1
OPENAI_API_KEY=your-api-key-here
MODEL_NAME=gpt-4o
```

- [ ] **Step 4: Commit**

```bash
git add -A
git commit -m "chore: scaffold Next.js project with openai SDK"
```

---

### Task 2: Implement API Route `/api/recognize`

**Files:**
- Create: `src/app/api/recognize/route.ts`

- [ ] **Step 1: Write the API route handler**

Create `src/app/api/recognize/route.ts`:

```typescript
import OpenAI from "openai";
import { NextRequest, NextResponse } from "next/server";

const ALLOWED_TYPES = ["image/jpeg", "image/png", "image/webp"];
const MAX_SIZE = 10 * 1024 * 1024; // 10MB

export async function POST(request: NextRequest) {
  const formData = await request.formData();
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
            '你是一个物品识别专家。用户会给你一张图片，你需要识别图片中的物品。请以严格的 JSON 格式返回结果，包含两个字段：name（物品名称）和 weight（估算重量，带单位）。示例：{"name":"苹果","weight":"约200g"}。只返回 JSON，不要返回其他内容。',
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
      max_tokens: 300,
    });

    const content = response.choices[0]?.message?.content?.trim() || "";

    const jsonMatch = content.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      return NextResponse.json(
        { success: false, error: "模型返回格式异常，请重试" },
        { status: 500 }
      );
    }

    const result = JSON.parse(jsonMatch[0]);

    return NextResponse.json({
      success: true,
      data: { name: result.name, weight: result.weight },
    });
  } catch (error) {
    console.error("Recognition error:", error);
    return NextResponse.json(
      { success: false, error: "识别失败，请稍后重试" },
      { status: 500 }
    );
  }
}
```

- [ ] **Step 2: Verify the route compiles**

```bash
cd "/Users/tony/Code/interview- program" && npx tsc --noEmit
```

Expected: no errors.

- [ ] **Step 3: Commit**

```bash
git add src/app/api/
git commit -m "feat: add /api/recognize endpoint with OpenAI-compatible API"
```

---

### Task 3: Implement Frontend Page

**Files:**
- Modify: `src/app/globals.css`
- Modify: `src/app/layout.tsx`
- Create: `src/app/page.tsx`

- [ ] **Step 1: Update globals.css with Tailwind directives**

Replace the contents of `src/app/globals.css` with:

```css
@import "tailwindcss";
```

- [ ] **Step 2: Update layout.tsx**

Replace the contents of `src/app/layout.tsx` with:

```tsx
import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "AI 物品识别",
  description: "上传图片，AI 识别物品名称和估算重量",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="zh-CN">
      <body className="bg-gray-50 min-h-screen">{children}</body>
    </html>
  );
}
```

- [ ] **Step 3: Write the main page component**

Create `src/app/page.tsx`:

```tsx
"use client";

import { useState, useRef } from "react";

interface RecognizeResult {
  name: string;
  weight: string;
}

export default function Home() {
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<RecognizeResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const handleFile = (f: File) => {
    if (!["image/jpeg", "image/png", "image/webp"].includes(f.type)) {
      setError("仅支持 JPG、PNG、WebP 格式");
      return;
    }
    if (f.size > 10 * 1024 * 1024) {
      setError("图片大小不能超过 10MB");
      return;
    }
    setError(null);
    setResult(null);
    setFile(f);
    setPreview(URL.createObjectURL(f));
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    const f = e.dataTransfer.files[0];
    if (f) handleFile(f);
  };

  const handleRecognize = async () => {
    if (!file) return;
    setLoading(true);
    setError(null);
    setResult(null);

    const formData = new FormData();
    formData.append("image", file);

    try {
      const res = await fetch("/api/recognize", { method: "POST", body: formData });
      const data = await res.json();

      if (!data.success) {
        setError(data.error || "识别失败");
        return;
      }
      setResult(data.data);
    } catch {
      setError("网络错误，请稍后重试");
    } finally {
      setLoading(false);
    }
  };

  const handleReset = () => {
    setFile(null);
    setPreview(null);
    setResult(null);
    setError(null);
    if (inputRef.current) inputRef.current.value = "";
  };

  return (
    <main className="max-w-lg mx-auto px-4 py-12">
      <h1 className="text-2xl font-bold text-center mb-8">AI 物品识别</h1>

      {!preview ? (
        <div
          onClick={() => inputRef.current?.click()}
          onDragOver={(e) => e.preventDefault()}
          onDrop={handleDrop}
          className="border-2 border-dashed border-gray-300 rounded-lg p-12 text-center cursor-pointer hover:border-blue-400 hover:bg-blue-50 transition-colors"
        >
          <p className="text-gray-500">点击或拖拽上传图片</p>
          <p className="text-gray-400 text-sm mt-2">支持 JPG、PNG、WebP，最大 10MB</p>
          <input
            ref={inputRef}
            type="file"
            accept="image/jpeg,image/png,image/webp"
            className="hidden"
            onChange={(e) => e.target.files?.[0] && handleFile(e.target.files[0])}
          />
        </div>
      ) : (
        <div className="space-y-4">
          <img src={preview} alt="预览" className="w-full rounded-lg border" />
          <div className="flex gap-3">
            <button
              onClick={handleRecognize}
              disabled={loading}
              className="flex-1 bg-blue-600 text-white py-2 rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? "识别中..." : "识别"}
            </button>
            <button
              onClick={handleReset}
              disabled={loading}
              className="px-4 py-2 border rounded-lg hover:bg-gray-50 disabled:opacity-50"
            >
              重新上传
            </button>
          </div>
        </div>
      )}

      {error && <p className="mt-4 text-red-600 text-center">{error}</p>}

      {result && (
        <div className="mt-6 p-4 bg-white rounded-lg border space-y-2">
          <p>
            <span className="font-medium">物品名称：</span>
            {result.name}
          </p>
          <p>
            <span className="font-medium">估算重量：</span>
            {result.weight}
          </p>
        </div>
      )}
    </main>
  );
}
```

- [ ] **Step 4: Verify the project compiles**

```bash
cd "/Users/tony/Code/interview- program" && npx tsc --noEmit
```

Expected: no errors.

- [ ] **Step 5: Commit**

```bash
git add src/app/
git commit -m "feat: add main page with image upload and recognition display"
```

---

### Task 4: Verify End-to-End

- [ ] **Step 1: Start dev server**

```bash
cd "/Users/tony/Code/interview- program" && npm run dev
```

Expected: server starts on `http://localhost:3000`.

- [ ] **Step 2: Open browser and test**

1. Open `http://localhost:3000` in browser
2. Verify upload area renders with dashed border
3. Upload an image file
4. Verify preview appears with "识别" and "重新上传" buttons
5. Click "识别" — verify loading state shows
6. Verify result (name + weight) displays below (requires valid API key in `.env.local`)
7. Click "重新上传" — verify returns to empty state

- [ ] **Step 3: Stop dev server**

Stop the running dev server with Ctrl+C.
