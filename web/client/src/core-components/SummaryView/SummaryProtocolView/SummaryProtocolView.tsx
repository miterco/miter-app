// Vendor
import React, {useCallback, useMemo} from 'react';

// Components
import {BaseSummaryItemView} from '../BaseSummaryItemView';
import {ContextMenuItem} from 'basic-components/ContextMenu';
import {ProtocolsIcon} from 'image';

// Types
import {ProtocolItem, ProtocolItemType, SummaryItem} from 'miter-common/SharedTypes';

// General.
import {useProtocolContext} from 'model/ProtocolContextProvider';
import Button, {ButtonType} from 'basic-components/Button';
import {waitATick} from 'Utils';
import {ProtocolSummaryStrategies} from 'miter-common/logic/protocol-summary-strategies';
import GroupIcon from 'basic-components/GroupIcon';

interface SummaryItemViewProps {
  item: SummaryItem;
  animateIn?: boolean;
}

const SummaryProtocolView: React.FC<SummaryItemViewProps> = ({item, animateIn}) => {
  const {protocols, protocolTypes, setCurrentProtocol, setIsDrawerExpanded, setIsDrawerVisible} = useProtocolContext();
  const itemProtocol = useMemo(() => protocols[item.protocolId as string], [item.protocolId, protocols]);
  const contextMenuItems: Array<ContextMenuItem> = [];
  const protocolType = itemProtocol?.typeId ? protocolTypes[itemProtocol.typeId] : null;
  const items = (itemProtocol?.isCompleted && itemProtocol.items) || [];

  const openProtocol = useCallback(() => {
    setCurrentProtocol(itemProtocol);
    waitATick(() => {
      setIsDrawerVisible(true);
      setIsDrawerExpanded(true);
    });
  }, [itemProtocol, setCurrentProtocol, setIsDrawerExpanded, setIsDrawerVisible]);

  const summarizeProtocolItemsFn =
    (protocolType?.name && ProtocolSummaryStrategies[protocolType.name]) || ProtocolSummaryStrategies.Default;

  const protocolGroupItems = items.filter(({type}) => type === ProtocolItemType.Group);
  const unGroupedProtocolItems = items.filter(({type, parentId}) => type === ProtocolItemType.Item && !parentId);
  const groupedProtocolItems = items.filter(({type, parentId}) => type === ProtocolItemType.Item && parentId);
  const filteredItems = summarizeProtocolItemsFn(unGroupedProtocolItems);
  const filteredGroupItems = summarizeProtocolItemsFn(protocolGroupItems);

  const groupItemsMap = groupedProtocolItems.reduce((groupMap, protocolItem) => {
    const {parentId} = protocolItem;
    if (!parentId) return groupMap;
    if (!groupMap[parentId]) groupMap[parentId] = [];
    groupMap[parentId] = [...groupMap[parentId], protocolItem];
    return groupMap;
  }, {} as Record<string, ProtocolItem[]>);

  return (
    (itemProtocol && (
      <BaseSummaryItemView
        animateIn={animateIn}
        item={item}
        topRow={
          <Button onClick={openProtocol} type={ButtonType.borderless} className="OpenProtocolButton">
            {itemProtocol.type?.name} <ProtocolsIcon />
          </Button>
        }
        contextMenuItems={contextMenuItems}
      >
        <div className="ProtocolContent">
          <h4 className="ProtocolTitle">{itemProtocol.title}</h4>
          <ul className="ProtocolList">
            {filteredGroupItems.map(item => (
              <li className="Group" key={item.id}>
                <GroupIcon />
                {item.text} ({groupItemsMap[item.id]?.length ?? 0} ideas)
              </li>
            ))}
            {filteredItems.map(({text, id}) => (
              <li key={id}>{text}</li>
            ))}
          </ul>
        </div>
      </BaseSummaryItemView>
    )) ??
    null
  );
};

export default SummaryProtocolView;
