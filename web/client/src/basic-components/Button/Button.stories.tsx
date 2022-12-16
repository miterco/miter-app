import {ComponentStory, ComponentMeta} from '@storybook/react';
import {Card} from 'antd';
import {ArrowLeftIcon} from 'image';
import Button from './Button';
import {ButtonType} from './Button.types';

export default {
  title: 'Button',
  component: Button,
  args: {children: 'Button'},
} as ComponentMeta<typeof Button>;

const Story: ComponentStory<typeof Button> = args => (
  <Card>
    <Button {...args} />
  </Card>
);

export const NoProps = Story.bind({});
NoProps.args = {
  children: 'Button',
};

export const Primary = Story.bind({});

Primary.args = {
  children: 'Button',
  type: ButtonType.primary,
};

export const Default = Story.bind({});

Default.args = {
  children: 'Button',
  type: ButtonType.default,
  icon: <ArrowLeftIcon />,
};

export const Borderless = Story.bind({});

Borderless.args = {
  children: 'Button',
  type: ButtonType.borderless,
};

export const Placeholder = Story.bind({});

Placeholder.args = {
  children: 'Button',
  type: ButtonType.placeholder,
};
