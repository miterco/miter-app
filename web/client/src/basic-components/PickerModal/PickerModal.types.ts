import {ElementType} from 'react';

export interface PickerModalOption {
  key: string;
  label: string;
  description?: string;
  icon?: ElementType;
  setup: {
    label: string;
    placeholder: string;
  };
}
