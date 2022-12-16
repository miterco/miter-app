// Components
import VoteStatusBar from './VoteStatusBar';
import Drawer, {DrawerFooter, DrawerState} from 'basic-components/Drawer';

export default {
  title: 'StatusBar/Vote',
  component: props => (
    <>
      <Drawer
        state={DrawerState.Expanded}
        footer={
          <>
            <VoteStatusBar {...props} />
            <DrawerFooter primaryAction={{label: 'Action', onClick: () => {}}} />
          </>
        }
      ></Drawer>
    </>
  ),
};

export const Default = {
  args: {
    shouldShow: true,
    votesCount: 1,
    totalVotes: 3,
  },
};
