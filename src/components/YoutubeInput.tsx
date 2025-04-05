"use client";

import type { SummaryResponse } from "@/types/api";
import { ArrowRightIcon } from "@heroicons/react/24/solid";
import { useState } from "react";
import { LoadingSpinner } from "./LoadingSpinner";
import { VideoSummaryResult } from "./VideoSummaryResult";

export function YoutubeInput() {
  const [url, setUrl] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [result, setResult] = useState<SummaryResponse | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loadingState, setLoadingState] = useState<string>("idle");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!url) return;

    setIsLoading(true);
    setError(null);
    setResult(null);
    setLoadingState("video-info");

    try {
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_BASE_URL || ""}/api/summary`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ url }),
        }
      );

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || "요약 중 오류가 발생했습니다.");
      }

      setLoadingState("summarizing");
      const data = await response.json();
      setResult(data);
      console.log("data", data);
    } catch (error) {
      console.error("Error:", error);
      setError(
        error instanceof Error
          ? error.message
          : "알 수 없는 오류가 발생했습니다."
      );
    } finally {
      setIsLoading(false);
      setLoadingState("idle");
    }
  };

  const getLoadingMessage = () => {
    switch (loadingState) {
      case "video-info":
        return "영상 정보를 가져오는 중...";
      case "summarizing":
        return "영상 내용을 요약하는 중... (최대 1분 정도 소요될 수 있습니다)";
      default:
        return "처리 중...";
    }
  };

  return (
    <div className="space-y-8">
      <form onSubmit={handleSubmit} className="max-w-2xl mx-auto">
        <div className="flex gap-2">
          <input
            type="url"
            value={url}
            onChange={(e) => setUrl(e.target.value)}
            placeholder="YouTube URL을 입력하세요"
            className="flex-1 px-4 py-2 rounded-lg bg-gray-700 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
            required
            disabled={isLoading}
          />
          <button
            type="submit"
            disabled={isLoading}
            className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
          >
            {isLoading ? "처리중..." : "요약하기"}
            {!isLoading && <ArrowRightIcon className="w-4 h-4" />}
          </button>
        </div>
      </form>

      {isLoading && <LoadingSpinner message={getLoadingMessage()} />}

      {error && (
        <div className="max-w-2xl mx-auto p-4 bg-red-500/10 border border-red-500 rounded-lg text-red-500">
          {error}
        </div>
      )}

      {result && <VideoSummaryResult result={result} />}
    </div>
  );
}
