// Vendor
import {ButtonType} from 'basic-components/Button';
import {ReactNode} from 'react';

export interface DrawerFooterAction {
  disabled?: boolean;
  label: string;
  onClick: () => void;
  icon?: ReactNode;
  type?: ButtonType;
}
