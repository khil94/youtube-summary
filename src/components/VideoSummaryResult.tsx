import type { SummaryResponse } from "@/types/api";

interface VideoSummaryResultProps {
  result: SummaryResponse;
}

export function VideoSummaryResult({ result }: VideoSummaryResultProps) {
  return (
    <div className="max-w-2xl mx-auto p-6 bg-gray-800 rounded-lg space-y-6">
      <div className="flex gap-4 items-start">
        <img
          src={result.thumbnailUrl}
          alt={result.title}
          className="w-48 rounded-lg"
        />
        <div>
          <h2 className="text-xl font-bold mb-2">{result.title}</h2>
          <p className="text-gray-400">재생 시간: {result.duration}</p>
        </div>
      </div>
      <div className="pt-4 border-t border-gray-700">
        <h3 className="text-lg font-semibold mb-2">요약</h3>
        <p className="text-gray-300 whitespace-pre-wrap">{result.summary}</p>
      </div>
      {result.relatedVideos && result.relatedVideos.length > 0 && (
        <div className="pt-4 border-t border-gray-700">
          <h3 className="text-lg font-semibold mb-4">관련 영상</h3>
          <div className="grid grid-cols-2 gap-4">
            {result.relatedVideos.map((video) => (
              <a
                key={video.id}
                href={`https://www.youtube.com/watch?v=${video.id}`}
                target="_blank"
                rel="noopener noreferrer"
                className="flex gap-3 p-2 rounded-lg hover:bg-gray-700 transition-colors"
              >
                <img
                  src={video.thumbnailUrl}
                  alt={video.title}
                  className="w-24 h-auto rounded"
                />
                <div className="flex-1 min-w-0">
                  <h4 className="text-sm font-medium text-white line-clamp-2">
                    {video.title}
                  </h4>
                  <p className="text-xs text-gray-400 mt-1">
                    {video.channelTitle}
                  </p>
                </div>
              </a>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
