import {ElementType} from 'react';

export interface Protocol {
  title: string;
  name: string;
  description: string;
  personId?: string | null;
  promptValue?: string;
}
