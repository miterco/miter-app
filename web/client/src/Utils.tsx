import * as Sentry from '@sentry/react';
import {BrowserTracing} from '@sentry/tracing';
import {notification} from 'antd';
import {formatDate} from 'miter-common/CommonUtil';
import {ItemType} from 'miter-common/SharedTypes';
import {StrMeetingCommands} from 'miter-common/Strings';
import {altOrOption} from 'hooks/useKeyboardShortcuts/useKeyboardShortcuts.const';

const {NODE_ENV, REACT_APP_ENV} = process.env;
export const isDevEnvironment = !['production', 'staging'].includes(NODE_ENV || '');

// If you want to test locally with a built client (via npm run build) and still want debug-level stuff,
// add REACT_APP_ENV=whatever to /web/client/.env.
export const debug = NODE_ENV !== 'production' || (REACT_APP_ENV && REACT_APP_ENV !== 'production');

//=================================================================================================
//                                  INTER-FRAME COMMUNICATION
//=================================================================================================
/**
 * Sends a message to the parent window containing the iframe.
 */
export const postUnsafeMessageToParentWindow = (message: any) => {
  if (window.parent.postMessage) {
    window.parent.postMessage(message, '*');
  }
};

//=================================================================================================
//                                          LOGGING
//=================================================================================================

export const log = (message: any) => {
  if (debug) console.log(message);
};

export const error = (message: any, informUser: boolean = false) => {
  console.error(message);
  if (informUser) window.alert(message);
};

export const track = (event: string, properties?: Record<string, string | number>) => {
  if (debug) console.log(`Tracking ${event} - ${JSON.stringify(properties)}`);
  if (window.heap) window.heap.track(event, properties);
};

export const setupSentry = (dsn = '') => {
  if (!isDevEnvironment) {
    Sentry.init({
      dsn,
      integrations: [new BrowserTracing()],
      tracesSampleRate: 1.0, // Percentage of trnasactions to be captured. Decrease if too many in prod.
    });
  }
};

//=================================================================================================
//                                      HTML MANIPULATION
//=================================================================================================
/**
 * Given an HTML element, it returns the index of this element in its parent node.
 *
 * @param {HTMLElement} element - a reference to a HTML node.
 * @returns {number} the index of the element in its parent node.
 */
export const getIndexOfElementInParent = (element: HTMLElement): number => {
  return Array.prototype.indexOf.call(element?.parentNode?.childNodes || [], element);
};

/**
 * Turns an HTML string into plain text.
 *
 * @param {string} html - the HTML string.
 * @returns {string} the text contained in the HTML string.
 */
export const htmlToText = (html: string | undefined): string => {
  if (!html) return '';
  const workerDiv = document.createElement('DIV');
  workerDiv.innerHTML = html;
  return workerDiv.textContent || workerDiv.innerText || '';
};

export const getUrl = () => {
  return `${window.location.protocol}//${window.location.host}${window.location.pathname}`;
};

export const urlForToken = (tokenValue: string) => {
  return `${window.location.protocol}//${window.location.host}/app/m/${tokenValue}`;
};

export const swapArrayElements = (sourceArray: any[], idxA: number, idxB: number) => {
  const resultArray = [...sourceArray];
  resultArray[idxB] = sourceArray[idxA];
  resultArray[idxA] = sourceArray[idxB];
  return resultArray;
};

// Convenience function for when you need a setTimeout() not to wait a period of time,
// but just to defer execution until the next run of the event loop.
export const waitATick = (callback: () => void) => {
  window.setTimeout(callback, 0);
};

export const showToast = (message: string, title?: string) => {
  notification.open({
    message: title || message,
    description: title ? message : undefined,
    placement: 'bottomRight',
    className: title ? undefined : 'SimpleToast',
  });
};

type KeyboardCommand = ItemType;

const shortcutsByCommand: Record<KeyboardCommand, string> = {
  None: `Ctrl+${altOrOption}+X`,
  Task: `Ctrl+${altOrOption}+C`,
  Pin: `Ctrl+${altOrOption}+V`,
  Decision: `Ctrl+${altOrOption}+B`,
};
const shortcutsbyShortcut: Record<string, KeyboardCommand> = {};
Object.entries(shortcutsByCommand).forEach(([command, shortcut]) => {
  shortcutsbyShortcut[shortcut] = command as KeyboardCommand;
});
export const KeyboardShortcuts = {byCommand: shortcutsByCommand, byShortcut: shortcutsbyShortcut};

// =====================================================================================================================
//                                            SELECTION & CARET POSITION
// =====================================================================================================================

/**
 * Given an HTML node, it selects everything it contains.
 *
 * @param {HTMLElement} node: The parent node for the selection.
 * @returns {void}
 */
export const selectNodeContent = (node: HTMLElement) => {
  const range = document.createRange();
  const sel = window.getSelection();

  range.selectNodeContents(node);

  if (sel) {
    sel.removeAllRanges();
    sel.addRange(range);
  }
};

/**
 * Finds the HTML element that contains the current position of the caret.
 *
 * @param {Selection} selection - the selection contained in the node to be found.
 * @returns {HTMLElement} the HTML element containing the selection.
 */
export const getElementFromSelection = ({anchorNode}: Selection): HTMLElement | null => {
  return anchorNode?.parentElement || null;
};

/**
 * Finds the index of the current position of the caret in a given element.
 *
 * @param {HTMLElement} element - the HTML element containing the selection.
 * @returns {number} the index of the caret with respect to the given element.
 */
