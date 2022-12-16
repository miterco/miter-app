import {ProtocolPhase} from 'miter-common/SharedTypes';

export interface ProtocolPhaseViewProps {
  nextPhase?: ProtocolPhase;
  moveToNextPhase: () => void;
}
