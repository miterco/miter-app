// Vendor
import classNames from 'classnames';
import {motion} from 'framer-motion';
import React, {ReactElement, useCallback, useEffect, useMemo, useState} from 'react';
import {useNavigate} from 'react-router-dom';

// Components
import ContextMenu, {ContextMenuItem} from 'basic-components/ContextMenu';
import {StarIcon, DecisionIcon, ProtocolsIcon} from 'image';
import SimpleTopicPicker from 'core-components/SimpleTopicPicker';
import Checkbox from 'basic-components/Checkbox';

// Types
import {ItemType, MeetingWithTokenValue, SummaryItem, Topic, UnsavedSummaryItem} from 'miter-common/SharedTypes';

// Context
import {useMiterContext} from 'model/MiterContextProvider';

// Styles
import './BaseSummaryItemView.less';

interface BaseSummaryItemViewProps {
  item: SummaryItem | UnsavedSummaryItem;
  context?: {meeting: MeetingWithTokenValue; topic: Topic | null}; // When present, we display the meeting title alongside the topic
  isEditing?: boolean;
  animateIn?: boolean;
  topRow?: ReactElement;
  contextMenuItems: ContextMenuItem[];
  handleFocus?: () => void;
  handleBlur?: () => void;
  handleEditAction?: () => void;
  handleToggleCompletion?: () => void;
}

const IconMap: Record<ItemType | 'Protocol', React.ReactElement | null> = {
  Task: null,
  Decision: <DecisionIcon className="ItemIcon" />,
  Pin: <StarIcon className="ItemIcon" />,
  Protocol: <ProtocolsIcon className="ItemIcon" />,
  None: null,
};

const BaseSummaryItemView: React.FC<BaseSummaryItemViewProps> = ({
  item,
  context,
  isEditing,
  animateIn,
  children,
  topRow,
  contextMenuItems,
  handleFocus,
  handleBlur,
  handleEditAction,
  handleToggleCompletion,
}) => {
  const {topics, getTopicById} = useMiterContext();
  const [currentItem, setCurrentItem] = useState({...item});
  const navigate = useNavigate();

  /*
   * Prop-based changes to the summary item should precedence over state-based ones.
   */
  useEffect(() => {
    setCurrentItem({...item});
  }, [item]);

  const handleChangeTopic = useCallback(
    (newTopicId: string | null) => {
      if (currentItem.topicId !== newTopicId) {
        setCurrentItem(prevItem => ({...prevItem, topicId: newTopicId}));
      }
    },
    [currentItem.topicId]
  );

  const handleMeetingDrilldown = useCallback(
    (tokenValue: string | undefined) => {
      if (tokenValue) navigate(`/m/${tokenValue}`);
    },
    [navigate]
  );

  const type = item.itemType;

  const signifier = useMemo(() => {
    if (type === 'Task') {
      return <Checkbox checked={currentItem.taskProgress === 'Completed'} onChange={handleToggleCompletion} />;
    } else if (item.protocolId) {
      return IconMap.Protocol;
    } else {
      return type ? IconMap[type] : null;
    }
  }, [type, item.protocolId, currentItem.taskProgress, handleToggleCompletion]);

  const meetingContext = useMemo(() => {
    if (context) {
      // Rendering outside the context of a meeting, so it's been provided in a prop
      if (context.meeting) {
        // Summary item is attached to a meeting
        const {meeting, topic} = context;
        return (
          <span>
            <a onClick={() => handleMeetingDrilldown(meeting.tokenValue)}>{meeting.title}</a>
            {topic ? `: ${topic.text}` : ''}
          </span>
        );
      } else {
        // Summary item is not attached to a meeting
        return <span className="NoTopics">Personal Task</span>;
      }
    }

    if (topics?.length) {
      return (
        <SimpleTopicPicker
          topics={topics}
          selectedTopic={getTopicById(currentItem.topicId || null)}
          onSelect={handleChangeTopic}
        />
      );
    }

    return <span className="NoTopics">No Topics</span>;
  }, [currentItem.topicId, getTopicById, handleChangeTopic, handleMeetingDrilldown, context, topics]);

  // Animation config: Animate opacity in all cases, height in some.
  const animInitial: Record<string, any> = {opacity: 0};
  const animAnimate: Record<string, any> = {
    opacity: 1,
    transition: {duration: 0.4},
  };
  if (animateIn) {
    animInitial.height = 0;
    animAnimate.height = 'auto';
  }

  return (
    <motion.div initial={animInitial} animate={animAnimate}>
      <ContextMenu menuItems={contextMenuItems} hidden={isEditing}>
        <div
          onFocus={handleFocus}
          onBlur={handleBlur}
          onDoubleClick={handleEditAction}
          className={classNames('SummaryItem', {
            Completed: currentItem.itemType === 'Task' && currentItem.taskProgress === 'Completed',
          })}
        >
          {signifier}
          <div className="ItemCore">
            <div className="TopRow">
              <div className="MeetingContext">{meetingContext}</div>
              {topRow}
            </div>
            <div className="BottomRow">{children}</div>
          </div>
        </div>
      </ContextMenu>
    </motion.div>
  );
};

export default BaseSummaryItemView;
