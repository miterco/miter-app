import {AntButtonType, ButtonType} from './Button.types';

export const mapButtonType = (type?: ButtonType): AntButtonType => {
  switch (type) {
    case ButtonType.primary:
      return AntButtonType.primary;
    case ButtonType.borderless:
    case ButtonType.placeholder:
      return AntButtonType.text;
    default:
      return AntButtonType.default;
  }
};
