/*
 * ToggleEdit: General-purpose editable text that can wrap to multiple lines and works
 * as either a controlled or uncontrolled component.
 *
 * Set `editing` to true/false to control whether it's static or editable. Set it to
 * 'uncontrolled' if you want to use ToggleEdit in uncontrolled mode. In controlled mode,
 * the parent component is responsible for managing the editing state via `editing`, and
 * can do so via the onChange and onCancel callbacks.
 *
 * In uncontrolled mode, use autoFocus to have the input in edit mode and focused initially.
 *
 * Use tagName if you want the underlying HTML tag to be something other than a DIV.
 *
 * Note: This component uses innerHTML and contentEditable rather than, say, an INPUT or
 * TEXTAREA because we want its content to be able to flow across multiple lines the way
 * normal text content does. (Secondarily, it also makes it easier to ensure that the
 * content remains in place as we toggle modes.)
 */

import React, {useCallback, useImperativeHandle, useMemo} from 'react';
import {KeyboardEvent, useEffect, useRef, useState} from 'react';
import ReactDOMServer from 'react-dom/server';
import linkifyHtml from 'linkify-html';
import classnames from 'classnames';

import {htmlToText, selectNodeContent, getCaretIndex, setCaretAtIndex, waitATick} from '../Utils';
import {TextEntity} from '../ClientTypes';
import {useMiterContext} from '../model/MiterContextProvider';
import {EMAILS_PATTERN} from 'miter-common/patterns';
import MentionAutoComplete from './MentionAutoComplete';
import TextFragment from './TextFragment';
import './ToggleEdit.less';
import {Person} from 'miter-common/SharedTypes';

export type StartEditingAction = 'Focus' | 'EnterKey';

/**
 * Object that maps from actions in the editable component to the assigned keys.
 */
const KeyBindings = {
  ForwardDelete: 'Delete',
  BackwardDelete: 'Backspace',
  StartMention: '@',
  Save: 'Enter',
  Cancel: 'Escape',
  Space: ' ',
};

const makeTextEntity = (text: string): TextEntity => ({type: 'Text', text});
const makeMentionEntity = (email: string, person: Person): TextEntity => ({
  type: 'Mention',
  text: email,
  person,
  mutable: false,
});

interface ToggleEditProps {
  value?: string;
  placeholder?: string;
  className?: string;
  tagName?: string; // Only used if allowFormatting is true
  editing: boolean;
  allowFormatting?: boolean; // Not currently used but probably will be?
  highlightOnHover?: boolean; // Defaults to true
  linkifyUrls?: boolean;
  withMentions?: boolean;
  initialCaretPosition?: number;
  autoOpenMentionsDropdown?: boolean;

  onChange?: (value: string) => void;
  onCancel?: (value: string, element: HTMLElement) => void;
  onBlur?: (value: string, element: HTMLElement) => void;
  onFocus?: () => void;
  onKeyPress?: (event: KeyboardEvent) => void;

  // Called when ToggleEdit thinks it should save and exit edit mode. Implementors of this
  // callback can save the passed data and update the `editing` prop accordingly.
  shouldSave?: (value: string, element: HTMLElement) => void;

  // Called when ToggleEdit thinks it should go into edit mode. Implementors of this callback
  // can update the `editing` prop accordingly.
  shouldStartEditing?: (action: StartEditingAction) => void;
}

const linkifyOptions = {
  defaultProtocol: 'https',
  target: '_blank',
  validate: {email: false},
  attributes: {
    onclick: 'if (window.zoomSdk) window.zoomSdk.openUrl({url: this.href})',
  },
};

