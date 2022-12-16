// Vendor
import React, {useMemo} from 'react';
import {motion} from 'framer-motion';

// API
import {useMiterContext} from 'model/MiterContextProvider';

// Utils
import {getAnimValues} from '../../NoteView.utils';

// Types
import {NoteViewProps} from '../../NoteView.types';
import Button, {ButtonSize, ButtonType} from 'basic-components/Button';
import {AddIcon} from 'image';

// Styles
import './SystemNoteView.less';
import TopicShape from 'core-components/TopicShape';
import {useProtocolContext} from 'model/ProtocolContextProvider';

const SystemNoteView: React.FC<NoteViewProps> = props => {
  const {getTopicById, meeting, currentUser} = useMiterContext();
  const {animInitial, animAnimate} = useMemo(() => getAnimValues(props.animateIn), [props.animateIn]);
  const topic = getTopicById(props.note.topicId || null);
  const {setShowProtocolPickerModal} = useProtocolContext();
  const content = useMemo(
    () => (
      <div className="TopicChange">
        <div className="CurrentTopic">
          <TopicShape topic={topic} />
          <span className="TopicText">{topic?.text || 'None'}</span>
        </div>
        <Button
          onClick={() => setShowProtocolPickerModal(true)}
          disabled={!currentUser || Boolean(meeting?.currentProtocolId)}
          size={ButtonSize.small}
          type={ButtonType.borderless}
          icon={<AddIcon className="ProtocolIcon" />}
        >
          Add Dynamic
        </Button>
      </div>
    ),
    [topic, setShowProtocolPickerModal, meeting, currentUser]
  );
  return (
    <motion.div className="SystemNote" initial={animInitial} animate={animAnimate}>
      {content}
    </motion.div>
  );
};

export default SystemNoteView;
