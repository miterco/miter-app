// Vendor
import {FC, ReactElement} from 'react';

// Components
import Button, {ButtonSize, ButtonType} from 'basic-components/Button';
import {ArrowLeftIcon} from 'image';

// Styles
import './PickerModalHeader.less';

interface PickerModalHeaderProps {
  title: string;
  currentScreen: number;
  onPaginateBack: () => void;
  description?: ReactElement | string;
}

const PickerModalHeader: FC<PickerModalHeaderProps> = ({title, description, currentScreen, onPaginateBack}) => {
  return (
    <div className="PickerModalHeader">
      <div className="Grid">
        {currentScreen > 0 && (
          <Button
            icon={<ArrowLeftIcon />}
            size={ButtonSize.large}
            type={ButtonType.borderless}
            className="Action"
            onClick={onPaginateBack}
          />
        )}
        <h3 className="Title">{title}</h3>
      </div>
      <div className="Description">{description}</div>
    </div>
  );
};

export default PickerModalHeader;
