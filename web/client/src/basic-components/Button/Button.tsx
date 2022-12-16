import {Button as AntButton, ButtonProps as AntButtonProps} from 'antd';
import React, {MouseEventHandler, ReactNode, useMemo} from 'react';
import {ReactComponent as DropdownArrow} from 'image/chevron-down.svg';
import Tooltip from 'basic-components/Tooltip';
import classNames from 'classnames';
import {ButtonType, ButtonSize, ButtonVariant} from './Button.types';
import {mapButtonType} from './Button.utils';
import {capitalizeString} from 'utils/string.utils';
import './Button.less';
import {ButtonHTMLType} from 'antd/lib/button/button';

interface ButtonProps extends Omit<React.ButtonHTMLAttributes<any>, 'type' | 'onClick'> {
  forceHideTooltip?: boolean;
  type?: ButtonType;
  size?: ButtonSize;
  variant?: ButtonVariant;
  dropdownArrow?: boolean;
  preserveIcons?: boolean;
  shortcut?: string;
  isShrinkable?: boolean;
  icon?: ReactNode;
  children?: ReactNode;
  onClick?: MouseEventHandler<HTMLElement>;
  htmlType?: ButtonHTMLType;
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>((props, ref) => {
  const {
    title,
    className,
    forceHideTooltip,
    type,
    size,
    variant,
    children,
    dropdownArrow,
    preserveIcons,
    isShrinkable,
    ...otherProps
  } = props;

  const btnElement = useMemo(() => {
    const antType = mapButtonType(type as ButtonType);
    const antSize = size === ButtonSize.large ? 'large' : 'middle';
    const antGhost = variant === ButtonVariant.outline;

    return (
      <AntButton
        type={antType}
        size={antSize}
        ghost={antGhost}
        className={classNames(
          'Btn',
          {
            PH: type === ButtonType.placeholder,
            PreserveIcons: preserveIcons,
            HasIcon: props.icon,
            HasLabel: children,
            ShrinkableWrapper: isShrinkable,
          },
          size,
          `${type && `Type${capitalizeString(type)}`}`,
          className
        )}
        ref={ref}
        {...otherProps}
      >
        {isShrinkable && <span className={classNames({Shrinkable: isShrinkable})}>{children}</span>}
        {!isShrinkable && children}
        {dropdownArrow ? <DropdownArrow className="Arrow" /> : null}
      </AntButton>
    );
  }, [
    type,
    size,
    variant,
    preserveIcons,
    props.icon,
    children,
    isShrinkable,
    className,
    ref,
    otherProps,
    dropdownArrow,
  ]);

  // TODO: Disabling tooltips on disabled buttons because Ant wraps disabled buttons in a span and it screws with the layout.
  if (title && !otherProps.disabled) {
    return (
      <Tooltip forceHide={forceHideTooltip} content={title} shortcut={props.shortcut} showDelay={0.3} hideDelay={0.1}>
        {btnElement}
      </Tooltip>
    );
  }
  return btnElement;
});

export default Button;
