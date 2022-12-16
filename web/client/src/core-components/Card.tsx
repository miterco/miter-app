import classNames from 'classnames';
import {Children, ReactNode, useMemo} from 'react';
import './Card.less';

interface CardProps {
  children?: any; // Expects one child
  className?: string;
  emptyString?: string;
  listCard?: boolean;

  customHeader?: JSX.Element; // If present, properties below are ignored.

  title?: ReactNode;
  centerTitle?: boolean;
  rightToolbarItems?: Array<JSX.Element>;
  leftToolbarItems?: Array<JSX.Element>;
}

const Card = (props: CardProps) => {
  const header = useMemo(() => {
    if (props.customHeader) return <header className="Custom">{props.customHeader}</header>;
    if (props.title) {
      return (
        <header>
          {props.leftToolbarItems ? <div className="Toolbar LeftTb">{props.leftToolbarItems}</div> : null}
          <h3>{props.title}</h3>
          {props.rightToolbarItems ? <div className="Toolbar">{props.rightToolbarItems}</div> : null}
        </header>
      );
    }

    return null;
  }, [props.title, props.leftToolbarItems, props.rightToolbarItems, props.customHeader]);

  const isListCard = props.listCard !== undefined ? props.listCard : false;

  const content = useMemo(() => {
    // TODO It's possible this should just throw, but this allows a gentler update path for us.
    if (Children.count(props.children) > 1) console.warn(`Cards expect one child, but card ${props.title} got more.`);

    return props.children || <div className="Empty">{props.emptyString || 'Nothing to see here.'}</div>;
  }, [props.children, props.emptyString, props.title]);

  return (
    <div className={classNames('Card', {ListCard: isListCard}, props.className, {CenterTitle: props.centerTitle})}>
      {header}
      {content}
    </div>
  );
};

export default Card;
