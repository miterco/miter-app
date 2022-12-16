// Vendor
import {ComponentMeta, ComponentStory} from '@storybook/react';
import {useArgs} from '@storybook/addons';

// Components
import Checkbox from './';
import {Card} from 'antd';

export default {
  title: 'Checkbox',
  component: Checkbox,
  argTypes: {
    isVisible: {
      control: 'boolean',
    },
  },
} as ComponentMeta<typeof Checkbox>;

const Story: ComponentStory<typeof Checkbox> = args => {
  const [{checked}, updateArgs] = useArgs();

  return (
    <Card>
      <Checkbox {...args} checked={checked} onChange={() => updateArgs({checked: !checked})} />
    </Card>
  );
};

export const Default = Story.bind({});

Default.args = {
  checked: true,
};
