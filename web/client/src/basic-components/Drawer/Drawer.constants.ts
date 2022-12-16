export const DrawerFooterMotionVariants = {
  initial: {y: '150%'},
  animate: {
    y: '0%',
    transition: {
      duration: 0.2,
      type: 'spring',
    },
  },
  exit: {
    y: '150%',
  },
};

export const DrawerTitleBarMotionVariants = {
  initial: {y: '150%'},
  animate: {
    y: '0%',
    transition: {
      duration: 0.8,
      type: 'spring',
    },
  },
  exit: {
    y: '150%',
  },
};

export const DrawerBodyMotionVariants = {};

// TODO: Investigate further into why the body animations breaks the layout on Safari/Zoom
// export const DrawerBodyMotionVariants = {
//   initial: {y: '150%'},
//   animate: {
//     y: '0%',
//     transition: {
//       duration: 0.5,
//       type: 'slide',
//       ease: 'easeOut',
//     },
//   },
//   exit: {
//     y: '200%',
//   },
// };
