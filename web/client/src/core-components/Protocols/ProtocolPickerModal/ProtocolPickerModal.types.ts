import {Protocol} from '../Protocols.types';

export interface ProtocolSecondScreen {
  label: string;
  placeholder: string;
}

export interface ProtocolWithSecondScreen extends Protocol {
  setup: ProtocolSecondScreen;
}
