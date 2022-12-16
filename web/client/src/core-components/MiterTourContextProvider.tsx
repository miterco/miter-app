/*
 * Walkthrough tour facility. Sort of in an awkward stage between a fully-generalized thing and a specialized one.
 * Currently a wrapper around Reactour, but if we keep it it may make sense to use a more targeted popover library
 * (or Ant or roll our own), as we diverge a bit from the whole "step through a sequential tour" thing and as a result
 * we're overriding a lot of Reactour's logic.
 */

import {StepType, TourProvider, useTour} from '@reactour/tour';
import {BtnFnProps} from '@reactour/tour/dist/types';
import {getUserPreference, setUserPreference} from 'model/UserPrefs';
import React, {Dispatch, ReactNode, useCallback, useContext, useEffect, useRef, useState} from 'react';

interface MiterTourContextValues {
  completeTourStep: (step: TourStepId | number) => void; // Complete a given step if it hasn't been completed already
  openTour: () => void;
  closeTour: () => void;
}

const AppearDelay = 1000; // Wait a moment after the app/component loads before showing the tour
const AdvanceDelay = 500; // Wait a moment after a prior action before advancing the tour

// =====================================================================================================================
//                                                 Content Definitions
// =====================================================================================================================

export type TourStepId = 'GoalField' | 'AddTopic' | 'StartBtn' | 'MarkOutcome' | 'Protocols';

/*
 * Defining our own step format here, then later converting to Reactour's. Allows us to define additional structure
 * and avoid replicating layout info.
 */
interface TourStep {
  id: TourStepId;
  title: string;
  body: string;
  containerSelector?: string;
  advanceOnClose?: number | boolean;
}

const TourSteps: TourStep[] = [
  {
    id: 'GoalField',
    containerSelector: '.MeetingPhaseNotStarted',
    title: 'Welcome',
    body: 'Welcome to Miter! Every great meeting starts with a specific, outcome-oriented goal. Click to create one.',
  },
  {
    id: 'AddTopic',
    title: 'Topics',
    advanceOnClose: true,
    body: 'If you need to discuss more than one thing in your meeting, add a topic for each.',
  },
  {
    id: 'StartBtn',
    title: 'Start Discussing',
    body: "You're prepped and ready — now press the Start button to get the conversation going and begin taking notes.",
  },
  {
    id: 'MarkOutcome',
    title: 'Real-Time Outcomes',
    body: "If there aren't outcomes, it didn't happen. Hover over a note to mark it as a decision, action item, or star--and ensure it's on the summary later.",
    advanceOnClose: 2,
  },
  {
    id: 'Protocols',
    title: 'Introducing Dynamics',
    body: "Discuss productively, with Dynamics! They're assistants for different types of structured conversation. It's like having a pro facilitator in the room with you.",
    advanceOnClose: true,
  },
];

// =====================================================================================================================
//                                                 Content Transformations
// =====================================================================================================================

const {ReactourSteps, StepMap} = (() => {
  const StepMap: Record<string, number> = {};
  const ReactourSteps: StepType[] = TourSteps.map((step, i) => {
    StepMap[step.id] = i;
    return {
      selector: `${step.containerSelector ? `${step.containerSelector} ` : ''}[data-tour="${step.id}"]`,
      content: (
        <>
          <h3>{step.title}</h3>
          <p>{step.body}</p>
        </>
      ),
    };
  });
  return {ReactourSteps, StepMap};
})();

// =====================================================================================================================
//                                                  Context Definition
// =====================================================================================================================

const MiterTourContext = React.createContext<MiterTourContextValues | null>(null);
MiterTourContext.displayName = 'Miter Tour Context';

export const useMiterTour = (): MiterTourContextValues => {
  const values = useContext(MiterTourContext);
  if (!values) throw new Error('Attempted to use MiterTourContext values outside a MiterTourContext.');
  return values;
};

// =====================================================================================================================
//                                         Inner Component - Does most of the work
// =====================================================================================================================

