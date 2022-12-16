import {Tooltip as AntTooltip} from 'antd';
import {ReactNode, useMemo} from 'react';
import {formatShortcut} from 'hooks/useKeyboardShortcuts';
import './Tooltip.less';

interface TooltipProps {
  children?: ReactNode;
  content: ReactNode;
  shortcut?: string;
  className?: string;
  placement?: 'left' | 'top' | 'right' | 'bottom';
  forceHide?: boolean;
  showDelay?: number;
  hideDelay?: number;
}

const Tooltip: React.FC<TooltipProps> = props => {
  const {children, content, shortcut, className, placement, forceHide, showDelay, hideDelay} = props;
  const layout = useMemo(() => {
    return (
      <>
        <span>{content}</span>
        {shortcut ? <span className="Shortcut">{formatShortcut(shortcut)}</span> : null}
      </>
    );
  }, [content, shortcut]);

  const overlayStyle: React.CSSProperties = useMemo(() => {
    if (!forceHide) return {};

    return {display: 'none'};
  }, [forceHide]);

  return (
    <AntTooltip
      overlayClassName={`Tooltip ${className}`}
      overlayStyle={overlayStyle}
      placement={placement || 'bottom'}
      title={layout}
      mouseEnterDelay={showDelay ?? 0.6}
      mouseLeaveDelay={hideDelay}
    >
      {children}
    </AntTooltip>
  );
};

export default Tooltip;
