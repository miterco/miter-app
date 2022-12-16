import {ItemType} from 'miter-common/SharedTypes';
import {DecisionIcon, StarIcon as PinIcon, ActionIcon as TaskIcon} from 'image';
import {useMemo} from 'react';
import React from 'react';

const ItemTypeIcon: React.FC<{type: ItemType}> = ({type}) => {
  const result = useMemo(() => {
    if (type === 'Task') return <TaskIcon />;
    if (type === 'Pin') return <PinIcon />;
    if (type === 'Decision') return <DecisionIcon />;
    return <></>;
  }, [type]);

  return result;
};

export default ItemTypeIcon;
