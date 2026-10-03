/** Global UI events — decoupled components talk through window events. */
export const UI_EVENTS = {
  openPalette: "studio:open-palette",
  openShortcuts: "studio:open-shortcuts",
  openSystem: "studio:open-system",
} as const;

export function emitUI(event: (typeof UI_EVENTS)[keyof typeof UI_EVENTS], detail?: unknown) {
  window.dispatchEvent(new CustomEvent(event, { detail }));
}

export function isTypingTarget(target: EventTarget | null) {
  const el = target as HTMLElement | null;
  return !!el && (el.isContentEditable || ["INPUT", "TEXTAREA", "SELECT"].includes(el.tagName));
}
