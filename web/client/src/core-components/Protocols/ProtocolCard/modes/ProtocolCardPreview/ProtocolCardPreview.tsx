// Vendor
import TextArea from 'antd/lib/input/TextArea';
import Button, {ButtonSize, ButtonType} from 'basic-components/Button';
import {PencilIcon} from 'image';
import {useMiterContext} from 'model/MiterContextProvider';
import {sendActivityPing} from 'model/ProtocolApi';
import {useProtocolContext} from 'model/ProtocolContextProvider';
import {ChangeEvent, FC, useEffect, useRef} from 'react';
import {waitATick} from 'Utils';

export interface ProtocolCardPreviewProps {
  text: string;
  isEditing: boolean;
  onChange: (text: string) => void;
  onEdit: () => void;
  onClose: () => void;
  onSubmit: () => void;
}

const ProtocolCardPreview: FC<ProtocolCardPreviewProps> = ({text, onChange, onEdit, onClose, onSubmit, isEditing}) => {
  const handleChange = ({target}: ChangeEvent<HTMLTextAreaElement>) => onChange(target.value);
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const {currentProtocol} = useProtocolContext();
  const {meeting} = useMiterContext();

  // Focus textarea (when present) on first load—-TextArea's autFocus prop doesn't seem to do this
  useEffect(() => {
    if (inputRef.current) waitATick(inputRef.current.focus);
  }, []);

  if (isEditing) {
    return (
      <TextArea
        onChange={handleChange}
        value={text}
        placeholder="Your answer"
        className="ProtocolCard PreviewEditMode"
        onKeyDown={() => {
          // Report the user activity only if the current meeting protocol is open. Otherwise it will show in the
          // activity indicator of another protocol.
          if (currentProtocol?.id === meeting?.currentProtocolId) sendActivityPing();
        }}
        onBlur={onClose}
        autoFocus
        ref={inputRef}
        onPressEnter={onSubmit}
      />
    );
  }

  return (
    <div className="ProtocolCard PreviewMode">
      <div className="Header">You answered</div>
      <div className="Body">{text}</div>
      <div className="Footer">
        <Button
          onClick={onEdit}
          className="FooterButton"
          size={ButtonSize.small}
          type={ButtonType.borderless}
          icon={<PencilIcon />}
        >
          Edit
        </Button>
      </div>
    </div>
  );
};

export default ProtocolCardPreview;
