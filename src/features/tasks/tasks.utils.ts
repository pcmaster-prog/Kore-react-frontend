export function isImage(mime?: string | null): boolean {
  return String(mime ?? "")
    .toLowerCase()
    .startsWith("image/");
}
