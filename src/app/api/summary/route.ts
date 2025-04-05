import { summarizeWithGemini } from "@/lib/gemini";
import {
  extractVideoId,
  findRelatedVideos,
  getVideoDetails,
} from "@/lib/youtube";
import { NextResponse } from "next/server";

export async function POST(req: Request) {
  try {
    const { url, transcript } = await req.json();

    if (!url) {
      return NextResponse.json(
        { error: "YouTube URL이 필요합니다." },
        { status: 400 }
      );
    }

    if (!transcript) {
      return NextResponse.json(
        { error: "자막이 필요합니다." },
        { status: 400 }
      );
    }

    const videoId = extractVideoId(url);
    if (!videoId) {
      return NextResponse.json(
        { error: "올바른 YouTube URL이 아닙니다." },
        { status: 400 }
      );
    }

    const [summaryResponse, videoDetails] = await Promise.all([
      summarizeWithGemini(transcript),
      getVideoDetails(videoId),
    ]);

    if (!videoDetails) {
      return NextResponse.json(
        { error: "영상 정보를 가져올 수 없습니다." },
        { status: 404 }
      );
    }

    // 관련 영상 검색
    const relatedVideos = await findRelatedVideos(summaryResponse.keywords);

    const { title, duration, thumbnailUrl } = videoDetails;

    return NextResponse.json({
      videoId,
      title,
      duration,
      thumbnailUrl,
      summary: summaryResponse.summary,
      timeline: summaryResponse.timeline,
      keywords: summaryResponse.keywords,
      relatedVideos,
    });
  } catch (error) {
    console.error("Error in summary route:", error);
    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? error.message
            : "요약 중 오류가 발생했습니다.",
      },
      { status: 500 }
    );
  }
}
