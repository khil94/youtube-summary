declare module "youtube-transcript-api" {
  interface TranscriptItem {
    text: string;
    duration: number;
    offset: number;
  }

  const YoutubeTranscript: {
    fetchTranscript(videoId: string): Promise<TranscriptItem[]>;
  };

  export default YoutubeTranscript;
}
