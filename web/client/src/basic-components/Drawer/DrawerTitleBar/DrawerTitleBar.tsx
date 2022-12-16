// Vendor
import Button, {ButtonSize, ButtonType} from 'basic-components/Button';
import cn from 'classnames';

// Components
import {MinimizeIcon} from 'image';
import {ElementType, FC, MouseEvent, useRef} from 'react';

// Styles
import './DrawerTitleBar.less';

interface DrawerTitleBarProps {
  onButtonClick?: () => void;
  onClick: () => void;
  title?: string;
  ActionIcon?: ElementType;
  icon?: ElementType;
  separate?: boolean;
}

const DrawerTitleBar: FC<DrawerTitleBarProps> = ({
  title,
  ActionIcon = MinimizeIcon,
  icon: Icon,
  onButtonClick,
  onClick,
  separate,
}) => {
  const buttonRef = useRef<HTMLButtonElement>(null);

  const handleButtonClick = (event: MouseEvent) => {
    event.stopPropagation();
    if (buttonRef.current) buttonRef.current.blur();
    if (onButtonClick) onButtonClick();
    else onClick();
  };

  return (
    <div className={cn('DrawerTitleBar', {Shadow: separate})} onClick={onClick}>
      <div className="Title">
        {Icon && <Icon className="TitleIcon" />}
        <span className="TitleLabel">{title}</span>
      </div>
      <Button
        icon={<ActionIcon />}
        type={ButtonType.borderless}
        className="Action"
        ref={buttonRef}
        onClick={handleButtonClick}
      />
    </div>
  );
};

export default DrawerTitleBar;
