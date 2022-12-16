import {Popover} from 'antd';
import Button, {ButtonSize, ButtonType} from '../basic-components/Button';
import TopicList from './TopicList';
import {ReactComponent as DropdownArrow} from '../image/chevron-down.svg';
import {ReactComponent as RightArrow} from '../image/arrow-right.svg';
import './TopicBar.less';
import {useMiterContext} from '../model/MiterContextProvider';
import {useCallback, useLayoutEffect, useMemo, useRef, useState} from 'react';
import {setCurrentTopic} from '../model/TopicApi';
import {Topic} from 'miter-common/SharedTypes';
import TopicShape from './TopicShape';
import Tooltip from 'basic-components/Tooltip';

const TopicBar: React.FC<{}> = () => {
  const {topics, currentTopicIndex} = useMiterContext();
  const currentTopic = useMemo(
    () => (topics && currentTopicIndex !== null ? topics[currentTopicIndex] : null),
    [topics, currentTopicIndex]
  );
  const [showDropdown, setShowDropdown] = useState(false);
  const [popoverWidth, setPopoverWidth] = useState(200);
  const dropdownRef = useRef<HTMLButtonElement>(null);
  const textRef = useRef<HTMLSpanElement>(null);
  const [showTooltip, setShowTooltip] = useState(false);

  const handleNextClick = useCallback(() => {
    if (currentTopicIndex !== null && topics && currentTopicIndex < topics.length - 1) {
      setCurrentTopic(topics[currentTopicIndex + 1]);
    }
  }, [currentTopicIndex, topics]);

  const handleDropdownToggle = useCallback(
    visibleState => {
      if (dropdownRef.current) setPopoverWidth(dropdownRef.current.offsetWidth);
      setShowDropdown(visibleState);
    },
    [dropdownRef]
  );

  const handleTopicSelect = useCallback(
    (topic: Topic) => {
      if (topic.id !== currentTopic?.id) setCurrentTopic(topic);
      setShowDropdown(false);
    },
    [currentTopic?.id]
  );

  const dropdown = useMemo(
    () => <TopicList showCurrentTopic onTopicSelect={handleTopicSelect} showCopyPriorButton />,
    [handleTopicSelect]
  );

  const topicText = useMemo(
    (): string => (currentTopicIndex === null ? 'Loading...' : currentTopic ? currentTopic.text : 'No current topic'),
    [currentTopicIndex, currentTopic]
  );

  useLayoutEffect(() => {
    const textElement = textRef.current;
    if (!textElement) return;
    setShowTooltip(textElement.scrollWidth > textElement.clientWidth);
  }, [topicText]);

  return (
    <div className="TopicBar">
      <Tooltip forceHide={!showTooltip} content={topicText}>
        <Popover
          content={dropdown}
          trigger="click"
          onVisibleChange={handleDropdownToggle}
          visible={showDropdown}
          placement="bottomLeft"
          overlayStyle={{width: popoverWidth, marginTop: -8, padding: 0}}
          overlayClassName="TopicsOverlay"
        >
          <Button
            className={`TopicDropdown${currentTopic ? '' : ' NoVal'}`}
            preserveIcons
            size={ButtonSize.large}
            type={ButtonType.borderless}
            ref={dropdownRef}
          >
            <TopicShape topic={currentTopic || null} />
            <span ref={textRef} className="Text">
              {topicText}
            </span>
            <DropdownArrow className="Arrow" />
          </Button>
        </Popover>
      </Tooltip>
      <Button
        className="NextBtn"
        onClick={handleNextClick}
        disabled={currentTopicIndex === null || !topics || currentTopicIndex >= topics.length - 1}
        type={ButtonType.borderless}
        size={ButtonSize.large}
      >
        Topic
        <RightArrow />
      </Button>
    </div>
  );
};

export default TopicBar;
