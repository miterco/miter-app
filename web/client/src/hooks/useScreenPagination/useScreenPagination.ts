import {useState} from 'react';
import {ScreenPaginationDirection} from './useScreenPagination.constants';

const useScreenPagination = (screenCount: number) => {
  const [[currentScreen, direction], setScreen] = useState<[number, ScreenPaginationDirection]>([
    0,
    ScreenPaginationDirection.RIGHT,
  ]);

  const paginate = (newDirection: ScreenPaginationDirection) => {
    const newIndex = currentScreen + newDirection;
    if (newIndex >= 0 && newIndex < screenCount) {
      setScreen([newIndex, newDirection]);
    } else {
      console.error(
        `Tried to paginate to screen ${newIndex + 1} which is out of boundaries for ${screenCount} screens.`
      );
    }
  };

  const goHomeScreen = () => {
    setScreen([0, ScreenPaginationDirection.RIGHT]);
  };

  const nextScreen = () => paginate(ScreenPaginationDirection.RIGHT);
  const previousScreen = () => paginate(ScreenPaginationDirection.LEFT);

  return {
    currentScreen,
    direction,
    nextScreen,
    previousScreen,
    goHomeScreen,
  };
};

export default useScreenPagination;
