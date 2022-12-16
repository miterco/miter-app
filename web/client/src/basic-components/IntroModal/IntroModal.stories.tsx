// Vendor
import {ComponentMeta, ComponentStory} from '@storybook/react';
import {useArgs} from '@storybook/addons';
import {Card} from 'antd';

// Components
import IntroModal from './';
import Button, {ButtonSize} from 'basic-components/Button';

// Types
import {ProtocolName} from 'core-components/Protocols/Protocols.types.ts';

// Constants
import {ProtocolIntro} from 'core-components/Protocols/ProtocolIntroModal';

export default {
  title: 'IntroModal',
  component: IntroModal,
} as ComponentMeta<typeof IntroModal>;

const Story: ComponentStory<typeof IntroModal> = args => {
  const [{isVisible}, updateArgs] = useArgs();

  const toggleModal = () => {
    updateArgs({isVisible: !isVisible});
  };

  return (
    <>
      <Card>
        <Button onClick={toggleModal} size={ButtonSize.large}>
          Show modal
        </Button>
      </Card>
      <IntroModal {...args} isVisible={isVisible} onClose={toggleModal} />
    </>
  );
};

export const Default = Story.bind({});

const introInfo = ProtocolIntro[ProtocolName.AskEveryone];

Default.args = {
  isVisible: true,
  onClose: () => {},
  ...introInfo,
};
