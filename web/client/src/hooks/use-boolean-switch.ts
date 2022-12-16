import {useState, useCallback} from 'react';

const useBooleanSwitch = (initialState?: boolean) => {
  const [state, setState] = useState<boolean>(initialState || false);
  const switchOn = useCallback(() => setState(true), []);
  const switchOff = useCallback(() => setState(false), []);

  return [state, switchOn, switchOff] as const;
};

export default useBooleanSwitch;
