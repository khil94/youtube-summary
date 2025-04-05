import { ClipboardDocumentIcon } from "@heroicons/react/24/outline";
import { useState } from "react";

interface ShareButtonProps {
  videoDetails: {
    title: string;
    duration: string;
    summary: string;
    timeline: string;
    keywords: string[];
  };
}

export default function ShareButton({ videoDetails }: ShareButtonProps) {
  const [showToast, setShowToast] = useState(false);

  const handleShare = async () => {
    const shareText =
      `[${videoDetails.title}] (${videoDetails.duration})\n\n` +
      `📝 요약\n${videoDetails.summary}\n\n` +
      `⏱ 타임라인\n${videoDetails.timeline}\n\n` +
      `🏷 키워드\n${videoDetails.keywords.join(", ")}\n\n` +
      `YouTube Summary AI로 생성된 요약입니다.`;

    try {
      await navigator.clipboard.writeText(shareText);
      setShowToast(true);
      setTimeout(() => setShowToast(false), 2000);
    } catch (err) {
      console.error("클립보드 복사 실패:", err);
    }
  };

  return (
    <div className="relative">
      <button
        onClick={handleShare}
        className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors"
      >
        <ClipboardDocumentIcon className="w-5 h-5" />
        복사하기
      </button>

      {/* 토스트 메시지 */}
      {showToast && (
        <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-4 py-2 bg-gray-900 text-white text-sm rounded-lg shadow-lg whitespace-nowrap">
          클립보드에 복사되었습니다
        </div>
      )}
    </div>
  );
}
