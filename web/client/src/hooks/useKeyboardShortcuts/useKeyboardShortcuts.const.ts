const isMac = window.navigator.platform.indexOf('Mac') !== -1;
export const cmdOrCtrl = isMac ? 'cmd' : 'ctrl';
export const altOrOption = isMac ? 'option' : 'alt';
