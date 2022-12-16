// Vendor
import {FC} from 'react';

// Components
import {ProtocolNoteView, StandardNoteView, SystemNoteView} from './NoteViews';

// Types
import {NoteViewProps} from './NoteView.types';

// Styles
import './NoteView.less';

const NoteView: FC<NoteViewProps> = props => {
  const NoteComponent = {
    StandardNote: StandardNoteView,
    Protocol: ProtocolNoteView,
    CurrentTopicSet: SystemNoteView,
  }[props.note.systemMessageType];

  if (!NoteComponent) {
    console.error(`Invalid note type: ${props.note.systemMessageType}`);
    return null;
  }

  return <NoteComponent {...props} />;
};

export default NoteView;
