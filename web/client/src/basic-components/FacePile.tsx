import './FacePile.less';
import Avatar from './Avatar';
import {DefaultPersonData, Person} from 'miter-common/SharedTypes';
import {useMemo} from 'react';

interface FacePileProps {
  people: Person[];
  height?: number;
  maxNumber?: number;
}

const FacePile: React.FC<FacePileProps> = props => {
  const size = useMemo(() => props.height || 32, [props.height]);

  const [individuals, grouped] = useMemo(() => {
    const max = props.maxNumber || 5;
    const sortedPeople = [...props.people];
    sortedPeople.sort((first, second) => {
      if (first.userId && second.userId) return second.userId > first.userId ? 1 : -1;
      else if (first.userId) return -1;
      return 1;
    });

    const _individuals = sortedPeople.length > max ? sortedPeople.slice(0, max - 1) : sortedPeople;
    const _grouped = sortedPeople.length > max ? sortedPeople.slice(max - 1) : null;

    return [_individuals, _grouped];
  }, [props.people, props.maxNumber]);

  const avatars = useMemo(
    () => individuals.map((user, i) => <Avatar key={i} user={user} size={size} overlap />),
    [individuals, size]
  );

  const overflow = useMemo(() => {
    const tooltip = grouped?.map((user, i) => <div key={i}>{user.displayName || DefaultPersonData.displayName}</div>);
    return grouped ? (
      <Avatar className="FPOverflow" text={`+${grouped.length}`} tooltip={<>{tooltip}</>} size={size} overlap />
    ) : (
      <></>
    );
  }, [grouped, size]);

  return (
    <div className="FacePile">
      {avatars}
      {overflow}
    </div>
  );
};

export default FacePile;
