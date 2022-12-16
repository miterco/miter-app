// Vendor
import {Dropdown, Menu} from 'antd';
import {ElementType, PropsWithChildren, useMemo, useState} from 'react';
import classNames from 'classnames';

// Components
import {
  ProtocolCardView,
  ProtocolCardPreview,
  ProtocolCardInput,
  ProtocolCardVote,
  ProtocolCardVoteSummary,
} from './modes';

// Types
import {ProtocolCardMode} from './ProtocolCard.types';
import {ContextMenuItem} from 'basic-components/ContextMenu';

// Styles
import './ProtocolCard.less';
import {ProtocolCardInputProps} from './modes/ProtocolCardInput/ProtocolCardInput';
import {ProtocolCardPreviewProps} from './modes/ProtocolCardPreview/ProtocolCardPreview';
import {ProtocolCardViewProps} from './modes/ProtocolCardView/ProtocolCardView';
import {ProtocolCardVoteProps} from './modes/ProtocolCardVote/ProtocolCardVote';
import {ProtocolCardVoteSummaryProps} from './modes/ProtocolCardVoteSummary/ProtocolCardVoteSummary';
import {motion} from 'framer-motion';

const ProtocolCardByMode: Record<ProtocolCardMode, ElementType> = {
  [ProtocolCardMode.View]: ProtocolCardView,
  [ProtocolCardMode.Preview]: ProtocolCardPreview,
  [ProtocolCardMode.Input]: ProtocolCardInput,
  [ProtocolCardMode.Vote]: ProtocolCardVote,
  [ProtocolCardMode.VoteSummary]: ProtocolCardVoteSummary,
};

interface ProtocolCardProps {
  mode: ProtocolCardMode;
  contextMenuItems?: ContextMenuItem[];
  animateIn?: boolean;
  className?: string;
}

type ExtendedProtocolCardProps<T> = PropsWithChildren<ProtocolCardProps & T>;

// eslint-disable-next-line react/function-component-definition
function ProtocolCard<
  T extends
    | ProtocolCardInputProps
    | ProtocolCardPreviewProps
    | ProtocolCardViewProps
    | ProtocolCardVoteProps
    | ProtocolCardVoteSummaryProps
>({contextMenuItems = [], mode, animateIn, className, ...props}: ExtendedProtocolCardProps<T>) {
  const [isFocused, setIsFocused] = useState(false);
  const ProtocolCardComponent = ProtocolCardByMode[mode];
  const menu = (
    <Menu className="ProtocolCardDropdownMenu">
      {contextMenuItems.map(({title, key, icon: Icon, onSelect, isDisabled, isHidden}) => {
        const handleSelect = () => {
          onSelect?.();
          setIsFocused(false);
        };

        return (
          <Menu.Item disabled={isDisabled} hidden={isHidden} onClick={handleSelect} key={key} icon={Icon}>
            {title}
          </Menu.Item>
        );
      })}
    </Menu>
  );

  const [animInitial, animAnimate] = useMemo(() => {
    const initial: any = {opacity: 0};
    const animate: any = {opacity: 1, transition: {duration: 0.3}};
    if (animateIn) {
      initial.height = 0;
      animate.height = 'auto';
    }
    return [initial, animate];
  }, [animateIn]);

  return (
    <Dropdown onOpenChange={setIsFocused} disabled={contextMenuItems.length === 0} trigger={['click']} overlay={menu}>
      <motion.div
        initial={animInitial}
        animate={animAnimate}
        className={classNames(
          'ProtocolCardWrapper',
          {WithDropdown: contextMenuItems.length > 0, Focused: isFocused},
          className
        )}
      >
        <ProtocolCardComponent {...props} />
      </motion.div>
    </Dropdown>
  );
}

export default ProtocolCard;
