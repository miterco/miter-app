// Vendor
import classNames from 'classnames';
import {ChangeEventHandler, ReactNode} from 'react';

// Components
import {CheckNarrowIcon} from 'image';

// Types
import {CheckboxSize} from './Checkbox.types';

// Utils
import {capitalizeString} from 'utils/string.utils';

// Styles
import './Checkbox.less';
import {uuid} from 'miter-common/CommonUtil';

interface CheckboxProps {
  size?: CheckboxSize;
  checked: boolean;
  disabled?: boolean;
  onChange?: ChangeEventHandler<HTMLInputElement>;
  label?: ReactNode;
  highlightEnabled?: boolean;
}

const Checkbox: React.FC<CheckboxProps> = ({
  size = CheckboxSize.Large,
  checked,
  disabled,
  onChange,
  label,
  highlightEnabled = false,
}) => {
  const checkboxId = `Checkbox_${uuid()}`;
  return (
    <div className={classNames('CheckboxWrapper', `Size${capitalizeString(size)}`)}>
      <span
        className={classNames('Checkbox', {
          Checked: checked,
          Highlighted: (checked && highlightEnabled) || (!checked && !highlightEnabled),
        })}
      >
        <input id={checkboxId} type="checkbox" checked={checked} disabled={disabled} onChange={onChange} />
        {checked && <CheckNarrowIcon className="Check" />}
      </span>
      {label && (
        <label className="Label" htmlFor={checkboxId}>
          {label}
        </label>
      )}
    </div>
  );
};
export default Checkbox;
