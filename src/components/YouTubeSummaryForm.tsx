"use client";

import { LoadingSpinner } from "@/components/LoadingSpinner";
import { extractVideoId } from "@/lib/youtube";
import { useState } from "react";
import CollapsibleSection from "./CollapsibleSection";
import HashTags from "./HashTags";
import RelatedVideos from "./RelatedVideos";
import ShareButton from "./ShareButton";
import Timeline from "./Timeline";

interface VideoDetails {
  videoId: string;
  title: string;
  duration: string;
  thumbnailUrl: string;
  summary: string;
  timeline: string;
  keywords: string[];
  relatedVideos: RelatedVideo[];
}

interface RelatedVideo {
  id: string;
  title: string;
  description: string;
  thumbnailUrl: string;
}

export function YouTubeSummaryForm() {
  const [url, setUrl] = useState("");
  const [videoDetails, setVideoDetails] = useState<VideoDetails | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const [playerRef, setPlayerRef] = useState<HTMLIFrameElement | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError("");
    setVideoDetails(null);

    try {
      console.log("Form submitted with URL:", url);
      const videoId = extractVideoId(url);
      console.log("Extracted videoId:", videoId);

      if (!videoId) {
        throw new Error(
          "올바른 YouTube URL이 아닙니다. YouTube 영상의 전체 URL을 입력해주세요.\n" +
            "예시: https://www.youtube.com/watch?v=xxxx"
        );
      }

      // 자막 가져오기
      console.log("Fetching transcript...");
      const transcriptResponse = await fetch(
        `${process.env.NEXT_PUBLIC_BASE_URL || ""}/api/transcript`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ videoId }),
        }
      );

      console.log("Transcript response status:", transcriptResponse.status);
      const transcriptData = await transcriptResponse.json();
      console.log("Transcript response data:", transcriptData);

      if (!transcriptResponse.ok) {
        if (transcriptData.error?.includes("No captions")) {
          throw new Error(
            "이 영상에는 자막이 없습니다. 자막이 있는 영상을 선택해주세요."
          );
        }
        if (transcriptData.error?.includes("Transcript is disabled")) {
          throw new Error(
            "이 영상은 자막이 비활성화되어 있습니다. 자막이 활성화된 다른 영상을 선택해주세요."
          );
        }
        throw new Error(
          transcriptData.error ||
            "자막을 가져오는 중 문제가 발생했습니다. 잠시 후 다시 시도해주세요."
        );
      }

      const { transcript } = transcriptData;

      // 요약 및 비디오 정보 가져오기
      const summaryResponse = await fetch(
        `${process.env.NEXT_PUBLIC_BASE_URL || ""}/api/summary`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ url, transcript }),
        }
      );

      if (!summaryResponse.ok) {
        const data = await summaryResponse.json();
        throw new Error(
          data.error ||
            "영상 요약 중 문제가 발생했습니다. 잠시 후 다시 시도해주세요."
        );
      }

      const data = await summaryResponse.json();
      console.log("API 응답 데이터:", data);
      setVideoDetails(data);
    } catch (err) {
      console.error("Error:", err);
      const errorMessage = err instanceof Error ? err.message : String(err);

      // API 할당량 초과 에러 처리
      if (
        errorMessage.includes("Too Many Requests") ||
        errorMessage.includes("quota") ||
        errorMessage.includes("429")
      ) {
        setError(
          "🕒 현재 너무 많은 요청이 들어와 API 할당량을 초과했습니다.\n" +
            "잠시 후 (약 1분 뒤) 다시 시도해주세요."
        );
      }
      // API 키 관련 에러 처리
      else if (errorMessage.includes("API key")) {
        setError("API 키 오류가 발생했습니다. 잠시 후 다시 시도해주세요.");
      }
      // 기타 에러 처리
      else {
        setError(
          errorMessage ||
            "알 수 없는 오류가 발생했습니다. 잠시 후 다시 시도해주세요."
        );
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleTimeClick = (seconds: number) => {
    if (playerRef) {
      // YouTube 플레이어에 메시지 전송
      playerRef.contentWindow?.postMessage(
        JSON.stringify({
          event: "command",
          func: "seekTo",
          args: [seconds, true],
        }),
        "*"
      );
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-900">
      <div className="max-w-4xl w-full mx-auto px-4 py-8">
        <h1 className="text-3xl font-bold mb-8 text-center text-white">
          YouTube 영상 요약
        </h1>

        <form onSubmit={handleSubmit} className="mb-8 w-full">
          <div className="flex gap-4">
            <input
              type="text"
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              placeholder="YouTube 영상 URL을 입력하세요 (예: https://www.youtube.com/watch?v=xxxx)"
              className="flex-1 p-2 border border-gray-700 rounded bg-gray-800 text-white placeholder-gray-400"
            />
            <button
              type="submit"
              disabled={isLoading}
              className="px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700 disabled:bg-gray-700"
            >
              요약하기
            </button>
          </div>
        </form>

        {isLoading && <LoadingSpinner />}

        {error && (
          <div className="p-4 mb-4 text-red-300 bg-red-900/50 rounded w-full whitespace-pre-line border border-red-800">
            {error}
          </div>
        )}

        {videoDetails && (
          <div className="mt-8 space-y-8">
            {/* 비디오 정보 섹션 */}
            <CollapsibleSection title="영상 정보">
              <div className="flex flex-col md:flex-row">
                {/* YouTube 플레이어 */}
                <div className="md:w-[480px] flex-shrink-0 relative aspect-video">
                  <iframe
                    ref={(ref) => setPlayerRef(ref)}
                    src={`https://www.youtube.com/embed/${videoDetails.videoId}?rel=0&enablejsapi=1`}
                    title={videoDetails.title}
                    className="absolute top-0 left-0 w-full h-full"
                    allowFullScreen
                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                  />
                </div>

                {/* 비디오 메타 정보 */}
                <div className="p-6 flex flex-col flex-grow">
                  <h2 className="text-2xl font-bold mb-2 line-clamp-2 text-white">
                    {videoDetails.title}
                  </h2>
                  <p className="text-gray-300 mb-4">
                    재생시간: {videoDetails.duration}
                  </p>
                  <HashTags keywords={videoDetails.keywords} />
                  <div className="mt-4">
                    <ShareButton videoDetails={videoDetails} />
                  </div>
                </div>
              </div>
            </CollapsibleSection>

            {/* 요약 섹션 */}
            <CollapsibleSection title="영상 요약">
              <div className="prose max-w-none">
                <p className="whitespace-pre-wrap text-gray-300 leading-relaxed">
                  {videoDetails.summary}
                </p>
              </div>
            </CollapsibleSection>

            {/* 타임라인 섹션 */}
            <CollapsibleSection title="타임라인" defaultOpen={false}>
              <Timeline
                content={videoDetails.timeline}
                onTimeClick={handleTimeClick}
              />
            </CollapsibleSection>

            {/* 관련 영상 섹션 */}
            {videoDetails.relatedVideos &&
              videoDetails.relatedVideos.length > 0 && (
                <CollapsibleSection title="관련 영상">
                  <RelatedVideos
                    videos={videoDetails.relatedVideos}
                    onVideoSelect={(videoId) => {
                      window.open(
                        `https://www.youtube.com/watch?v=${videoId}`,
                        "_blank"
                      );
                    }}
                  />
                </CollapsibleSection>
              )}
          </div>
        )}
      </div>
    </div>
  );
}
