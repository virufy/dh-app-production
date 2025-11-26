// src/utils/audioUtils.ts
export async function blobUrlToBase64(url: string): Promise<{ base64: string; contentType: string }> {
  const res = await fetch(url);
  if (!res.ok) throw new Error(`Fetch failed ${res.status}`);
  const contentType = res.headers.get("Content-Type") || "audio/wav";
  const buf = await res.arrayBuffer();
  const bytes = new Uint8Array(buf);
  let binary = "";
  for (let i = 0; i < bytes.length; i++) binary += String.fromCharCode(bytes[i]);
  return { base64: btoa(binary), contentType };
}