import { NextResponse } from "next/server";
import { YoutubeTranscript } from "youtube-transcript";

interface TranscriptItem {
  text: string;
  offset: number;
  duration: number;
}

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
      const transcriptItems = await YoutubeTranscript.fetchTranscript(videoId);

      // 자막을 시간 정보와 함께 처리
      const segments: { start: number; end: number; text: string }[] = [];
      let currentSegment = {
        start: transcriptItems[0]?.offset || 0,
        end: 0,
        text: "",
      };

      transcriptItems.forEach((item: TranscriptItem, index: number) => {
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
    } catch (transcriptError) {
      console.error("[YouTube Transcript Error]:", {
        error: transcriptError,
        message:
          transcriptError instanceof Error
            ? transcriptError.message
            : "Unknown error",
        videoId,
      });

      // 자막 비활성화 에러 처리
      if (transcriptError instanceof Error) {
        const errorMessage = transcriptError.message.toLowerCase();
        if (errorMessage.includes("transcript is disabled")) {
          return NextResponse.json(
            {
              error:
                "이 영상은 자막이 비활성화되어 있습니다. 다른 영상을 선택해주세요.",
            },
            { status: 400 }
          );
        }
        if (errorMessage.includes("no captions")) {
          return NextResponse.json(
            {
              error:
                "이 영상에는 자막이 없습니다. 자막이 있는 다른 영상을 선택해주세요.",
            },
            { status: 400 }
          );
        }
      }

      throw transcriptError;
    }
  } catch (error) {
    console.error("[Transcript API Error]:", {
      error,
      message: error instanceof Error ? error.message : "Unknown error",
      timestamp: new Date().toISOString(),
    });

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