const Inner: React.FC<{
  children: ReactNode;
  currentStep: number;
  setCurrentStep: Dispatch<React.SetStateAction<number>>;
}> = ({children, currentStep, setCurrentStep}) => {
  const openTimer = useRef<number | null>(null);
  const advanceTimer = useRef<number | null>(null);
  const {steps, setIsOpen: _setIsOpen} = useTour();
  const currentStepRef = useRef(0); // Allows access to current step without triggering a useEffect()

  useEffect(() => {
    setUserPreference('CurrentTourStep', currentStep);
    currentStepRef.current = currentStep;
  }, [currentStep]);

  const completeTourStep = useCallback(
    (step: TourStepId | number) => {
      const stepIndex = typeof step === 'number' ? step : StepMap[step];
      if (stepIndex === undefined) {
        console.error('Attempted to access an unknown tour step.');
        return;
      }

      if (currentStepRef.current <= stepIndex) {
        if (advanceTimer.current) window.clearTimeout(advanceTimer.current);
        advanceTimer.current = window.setTimeout(() => {
          setCurrentStep(stepIndex + 1);
          if (!steps[stepIndex + 1] || !document.querySelector(steps[stepIndex + 1].selector as string)) {
            _setIsOpen(false);
          }
          advanceTimer.current = null;
        }, AdvanceDelay);
      }
    },
    [_setIsOpen, setCurrentStep, steps]
  );

  const openTour = useCallback(() => {
    const shouldOpen =
      currentStepRef.current < steps.length && document.querySelector(steps[currentStepRef.current].selector as string);
    const capturedTimer = openTimer;
    if (shouldOpen && !openTimer.current) {
      capturedTimer.current = window.setTimeout(() => {
        capturedTimer.current = null;
        _setIsOpen(true);
      }, AppearDelay);
    }
  }, [_setIsOpen, steps]);

  const closeTour = useCallback(() => {
    if (openTimer.current) {
      window.clearTimeout(openTimer.current);
      openTimer.current = null;
    }
    _setIsOpen(false);
  }, [_setIsOpen]);

  return (
    <MiterTourContext.Provider value={{completeTourStep, openTour, closeTour}}>{children}</MiterTourContext.Provider>
  );
};

// =====================================================================================================================
//                                              Outer Component (Exported)
// =====================================================================================================================

const MiterTourContextProvider: React.FC = ({children}) => {
  const [currentStep, setCurrentStep] = useState(getUserPreference('CurrentTourStep'));

  const handleBeforeClose = useCallback(() => {
    const advance = TourSteps[currentStep].advanceOnClose;
    if (advance) {
      setCurrentStep(currentStep + (advance === true ? 1 : advance));
    }
  }, [currentStep]);

  const nextButton = useCallback((btnProps: BtnFnProps) => {
    const {Button, setCurrentStep, currentStep, setIsOpen, stepsLength} = btnProps;

    const clickHandler = () => {
      const isLastStep = currentStep + 1 >= stepsLength;
      const triggerPresent = isLastStep
        ? true
        : document.querySelector(ReactourSteps[currentStep + 1].selector as string);

      if (!triggerPresent) setIsOpen(false);

      // Oddly, Reactour's click handler fires even when the button is disabled.
      if (!isLastStep) setCurrentStep(currentStep + 1);
    };

    return <Button onClick={clickHandler} />;
  }, []);

  // TODO It looks like Reactour is on the verge of adding a more direct way to hide the dots
  return (
    <TourProvider
      steps={ReactourSteps}
      className="MiterTour"
      maskClassName="MiterTourMask"
      currentStep={currentStep}
      setCurrentStep={setCurrentStep}
      disableKeyboardNavigation={['left', 'right']}
      styles={{dot: base => ({...base, display: 'none'})}}
      showBadge={false}
      nextButton={nextButton}
      prevButton={({Button, setCurrentStep}) => (
        <span className="SkipBtn">
          <Button hideArrow onClick={() => setCurrentStep(Number.MAX_SAFE_INTEGER)}>
            Skip Tour
          </Button>
        </span>
      )}
      beforeClose={handleBeforeClose}
    >
      <Inner currentStep={currentStep} setCurrentStep={setCurrentStep}>
        {children}
      </Inner>
    </TourProvider>
  );
};

export default MiterTourContextProvider;
