// Extracts the 11-character video id from any common YouTube URL shape:
// youtube.com/shorts/ID, youtube.com/watch?v=ID, youtube.com/embed/ID,
// or the youtu.be/ID short link.
export const extractYouTubeVideoId = (url: string): string => {
  const regex =
    /(?:youtube\.com\/shorts\/|youtube\.com\/watch\?(?:.*&)?v=|youtube\.com\/embed\/|youtu\.be\/)([a-zA-Z0-9_-]{11})/;
  const match = url.match(regex);
  return match ? match[1] : "";
};

export const getYouTubeEmbedUrl = (url: string): string => {
  const videoId = extractYouTubeVideoId(url);
  return videoId ? `https://www.youtube.com/embed/${videoId}` : "";
};
