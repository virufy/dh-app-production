// Small utility to format seconds into M:SS
export default function formatTime(seconds: number): string {
  const mins = Math.floor(seconds / 60).toString();
  const secs = (seconds % 60).toString().padStart(2, "0");
  return `${mins}:${secs}`;
}
