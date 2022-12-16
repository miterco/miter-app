import { ReactNode, useEffect, useRef } from 'react';
import './StickyHeader.less';


interface StickyHeaderProps {
  children: ReactNode;
  onStick: (el: Element) => void;
  onUnstick: (el: Element) => void;
}


const StickyHeader: React.FC<StickyHeaderProps> = ({ children, onStick, onUnstick }) => {
  const ref = useRef<HTMLHeadingElement>(null);

  useEffect(() => {
    if (ref.current) {
      const el = ref.current;
      const observer = new IntersectionObserver(
        ([e]) => {
          // IntersectionObserver will trigger when the header hits the top _or_ the bottom. I can't
          // find a better way to differentiate than just to check its y coordinate against the list's
          // scroll position. The check below says: If the header's offsetTop is within 80px of the list's
          // scroll position (that is, we've scrolled about as far as the top of the header), then it's
          // an intersection we care about.
          if (Math.abs((e.target as HTMLElement).offsetTop - (e.target.parentElement?.scrollTop || 0)) < 80) {
            if (e.isIntersecting) onUnstick(e.target);
            else onStick(e.target);
          }
        },
        {
          root: null,
          rootMargin: '0px',
          threshold: [1]
        }
      );
      observer.observe(ref.current);
      return () => { observer.unobserve(el); };
    }
  }, [ref, onStick, onUnstick]);

  return (
    <header ref={ref} className="StickyHeader"><div>{children}</div></header>
  );
};


export default StickyHeader;