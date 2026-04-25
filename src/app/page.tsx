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
