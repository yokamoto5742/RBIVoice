export function getRoomIdFromUrl(): string | null {
  const params = new URLSearchParams(window.location.search);
  const room = params.get('room');
  if (!room) return null;
  const trimmed = room.trim();
  return trimmed.length > 0 ? trimmed : null;
}
