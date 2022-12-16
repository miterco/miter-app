import {TextEntity} from '../ClientTypes';
import Avatar from './Avatar';
import './TextFragment.less';

const TextFragment = ({text, type, mutable, person}: TextEntity) => (
  <span className={`${type}Fragment`} contentEditable={mutable}>
    {type === 'Mention' && <Avatar user={person} />}
    {text}
  </span>
);

export default TextFragment;
