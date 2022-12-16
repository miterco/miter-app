// Vendor
import {FC, useCallback, useMemo} from 'react';
import cn from 'classnames';

// Components
import Drawer from 'basic-components/Drawer';
import {ProtocolsIcon} from 'image';
import ContentListPhaseView from '../ProtocolPhaseView/ContentListPhaseView/ContentListPhaseView';
import SingleResponsePhaseView from '../ProtocolPhaseView/SingleResponsePhaseView/SingleResponsePhaseView';
import MultipleResponsesPhaseView from '../ProtocolPhaseView/MultipleResponsesPhaseView/MultipleResponsesPhaseView';
import VoteOnContentListPhaseView from '../ProtocolPhaseView/VoteOnContentListPhaseView/VoteOnContentListPhaseView';
import ReviewVoteResultsPhaseView from '../ProtocolPhaseView/ReviewVoteResultsPhaseView/ReviewVoteResultsPhaseView';
import SoloMultipleResponsesPhaseView from '../ProtocolPhaseView/SoloMultipleResponsesPhaseView/SoloMultipleResponsesPhaseView';
import UserContentListPhaseView from '../ProtocolPhaseView/UserContentListPhaseView/UserContentListPhaseView';
import OrganizeContentListPhaseView from '../ProtocolPhaseView/OrganizeContentListPhaseView/OrganizeContentListPhaseView';

// Types
import {DrawerState} from 'basic-components/Drawer/Drawer.types';
import {ProtocolPhaseType} from 'miter-common/SharedTypes';

// Providers
import {useProtocolContext} from 'model/ProtocolContextProvider';

// Styles
import './ProtocolDrawer.less';
import {moveToNextProtocolPhase} from 'model/ProtocolApi';
import StepBar from 'basic-components/StepBar';

// ---------------------------------------------------------------------------------------------------------------------
//                                 MAP OF PROTOCOL PHASE TYPES TO PHASE VIEW COMPONENTS
// ---------------------------------------------------------------------------------------------------------------------
const ProtocolPhaseViewMap: Record<ProtocolPhaseType | 'Unknown', any> = {
  SingleResponse: SingleResponsePhaseView,
  MultipleResponses: MultipleResponsesPhaseView,
  SoloMultipleResponses: SoloMultipleResponsesPhaseView,
  ContentList: ContentListPhaseView,
  UserContentList: UserContentListPhaseView,
  VoteOnContentList: VoteOnContentListPhaseView,
  ReviewVoteResults: ReviewVoteResultsPhaseView,
  OrganizeContentList: OrganizeContentListPhaseView,
  Unknown: () => null, // Render an empty component if the phase type is unknown.
};

// ---------------------------------------------------------------------------------------------------------------------
//                                            PROTOCOL DRAWER COMPONENT
// ---------------------------------------------------------------------------------------------------------------------
interface ProtocolDrawerProps {
  state: DrawerState;
}

const ProtocolDrawer: FC<ProtocolDrawerProps> = ({state}) => {
  const {setIsDrawerVisible, setIsDrawerExpanded, currentProtocol, currentProtocolType, closeProtocol} =
    useProtocolContext();

  const handleDrawerStateChange = useCallback(
    (toState: DrawerState) => {
      if (toState === DrawerState.Closed) closeProtocol();
      else {
        setIsDrawerVisible(true);
        setIsDrawerExpanded(toState === DrawerState.Expanded);
      }
    },
    [setIsDrawerExpanded, setIsDrawerVisible, closeProtocol]
  );

  const nextPhase = useMemo(() => {
    const phaseIndex = (currentProtocol?.currentPhaseIndex || 0) + 1;
    return currentProtocolType?.phases?.[phaseIndex];
  }, [currentProtocol?.currentPhaseIndex, currentProtocolType?.phases]);

  const moveToNextPhase = useCallback(() => {
    if (!nextPhase) closeProtocol();

    // Even when there is no next phase, we need to call the endpoint so that it updates the completed state.
    if (currentProtocol?.id) moveToNextProtocolPhase(currentProtocol.id);
  }, [currentProtocol, nextPhase, closeProtocol]);

  const phaseNames = useMemo(() => currentProtocolType?.phases?.map(phase => phase.name) || [], [currentProtocolType]);

  // Select the right component to render depending on the current phase.
  const phaseType: ProtocolPhaseType | 'Unknown' = currentProtocol?.currentPhase?.type || 'Unknown';
  const ProtocolPhaseView = ProtocolPhaseViewMap[phaseType];
  const protocolNameWithoutSpaces = currentProtocolType?.name.replaceAll(' ', '');

  return (
    <Drawer
      className={cn('ProtocolDrawer', protocolNameWithoutSpaces)}
      title={currentProtocolType?.name}
      icon={ProtocolsIcon}
      titleBarButtonAction={currentProtocol?.isCompleted ? 'Close' : 'MinMax'}
      state={state}
      shouldChangeState={handleDrawerStateChange}
    >
      <div className="ProtocolDrawerHeader">
        <StepBar className="Stepper" phases={phaseNames} currentPhase={currentProtocol?.currentPhaseIndex} />
        <h2 className="Title">{currentProtocol?.title}</h2>
        <div className="Subtitle">{currentProtocol?.currentPhase?.description}</div>
      </div>

      <ProtocolPhaseView nextPhase={nextPhase} moveToNextPhase={moveToNextPhase} />
    </Drawer>
  );
};

export default ProtocolDrawer;
