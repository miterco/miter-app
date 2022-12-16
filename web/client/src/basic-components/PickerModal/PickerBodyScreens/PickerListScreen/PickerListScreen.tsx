// Vendor
import {FC} from 'react';

// Types
import {PickerModalOption} from 'basic-components/PickerModal/PickerModal.types';

// Styles
import './PickerListScreen.less';

interface PickerListScreenProps {
  options: PickerModalOption[];
  selectOption: (option: PickerModalOption) => void;
}

const PickerListScreen: FC<PickerListScreenProps> = ({options, selectOption}) => {
  return (
    <ul className="PickerOptionList">
      {options.map(option => (
        <li key={option.key} className="Option" onClick={() => selectOption(option)}>
          <h3 className="Title">
            {option.icon && <option.icon className="Icon" />}
            {option.label}
          </h3>
          <p className="Description">{option.description}</p>
        </li>
      ))}
    </ul>
  );
};

export default PickerListScreen;
