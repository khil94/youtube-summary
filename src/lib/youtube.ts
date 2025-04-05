import { YoutubeTranscript } from "youtube-transcript";

interface VideoTranscript {
  text: string;
  duration: number;
  offset: number;
}

interface RelatedVideo {
  id: string;
  title: string;
  description: string;
  thumbnailUrl: string;
}

interface YouTubeSearchResult {
  id: {
    videoId: string;
  };
  snippet: {
    title: string;
    description: string;
    thumbnails: {
      medium: {
        url: string;
      };
    };
  };
}

// YouTube API 응답의 부분적 타입 정의
interface YouTubeApiResponse {
  items?: Array<{
    id?: {
      videoId?: string;
    };
    snippet?: {
      title?: string;
      description?: string;
      thumbnails?: {
        medium?: {
          url?: string;
        };
      };
    };
  }>;
}

interface VideoDetails {
  title: string;
  duration: string;
  thumbnailUrl: string;
}

if (!process.env.NEXT_PUBLIC_YOUTUBE_API_KEY) {
  throw new Error(
    "YouTube API 키가 설정되지 않았습니다. .env.local 파일에 NEXT_PUBLIC_YOUTUBE_API_KEY를 추가해주세요."
  );
}

export function extractVideoId(url: string): string | null {
  const patterns = [
    /(?:https?:\/\/)?(?:www\.)?youtube\.com\/watch\?v=([^&]+)/,
    /(?:https?:\/\/)?(?:www\.)?youtube\.com\/embed\/([^?]+)/,
    /(?:https?:\/\/)?(?:www\.)?youtu\.be\/([^?]+)/,
  ];

  for (const pattern of patterns) {
    const match = url.match(pattern);
    if (match) {
      return match[1];
    }
  }

  return null;
}

export async function getTranscript(videoId: string): Promise<string | null> {
  try {
    // 한국어 자막 우선 시도
    const transcript: VideoTranscript[] =
      await YoutubeTranscript.fetchTranscript(videoId, {
        lang: "ko",
      });

    // 자막을 시간 정보와 함께 처리
    const segments: { start: number; end: number; text: string }[] = [];
    let currentSegment = {
      start: transcript[0]?.offset || 0,
      end: 0,
      text: "",
    };

    transcript.forEach((item, index) => {
      const currentText = item.text.trim();
      if (currentText) {
        if (currentSegment.text) {
          currentSegment.text += " " + currentText;
        } else {
          currentSegment.text = currentText;
        }

        // 다음 자막이 없거나, 현재 세그먼트가 충분히 길면 새로운 세그먼트 시작
        if (
          index === transcript.length - 1 ||
          currentSegment.text.length > 200
        ) {
          currentSegment.end = item.offset + item.duration;
          segments.push({ ...currentSegment });
          if (index < transcript.length - 1) {
            currentSegment = {
              start: transcript[index + 1].offset,
              end: 0,
              text: "",
            };
          }
        }
      }
    });

    // 시간 정보를 포함한 텍스트 생성
    const formattedTranscript = segments
      .map((segment) => {
        const startTime = formatTime(segment.start);
        const endTime = formatTime(segment.end);
        return `[${startTime} ~ ${endTime}] ${segment.text}`;
      })
      .join("\n\n");

    return formattedTranscript;
  } catch (error) {
    console.error("[YoutubeTranscript] 🚨 Error details:", {
      error,
      message: error instanceof Error ? error.message : "Unknown error",
      videoId,
      timestamp: new Date().toISOString(),
    });

    // 더 자세한 에러 메시지 제공
    if (error instanceof Error) {
      if (error.message.includes("Transcript is disabled")) {
        throw new Error(
          "이 영상은 자막이 비활성화되어 있습니다. 다음 방법을 시도해보세요:\n" +
            "1. 영상 설정(⚙️)에서 자막 활성화\n" +
            "2. 자동 생성 자막 사용\n" +
            "3. 다른 영상 선택"
        );
      }
      if (error.message.includes("No captions")) {
        throw new Error(
          "이 영상에는 자막이 없습니다. 다음 방법을 시도해보세요:\n" +
            "1. 자동 생성 자막 사용\n" +
            "2. 자막이 있는 다른 영상 선택"
        );
      }
    }
    throw error;
  }
}

// 시간(초)을 HH:MM:SS 형식으로 변환
function formatTime(seconds: number): string {
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  const secs = Math.floor(seconds % 60);

  return [hours, minutes, secs]
    .map((v) => v.toString().padStart(2, "0"))
    .join(":");
}

export async function findRelatedVideos(
  keywords: string[],
  maxResults: number = 5
): Promise<RelatedVideo[]> {
  try {
    console.log("검색에 사용되는 키워드:", keywords);

    const params = new URLSearchParams({
      part: "snippet",
      q: keywords.join(" | "),
      type: "video",
      maxResults: maxResults.toString(),
      relevanceLanguage: "ko",
      key: process.env.NEXT_PUBLIC_YOUTUBE_API_KEY || "",
    });

    const response = await fetch(
      `https://www.googleapis.com/youtube/v3/search?${params.toString()}`
    );

    if (!response.ok) {
      throw new Error(`YouTube API 오류: ${response.status}`);
    }

    const data: YouTubeApiResponse = await response.json();

    if (!data.items || !Array.isArray(data.items)) {
      console.error("[YouTube API Error] 잘못된 응답 형식:", data);
      return [];
    }

    return data.items
      .filter((item): item is YouTubeSearchResult => {
        // 필수 필드가 있는지 확인
        return Boolean(
          item !== null &&
            typeof item === "object" &&
            item.id?.videoId &&
            item.snippet?.title &&
            item.snippet?.description &&
            item.snippet?.thumbnails?.medium?.url
        );
      })
      .map((item) => ({
        id: item.id.videoId,
        title: item.snippet.title,
        description: item.snippet.description,
        thumbnailUrl: item.snippet.thumbnails.medium.url,
      }));
  } catch (error) {
    console.error("[YouTube API Error]:", error);
    throw new Error("관련 영상을 검색하는 중 오류가 발생했습니다.");
  }
}

export async function getVideoDetails(
  videoId: string
): Promise<VideoDetails | null> {
  try {
    const params = new URLSearchParams({
      part: "snippet,contentDetails",
      id: videoId,
      key: process.env.NEXT_PUBLIC_YOUTUBE_API_KEY || "",
    });

    const response = await fetch(
      `https://www.googleapis.com/youtube/v3/videos?${params.toString()}`
    );

    if (!response.ok) {
      throw new Error(`YouTube API 오류: ${response.status}`);
    }

    const data = await response.json();

    if (!data.items || !data.items[0]) {
      return null;
    }

    const video = data.items[0];
    const durationStr = video.contentDetails.duration;

    // ISO 8601 duration 형식을 파싱하여 분과 초로 변환
    const minutes = durationStr.match(/(\d+)M/)?.[1] || "0";
    const seconds = durationStr.match(/(\d+)S/)?.[1] || "0";

    // 한글 형식으로 변환
    const duration = `${minutes}분${seconds}초`;

    return {
      title: video.snippet.title,
      duration: duration,
      thumbnailUrl: video.snippet.thumbnails.medium.url,
    };
  } catch (error) {
    console.error("[YouTube API Error]:", error);
    return null;
  }
}
