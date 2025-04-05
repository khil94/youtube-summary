export interface RelatedVideo {
  id: string;
  title: string;
  thumbnailUrl: string;
  channelTitle: string;
}

export interface SummaryResponse {
  summary: string;
  title: string;
  duration: string;
  thumbnailUrl: string;
  error?: string;
  relatedVideos: RelatedVideo[];
}

export interface SummaryRequest {
  url: string;
}
