// Vendor
import cn from 'classnames';
import {FC} from 'react';

// Styles
import './StepBar.less';

interface StepProps {
  phase: string;
  currentPhase: number;
  index: number;
}

const Step: FC<StepProps> = ({phase, currentPhase, index}) => {
  const isActive = index === currentPhase;

  return (
    <>
      {index !== 0 && <span className="HorizontalBar InBetween" />}
      <span className={cn('Step', {Expanded: isActive})}>
        {index + 1}
        <span
          className="StepTitle"
          style={{
            maxWidth: isActive ? `${phase.length + 1}ch` : '0',
          }}
        >
          . {phase}
        </span>
      </span>
    </>
  );
};

interface StepBarProps {
  className?: string;
  currentPhase?: number;
  phases: string[];
}

const StepBar: FC<StepBarProps> = ({phases, currentPhase = 0, className}) => {
  if (currentPhase >= phases.length) {
    throw new Error('Current phase is greater than the number of phases');
  }
  if (currentPhase < 0) {
    throw new Error('Current phase is less than 0');
  }

  return (
    <div className={cn('Steps', className)}>
      <span className="HorizontalBar" />
      {phases.map((phase, index) => (
        <Step key={phase} phase={phase} index={index} currentPhase={currentPhase} />
      ))}
      <span className="HorizontalBar" />
    </div>
  );
};

export default StepBar;
