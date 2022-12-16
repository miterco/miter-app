// Vendor
import {FC, ReactElement, useEffect, useMemo, useState} from 'react';
import {motion, AnimatePresence} from 'framer-motion';

// Constants
import {animationVariants, transitionDuration} from './AnimatedScreens.constants';

// Style
import './AnimatedScreens.less';
import {ScreenPaginationDirection} from 'hooks/useScreenPagination/useScreenPagination.constants';

interface AnimatedScreensProps {
  screens: ReactElement[];
  currentScreen: number;
  direction: ScreenPaginationDirection;
}

const AnimatedScreens: FC<AnimatedScreensProps> = ({screens, currentScreen, direction}) => {
  const [currentHeight, setCurrentHeight] = useState<string | null>(null);
  const idRef = useMemo(() => `AnimatedScreen-${Math.random().toString()}`, []);

  useEffect(() => {
    setTimeout(() => {
      const el = document.getElementById(idRef);
      const height = el?.offsetHeight;
      if (height) {
        setCurrentHeight(`${height}px`);
      }
    }, transitionDuration * 1000 + 15);
  }, [screens, currentScreen, idRef]);

  return (
    <div style={{height: currentHeight ?? ''}} className="AnimatedScreens">
      <AnimatePresence initial={false} custom={direction}>
        {screens.map(
          (Screen, index) =>
            index === currentScreen && (
              <motion.div
                key={index}
                custom={direction}
                variants={animationVariants}
                initial="initial"
                animate="animate"
                exit="exit"
                className="AnimatedScreen"
                id={idRef}
              >
                {Screen}
              </motion.div>
            )
        )}
      </AnimatePresence>
    </div>
  );
};

export default AnimatedScreens;
