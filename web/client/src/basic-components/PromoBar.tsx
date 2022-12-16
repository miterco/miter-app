import {useEffect, useState, useCallback, useRef, ReactNode, FC} from 'react';
import classNames from 'classnames';

// Components.
import Button, {ButtonType} from './Button';

// Assets.
import {CloseIcon} from 'image';
import './PromoBar.less';
import {waitATick} from 'Utils';
import {useMiterContext} from 'model/MiterContextProvider';

export interface Promo {
  id: string;
  icon?: ReactNode;
  content: ReactNode;
  buttonLabel?: string;
  onClick: () => void;
  onClose?: () => void;
  hideInSidebar?: boolean;
  hideInDesktop?: boolean;
  closeOnMeetingChange?: boolean;
  showOncePerSession?: boolean; // Ensures that a promo will be showed only once in a session (until the user reloads).
  alreadyClosed?: boolean;
}

const PromoBar: FC = () => {
  const {isInSidebar, meeting, currentPromo, hidePromoBar, isPromoBarVisible} = useMiterContext();
  const [mounted, setMounted] = useState(false);
  const {icon, content, onClick, onClose, hideInSidebar, hideInDesktop, buttonLabel} = currentPromo || {};

  const closePromoBar = useCallback(
    event => {
      event.stopPropagation();
      hidePromoBar();
      if (onClose) setTimeout(onClose, 300);
    },
    [onClose, hidePromoBar]
  );

  const handleClick = useCallback(() => {
    hidePromoBar();
    if (onClick) onClick();
  }, [onClick, hidePromoBar]);

  if (hideInSidebar && isInSidebar) return null;
  if (hideInDesktop && !isInSidebar) return null;

  return (
    <div className="PromoBarWrapper">
      <div className={classNames('PromoBar', {visible: isPromoBarVisible})} onClick={handleClick}>
        {!isInSidebar && icon}
        <div className="Content">{content}</div>
        {!isInSidebar && buttonLabel && (
          <Button onClick={handleClick} type={ButtonType.primary}>
            {buttonLabel}
          </Button>
        )}
        {isInSidebar && icon}
        <Button
          type={ButtonType.borderless}
          title="Close promo bar"
          onClick={closePromoBar}
          icon={<CloseIcon />}
          className="CloseButton"
        />
      </div>
    </div>
  );
};

export default PromoBar;
