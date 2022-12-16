// Vendor
import {Modal} from 'antd';
import {FC, ReactElement} from 'react';

// Components
import {AnimatedScreens} from 'basic-components/AnimatedScreens';

// Styles
import './PickerModal.less';

interface PickerModalProps {
  open: boolean;
  onClose: () => void;
  screens: {
    header: ReactElement[];
    body: ReactElement[];
  };
  currentScreen: number;
  direction: number;
}

const PickerModal: FC<PickerModalProps> = ({
  open,
  onClose,
  screens: {header: headerScreens, body: bodyScreens},
  currentScreen,
  direction,
}) => {
  return (
    <Modal
      className="PickerModal"
      destroyOnClose
      title={<AnimatedScreens screens={headerScreens} currentScreen={currentScreen} direction={direction} />}
      open={open}
      onCancel={onClose}
      closable={false}
      footer={null}
      maskStyle={{
        backdropFilter: 'blur(5px)',
        background: 'rgba(102, 102, 102, 0.5)',
      }}
      width={348}
    >
      <AnimatedScreens screens={bodyScreens} currentScreen={currentScreen} direction={direction} />
    </Modal>
  );
};

export default PickerModal;
