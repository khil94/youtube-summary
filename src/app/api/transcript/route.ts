import { NextResponse } from "next/server";

export async function POST(req: Request) {
  try {
    const { videoId } = await req.json();

    if (!videoId) {
      return NextResponse.json(
        { error: "비디오 ID가 필요합니다." },
        { status: 400 }
      );
    }

    try {
      // 1. 자막 목록 가져오기
      const captionsResponse = await fetch(
        `https://www.googleapis.com/youtube/v3/captions?part=snippet&videoId=${videoId}&key=${process.env.NEXT_PUBLIC_YOUTUBE_API_KEY}`
      );

      if (!captionsResponse.ok) {
        throw new Error("자막 정보를 가져오는데 실패했습니다.");
      }

      const captionsData = await captionsResponse.json();

      if (!captionsData.items || captionsData.items.length === 0) {
        return NextResponse.json(
          {
            error:
              "이 영상에는 자막이 없습니다. 자막이 있는 다른 영상을 선택해주세요.",
          },
          { status: 400 }
        );
      }

      // 2. 첫 번째 자막 선택 (기본적으로 가장 적절한 자막이 첫 번째로 옴)
      const captionId = captionsData.items[0].id;

      // 3. 자막 내용 가져오기
      const transcriptResponse = await fetch(
        `https://www.googleapis.com/youtube/v3/captions/${captionId}?key=${process.env.NEXT_PUBLIC_YOUTUBE_API_KEY}`
      );

      if (!transcriptResponse.ok) {
        throw new Error("자막 내용을 가져오는데 실패했습니다.");
      }

      const transcriptData = await transcriptResponse.json();
      const transcript = transcriptData.text;

      return NextResponse.json({ transcript });
    } catch (transcriptError) {
      console.error("[YouTube Transcript Error]:", transcriptError);
      throw transcriptError;
    }
  } catch (error) {
    console.error("[Transcript API Error]:", error);
    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? error.message
            : "자막을 가져오는 중 오류가 발생했습니다.",
      },
      { status: 500 }
    );
  }
}
