// Types
import {Note, Person} from 'miter-common/SharedTypes';

export interface NoteViewProps {
  note: Note;
  animateIn?: boolean;
  author: Person;
  didSelectFromContextMenu?: () => void;
  onShowContextMenu?: (note: Note, hider: () => void) => void;
  onHideContextMenu?: (note: Note) => void;
}
