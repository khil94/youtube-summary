import { getTranscript } from "@/lib/youtube";
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

    const transcript = await getTranscript(videoId);

    if (!transcript) {
      return NextResponse.json(
        { error: "자막을 찾을 수 없습니다." },
        { status: 404 }
      );
    }

    return NextResponse.json({ transcript });
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
