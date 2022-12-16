// Vendor
import {Empty} from 'antd';
import React, {ReactNode, useMemo, useState} from 'react';

// Types
import {ItemType, SummaryItem, UnsavedSummaryItem} from 'miter-common/SharedTypes';

// Components
import SummaryItemView from '../SummaryItemView';

// Utils
import {SummaryListEmpties} from 'miter-common/Strings';
import {SummaryProtocolView} from '../SummaryProtocolView';
import StickyHeader from 'basic-components/StickyHeader';
import {log} from 'Utils';

interface SummarySectionProps {
  items: SummaryItem[];
  unsavedItem: UnsavedSummaryItem | null;
  didSave: () => void;
  pinType: ItemType;
}

const Headers: Record<ItemType, string> = {
  Decision: 'Decisions',
  Pin: 'Starred Notes',
  Task: 'Action Items',
  None: '',
};

const SummarySection: React.FC<SummarySectionProps> = ({items, pinType, unsavedItem, didSave}) => {
  const unsavedItemView = useMemo(() => {
    if (unsavedItem?.itemType !== pinType) return undefined;
    return <SummaryItemView item={unsavedItem} autoFocus onEndEditing={didSave} animateIn />;
  }, [didSave, pinType, unsavedItem]);

  const onStickHeader = () => {
    log('TODO: Implement onStickHeader() here and debug in MeetingList');
  };

  const onUnstickHeader = () => {
    log('TODO: Implement onUnstickHeader() here and debugin MeetingList');
  };

  return (
    <>
      <StickyHeader key={`header_${pinType}`} onStick={onStickHeader} onUnstick={onUnstickHeader}>
        {Headers[pinType]}
      </StickyHeader>
      {items.map((item, i) =>
        item.systemMessageType === 'StandardNote' ? (
          <SummaryItemView key={i} item={item} />
        ) : (
          <SummaryProtocolView key={item.id} item={item} />
        )
      )}
      {unsavedItemView}
      {!(items.length || unsavedItemView) && (
        <Empty className="Empty" description={SummaryListEmpties[pinType]} image={Empty.PRESENTED_IMAGE_SIMPLE} />
      )}
    </>
  );
};

export default SummarySection;
