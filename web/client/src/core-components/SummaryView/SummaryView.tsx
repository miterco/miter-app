// Vendor
import classNames from 'classnames';
import {useCallback, useMemo, useState} from 'react';

// Types
import {ItemType, ItemTypeValues, SummaryItem, UnsavedSummaryItem} from 'miter-common/SharedTypes';
import {DrawerState} from 'basic-components/Drawer/Drawer.types';

// Providers
import {useMiterContext} from 'model/MiterContextProvider';

// Components
import Button, {ButtonSize, ButtonType} from 'basic-components/Button';
import Drawer from 'basic-components/Drawer';
import NoteList from 'core-components/Notes/NoteList';
import {AddIcon} from 'image';

// Styles
import './SummaryView.less';
import Card from 'core-components/Card';
import SummarySection from './SummarySection';
import {Dropdown, Menu} from 'antd';
import {ItemTypeLabels} from 'miter-common/Strings';

const filterSummaryItemList = (type: ItemType, allItems: SummaryItem[] | null): SummaryItem[] => {
  return allItems ? allItems.filter(item => item.itemType === type) : [];
};

const SummaryView: React.FC<{}> = () => {
  const {summaryItems} = useMiterContext();
  const [showNotesDrawer, setShowNotesDrawer] = useState(false);
  const [unsavedItem, setUnsavedItem] = useState<UnsavedSummaryItem | null>(null);

  const sortedItems = useMemo<Record<Exclude<ItemType, 'None'>, SummaryItem[]>>(
    () => ({
      Task: filterSummaryItemList('Task', summaryItems),
      Pin: filterSummaryItemList('Pin', summaryItems),
      Decision: filterSummaryItemList('Decision', summaryItems),
    }),
    [summaryItems]
  );

  const handleAddClick = useCallback(({key}) => {
    if (!ItemTypeValues.includes(key)) {
      console.warn(`Tried to add an unknown item type ${key}.`);
      key = 'Task';
    }
    setUnsavedItem({itemText: '', itemType: key, targetDate: null, noteId: null});
  }, []);

  const addButton = useMemo(() => {
    const menu = (
      <Menu onClick={handleAddClick}>
        <Menu.Item key="Task">Add {ItemTypeLabels.Task.Singular}</Menu.Item>
        <Menu.Item key="Decision">Add {ItemTypeLabels.Decision.Singular}</Menu.Item>
        <Menu.Item key="Pin">Add {ItemTypeLabels.Pin.Singular}</Menu.Item>
      </Menu>
    );

    return (
      <Dropdown key="add" overlay={menu} trigger={['click']}>
        <Button
          type={ButtonType.borderless}
          title="Add an action item, decision, or note to the summary"
          forceHideTooltip
          icon={<AddIcon />}
        />
      </Dropdown>
    );
  }, [handleAddClick]);

  const clearUnsavedItem = () => setUnsavedItem(null);

  return (
    <>
      <div className={classNames('MeetingContent', 'Summary')}>
        <Card className="SummaryCard" title="Summary" rightToolbarItems={[addButton]} listCard>
          <div className="SummaryList">
            <SummarySection
              items={sortedItems.Task}
              pinType="Task"
              unsavedItem={unsavedItem}
              didSave={clearUnsavedItem}
            />
            <SummarySection
              items={sortedItems.Decision}
              pinType="Decision"
              unsavedItem={unsavedItem}
              didSave={clearUnsavedItem}
            />
            <SummarySection
              items={sortedItems.Pin}
              pinType="Pin"
              unsavedItem={unsavedItem}
              didSave={clearUnsavedItem}
            />
            <Button
              className="ShowNotesBtn"
              size={ButtonSize.large}
              onClick={() => setShowNotesDrawer(prevState => !prevState)}
            >
              Show All Notes
            </Button>
          </div>
        </Card>
      </div>

      <NotesDrawer visible={showNotesDrawer} shouldClose={() => setShowNotesDrawer(false)} />
    </>
  );
};

const NotesDrawer: React.FC<{visible: boolean; shouldClose: () => any}> = ({visible: isVisible, shouldClose}) => {
  const [isExpanded, setIsExpanded] = useState(true);

  const handleChangeState = (toState: DrawerState) => {
    if (toState === DrawerState.Closed) shouldClose();
    else setIsExpanded(toState === DrawerState.Expanded);
  };

  return (
    <Drawer
      title="All Notes"
      className="NotesDrawer"
      state={isVisible ? (isExpanded ? DrawerState.Expanded : DrawerState.Collapsed) : DrawerState.Closed}
      shouldChangeState={handleChangeState}
      titleBarButtonAction="Close"
      separateTitleBar
    >
      <div className="NoteListContainer">
        <NoteList />
      </div>
    </Drawer>
  );
};

export default SummaryView;
