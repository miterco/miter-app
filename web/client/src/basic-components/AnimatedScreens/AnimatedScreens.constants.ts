import {Variants} from 'framer-motion';
import {ScreenPaginationDirection} from 'hooks/useScreenPagination/useScreenPagination.constants';

export const transitionDuration = 0.2;

const transition = {
  duration: transitionDuration,
  ease: 'easeInOut',
};

export const animationVariants: Variants = {
  initial: (direction: ScreenPaginationDirection) => ({
    x: direction === ScreenPaginationDirection.RIGHT ? '125%' : '-125%',
    position: 'absolute',
    top: '0',
    zIndex: 1,
    transition,
  }),
  animate: {
    x: '0',
    position: 'relative',
    transition,
  },
  exit: (direction: ScreenPaginationDirection) => ({
    x: direction === ScreenPaginationDirection.RIGHT ? '-125%' : '125%',
    position: 'absolute',
    zIndex: 1,
    transition,
  }),
};
