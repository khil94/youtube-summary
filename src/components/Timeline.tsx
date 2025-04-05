interface TimelineProps {
  content: string;
  onTimeClick: (seconds: number) => void;
}

export default function Timeline({ content, onTimeClick }: TimelineProps) {
  // HH:MM:SS 형식의 시간을 초로 변환
  const timeToSeconds = (timeStr: string): number => {
    const [hours, minutes, seconds] = timeStr.split(":").map(Number);
    return hours * 3600 + minutes * 60 + seconds;
  };

  // 타임라인 텍스트에서 시간 부분을 클릭 가능한 링크로 변환
  const renderTimelineWithLinks = () => {
    if (!content) return null;

    // 각 줄을 처리
    return content.split("\n").map((line, index) => {
      // [HH:MM:SS ~ HH:MM:SS] 형식의 시간 찾기
      const timeMatch = line.match(
        /\[(\d{2}:\d{2}:\d{2})\s*~\s*\d{2}:\d{2}:\d{2}\]/
      );

      if (timeMatch) {
        const startTime = timeMatch[1]; // 시작 시간만 사용
        const timeInSeconds = timeToSeconds(startTime);

        // 시간 부분을 클릭 가능한 링크로 변환
        const parts = line.split(timeMatch[0]);
        return (
          <div key={index} className="mb-2">
            <button
              onClick={() => onTimeClick(timeInSeconds)}
              className="text-blue-400 hover:text-blue-300 transition-colors cursor-pointer font-mono"
            >
              {timeMatch[0]}
            </button>
            <span className="text-gray-300">{parts[1]}</span>
          </div>
        );
      }

      return (
        <div key={index} className="text-gray-300 mb-2">
          {line}
        </div>
      );
    });
  };

  return <div className="prose max-w-none">{renderTimelineWithLinks()}</div>;
}