const ToggleEdit = React.forwardRef<HTMLDivElement, ToggleEditProps>((props, forwardedRef) => {
  const {
    editing,
    allowFormatting,
    shouldSave,
    onChange,
    onCancel,
    onKeyPress,
    shouldStartEditing,
    onBlur,
    withMentions,
    value,
    onFocus,
    autoOpenMentionsDropdown,
    initialCaretPosition,
  } = props;
  const placeholder = props.placeholder || 'Type something...';
  const highlightOnHover = props.highlightOnHover !== undefined ? props.highlightOnHover : true;

  // Creating a temporary div so this is never null and useImperativeHandle() doesn't mess with the compiler
  const ref = useRef<HTMLDivElement>(document.createElement('div'));

  // useImperativeHandle() hook customizes what the component gives back in the forwarded ref.
  useImperativeHandle(forwardedRef, () => ref.current);

  const {relevantPeople} = useMiterContext();
  const [currentValue, setCurrentValue] = useState(props.value);
  const [mentionSearchQuery, setMentionSearchQuery] = useState<string>('');
  const [mentionDropdownOpen, setMentionDropdownOpen] = useState<boolean>(false);
  const [mentionStartPos, setMentionStartPos] = useState<number>(-1);
  const [mentionTextNode, setMentionTextNode] = useState<Node | null>(null);
  const [lastMentionIndex, setLastMentionIndex] = useState<number>(-1);
  const [lastMention, setLastMention] = useState<string>('');

  // If a new value comes down from the server, override whatever's in current value
  useEffect(() => {
    setCurrentValue(value);
  }, [value]);

  const emailToPersonMap = useMemo(() => {
    const emailToPerson: Record<string, Person> = {};

    for (const person of relevantPeople) {
      if (!person.email) continue; // Skip people without email addresses.
      emailToPerson[person.email] = person;
    }

    return emailToPerson;
  }, [relevantPeople]);

  /**
   * Generates the HTML that will be injected in the component innerHTML.
   */
  const displayedValue: string = useMemo(() => {
    const textWithoutLineBreaks = currentValue?.replaceAll('\n', '');
    const text = (allowFormatting ? textWithoutLineBreaks : htmlToText(textWithoutLineBreaks)) || '';
    const mentions = text?.matchAll(new RegExp(EMAILS_PATTERN, 'gi')) || [];
    let offset = 0; // Last processed index.
    let prefix = ''; // Text before the current mention token.
    const tokens: TextEntity[] = [];

    // Prevent the single empty space in the input.
    if (!text?.trim()) return '';

    // Tokenize the text.
    for (const match of mentions) {
      // Check if the email belongs to a person relevant to the meeting.
      prefix = text.substring(offset, match.index);
      const email = match[0];
      const person = emailToPersonMap[email];

      if (prefix) tokens.push(makeTextEntity(prefix)); // Create the TextEntity for the text before the mention.
      tokens.push(makeMentionEntity(email, person)); // Create the MentionEntity for the current mention.
      offset = (match.index || 0) + email.length;
    }

    // Add the TextEntity for the text after the last token.
    const suffix = text.substring(offset) || ' ';
    if (suffix) tokens.push(makeTextEntity(suffix));

    // Generate the HTML to render.
    let html = '';

    for (let i = 0; i < tokens.length; i++) {
      html += ReactDOMServer.renderToString(TextFragment(tokens[i]));
    }

    return props.linkifyUrls ? linkifyHtml(html, linkifyOptions) : html;
  }, [currentValue, allowFormatting, props.linkifyUrls, emailToPersonMap]);

  // Handle enter and exit of edit mode.
  useEffect(() => {
    if (ref.current) {
      if (editing) {
        // We just toggled editing on OR the component mounted in edit mode, which means
        // we want to autofocus it at mount.
        ref.current.focus();

        if (typeof initialCaretPosition === 'number') {
          waitATick(() => setCaretAtIndex(initialCaretPosition, ref.current));
        } else {
          selectNodeContent(ref.current);
        }
      } else {
        setMentionDropdownOpen(false);
        setCurrentValue(value);
        ref.current.innerHTML = displayedValue;
        ref.current.blur();
      }
    }
    // eslint-disable-next-line
  }, [editing]);

  // When the autoOpenMentionsDropdown is used, appart from just setting the openMentionsDropdown
  // to true, the mention-related state has to be set/updated with the current caret position.
  useEffect(() => {
    if (!autoOpenMentionsDropdown || !ref.current) return;
    const element = ref.current;

    waitATick(() => {
      // Wait for the component to be re-rendered and the caret position updated.
      setLastMentionIndex(getCaretIndex(element) - 2); // Used to calculate the final caret position.
      setMentionSearchQuery(''); // Update the value by which the mentions will be filtered.
      setMentionDropdownOpen(true);
      setMentionTextNode(element.childNodes[0]); // Sets the node containing the caret.
      setMentionStartPos(getCaretIndex(element) - 1); // The position of the @ symbol.
    });
  }, [autoOpenMentionsDropdown]);

  useEffect(() => {
    // When a mention was added, set the caret position to be right after the mention.
    if (lastMention) {
      setTimeout(() => {
        if (ref.current) {
          ref.current.focus();
          // Not sure why, but the caret position is not updated if we don't wait two ticks.
          waitATick(() => waitATick(() => setCaretAtIndex(lastMentionIndex + lastMention.length + 2, ref.current)));
        }
      }, 50);
      setLastMention('');
    }

    // Call the onChange callback since the contents changed.
    if (onChange && ref.current) onChange(ref.current.innerText);
  }, [currentValue, lastMention, lastMentionIndex, onChange]);

  // Handlers for keyboard & focus events
  const handleBlur = useCallback(() => {
    if (!editing || !ref.current) return;
    if (onBlur) onBlur(ref.current.innerText, ref.current);
  }, [editing, onBlur]);

  const handleFocus = useCallback(() => {
    if (onFocus) onFocus();
    if (shouldStartEditing) shouldStartEditing('Focus');
  }, [onFocus, shouldStartEditing]);

  /**
   * Defines the key-bindings for item edition.
   */
  const handleKeyPress = useCallback(
    (event: KeyboardEvent) => {
      if (!ref.current) return;

      const selection = window.getSelection();
      const currentNode = selection?.anchorNode || null;
      const cursorPos = selection?.anchorOffset || 0;
      const text = currentNode?.textContent || '';

      if (!editing && event.key === 'Enter' && shouldStartEditing) {
        shouldStartEditing('EnterKey');
      }

      if (editing) {
        switch (event.key) {
          case KeyBindings.Save:
            event.preventDefault();
            if (mentionDropdownOpen) {
              setMentionDropdownOpen(false);
            } else if (shouldSave && ref.current.innerText) {
              const trimmedText = ref.current.innerText.trim();
              trimmedText && shouldSave(ref.current.innerText, ref.current);
            }
            break;

          case KeyBindings.StartMention:
            if (cursorPos === 0 || text[cursorPos - 1].match(/\s| /)) {
              setLastMentionIndex(getCaretIndex(ref.current) - 1);
              setMentionSearchQuery('');
              setMentionDropdownOpen(true);
              setMentionStartPos(cursorPos);
              setMentionTextNode(currentNode);
            }
            break;
        }
      }

      if (onKeyPress) onKeyPress(event);
    },
    [editing, shouldStartEditing, shouldSave, mentionDropdownOpen, onKeyPress]
  );

  /**
   * Defines the key-bindings for the editing mode.
   *
   * Esc doesn't trigger a keypress event so we handle it in a keydown.
   *
   * @param {KeyboardEvent} event - The key down event.
   * @returns {void}
   */
  const handleKeyUp = useCallback(
    (event: KeyboardEvent) => {
      if (!ref.current || !editing) return;

      const cursorPosition = getCaretIndex(ref.current);

      switch (event.key) {
        case KeyBindings.Cancel:
          if (mentionDropdownOpen) {
            setMentionDropdownOpen(false);
          } else if (props.value === currentValue) {
            ref.current.innerHTML = displayedValue;
            if (onCancel) onCancel(ref.current.innerText, ref.current);
          } else {
            setCurrentValue(props.value);
            if (onCancel) onCancel(ref.current.innerText, ref.current);
          }
          break;

        case KeyBindings.Space:
          setMentionDropdownOpen(false);
          break;

        case KeyBindings.BackwardDelete: {
          if (cursorPosition <= mentionStartPos) setMentionDropdownOpen(false);
          break;
        }

        default:
          if (mentionDropdownOpen && event.key.length === 1) {
            // It is a printable char.
            const text = mentionTextNode?.textContent || '';
            let mentionEndIndex = text.indexOf(' ', mentionStartPos);

            if (mentionEndIndex === -1) {
              mentionEndIndex = text.length;
            }
            setMentionSearchQuery(text.substring(mentionStartPos + 1, mentionEndIndex));
          }
          break;
      }

      if (onChange) onChange(ref.current.innerText);
    },
    [
      props.value,
      editing,
      mentionDropdownOpen,
      onCancel,
      displayedValue,
      mentionTextNode,
      mentionStartPos,
      currentValue,
      onChange,
    ]
  );

  /**
   * Adds a mention for the selected person.
   *
   * @param {string} personId - The ID of the selected person.
   * @returns {void}
   */
  const createAtMention = useCallback(
    (email: string) => {
      if (!mentionTextNode || !ref.current) return;

      const text = mentionTextNode.textContent || '';

      mentionTextNode.textContent = `${text.substring(0, mentionStartPos)}${email}${
        text.substring(mentionStartPos + mentionSearchQuery.length + 1) || ' '
      }`;

      setLastMention(email);
      setCurrentValue(ref.current.innerText);
      setMentionDropdownOpen(false);
    },
    [mentionTextNode, mentionStartPos, mentionSearchQuery]
  );

  const core = React.createElement(props.tagName || 'div', {
    className: classnames(
      'ToggleEdit',
      {
        HoverHighlight: highlightOnHover,
        Editing: editing,
        NoVal: !(currentValue || editing),
      },
      props.className
    ),
    onKeyPress: handleKeyPress,
    onKeyUp: handleKeyUp,
    onFocus: handleFocus,
    onBlur: handleBlur,
    placeholder,
    ref,
    contentEditable: editing,
    tabIndex: 0,
    dangerouslySetInnerHTML: {__html: displayedValue},
  });

  if (!withMentions) return core;

  return (
    <MentionAutoComplete
      open={mentionDropdownOpen}
      onSelect={createAtMention}
      searchQuery={mentionSearchQuery}
      className="ToggleEditSelect"
    >
      {core}
    </MentionAutoComplete>
  );
});

export default ToggleEdit;
