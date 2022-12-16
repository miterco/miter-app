/*
 * StepView renders a single step in a sequence of steps, e.g., in a
 * multi-step onboarding process. Prior steps are shown with a checkmark
 * instead of a number.
 */
import classNames from 'classnames';
import {CheckedIcon} from 'image';
import './StepView.less';

interface StepViewProps {
  step: number;
  text: string;
  currentStep: number;
}

type StepState = 'Current' | 'Completed' | null;

const StepView: React.FC<StepViewProps> = ({step, text, currentStep}) => {
  const state: StepState = currentStep === step ? 'Current' : currentStep > step ? 'Completed' : null;

  return (
    <div className={classNames('StepView', state)}>
      <div className="Num">{state === 'Completed' ? <CheckedIcon /> : step}</div>
      <div className="Text">{text}</div>
    </div>
  );
};

export default StepView;
