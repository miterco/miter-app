export const StatusBarMotionVariants = {
  initial: {padding: 0, height: 0, top: '16px'},
  animate: {
    height: '28px',
    top: '0px',
    padding: 8,
    transition: {
      duration: 0.3,
    },
  },
  exit: {
    padding: 0,
    height: 0,
    top: '16px',
  },
};
