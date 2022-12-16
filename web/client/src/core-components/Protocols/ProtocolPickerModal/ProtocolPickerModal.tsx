// Vendor
import {FC, useCallback, useEffect, useMemo, useState} from 'react';

// Components
import PickerModal, {PickerModalOption} from 'basic-components/PickerModal';
import {ProtocolsIcon} from 'image';
import PickerListScreen from 'basic-components/PickerModal/PickerBodyScreens/PickerListScreen';
import PickerPromptScreen from 'basic-components/PickerModal/PickerBodyScreens/PickerPromptScreen';
import PickerModalHeader from 'basic-components/PickerModal/PickerModalHeader';

// Endpoints
import {createProtocol} from 'model/ProtocolApi';

// Contexts
import {useProtocolContext} from 'model/ProtocolContextProvider';
import {StrProtocols} from 'miter-common/Strings';
import {useScreenPagination} from 'hooks/useScreenPagination';

interface ProtocolPickerModalProps {
  open: boolean;
  onClose: () => void;
}

const ProtocolPickerModal: FC<ProtocolPickerModalProps> = ({open, onClose}) => {
  const {protocolTypes, showProtocolPickerModal} = useProtocolContext();
  const {currentScreen, direction, nextScreen, previousScreen, goHomeScreen} = useScreenPagination(3);
  const [currentSelectedOption, setCurrentSelectedOption] = useState<PickerModalOption | null>(null);

  // Reset the protocol picker state when it is closed.
  useEffect(() => {
    if (!showProtocolPickerModal && currentSelectedOption) {
      setCurrentSelectedOption(null);
      goHomeScreen();
    }
  }, [showProtocolPickerModal, currentSelectedOption, goHomeScreen]);

  const selectOption = useCallback(
    (option: PickerModalOption): void => {
      setCurrentSelectedOption(option);
      nextScreen();
    },
    [nextScreen]
  );

  const handleProtocolSelection = useCallback(
    async ({selectedOption, promptValue}: {selectedOption: PickerModalOption; promptValue: string}) => {
      await createProtocol(promptValue, selectedOption.key);
    },
    []
  );

  const handleConfirm = useCallback(
    (promptValue: string): void => {
      if (currentSelectedOption) {
        handleProtocolSelection({selectedOption: currentSelectedOption, promptValue});
        onClose();
      }
    },
    [currentSelectedOption, onClose, handleProtocolSelection]
  );

  const options: PickerModalOption[] = Object.values(protocolTypes).map((protocolType: any) => ({
    key: protocolType.id,
    label: protocolType.name,
    description: protocolType.description,
    icon: ProtocolsIcon,
    setup: protocolType.data.setup,
  }));

  const screens = {
    header: useMemo(
      () => [
        <PickerModalHeader
          title={StrProtocols.AddProtocolHeader}
          description={StrProtocols.AddProtocolDescription}
          currentScreen={currentScreen}
          onPaginateBack={previousScreen}
        />,
        <PickerModalHeader
          title={StrProtocols.AddProtocolHeader}
          description={
            <div className="HeaderDescription">
              {currentSelectedOption?.icon && <currentSelectedOption.icon />}
              {currentSelectedOption?.label}
            </div>
          }
          currentScreen={currentScreen}
          onPaginateBack={previousScreen}
        />,
      ],
      [currentScreen, currentSelectedOption, previousScreen]
    ),
    body: useMemo(
      () => [
        <PickerListScreen options={options} selectOption={selectOption} />,
        <PickerPromptScreen
          label={currentSelectedOption?.setup.label}
          placeholder={currentSelectedOption?.setup.placeholder}
          onConfirm={handleConfirm}
          onCancel={previousScreen}
        />,
      ],
      [options, currentSelectedOption, previousScreen, selectOption, handleConfirm]
    ),
  };

  return (
    <PickerModal open={open} onClose={onClose} screens={screens} currentScreen={currentScreen} direction={direction} />
  );
};

export default ProtocolPickerModal;
