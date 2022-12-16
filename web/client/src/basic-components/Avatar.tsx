import classnames from 'classnames';
import {DefaultPersonData, Person} from 'miter-common/SharedTypes';
import AntAvatar from 'antd/lib/avatar/avatar';
import {PersonIcon} from 'image';
import './Avatar.less';
import React, {CSSProperties, MouseEventHandler, useCallback, useMemo, useState} from 'react';
import Tooltip from './Tooltip';

export interface AvatarProps {
  user?: Person; // user takes precedence over text
  text?: string;
  tooltip?: string | JSX.Element | null; // tooltip takes precedence over user
  size?: number;
  overlap?: boolean; // Shift left to work inside a FacePile. Requires size.
  className?: string;

  onClick?: MouseEventHandler<HTMLDivElement>;
}

export const DefaultAvatarSize = 32;

const numberOfAvatarColors = 7; // Should match the colors defined in the LESS file
const bucketSize = Math.round(26 / numberOfAvatarColors); // Distribute colors across the alphabet
const overlapAmount = 0.5;

const Avatar: React.FC<AvatarProps> = props => {
  const [hideTooltip, setHideTooltip] = useState(false);
  const firstInitial = props.user ? props.user?.initials?.substr(0, 1) : undefined;
  const initialIndex = firstInitial ? firstInitial.charCodeAt(0) - 65 : 0;
  const colorIndex = Math.round(initialIndex / bucketSize);
  const size = (props.size ? props.size : DefaultAvatarSize) - 2;
  const {onClick} = props;

  const pictureUrl = useMemo(() => {
    if (!props.user?.picture) return null;
    const idType = props.user?.userId ? 'user' : 'person';
    const id = props.user?.userId || props.user?.id;

    return id ? `/api/users/${idType}/${id}/proxy-picture` : null;
  }, [props.user?.userId, props.user?.id, props.user?.picture]);

  const style: CSSProperties = useMemo(() => ({minWidth: size, minHeight: size}), [size]);
  if (props.overlap && props.size) style.marginLeft = -size * overlapAmount;

  const handleClick: MouseEventHandler<HTMLDivElement> = useCallback(
    event => {
      setHideTooltip(true);
      onClick && onClick(event);
    },
    [onClick]
  );

  const avatar = useMemo(
    () => (
      <div className="AvatarWrapper" onClick={handleClick} onMouseEnter={() => setHideTooltip(false)}>
        {React.createElement(AntAvatar, {
          src: pictureUrl,
          size,
          className: classnames('Avatar', `AvatarColor${colorIndex}`, props.className, {
            clickable: props.onClick,
          }),
          icon: firstInitial || props.text || <PersonIcon />,
          style,
          crossOrigin: 'anonymous',
        })}
      </div>
    ),
    [colorIndex, firstInitial, handleClick, pictureUrl, props.className, props.onClick, props.text, size, style]
  );

  if (props.tooltip === null) return avatar;

  return (
    <Tooltip
      className={props.className ? `Tooltip-${props.className}` : ''}
      placement="bottom"
      content={props.tooltip || props.user?.displayName || props.user?.initials || DefaultPersonData.displayName}
      forceHide={hideTooltip}
    >
      {avatar}
    </Tooltip>
  );
};

export default Avatar;
