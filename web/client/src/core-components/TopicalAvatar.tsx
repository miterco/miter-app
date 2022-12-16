import Avatar, { AvatarProps, DefaultAvatarSize } from '../basic-components/Avatar';
import { DefaultPersonData, Topic, Person } from 'miter-common/SharedTypes';
import './TopicalAvatar.less';
import TopicShape from './TopicShape';
import Tooltip from '../basic-components/Tooltip';

const BadgeProportion = 0.67;
const BadgeOffset = 0.33;

interface TopicalAvatarProps extends Omit<AvatarProps, 'overlap' | 'user' | 'tooltip'> {
  person: Person;
  topic?: Topic | null;
}

const TopicalAvatar: React.FC<TopicalAvatarProps> = ({ person, topic, ...otherProps }) => {

  const tooltip = (
    <table className="TabularTooltip">
      <tbody>
        <tr>
          <th>Author:</th>
          <td>{person.displayName || DefaultPersonData.displayName}</td>
        </tr>
        {topic ?
          <tr>
            <th>Topic:</th>
            <td>{topic.text}</td>
          </tr>
          : null}
      </tbody>
    </table>
  );

  const badgeSize = (otherProps.size || DefaultAvatarSize) * BadgeProportion;
  const badgeOffset = -badgeSize * BadgeOffset;
  const badgeStyle = { width: badgeSize, height: badgeSize, right: badgeOffset, bottom: badgeOffset };
  const badge = topic ? <TopicShape topic={topic} style={badgeStyle} /> : null;

  return (
    <Tooltip placement="right" content={tooltip}>
      <div className="TopicalAvatar">
        <Avatar user={person} tooltip={null} {...otherProps} />
        {badge}
      </div>
    </Tooltip>
  );
};

export default TopicalAvatar;