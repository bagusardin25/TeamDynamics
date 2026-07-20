import type { SimMessage } from '../app/simulation/types';

export type FeedFilter = 'all' | 'agents' | 'system';
export type FeedSpeed = 0.75 | 1 | 1.5 | 2;

export function filterSimulationMessages(
  messages: SimMessage[],
  filter: FeedFilter,
): SimMessage[] {
  if (filter === 'all') return messages;
  if (filter === 'system') {
    return messages.filter((message) => message.type === 'system');
  }
  return messages.filter((message) => message.type !== 'system');
}

export function getFeedRevealDelay(
  speed: FeedSpeed,
  nextMessage?: SimMessage,
  previousMessage?: SimMessage,
): number {
  let baseDelay = 650;

  if (nextMessage?.type === 'system') {
    baseDelay = previousMessage?.type === 'system' ? 700 : 500;
  } else if (nextMessage) {
    const contentDelay = Math.min(
      400,
      Math.round(nextMessage.content.trim().length * 1.4),
    );
    baseDelay = 1150 + contentDelay;
  }

  return Math.round(baseDelay / speed);
}

export function getInitialFeedVisibleCount(
  messageCount: number,
  visibleCount: number,
  initialized: boolean,
  initialMessageCount: number | null,
): number | null {
  if (visibleCount > messageCount) return messageCount;
  if (!initialized && initialMessageCount !== null) {
    return Math.min(initialMessageCount, messageCount);
  }
  return null;
}

export function getNextFeedVisibleCount(
  messageCount: number,
  visibleCount: number,
): number | null {
  if (visibleCount >= messageCount) return null;
  return visibleCount + 1;
}

export function getQueuedAgentName(
  messages: SimMessage[],
  visibleCount: number,
): string | null {
  const nextMessage = messages[visibleCount];
  if (!nextMessage || nextMessage.type === 'system') return null;
  return nextMessage.agent || nextMessage.agent_name || null;
}

export function isFeedNearBottom(
  element: Pick<
    HTMLElement,
    'scrollHeight' | 'scrollTop' | 'clientHeight'
  >,
  threshold = 120,
): boolean {
  return (
    element.scrollHeight - element.scrollTop - element.clientHeight <= threshold
  );
}
