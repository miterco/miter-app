// Vendor
import {FC, ReactElement} from 'react';

// Components
import {DrawerFooter} from 'basic-components/Drawer';
import {ButtonType} from 'basic-components/Button';
import {ArrowRightIcon} from 'image';

// Styles
import './ProtocolDrawerFooter.less';
import {DrawerFooterAction} from 'basic-components/Drawer/DrawerFooter';
import {deleteProtocol, moveToNextProtocolPhase, moveToPreviousProtocolPhase} from 'model/ProtocolApi';
import {useProtocolContext} from 'model/ProtocolContextProvider';
import {StrProtocols} from 'miter-common/Strings';

interface ProtocolDrawerFooterProps {
  button: {
    label: string;
    hasIcon: boolean;
    disabled: boolean;
    onClick: () => void;
    type?: ButtonType;
  };
  topElement?: ReactElement;
}

const ProtocolDrawerFooter: FC<ProtocolDrawerFooterProps> = ({button, topElement, children}) => {
  const {currentProtocol} = useProtocolContext();
  const primaryAction: DrawerFooterAction = {
    label: button.label,
    onClick: button.onClick,
    disabled: button.disabled,
    type: button.type || ButtonType.primary,
    icon: button.hasIcon ? <ArrowRightIcon className="RIcon" /> : null, // TODO should integrate RIcon into button component
  };

  const menuActions: DrawerFooterAction[] = [
    {
      label: 'Go Back',
      disabled: !currentProtocol?.currentPhaseIndex,
      onClick: () => {
        if (currentProtocol?.id) moveToPreviousProtocolPhase(currentProtocol.id);
      },
    },
    {
      label: 'Skip to Next Phase',
      disabled:
        !currentProtocol?.type?.phases?.length ||
        currentProtocol?.currentPhaseIndex >= currentProtocol?.type?.phases?.length - 1,
      onClick: () => {
        if (currentProtocol?.id) moveToNextProtocolPhase(currentProtocol.id);
      },
    },
    {
      label: `Delete ${StrProtocols.Protocol}`,
      onClick: () => {
        if (currentProtocol?.id) deleteProtocol(currentProtocol.id);
      },
    },
  ];

  return (
    <>
      {topElement}
      <DrawerFooter menuActions={menuActions} primaryAction={primaryAction}>
        {children}
      </DrawerFooter>
    </>
  );
};

export default ProtocolDrawerFooter;
