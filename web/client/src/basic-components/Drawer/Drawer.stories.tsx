// Vendor
import {ComponentStory, ComponentMeta} from '@storybook/react';
import {useArgs} from '@storybook/client-api';

// Components
import Drawer from './Drawer';
import * as Icons from 'image';
import DrawerFooter from './DrawerFooter';
import ProtocolDrawerHeader from 'core-components/Protocols/ProtocolDrawer/ProtocolDrawerHeader';
import {Card} from 'antd';

// Types
import {ButtonType} from 'basic-components/Button';
import {DrawerState} from './Drawer.types';

export default {
  title: 'Drawer',
  component: Drawer,
  argTypes: {
    title: {
      control: 'text',
    },
    icon: {
      options: Object.keys(Icons),
      mapping: Icons,
    },
    footer: {
      control: {
        disable: true,
      },
    },
  },
} as ComponentMeta<typeof Drawer>;

const Story: ComponentStory<typeof Drawer> = args => {
  const [{isDrawerExpanded}, updateArgs] = useArgs();

  const handleChangestate = (toState: DrawerState) => {
    updateArgs({state: toState});
  };
  return (
    <Drawer {...args} shouldChangeState={handleChangestate}>
      <ProtocolDrawerHeader title="Example drawer title" subtitle="Example drawer subtitle" />
      <Card>Content</Card>
    </Drawer>
  );
};

export const Default = Story.bind({});

Default.args = {
  title: 'Drawer',
  state: DrawerState.Expanded,
  footer: (
    <DrawerFooter
      primaryAction={{
        label: 'Discuss',
        onClick: () => {},
        disabled: false,
        type: ButtonType.default,
      }}
      menuActions={[
        {
          label: 'Skip',
          onClick: () => {},
        },
      ]}
    />
  ),
};
