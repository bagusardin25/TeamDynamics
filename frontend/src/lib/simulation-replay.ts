export type ReplayPresentationStatus =
  | 'idle'
  | 'running'
  | 'paused'
  | 'completed';

export function getReplayPresentationStatus(
  visibleMessages: number,
  totalMessages: number,
  isPlaying: boolean,
): ReplayPresentationStatus {
  if (totalMessages > 0 && visibleMessages >= totalMessages) return 'completed';
  if (isPlaying) return 'running';
  if (visibleMessages > 0) return 'paused';
  return 'idle';
}
