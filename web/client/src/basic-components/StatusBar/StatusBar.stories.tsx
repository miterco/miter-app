// Components
import StatusBar from './StatusBar';
import Drawer, {DrawerFooter, DrawerState} from 'basic-components/Drawer';

// Types
import {StatusBarVariant} from './StatusBar.types';

export default {
  title: 'StatusBar',
  component: props => (
    <>
      <Drawer
        state={DrawerState.Expanded}
        footer={
          <>
            <StatusBar {...props} />
            <DrawerFooter primaryAction={{label: 'Action', onClick: () => {}}} />
          </>
        }
      ></Drawer>
    </>
  ),
  argTypes: {
    children: 'text',
    variant: {
      control: {
        type: 'select',
        options: Object.values(StatusBarVariant),
      },
    },
  },
};

export const Default = {
  args: {
    children: 'Example status bar',
    shouldShow: true,
    variant: StatusBarVariant.Primary,
  },
};
