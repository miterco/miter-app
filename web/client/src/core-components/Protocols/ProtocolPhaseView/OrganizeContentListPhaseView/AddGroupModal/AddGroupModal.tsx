import {createProtocolItemGroup, updateProtocolItem} from 'model/ProtocolApi';
import {useProtocolContext} from 'model/ProtocolContextProvider';
import {FC, useCallback, useEffect, useMemo, useRef, useState, KeyboardEvent} from 'react';
import {waitATick} from 'Utils';
import Modal from 'antd/lib/modal/Modal';
import TextArea from 'antd/lib/input/TextArea';
import Button, {ButtonType, ButtonVariant} from 'basic-components/Button';
import {ProtocolItem} from 'miter-common/SharedTypes';

interface AddGroupModalProps {
  open: boolean;
  onClose: (group?: ProtocolItem) => void;
  groupToEdit?: ProtocolItem | null;
}

const AddGroupModal: FC<AddGroupModalProps> = ({open, onClose, groupToEdit}) => {
  const [text, setText] = useState(groupToEdit?.text || '');
  const {currentProtocol} = useProtocolContext();
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const isEditing = Boolean(groupToEdit);

  useEffect(() => {
    setText(groupToEdit?.text || '');
  }, [groupToEdit]);

  useEffect(() => {
    if (open) waitATick(() => inputRef.current && inputRef.current.focus());
  }, [open]);

  const closeModal = useCallback(
    (group?: ProtocolItem) => {
      setText('');
      onClose(group);
    },
    [onClose]
  );

  const handleOk = useCallback(async () => {
    if (currentProtocol?.id && text) {
      if (groupToEdit) {
        await updateProtocolItem(groupToEdit.id, text);
        closeModal();
      } else {
        const group = await createProtocolItemGroup(currentProtocol.id, text);
        closeModal(group?.id ? (group as ProtocolItem) : undefined);
      }
    }
  }, [closeModal, text, currentProtocol?.id, groupToEdit]);

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
      <Button key="cancel" onClick={() => closeModal()} tabIndex={3}>
        Cancel
      </Button>,
      <Button key="submit" onClick={handleOk} type={ButtonType.primary} disabled={!text} tabIndex={2}>
        {isEditing ? 'Save' : 'Add Group'}
      </Button>,
    ],
    [handleOk, closeModal, text, isEditing]
  );

  return (
    <Modal
      className="AddGroupModal"
      title={isEditing ? 'Update Group Name' : 'Add Group'}
      open={open}
      onOk={handleOk}
      onCancel={() => closeModal()}
      okText="Add"
      footer={footer}
    >
      <div className="Content">
        <TextArea
          ref={inputRef}
          autoSize={{minRows: 1, maxRows: 2}}
          placeholder="Group name"
          onKeyPress={handleKeyPress}
          value={text}
          onChange={e => setText(e.target.value)}
        />
      </div>
    </Modal>
  );
};

export default AddGroupModal;