export const getCaretIndex = (element: HTMLElement | null): number => {
  if (!element) return -1;

  let index = 0;
  const selection = window.getSelection();

  if (selection?.rangeCount !== 0) {
    const range = selection?.getRangeAt(0);

    if (range) {
      const preCaretRange = range.cloneRange();
      preCaretRange?.selectNodeContents(element);
      preCaretRange?.setEnd(range.endContainer, range.endOffset);
      index = preCaretRange?.toString().length || 0;
    }
  }

  return index;
};

/**
 * Moves the caret to the given index position of the element.
 *
 * Not always an element only contains text, many times an HTML element contains more elements, making the task of
 * moving the caret to a given position more difficult. Also, even if it only contains text, in terms of done it is
 * an Element that contains a TextNode which contain text.
 *
 * This function is a recursive function that iterates all the child nodes of the given element and tries to find the
 * node that contains the index for the desired caret position.
 *
 * @param {number} index - the desired index position of the caret.
 * @param {Node} element - the HTML  containing the selection.
 * @returns {void}
 */
export const setCaretAtIndex = (desiredCaretPosition: number, element: Node | null): void => {
  if (!element) return;

  if (element.nodeType === 3) {
    // The current element is a text node, no need to recurse any further. Simply set the caret position at the
    // requested index. The way this is done is to create a selection range starting at the desired index and then
    // collapsing it to be zero characters long, which results in the caret being placed at the desired position.
    const range = document.createRange();

    // Set the selection to start at the desired position. If the desiredCaretPosition is a negative number it will
    // cause the caret to move to the beginning of the line, so make sure it isn't lesser than zero.
    range.setStart(element, Math.max(desiredCaretPosition, 0));

    // Collapse the selection so that it is zero characters long.
    range.collapse(true);

    const selection = window.getSelection();
    selection?.removeAllRanges(); // Remove any previous selection.
    selection?.addRange(range); // Add the collapsed range as the current and only selection.
  }

  let currentNodeStartPosition = 0; // We start at the beginning of the element.

  for (const currentChildNode of element.childNodes) {
    const childContentsLength = currentChildNode?.textContent?.length || 0;
    const currentElement: any = currentChildNode;

    // If the desired caret position is not in the current node, move on.
    if (desiredCaretPosition > currentNodeStartPosition + childContentsLength) {
      currentNodeStartPosition += childContentsLength;
      continue;
    }

    // Ignore non-editable elements.
    if (currentElement.contentEditable === 'false') {
      currentNodeStartPosition += childContentsLength;
      continue;
    }

    // The desired caret position is this node, but this node may contain more elements, so recurse.
    return setCaretAtIndex(desiredCaretPosition - currentNodeStartPosition, currentChildNode);
  }
};

// =====================================================================================================================
//                                                 DATES & TIMES
// =====================================================================================================================
/**
 * Formats a Date as a timestamp with separate date and time parts for styling purposes.
 *
 * @param {Date | null | undefined} date
 * @returns {JSX.Element | null}
 */
export const makeCompoundDateTimeStamp = (date: Date | null | undefined) => {
  if (!date) return null;
  return (
    <div className="CompoundDateTime">
      <span>{formatDate(date, {date: true})}</span>
      {formatDate(date, {time: true})}
    </div>
  );
};

// =====================================================================================================================
//                                                   CLIPBOARD
// =====================================================================================================================
interface ClipboardNotificationData {
  nounForTitle: string;
  description: string;
}

export const copyToClipboard = async (text: string, isHtml: boolean, notificationData?: ClipboardNotificationData) => {
  // @ts-ignore
  const permission = (await navigator.permissions?.query({name: 'clipboard-write'})) || {state: 'denied'};
  let success = false;

  if (permission.state === 'granted' || permission.state === 'prompt') {
    const clipboardData: Record<string, Promise<Blob>> = {
      'text/plain': Promise.resolve(new Blob([text], {type: 'text/plain'})),
    };
    if (isHtml) clipboardData['text/html'] = Promise.resolve(new Blob([text], {type: 'text/html'}));

    await navigator.clipboard.write([new ClipboardItem(clipboardData)]);
    success = true;
  } else {
    // This is a hacky (from https://komsciguy.com/js/a-better-way-to-copy-text-to-clipboard-in-javascript/) workaround
    // to support copying HTML data to the clipboard when the `navigator.clipboard` API is not available.
    const listener = function (ev: ClipboardEvent) {
      ev.preventDefault(); // TODO is this needed?
      if (ev.clipboardData) {
        if (isHtml) ev.clipboardData.setData('text/html', text);
        ev.clipboardData.setData('text/plain', text);
      }
    };

    // Create a text-area with the given text.
    const element = document.createElement('textarea');
    element.value = text;
    document.body.appendChild(element);

    // Select its content and copy it to the clipboard.
    element.select();
    document.addEventListener('copy', listener);
    document.execCommand('copy');
    document.removeEventListener('copy', listener);

    // Clean up.
    document.body.removeChild(element);
    success = true;
  }

  if (success && notificationData) {
    notification.open({
      message: `${notificationData.nounForTitle} copied to your clipboard.`,
      description: notificationData.description,
      placement: 'bottomRight',
    });
  }
};

// =====================================================================================================================
//                                               INVITE & SHARE
// =====================================================================================================================

export const copyShareUrlToClipboardAndConfirm = () => {
  copyToClipboard(getUrl(), false, {
    nounForTitle: 'Miter link',
    description: 'Anyone with the link can join the meeting and see its summary.',
  });
};
