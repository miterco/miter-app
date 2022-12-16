// Vendor
import {ReactNode, ElementType, FC, useRef, useEffect, KeyboardEvent, MouseEvent} from 'react';
import {Drawer as AntDrawer} from 'antd';
import cn from 'classnames';
import {AnimatePresence, motion} from 'framer-motion';

// Components
import {MinimizeIcon, MaximizeIcon, CloseIcon} from 'image';

// Interfaces
import DrawerTitleBar from './DrawerTitleBar';
import {DrawerState} from './Drawer.types';

// Constants
import {DefaultVariantTransitions} from 'constants/motion.constants';
import {DrawerFooterMotionVariants, DrawerTitleBarMotionVariants, DrawerBodyMotionVariants} from './Drawer.constants';

// Styles
import './Drawer.less';

interface DrawerProps {
  state: DrawerState;
  shouldChangeState: (desiredState: DrawerState) => void;
  footer?: ReactNode;
  title?: string;
  icon?: ElementType;
  titleBarButtonAction?: 'MinMax' | 'Close'; // Default is min-max
  className?: string;
  separateTitleBar?: boolean;
}

const Drawer: FC<DrawerProps> = ({
  children,
  state,
  shouldChangeState,
  footer,
  title,
  icon,
  titleBarButtonAction,
  className,
  separateTitleBar,
}) => {
  const prevState = useRef(state);
  const titleActionIsClose = titleBarButtonAction === 'Close';
  const isVisible = state !== DrawerState.Closed;
  const isExpanded = state === DrawerState.Expanded;
  const shouldAnimateTitleBar = prevState.current === DrawerState.Closed && state === DrawerState.Collapsed;

  const handleToggleDrawer = () => {
    shouldChangeState(state === DrawerState.Expanded ? DrawerState.Collapsed : DrawerState.Expanded);
  };

  useEffect(() => {
    if (prevState.current !== state) {
      prevState.current = state;
    }
  }, [state]);

  const handleClose = (e: React.KeyboardEvent | React.MouseEvent) => {
    if ((e as KeyboardEvent<HTMLDivElement>).key !== 'Escape') shouldChangeState(DrawerState.Collapsed);
  };

  return (
    <AntDrawer
      size="large"
      className={cn('Drawer', state, className)}
      placement="bottom"
      onClose={handleClose}
      closeIcon={null}
      open={isVisible && isExpanded}
      forceRender // Allows custom animations to override Ant's. TODO maybe reduce overrides to eliminate.
      footer={
        footer ? (
          <AnimatePresence>
            {isExpanded && (
              <motion.div className="Footer" variants={DrawerFooterMotionVariants} {...DefaultVariantTransitions}>
                {footer}
              </motion.div>
            )}
          </AnimatePresence>
        ) : undefined
      }
    >
      <AnimatePresence>
        {isVisible && (
          <motion.div
            key="titleBar"
            variants={DrawerTitleBarMotionVariants}
            {...DefaultVariantTransitions}
            initial={shouldAnimateTitleBar ? DefaultVariantTransitions.initial : false}
          >
            <DrawerTitleBar
              title={title}
              onClick={handleToggleDrawer}
              onButtonClick={titleActionIsClose ? () => shouldChangeState(DrawerState.Closed) : undefined}
              icon={icon}
              ActionIcon={titleActionIsClose ? CloseIcon : isExpanded ? MinimizeIcon : MaximizeIcon}
              separate={separateTitleBar}
            />
          </motion.div>
        )}
        {isExpanded && (
          <motion.div className="Content" key="body" variants={DrawerBodyMotionVariants} {...DefaultVariantTransitions}>
            {children}
          </motion.div>
        )}
      </AnimatePresence>
    </AntDrawer>
  );
};
export default Drawer;
