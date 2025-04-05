import { NextResponse } from "next/server";
import { YoutubeTranscript } from "youtube-transcript";

export async function POST(req: Request) {
  try {
    const { videoId } = await req.json();

    if (!videoId) {
      return NextResponse.json(
        { error: "비디오 ID가 필요합니다." },
        { status: 400 }
      );
    }

    const transcriptItems = await YoutubeTranscript.fetchTranscript(videoId, {
      lang: "ko",
    });

    // 자막을 시간 정보와 함께 처리
    const segments: { start: number; end: number; text: string }[] = [];
    let currentSegment = {
      start: transcriptItems[0]?.offset || 0,
      end: 0,
      text: "",
    };

    transcriptItems.forEach((item, index) => {
      const currentText = item.text.trim();
      if (currentText) {
        if (currentSegment.text) {
          currentSegment.text += " " + currentText;
        } else {
          currentSegment.text = currentText;
        }

        // 다음 자막이 없거나, 현재 세그먼트가 충분히 길면 새로운 세그먼트 시작
        if (
          index === transcriptItems.length - 1 ||
          currentSegment.text.length > 200
        ) {
          currentSegment.end = item.offset + item.duration;
          segments.push({ ...currentSegment });
          if (index < transcriptItems.length - 1) {
            currentSegment = {
              start: transcriptItems[index + 1].offset,
              end: 0,
              text: "",
            };
          }
        }
      }
    });

    // 시간 정보를 포함한 텍스트 생성
    const transcript = segments
      .map((segment) => {
        const startTime = new Date(segment.start * 1000)
          .toISOString()
          .substr(11, 8);
        const endTime = new Date(segment.end * 1000)
          .toISOString()
          .substr(11, 8);
        return `[${startTime} ~ ${endTime}] ${segment.text}`;
      })
      .join("\n\n");

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
