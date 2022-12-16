// Vendor
import {ComponentStory, ComponentMeta} from '@storybook/react';
import {Card} from 'antd';

// Components
import ActivityIndicator from './';

export default {
  title: 'ActivityIndicator',
  component: ActivityIndicator,
  argTypes: {
    activeCount: {
      control: {
        type: 'range',
        min: 0,
        max: 10,
      },
    },
  },
} as ComponentMeta<typeof ActivityIndicator>;

const Story: ComponentStory<typeof ActivityIndicator> = args => (
  <Card>
    <ActivityIndicator {...args} />
  </Card>
);

export const Default = Story.bind({});
Default.args = {
  activeCount: 0,
};
