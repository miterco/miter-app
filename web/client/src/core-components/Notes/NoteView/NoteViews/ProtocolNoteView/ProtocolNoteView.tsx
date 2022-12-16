// Vendor
import {FC, useMemo} from 'react';

// Components
import Avatar from 'basic-components/Avatar';
import Button, {ButtonType} from 'basic-components/Button';

// Styles
import './ProtocolNoteView.less';
import {PopOutIcon, ProtocolsIcon} from 'image';
import {useProtocolContext} from 'model/ProtocolContextProvider';

import {ProtocolSummaryStrategies} from 'miter-common/logic/protocol-summary-strategies';
import {NoteViewProps} from '../../NoteView.types';
import classNames from 'classnames';
import {useMiterContext} from 'model/MiterContextProvider';
import {ProtocolItem, ProtocolItemType} from 'miter-common/SharedTypes';
import GroupIcon from 'basic-components/GroupIcon';

const ProtocolNoteView: FC<NoteViewProps> = ({note: {protocolId}}) => {
  const {openProtocol, protocols, protocolTypes} = useProtocolContext();
  const {currentUser, setShowSignInDialog} = useMiterContext();

  const protocol = protocolId ? protocols[protocolId] : null;
  const protocolType = protocol?.typeId ? protocolTypes[protocol.typeId] : null;
  const items = (protocol?.isCompleted && protocol.items) || [];

  const signInButton = useMemo(
    () => (
      <Button onClick={() => setShowSignInDialog(true)} type={ButtonType.borderless} className="OpenProtocolButton">
        Sign In To Open
      </Button>
    ),
    [setShowSignInDialog]
  );

  const openProtocolButton = useMemo(
    () => (
      <Button
        onClick={() => openProtocol(protocolId)}
        type={ButtonType.borderless}
        icon={<PopOutIcon />}
        className="OpenProtocolButton"
      >
        {!protocol?.isCompleted && 'Open'}
      </Button>
    ),
    [openProtocol, protocol?.isCompleted, protocolId]
  );

  const summarizeProtocolItemsFn =
    protocolType?.name && ProtocolSummaryStrategies[protocolType.name]
      ? ProtocolSummaryStrategies[protocolType.name]
      : ProtocolSummaryStrategies.Default;

  const filteredItems = summarizeProtocolItemsFn(items);
  const groupedItemsMap: Record<string, ProtocolItem[]> = {};
  const groups = [];
  const ungroupedItems = [];

  for (const item of filteredItems) {
    if (item.type === ProtocolItemType.Group) groups.push(item);
    else if (!item.parentId) ungroupedItems.push(item);
    // It's an item in a group.
    else if (!groupedItemsMap[item.parentId]) groupedItemsMap[item.parentId] = [item];
    else groupedItemsMap[item.parentId].push(item);
  }

  return (
    <div className={classNames('ProtocolNote', {Completed: protocol?.isCompleted})}>
      <div className="ProtocolNoteCard">
        <div className="Header">
          <ProtocolsIcon className="ProtocolIcon" />
          <div className="ProtocolType">{protocolType?.name}</div>

          {currentUser ? openProtocolButton : signInButton}
          <div className="ProtocolTitle">{protocol?.title}</div>
        </div>

        <ul className="ProtocolSummary">
          {groups.map(item => (
            <li className="ProtocolSummaryItem" key={item.id}>
              <GroupIcon />
              {item.text} ({groupedItemsMap[item.id]?.length ?? 0} ideas)
            </li>
          ))}
          {ungroupedItems.map(item => (
            <li className="ProtocolSummaryItem" key={item.id}>
              <Avatar size={22} className="Avatar" user={item.creator} />
              {item.text}
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
};

export default ProtocolNoteView;
