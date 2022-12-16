// Vendor
import {Modal} from 'antd';
import {FC, ReactNode, useEffect, useState} from 'react';
import {motion, AnimatePresence} from 'framer-motion';

// Components
import Button, {ButtonSize, ButtonType} from 'basic-components/Button';
import Checkbox from 'basic-components/Checkbox';

// Styles
import './IntroModal.less';
import {DefaultVariantTransitions} from 'constants/motion.constants';
import {CheckboxSize} from 'basic-components/Checkbox/Checkbox.types';

const transition = {duration: 0.3, ease: 'easeInOut'};

const IntroModalAnimationVariants = {
  initial: {
    y: '0%',
    scale: 0.75,
    transition,
  },
  animate: {
    y: 0,
    scale: 1,
    transition,
  },
  exit: {
    y: '0%',
    scale: 0.75,
    transition,
  },
};

interface IntroModalProps {
  open: boolean;
  onClose: (showAgain: boolean) => void;
  title: string;
  icon?: ReactNode;
}

const IntroModal: FC<IntroModalProps> = ({children, open, onClose, title, icon}) => {
  const [showAgain, setShowAgain] = useState(false);
  const [isClosing, setIsClosing] = useState(false);

  const handleCheckboxChange = () => {
    setShowAgain(!showAgain);
  };

  const handleClose = () => {
    setIsClosing(true);
    setTimeout(() => {
      onClose(showAgain);
    }, 100);
  };

  useEffect(() => {
    if (open) {
      setIsClosing(false);
    }
  }, [open]);

  return (
    <Modal
      maskStyle={{
        backdropFilter: 'blur(5px)',
        background: 'rgba(204, 204, 204, 0.66)',
      }}
      width={348}
      footer={null}
      closable={false}
      destroyOnClose
      open={open}
      onCancel={() => handleClose()}
      onOk={handleClose}
      className="IntroModal"
    >
      <AnimatePresence>
        {!isClosing && (
          <motion.div
            key="introModal"
            className="Content"
            variants={IntroModalAnimationVariants}
            {...DefaultVariantTransitions}
          >
            <div className="Header">
              {icon}
              <h1 className="Title">{title}</h1>
            </div>
            <div>{children}</div>

            <Checkbox
              size={CheckboxSize.Small}
              label="Don't show again"
              checked={!showAgain}
              onChange={handleCheckboxChange}
            />
            <Button onClick={handleClose} type={ButtonType.default} size={ButtonSize.large}>
              Continue
            </Button>
          </motion.div>
        )}
      </AnimatePresence>
    </Modal>
  );
};

export default IntroModal;
