import {Dropdown, Menu} from 'antd';
import MenuItem from 'antd/lib/menu/MenuItem';
import React, {MouseEvent, ReactNode, useCallback, useMemo, useState} from 'react';
import {HBox} from './Box';
import {ReactComponent as OverflowIcon} from '../image/overflow.svg';
import Button from './Button';
import './ContextMenu.less';

export interface ContextMenuItem {
  icon?: ReactNode;
  title: string;
  isToggled?: boolean;
  isButton?: boolean;
  onSelect?: () => void;
  key: string;
  shortcut?: string;
  isDisabled?: boolean;
  isHidden?: boolean;
}

interface ContextMenuProps {
  menuItems: Array<ContextMenuItem>;
  children: JSX.Element;
  hidden?: boolean;
  didSelect?: () => void;
  onShow?: (hideMe: () => void) => void;
  onHide?: () => void;
}

const ContextMenu: React.FC<ContextMenuProps> = ({menuItems, children, hidden, didSelect, onShow, onHide}) => {
  const [showMenu, setShowMenu] = useState(false);

  const handleItemSelect = useCallback(
    (event: MouseEvent | null, key: string) => {
      setShowMenu(false);
      menuItems.some(item => {
        if (item.key === key) {
          if (item.onSelect) item.onSelect();
          return true;
        }
        return false;
      });
      if (event) (event.target as HTMLElement).blur();
      if (didSelect) didSelect();
    },
    [menuItems, didSelect]
  );

  const hider = useCallback(() => {
    setShowMenu(false);
  }, []);

  const handleMouseEnter = useCallback(() => {
    setShowMenu(true);
    if (onShow) onShow(hider);
  }, [hider, onShow]);

  const handleMouseLeave = useCallback(() => {
    setShowMenu(false);
    if (onHide) onHide();
  }, [onHide]);

  const menuElements = useMemo(() => {
    const regularItems: ContextMenuItem[] = [];
    const result: ReactNode[] = [];

    menuItems.forEach(item => {
      if (item.isHidden) return;
      if (item.isButton) {
        result.push(
          <Button
            className={item.isToggled ? 'On' : ''}
            onClick={event => handleItemSelect(event, item.key)}
            forceHideTooltip={!showMenu}
            key={item.key}
            title={item.title}
            shortcut={item.shortcut}
            disabled={item.isDisabled}
          >
            {item.icon || item.title}
          </Button>
        );
      } else regularItems.push(item);
    });

    if (regularItems.length) {
      const overflowMenu = (
        <Menu onClick={(info: any) => handleItemSelect(null, info.key)}>
          {regularItems.map(item => (
            <MenuItem disabled={item.isDisabled} key={item.key} icon={item.icon || <></>}>
              {item.title}
            </MenuItem>
          ))}
        </Menu>
      );

      result.push(
        <Dropdown key="ContextMenu_overflow" overlay={overflowMenu} trigger={['click']}>
          <Button>
            <OverflowIcon />
          </Button>
        </Dropdown>
      );

      return result;
    }
  }, [menuItems, handleItemSelect, showMenu]);

  return (
    <div className="CtxtMenuCtr" onMouseEnter={handleMouseEnter} onMouseLeave={handleMouseLeave}>
      {children}
      <HBox className={`CtxtMenu${showMenu && !hidden ? ' Show' : ''}`}>{menuElements}</HBox>
    </div>
  );
};

export default ContextMenu;
