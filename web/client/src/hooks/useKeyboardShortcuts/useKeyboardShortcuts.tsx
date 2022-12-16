import {useMemo} from 'react';
import {useHotkeys} from 'react-hotkeys-hook';
import {platformizeShortcut} from './useKeyboardShortcuts.utils';

const useKeyboardShortcuts = (
  shortcuts: string | string[],
  handler: (shortcut: string) => void,
  dependencies: any[] = []
) => {
  const shortcutString = useMemo(() => {
    if (typeof shortcuts === 'string') return platformizeShortcut(shortcuts);
    return platformizeShortcut(shortcuts.join(', '));
  }, [shortcuts]);

  useHotkeys(
    shortcutString,
    (keyboardEvent, hotkeysEvent) => {
      keyboardEvent.preventDefault();
      handler(hotkeysEvent.key);
    },
    {enableOnTags: ['INPUT', 'TEXTAREA'], enableOnContentEditable: true},
    dependencies
  );
};

export default useKeyboardShortcuts;
