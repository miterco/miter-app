// Vendor
import {FC, useMemo} from 'react';
import {Dropdown, Menu} from 'antd';

// Components
import Button, {ButtonSize, ButtonType} from 'basic-components/Button';
import {OverflowIcon} from 'image';
import ProtocolActivityIndicator from 'core-components/Protocols/ProtocolActivityIndicator';

// Types
import {DrawerFooterAction} from './DrawerFooter.types';

// Styles
import './DrawerFooter.less';

interface DrawerFooterProps {
  menuActions?: DrawerFooterAction[];
  primaryAction: DrawerFooterAction;
}

const DrawerFooter: FC<DrawerFooterProps> = ({menuActions = [], primaryAction, children}) => {
  const ActionsMenu = useMemo(
    () => (
      <Menu>
        {menuActions.map(({label, onClick, disabled}) => (
          <Menu.Item key={label} disabled={disabled} onClick={onClick}>
            {label}
          </Menu.Item>
        ))}
      </Menu>
    ),
    [menuActions]
  );

  return (
    <div className="DrawerFooter">
      {children ?? <ProtocolActivityIndicator />}
      <div className="actions">
        {menuActions.length > 0 && (
          <Dropdown trigger={['click']} overlay={ActionsMenu}>
            <Button className="overflowButton" size={ButtonSize.large}>
              <OverflowIcon />
            </Button>
          </Dropdown>
        )}
        <Button
          type={primaryAction.type}
          size={ButtonSize.large}
          onClick={primaryAction.onClick}
          disabled={primaryAction.disabled}
        >
          {primaryAction.label}
          {primaryAction.icon}
        </Button>
      </div>
    </div>
  );
};

export default DrawerFooter;
