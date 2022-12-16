import classNames from 'classnames';
import {AnimatePresence, motion} from 'framer-motion';
import {FC} from 'react';
import {StatusBarMotionVariants} from './StatusBar.const';
import {capitalizeString} from 'utils/string.utils';
import './StatusBar.less';
import {StatusBarVariant} from './StatusBar.types';

interface StatusBarProps {
  shouldShow: boolean;
  variant?: StatusBarVariant;
}

const StatusBar: FC<StatusBarProps> = ({children, shouldShow, variant = StatusBarVariant.Primary}) => (
  <AnimatePresence>
    {shouldShow && (
      <motion.div {...StatusBarMotionVariants} className={classNames('StatusBar', capitalizeString(variant))}>
        {children}
      </motion.div>
    )}
  </AnimatePresence>
);

export default StatusBar;
