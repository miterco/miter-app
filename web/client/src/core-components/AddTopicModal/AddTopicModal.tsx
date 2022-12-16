import {Modal} from 'antd';
import TextArea from 'antd/lib/input/TextArea';
import Button, {ButtonType, ButtonVariant} from 'basic-components/Button';
import {createTopic} from 'model/TopicApi';
import {KeyboardEvent, useCallback, useEffect, useMemo, useRef, useState} from 'react';
import {waitATick} from 'Utils';
import './AddTopicModal.less';

interface AddTopicModalProps {
  open: boolean;
  shouldClose: () => boolean;
}

const AddTopicModal: React.FC<AddTopicModalProps> = ({open, shouldClose}) => {
  const [text, setText] = useState('');
  const inputRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    if (open) waitATick(() => inputRef.current && inputRef.current.focus());
  }, [open]);

  const performClose = useCallback(() => {
    if (shouldClose()) setText('');
  }, [shouldClose]);

  const handleOk = useCallback(() => {
    if (text) {
      performClose();
      createTopic(text);
    }
  }, [performClose, text]);

  const handleKeyPress = useCallback(
    (event: KeyboardEvent) => {
      if (event.key === 'Enter') {
        handleOk();
        event.preventDefault();
      }
    },
    [handleOk]
  );

  const footer = useMemo(
    () => [
      <Button key="cancel" onClick={performClose} tabIndex={3}>
        Cancel
      </Button>,
      <Button key="submit" onClick={handleOk} type={ButtonType.primary} disabled={!text} tabIndex={2}>
        Add Topic
      </Button>,
    ],
    [handleOk, performClose, text]
  );

  return (
    <Modal
      className="AddTopicModal"
      title="Add Topic"
      open={open}
      onOk={handleOk}
      onCancel={performClose}
      okText="Add"
      footer={footer}
    >
      <div className="Content">
        <p className="Hint">
          Create a topic for each conversation you want to have in your meeting. Keep it short and specific.
        </p>
        <TextArea
          ref={inputRef}
          autoSize={{minRows: 1, maxRows: 2}}
          placeholder="What do you want to discuss?"
          onKeyPress={handleKeyPress}
          value={text}
          onChange={e => setText(e.target.value)}
        />
      </div>
    </Modal>
  );
};

export default AddTopicModal;
