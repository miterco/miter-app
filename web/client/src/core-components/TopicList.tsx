import {useCallback, useEffect, useMemo, useRef, useState} from 'react';
import Button, {ButtonType} from '../basic-components/Button';
import TopicView from './TopicView';
import {ReactComponent as AddIcon} from '../image/add-bordered.svg';
import './TopicList.less';
import {Topic} from 'miter-common/SharedTypes';
import {swapArrayElements, waitATick} from '../Utils';
import {editTopic} from '../model/TopicApi';
import {useMiterContext} from '../model/MiterContextProvider';
import ReorderableList, {ReorderableListItemData} from '../basic-components/ReorderableList';
import classNames from 'classnames';
import useCopyPriorTopicsButton from '../hooks/copy-prior-topics-hook';
import AddTopicModal from './AddTopicModal/AddTopicModal';
import {useMiterTour} from './MiterTourContextProvider';

interface TopicListProps {
  showCurrentTopic?: boolean;
  onTopicSelect?: (topic: Topic) => void; // Double-click to edit works iff this is undefined
  showCopyPriorButton?: boolean;
}

const TopicList: React.FC<TopicListProps> = props => {
  const {topics, attendees, currentTopicIndex} = useMiterContext();
  const [initialLoadComplete, setInitialLoadComplete] = useState(false);
  const shouldReceiveClicks = props.onTopicSelect !== undefined;
  const [currentlyReceivingClicks, setCurrentlyReceivingClicks] = useState(shouldReceiveClicks);
  const footerRef = useRef<HTMLDivElement>(null);
  const [showAddTopicModal, setShowAddTopicModal] = useState(false);
  const {openTour, closeTour, completeTourStep} = useMiterTour();

  // When we first get topics for a meeting (so `topics` switches from null to an empty or non-
  // empty array), enable mount animations on next paint.
  useEffect(() => {
    if (topics) waitATick(() => setInitialLoadComplete(true));
  }, [topics]);

  const handleTopicMove = useCallback(
    (idxBefore: number, idxAfter: number) => {
      if (topics) {
        const updatedTopics = swapArrayElements(topics, idxBefore, idxAfter);
        const beforeVal = idxAfter === 0 ? 0 : updatedTopics[idxAfter - 1].order;
        const afterVal = idxAfter > topics.length - 2 ? Math.floor(beforeVal) + 1 : updatedTopics[idxAfter + 1].order;
        const order = (beforeVal + afterVal) / 2;

        editTopic({id: topics[idxBefore].id, order});
      }
    },
    [topics]
  );

  const makeTopicView = useCallback(
    (topic: Topic, index: number) => {
      if (!topics) return <></>;
      return (
        <TopicView
          key={index}
          topic={topic}
          author={topic.createdBy ? attendees[topic.createdBy] || {} : {}}
          showAsCurrent={Boolean(
            props.showCurrentTopic && currentTopicIndex !== null && topics[currentTopicIndex]?.id === topic.id
          )}
          onClick={currentlyReceivingClicks ? props.onTopicSelect : undefined}
          index={index}
          isFirst={index === 0}
          isLast={index === topics.length - 1}
        />
      );
    },
    [props.showCurrentTopic, props.onTopicSelect, currentTopicIndex, topics, currentlyReceivingClicks, attendees]
  );

  const makeListItems = useCallback((): ReorderableListItemData[] => {
    const result = topics ? topics.map((topic, i) => ({id: topic.id, node: makeTopicView(topic, i)})) : [];
    return result;
  }, [topics, makeTopicView]);

  const handleAddClick = useCallback(() => {
    setShowAddTopicModal(true);
    closeTour();
    completeTourStep('AddTopic');
  }, [closeTour, completeTourStep]);

  const itemHoverStyle = props.showCurrentTopic
    ? {
        scale: 1,
        backgroundColor: '#FFFAFC',
        boxShadow: '0 1px 2px rgba(0,0,0,0.12), 0 1px 4px rgba(0,0,0,0.08)',
      }
    : undefined;

  const itemDragActiveStyle = props.showCurrentTopic
    ? {
        scale: 1.03,
        boxShadow: '0 1px 2px rgba(0,0,0,0.1), 0 2px 6px rgba(0,0,0,0.2)',
      }
    : undefined;

  const copyPriorButton = useCopyPriorTopicsButton(props.showCopyPriorButton || false, true);
  const footerContent = useMemo(
    () => (
      <>
        <Button
          className={classNames('AddBtn', {Empty: !topics?.length})}
          type={ButtonType.borderless}
          icon={<AddIcon />}
          onClick={handleAddClick}
          data-tour="AddTopic"
        >
          Add Topic
        </Button>

        {copyPriorButton}

        <AddTopicModal
          open={showAddTopicModal}
          shouldClose={() => {
            setShowAddTopicModal(false);
            completeTourStep('AddTopic');
            openTour();
            return true;
          }}
        />
      </>
    ),
    [topics?.length, handleAddClick, copyPriorButton, showAddTopicModal, completeTourStep, openTour]
  );

  return (
    <div className="TopicList">
      <ReorderableList
        items={makeListItems()}
        onItemsReordered={handleTopicMove}
        onDragStart={() => setCurrentlyReceivingClicks(false)}
        onDragEnd={() => setCurrentlyReceivingClicks(shouldReceiveClicks)}
        useMountAnimation={initialLoadComplete}
        itemHoverStyle={itemHoverStyle}
        itemDragStyle={itemDragActiveStyle}
        itemActiveStyle={itemDragActiveStyle}
      />
      <footer ref={footerRef}>{footerContent}</footer>
    </div>
  );
};

export default TopicList;
