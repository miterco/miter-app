import useCopyPriorTopicsButton from '../hooks/copy-prior-topics-hook';

// Components.
import Card from './Card';
import TopicList from './TopicList';

// Assets and styles.
import './StartView.less';
import MeetingButtonBar from './MeetingButtonBar';

const StartView: React.FC<{}> = () => {
  return (
    <>
      <div className="StartView MeetingContent">
        <Card className="Topics" title="Topics" listCard rightToolbarItems={[useCopyPriorTopicsButton(true)]}>
          <TopicList />
        </Card>
        <MeetingButtonBar compact />
      </div>
    </>
  );
};

export default StartView;
