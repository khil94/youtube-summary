import { NextResponse } from "next/server";
import { YoutubeTranscript } from "youtube-transcript";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const videoId = searchParams.get("videoId");

    if (!videoId) {
      return NextResponse.json(
        { error: "Video ID is required" },
        { status: 400 }
      );
    }

    const transcript = await YoutubeTranscript.fetchTranscript(videoId, {
      lang: "ko",
    });

    return NextResponse.json({ transcript });
  } catch (error) {
    console.error("[Captions API Error]:", {
      error,
      message: error instanceof Error ? error.message : "Unknown error",
      timestamp: new Date().toISOString(),
    });

    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? error.message
            : "자막을 가져오는데 실패했습니다.",
      },
      { status: 500 }
    );
  }
}
