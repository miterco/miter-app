// Vendor
import {ChangeEvent, FC, useEffect, useRef, useState} from 'react';
import {Input} from 'antd';

// Components
import Button, {ButtonSize, ButtonType} from 'basic-components/Button';

// Styles
import './PickerPromptScreen.less';

interface PickerPromptScreenProps {
  confirmLabel?: string;
  onConfirm: (value: string) => void;
  cancelLabel?: string;
  onCancel: () => void;
  label?: string;
  placeholder?: string;
}

const PickerPromptScreen: FC<PickerPromptScreenProps> = ({
  confirmLabel = 'Add',
  onConfirm,
  cancelLabel = 'Cancel',
  onCancel,
  label = 'Prompt',
  placeholder,
}) => {
  const [promptValue, setPromptValue] = useState('');
  const inputRef = useRef<HTMLTextAreaElement>(null);

  // Focus the input when the component loads. Doing this immediately seems to accelerate the drilldown animation so
  // putting it on a slight delay.
  useEffect(() => {
    setTimeout(() => {
      if (inputRef.current) inputRef.current.focus();
    }, 200);
  }, []);

  const handlePromptChange = (event: ChangeEvent<HTMLTextAreaElement>): void => {
    setPromptValue(event.target.value);
  };

  const handleConfirm = (): void => {
    onConfirm(promptValue);
  };

  return (
    <div className="PickerPromptScreen">
      <div className="Label">{label}</div>
      <Input.TextArea
        onPressEnter={handleConfirm}
        value={promptValue}
        onChange={handlePromptChange}
        placeholder={placeholder}
        ref={inputRef}
      />
      <div className="Footer">
        <Button size={ButtonSize.large} onClick={onCancel} className="CancelBtn">
          {cancelLabel}
        </Button>
        <Button
          disabled={!promptValue.length}
          onClick={handleConfirm}
          size={ButtonSize.large}
          type={ButtonType.primary}
          className="ConfirmBtn"
        >
          {confirmLabel}
        </Button>
      </div>
    </div>
  );
};

export default PickerPromptScreen;
