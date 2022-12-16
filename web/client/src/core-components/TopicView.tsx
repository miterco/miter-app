import {Topic, Person} from 'miter-common/SharedTypes';
import TopicShape from './TopicShape';
import {ReactComponent as OverflowIcon} from '../image/overflow.svg';
import {Dropdown, Menu} from 'antd';
import Button, {ButtonType} from '../basic-components/Button';
import Avatar from '../basic-components/Avatar';
import ToggleEdit from '../basic-components/ToggleEdit';
import {createTopic, deleteTopic, editTopic} from '../model/TopicApi';
import './TopicView.less';
import {useCallback, useMemo, useState} from 'react';

export interface TopicViewProps {
  topic: Topic;
  author: Person;
  showAsCurrent?: boolean;
  onFinishEditing?: (shouldAddAnother: boolean) => void;
  index: number | null;
  isFirst?: boolean;
  isLast?: boolean;
  onMoveBy?: (topic: Topic, moveAmount: 1 | -1) => void;
  onClick?: (topic: Topic) => void;
}

const TopicView: React.FC<TopicViewProps> = allProps => {
  const {topic, onMoveBy, onFinishEditing, onClick, ...props} = allProps;
  const [isEditing, setIsEditing] = useState<boolean>(topic.id === undefined);

  const handleOverflowSelect = useCallback(
    (info: {key: string; domEvent: any}) => {
      if (topic.id) {
        // Preexisting topic -- check is mostly just for type safety
        switch (info.key) {
          case 'Edit':
            setIsEditing(true);
            break;
          case 'Delete':
            deleteTopic(topic);
            break;
        }
      }
      info.domEvent.stopPropagation();
    },
    [topic]
  );

  const handleSave = useCallback(
    (value: string) => {
      setIsEditing(false);

      const emptyContent = value.trim() === '';

      if (onFinishEditing) onFinishEditing(!emptyContent);
      if (emptyContent) return;

      if (topic.text !== value) {
        const newTopic: Topic = {...topic, text: value};
        editTopic(newTopic);
      }
    },
    [topic, onFinishEditing]
  );

  const handleCancel = useCallback(() => {
    if (onFinishEditing) onFinishEditing(false);
  }, [onFinishEditing]);

  const handleClick = useCallback(() => {
    if (onClick && !isEditing) onClick(topic);
  }, [topic, onClick, isEditing]);

  const overflowMenu = useMemo(
    () => (
      <Menu onClick={info => handleOverflowSelect(info)}>
        <Menu.Item key="Edit">Edit</Menu.Item>
        <Menu.Item key="Delete">Remove Topic</Menu.Item>
      </Menu>
    ),
    [handleOverflowSelect]
  );

  const overflowMenuButton = useMemo(
    () => (
      <Dropdown overlay={overflowMenu} trigger={['click']}>
        <Button
          className="OverflowBtn"
          type={ButtonType.borderless}
          onClick={e => e.stopPropagation()}
          icon={<OverflowIcon />}
        />
      </Dropdown>
    ),
    [overflowMenu]
  );

  return (
    <div className={`TopicView${props.showAsCurrent ? ' Current' : ''}`} onClick={handleClick}>
      <div className="Sig">
        {topic.id ? <Avatar user={props.author} size={28} /> : null}
        {props.index !== null && <div className="Num">{props.index + 1}</div>}
      </div>
      <ToggleEdit
        placeholder="Add topic"
        value={topic.text || undefined}
        shouldSave={handleSave}
        onBlur={handleSave}
        onCancel={handleCancel}
        highlightOnHover={false}
        editing={isEditing}
      />
      <div className="RCtrls">
        <TopicShape topic={topic || isEditing} />
        {overflowMenuButton}
      </div>
    </div>
  );
};

export default TopicView;
