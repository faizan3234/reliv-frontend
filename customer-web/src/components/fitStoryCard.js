export const STORY_WIDTH = 420;
export const STORY_HEIGHT = STORY_WIDTH * 16 / 9;

// Scale the complete composition, never crop its lower rows to fit a story.
export function fitStoryCard(art) {
  const layout = art?.querySelector('.reference-layout');
  if (!layout) return;
  const height = Math.max(STORY_HEIGHT, layout.scrollHeight, layout.offsetHeight);
  const scale = Math.min(1, STORY_HEIGHT / height);
  layout.style.transform = `scale(${scale})`;
  layout.style.left = `${(STORY_WIDTH - STORY_WIDTH * scale) / 2}px`;
  layout.style.top = `${Math.max(0, (STORY_HEIGHT - height * scale) / 2)}px`;
}
