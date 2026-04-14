import type { KeyboardEvent as ReactKeyboardEvent } from "react";

const KEY_CODE_MAPPINGS: Record<string, number> = {
  Enter: 13,
  Escape: 27,
  ArrowLeft: 37,
  ArrowUp: 38,
  ArrowRight: 39,
  ArrowDown: 40,
  Home: 36,
  End: 35,
  " ": 32,
  Spacebar: 32,
};

export function isKey(
  event: KeyboardEvent | ReactKeyboardEvent<HTMLElement>,
  keyName: string,
): boolean {
  if (event.key === keyName) {
    return true;
  }

  const mappedKeyCode = KEY_CODE_MAPPINGS[keyName];
  if (mappedKeyCode !== undefined && (event as any).keyCode === mappedKeyCode) {
    return true;
  }

  return false;
}
