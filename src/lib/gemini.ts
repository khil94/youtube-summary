import { GoogleGenerativeAI } from "@google/generative-ai";

if (!process.env.NEXT_PUBLIC_GOOGLE_API_KEY) {
  throw new Error("NEXT_PUBLIC_GOOGLE_API_KEY가 설정되지 않았습니다.");
}

const genAI = new GoogleGenerativeAI(process.env.NEXT_PUBLIC_GOOGLE_API_KEY);

interface SummaryResponse {
  summary: string;
  timeline: string;
  keywords: string[];
}

export async function summarizeWithGemini(
  text: string
): Promise<SummaryResponse> {
  try {
    const model = genAI.getGenerativeModel({ model: "gemini-1.5-pro" });

    const prompt = `다음 유튜브 영상의 내용을 분석하여 정확히 아래 형식에 맞춰 응답해주세요:

[요약]
다음 영상의 내용을 한국어로 간단명료하게 요약해주세요:

${text}

요약문은 다음 구조를 반드시 지켜주세요:
1. 첫 문단: 영상의 전반적인 주제와 목적
2. 중간 문단들: 주요 논점이나 내용
3. 마지막 문단: 결론이나 핵심 메시지

[타임라인]
주요 내용을 시간대별로 정리해주세요. 입력된 자막의 시간 정보를 참고하여 작성해주세요.
예시 형식:
[00:00:00 ~ 00:11:05] 소개
[00:11:05 ~ 00:42:12] 어제 회의에 대한 토론
[00:42:12 ~ 01:05:12] 카페 읽기
[01:05:12 ~ 01:28:02] 이벤트 일정 공지
[01:28:02 ~ 01:36:00] 자유시간에 즐길 게임 추천
[01:36:00 ~ 01:44:39] 결론
...

주제 변경 간격이 3분에서 5분 사이가 되도록 하세요. 이 요건을 충족하도록 요약을 적절히 조정하세요.

주제 요약에는 간결하고 명확한 언어를 사용하세요. 지나치게 자세히 설명하지 않고 각 섹션의 핵심을 파악하세요.

동영상 콘텐츠가 3~5분 간격 가이드라인에 완벽하게 부합하지 않는 경우, 최선의 판단을 통해 논리적이고 의미 있는 주제 구분을 만드세요.

최종 결과물에는 추가 설명이나 메모는 포함하지 마세요.

동영상 콘텐츠에 대한 명확하고 간결한 요약을 제공하고 동영상 전체에서 논의된 주요 주제를 강조하는 것이 과제임을 기억하세요.

[키워드]
위 내용의 핵심 키워드 3개를 정확히 쉼표로 구분하여 나열해주세요.
각 키워드는 1-2개 단어로 구성하고 YouTube 검색에 적합해야 합니다.

반드시 [요약], [타임라인], [키워드] 섹션을 구분하여 작성해주세요.`;

    const result = await model.generateContent(prompt);
    const response = await result.response;
    const content = response.text();

    console.log("Gemini API 응답:", content);

    // 첫 번째 발견된 섹션들만 추출
    const summaryMatch = content.match(/\[요약\]([\s\S]*?)(?=\[타임라인\])/i);
    const timelineMatch = content.match(
      /\[타임라인\]([\s\S]*?)(?=\[키워드\])/i
    );
    const keywordsMatch = content.match(/\[키워드\]([\s\S]*?)(?=\[요약\]|$)/i);

    if (!summaryMatch || !timelineMatch || !keywordsMatch) {
      console.error("섹션 추출 실패. API 응답:", content);
      throw new Error("요약 생성 중 오류가 발생했습니다. 다시 시도해주세요.");
    }

    const summary = summaryMatch[1].trim();
    const timeline = timelineMatch[1].trim();
    const keywords = keywordsMatch[1]
      .trim()
      .split(/[,，]/)
      .map((k) => k.trim())
      .filter((k) => k.length > 0 && k !== "")
      .slice(0, 5);

    if (keywords.length === 0) {
      console.error("키워드 추출 실패:", content);
      throw new Error("키워드 추출 중 오류가 발생했습니다. 다시 시도해주세요.");
    }

    return { summary, timeline, keywords };
  } catch (error) {
    console.error("[Gemini API Error]:", {
      error,
      message: error instanceof Error ? error.message : "알 수 없는 오류",
    });

    if (error instanceof Error) {
      const errorMessage = error.message;
      if (errorMessage.includes("404")) {
        throw new Error(
          "현재 서비스를 사용할 수 없습니다. 잠시 후 다시 시도해주세요."
        );
      }
      if (
        errorMessage.includes("API key") ||
        errorMessage.includes("authentication")
      ) {
        throw new Error(
          "API 키 오류: API 키가 올바르지 않습니다. API 키를 확인해주세요."
        );
      }
      throw new Error(`요약 중 오류가 발생했습니다: ${errorMessage}`);
    }
    throw new Error(
      "알 수 없는 오류가 발생했습니다. 잠시 후 다시 시도해주세요."
    );
  }
}
