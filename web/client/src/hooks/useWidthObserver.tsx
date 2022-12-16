import * as React from 'react';

const useWidthObserver = (element?: HTMLElement | null) => {
  const ref = React.useRef<HTMLElement | null>(element ?? null);
  const [width, setWidth] = React.useState(0);
  const [resizeObserver] = React.useState(() =>
    new ResizeObserver(((entries) => {
      if (entries.length !== 1) console.warn(`Resize observer expected one entry, got ${entries.length}.`);
      setWidth(entries[0].contentRect.width);
    })
  ));

  const setRef = React.useCallback((element: HTMLElement | null) => {
    if (ref.current) {
      resizeObserver.unobserve(ref.current);
    }

    ref.current = element;

    if (ref.current) {
      resizeObserver.observe(ref.current);
    }
  }, [resizeObserver]);

  React.useEffect(() => {
    if (element) {
      setRef(element);
    }
  }, [setRef, element]);

  React.useEffect(() => {
    return () => resizeObserver.disconnect();
  }, [resizeObserver])

  return { width, setRef };
}

export default useWidthObserver;