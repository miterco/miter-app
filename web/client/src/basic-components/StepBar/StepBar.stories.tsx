import {ComponentStory, ComponentMeta} from '@storybook/react';
import {Card} from 'antd';
import StepBar from './StepBar';

export default {
  title: 'StepBar',
  argTypes: {
    phases: {
      control: {
        type: 'array',
        options: {
          items: {
            type: 'string',
          },
        },
      },
    },
    currentPhase: {
      control: {
        type: 'number',
        min: 0,
        max: 2,
      },
    },
  },
  component: StepBar,
} as ComponentMeta<typeof StepBar>;

const Story: ComponentStory<typeof StepBar> = args => (
  <Card type="inner">
    <StepBar {...args} />
  </Card>
);

export const Default = Story.bind({});
Default.args = {
  phases: ['Phase 1', 'Phase 2', 'Phase 3'],
};
