import {Dropdown, Input, Menu} from 'antd';
import React, {useCallback, useMemo, useState, KeyboardEvent, useEffect} from 'react';
import {GoalTypeInfo, GoalTypeMap, GoalTypeValues} from 'miter-common/SharedTypes';
import './GoalField.less';
import {encodeGoal, getGoalTypeString, validateAndDecodeGoal, validateGoalType} from 'miter-common/CommonUtil';
import Button, {ButtonType} from '../basic-components/Button';
import {waitATick} from '../Utils';
import classNames from 'classnames';
import {useMiterTour} from './MiterTourContextProvider';

const GoalPlaceholder = 'This meeting has no goal';

interface GoalFieldProps {
  goal: string | null;
  onChange: (goal: string | null) => void;
  useStrongNudge?: boolean;
}

const GoalMenuOptions = (() => {
  // TODO it would be great if the key here was GoalTypeGroup but after banging my
  // head against TS for an hour trying to do that in a way that doesn't cause
  // TS errors downstream I am giving up.
  const groupedActiveTypes: Record<string, GoalTypeInfo[]> = {};
  GoalTypeValues.forEach(type => {
    const info = GoalTypeMap[type];
    if (!info.isDisabled) {
      if (!groupedActiveTypes[info.group]) groupedActiveTypes[info.group] = [];
      groupedActiveTypes[info.group]?.push({...info, goalType: type});
    }
  });

  const groups = Object.keys(groupedActiveTypes);
  return groups.map((group, i) => (
    <React.Fragment key={`frag_${group}`}>
      {i > 0 ? <Menu.Divider key={`div_${group}`} /> : ''}
      {groupedActiveTypes[group].map(goalOpt => (
        <Menu.Item key={goalOpt.goalType}>{goalOpt.string}</Menu.Item>
      ))}
    </React.Fragment>
  ));
})();

const GoalField: React.FC<GoalFieldProps> = props => {
  const {onChange} = props;
  const {useStrongNudge} = props;
  const goal = useMemo(() => validateAndDecodeGoal(props.goal), [props.goal]);
  const [customText, setCustomText] = useState('');
  const [initialLoadComplete, setInitialLoadComplete] = useState(false);
  const {completeTourStep, openTour, closeTour} = useMiterTour();

  // On mount, register initial load is complete.
  useEffect(() => setInitialLoadComplete(true), []);
  useEffect(() => setCustomText(goal?.customText || ''), [goal]);

  const handleChange = useCallback(
    (updatedGoalType?: string) => {
      const type = updatedGoalType ? validateGoalType(updatedGoalType) : goal?.type;
      if ((!type && goal) || (type && !goal) || (goal && (goal.type !== type || goal.customText !== customText))) {
        onChange(type ? encodeGoal({type, customText: customText || undefined}) : null);
        openTour();
      }
    },
    [goal, customText, onChange, openTour]
  );

  const handleKeyDown = useCallback(
    (e: KeyboardEvent) => {
      if (e.key === 'Return' || e.key === 'Enter') {
        (e.target as HTMLInputElement).blur();
      }
      if (e.key === 'Escape') {
        setCustomText(goal?.customText || '');
        waitATick(() => (e.target as HTMLInputElement).blur());
      }
    },
    [goal]
  );

  // Clear goal if Command key is down.
  const handleButtonClick = useCallback(
    (event: React.MouseEvent) => {
      if (event.metaKey) onChange(null);
    },
    [onChange]
  );

  const handleDropdownVisibleChange = useCallback(
    (visible: boolean) => {
      completeTourStep('GoalField');
      visible ? closeTour() : openTour();
    },
    [closeTour, completeTourStep, openTour]
  );

  const buttonLabel = useMemo(
    () => (goal ? getGoalTypeString(goal) : <span className="PH">{GoalPlaceholder}</span>),
    [goal]
  );

  const menu = useMemo(
    () => (
      <Menu onClick={opts => handleChange(opts.key)} className="GoalMenu" data-tour="GoalMenu">
        {GoalMenuOptions}
      </Menu>
    ),
    [handleChange]
  );

  return (
    <h2 className={classNames('GoalField', {Strong: useStrongNudge}, {Other: goal?.type === 'Other'})}>
      <label>Goal:</label>
      <Dropdown overlay={menu} trigger={['click']} onOpenChange={handleDropdownVisibleChange}>
        <Button type={ButtonType.borderless} onClick={handleButtonClick} dropdownArrow data-tour="GoalField">
          {buttonLabel}
        </Button>
      </Dropdown>
      {goal?.type === 'Other' && (
        <Input
          value={customText}
          autoFocus={initialLoadComplete}
          placeholder="What do you hope to achieve?"
          onChange={e => setCustomText(e.target.value)}
          onBlur={() => handleChange()}
          onKeyDown={handleKeyDown}
        />
      )}
    </h2>
  );
};

export default GoalField;
