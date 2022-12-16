// Vendor
import {FC, useEffect, useState, KeyboardEvent, ReactNode, useRef, ChangeEvent, FocusEvent, useCallback} from 'react';

// Components
import Avatar from 'basic-components/Avatar';
import Button, {ButtonType, ButtonVariant} from 'basic-components/Button';
import {AddIcon} from 'image';

// Types
import {Person} from 'miter-common/SharedTypes';
import cn from 'classnames';
import {useProtocolContext} from 'model/ProtocolContextProvider';
import {useMiterContext} from 'model/MiterContextProvider';
import {sendActivityPing} from 'model/ProtocolApi';

export interface ProtocolCardInputProps {
  user?: Person;
  text: string;
  onSubmit: () => void;
  onChange: (text: string) => void;
  onBlur?: () => void;
  showAvatar?: boolean;
  showSubmitButton?: boolean;
  placeholder?: string;
  submitButtonIcon?: ReactNode;
  shouldInitFocused?: boolean;
}

const ProtocolCardInput: FC<ProtocolCardInputProps> = ({
  user,
  text,
  onSubmit,
  onBlur,
  onChange,
  showAvatar,
  showSubmitButton,
  placeholder,
  submitButtonIcon: SubmitButtonIcon = AddIcon,
  shouldInitFocused,
}) => {
  const [isFocused, setIsFocused] = useState(shouldInitFocused);
  const {currentProtocol} = useProtocolContext();
  const {meeting} = useMiterContext();
  const wrapperRef = useRef<HTMLDivElement | null>(null);
  const inputRef = useRef<HTMLInputElement | null>(null);

  const handleChange = useCallback(
    ({target}: ChangeEvent<HTMLInputElement>) => {
      onChange(target.value);
    },
    [onChange]
  );

  const blur = useCallback(() => {
    setIsFocused(false);
    onBlur?.();
  }, [onBlur, setIsFocused]);

  const handleBlur = useCallback(
    ({relatedTarget}: FocusEvent) => {
      if (!wrapperRef.current?.contains(relatedTarget as Node)) blur();
    },
    [blur]
  );

  const handleFocus = useCallback(() => setIsFocused(true), [setIsFocused]);

  const handleKeyDown = useCallback(
    ({key}: KeyboardEvent<Element>) => {
      if (key === 'Enter' && text.length > 0) {
        onSubmit();
      } else if (key === 'Escape') {
        blur();
      } else if (currentProtocol?.id === meeting?.currentProtocolId) {
        // Report the user activity only if the current meeting protocol is open. Otherwise it will show in the
        // activity indicator of another protocol.
        sendActivityPing();
      }
    },
    [text, onSubmit, currentProtocol?.id, meeting?.currentProtocolId, blur]
  );

  const handleSubmitClick = useCallback(() => {
    onSubmit();
    inputRef.current?.focus();
  }, [onSubmit]);

  useEffect(() => {
    if (isFocused) {
      inputRef.current?.focus();
    }
  }, [isFocused]);

  return (
    <div
      tabIndex={1}
      ref={wrapperRef}
      onBlur={handleBlur}
      onFocus={handleFocus}
      className={cn('ProtocolCard', 'EditMode', {Focused: isFocused})}
    >
      {showAvatar && user && (
        <div className="Start">
          <Avatar size={26} user={user} />
        </div>
      )}
      <div className="Body">
        <input
          onChange={handleChange}
          onKeyDown={handleKeyDown}
          value={text}
          placeholder={placeholder}
          ref={inputRef}
          className="ProtocolCardInputToggleEdit"
          type="text"
        />
      </div>
      {!showSubmitButton && (
        <div className="End">
          <Button
            onClick={handleSubmitClick}
            disabled={!text?.length}
            type={ButtonType.borderless}
            variant={ButtonVariant.outline}
            icon={<SubmitButtonIcon className="SubmitButtonIcon" />}
          />
        </div>
      )}
    </div>
  );
};

export default ProtocolCardInput;
