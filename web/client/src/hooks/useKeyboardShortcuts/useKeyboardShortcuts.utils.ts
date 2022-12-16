import {toTitleCase} from 'miter-common/CommonUtil';
import {cmdOrCtrl, altOrOption} from './useKeyboardShortcuts.const';

export const platformizeShortcut = (genericShortcut: string) => {
  return genericShortcut.replaceAll('cmdOrCtrl', cmdOrCtrl).replaceAll('altOrOption', altOrOption);
};

export const formatShortcut = (shortcut: string) => {
  return toTitleCase(platformizeShortcut(shortcut).replaceAll('+', ' '));
};
