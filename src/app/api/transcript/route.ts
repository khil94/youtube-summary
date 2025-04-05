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

    // YouTube 동영상 페이지에서 자막 데이터 직접 가져오기
    const response = await fetch(`https://www.youtube.com/watch?v=${videoId}`);
    const html = await response.text();

    // 자막 데이터 추출
    const captionTrackPattern = /"captionTracks":\[(.*?)\]/;
    const match = html.match(captionTrackPattern);

    if (!match) {
      return NextResponse.json(
        { error: "자막을 찾을 수 없습니다." },
        { status: 404 }
      );
    }

    const captionTracks = JSON.parse(`[${match[1]}]`);
    const koreanTrack = captionTracks.find(
      (track: { languageCode: string }) => track.languageCode === "ko"
    );
    const defaultTrack = captionTracks[0];
    const selectedTrack = koreanTrack || defaultTrack;

    if (!selectedTrack?.baseUrl) {
      return NextResponse.json(
        { error: "자막을 찾을 수 없습니다." },
        { status: 404 }
      );
    }

    // 자막 내용 가져오기
    const transcriptResponse = await fetch(selectedTrack.baseUrl);
    const transcript = await transcriptResponse.text();

    // XML 형식의 자막을 파싱
    const textSegments = transcript.match(/<text[^>]*>(.*?)<\/text>/g) || [];
    const parsedTranscript = textSegments.map((segment) => {
      const startMatch = segment.match(/start="([\d.]+)"/);
      const durMatch = segment.match(/dur="([\d.]+)"/);
      const textMatch = segment.match(/<text[^>]*>(.*?)<\/text>/);

      return {
        text:
          textMatch?.[1]
            .replace(/&amp;/g, "&")
            .replace(/&quot;/g, '"')
            .trim() || "",
        offset: startMatch ? parseFloat(startMatch[1]) * 1000 : 0,
        duration: durMatch ? parseFloat(durMatch[1]) * 1000 : 0,
      };
    });

    return NextResponse.json({ transcript: parsedTranscript });
  } catch (error) {
    console.error("[Transcript API Error]:", error);
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
