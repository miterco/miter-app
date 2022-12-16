import {Dropdown, Menu} from 'antd';
import {Topic} from 'miter-common/SharedTypes';
import {useMemo} from 'react';
import Button, {ButtonType} from '../basic-components/Button';
import './SimpleTopicPicker.less';

interface SimpleTopicPickerProps {
  topics: Topic[];
  onSelect: (topicId: string) => void;
  selectedTopic: Topic | null;
}

const SimpleTopicPicker: React.FC<SimpleTopicPickerProps> = ({topics, onSelect, selectedTopic}) => {
  const menu = useMemo(
    () => (
      <Menu onClick={info => onSelect(info.key)}>
        {topics.map(topic => (
          <Menu.Item key={topic.id}>{topic.text}</Menu.Item>
        ))}
      </Menu>
    ),
    [topics, onSelect]
  );

  return (
    <Dropdown className="SimpleTopicPicker" overlayClassName="SimpleTopicOverlay" overlay={menu} trigger={['click']}>
      <Button type={ButtonType.borderless} dropdownArrow>
        {selectedTopic?.text || 'No Topic'}
      </Button>
    </Dropdown>
  );
};

export default SimpleTopicPicker;
