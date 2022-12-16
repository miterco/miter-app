import {Modal} from 'antd';
import TextArea from 'antd/lib/input/TextArea';
import Button, {ButtonType, ButtonVariant} from 'basic-components/Button';
import DatePicker from 'basic-components/DatePicker';
import {createSummaryItem} from 'model/SummaryApi';
import {KeyboardEvent, useCallback, useEffect, useMemo, useRef, useState} from 'react';
import {waitATick} from 'Utils';
import './AddTaskModal.less';

interface AddTaskModalProps {
  open: boolean;
  shouldClose: () => boolean;
}

const AddTaskModal: React.FC<AddTaskModalProps> = ({open, shouldClose}) => {
  const [text, setText] = useState('');
  const [dueDate, setDueDate] = useState<Date | null>(null);
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
      createSummaryItem({itemText: text, targetDate: dueDate, itemType: 'Task', noteId: null}, true);
    }
  }, [dueDate, performClose, text]);

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
        Add
      </Button>,
    ],
    [handleOk, performClose, text]
  );

  return (
    <Modal
      className="AddTaskModal"
      title="Add Task"
      open={open}
      onOk={handleOk}
      onCancel={performClose}
      okText="Add"
      footer={footer}
    >
      <div className="Content">
        <TextArea
          ref={inputRef}
          autoSize={{minRows: 2, maxRows: 6}}
          placeholder="What needs doing?"
          onKeyPress={handleKeyPress}
          value={text}
          onChange={e => setText(e.target.value)}
        />
        <DatePicker value={dueDate} placeholder="No Due Date" onChange={newDate => setDueDate(newDate)} />
      </div>
    </Modal>
  );
};

export default AddTaskModal;
