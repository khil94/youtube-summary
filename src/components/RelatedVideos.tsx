interface RelatedVideo {
  id: string;
  title: string;
  thumbnailUrl: string;
}

interface RelatedVideosProps {
  videos: RelatedVideo[];
  onVideoSelect: (videoId: string) => void;
}

export default function RelatedVideos({
  videos,
  onVideoSelect,
}: RelatedVideosProps) {
  if (!videos || videos.length === 0) return null;

  return (
    <div className="grid grid-cols-2 gap-4">
      {videos.map((video) => (
        <div
          key={video.id}
          className="flex gap-3 p-2 rounded-lg hover:bg-gray-700 transition-colors"
        >
          <a
            href={`https://www.youtube.com/watch?v=${video.id}`}
            target="_blank"
            rel="noopener noreferrer"
            className="cursor-pointer"
            onClick={(e) => {
              e.preventDefault();
              onVideoSelect(video.id);
            }}
          >
            <img
              src={video.thumbnailUrl}
              alt={video.title}
              className="w-24 h-auto rounded hover:opacity-90 transition-opacity"
            />
          </a>
          <a
            href={`https://www.youtube.com/watch?v=${video.id}`}
            target="_blank"
            rel="noopener noreferrer"
            className="text-sm font-medium text-white line-clamp-2 flex-1 hover:text-gray-300 cursor-pointer"
            onClick={(e) => {
              e.preventDefault();
              onVideoSelect(video.id);
            }}
          >
            {video.title}
          </a>
        </div>
      ))}
    </div>
  );
}
