import {getGoalString, isValidDate} from 'miter-common/CommonUtil';
import {Goal, GoalType, GoalTypeMap} from 'miter-common/SharedTypes';

describe('isValidDate (CommonUtil)', () => {
  it('should return false with invalid inputs', () => {
    expect(isValidDate(null)).toBe(false);
    expect(isValidDate('')).toBe(false);
    expect(isValidDate('foo')).toBe(false);

    expect(isValidDate(new Date(''))).toBe(false);
    expect(isValidDate(new Date('I am not a date'))).toBe(false);
  });

  it('should return true with valid inputs', () => {
    expect(isValidDate(new Date(5))).toBe(true); // TODO maybe turn into false?
    expect(isValidDate(new Date())).toBe(true);
    expect(isValidDate(new Date(Date.now()))).toBe(true);
    expect(isValidDate(new Date('3/6/1977'))).toBe(true);
  });
});

describe('getGoalString', () => {
  it('should return the correct user-facing string for an enumerated goal', () => {
    const goal: Goal = {type: 'CreateCollab', customText: 'useless custom text'};
    const goalString = getGoalString(goal);
    expect(goalString).toBe(GoalTypeMap.CreateCollab.string);
  });

  it('should return the correct user-facing string for a different type of enumerated goal', () => {
    const goal: Goal = {type: 'CareerFeedback', customText: 'useless custom text'};
    const goalString = getGoalString(goal);
    expect(goalString).toBe(GoalTypeMap.CareerFeedback.string);
  });

  it('should return the custom string for an "Other" type goal', () => {
    const goal: Goal = {type: 'Other', customText: 'custom goal text'};
    const goalString = getGoalString(goal);
    expect(goalString).toBe('custom goal text');
  });

  it('should return the empty string for a custom goal without a string', () => {
    const goal: Goal = {type: 'Other'};
    const goalString = getGoalString(goal);
    expect(goalString).toBe('');
  });

  it('should return the empty string for an unrecognized goal type', () => {
    const goal: Goal = {type: 'Monkeys' as GoalType, customText: 'useless custom text'};
    const goalString = getGoalString(goal);
    expect(goalString).toBe('');
  });

  it('should return the correct user-facing string for a legacy goal', () => {
    const goal: Goal = '[[CreateCollab]]' as any as Goal;
    const goalString = getGoalString(goal);
    expect(goalString).toBe(GoalTypeMap.CreateCollab.string);
  });
});
