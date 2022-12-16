import {ReactNode} from 'react';
import './IntroSteps.less';

export const IntroStepStrings: Record<string, ReactNode> = {
  SelectFromMeetingList: 'Select or create a meeting at left',
  OpenFromGCal: (
    <>
      Select a calendar event, then click <strong>Open in Miter.</strong>
    </>
  ),
  AddGoal: (
    <>
      Add a goal. <span>(Forget big agendas!)</span>
    </>
  ),
  AddGoalAndTopics: (
    <>
      Add a goal and topics. <span>(Forget big agendas!)</span>
    </>
  ),
  TakeNotes: 'Take notes, together.',
  CollectOutcomes: 'Collect outcomes in real time.',
  NotesAndOutcomes: 'Takes notes together. Collect outcomes in real time.',
  ReceiveSummary: 'Receive the automatic summary.',
  TaskList: 'Track action items via this list!',
};

interface IntroStepsProps {
  stepContent: ReactNode[];
}

const IntroSteps: React.FC<IntroStepsProps> = ({stepContent}) => {
  if (!stepContent.length) return <p className="Error">IntroSteps has no steps to display.</p>;

  return (
    <div className="IntroSteps">
      {stepContent.map((contentItem, i) => (
        <div key={i}>
          <div className="Num">{i + 1}</div>
          <div>{contentItem}</div>
        </div>
      ))}
    </div>
  );
};

export default IntroSteps;
