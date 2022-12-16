// Vendor
import {useArgs} from '@storybook/client-api';
import {ComponentStory, ComponentMeta} from '@storybook/react';
import {Card} from 'antd';
import {useState} from 'react';

// Components
import Button from 'basic-components/Button';
import PickerModal, {PickerModalOption} from './';
import {ProtocolsIcon} from 'image';

export default {
  title: 'PickerModal',
  component: PickerModal,
} as ComponentMeta<typeof PickerModal>;

const Story: ComponentStory<typeof PickerModal> = args => {
  const [{isVisible}, updateArgs] = useArgs();
  const [selectedOption, setSelectedOption] = useState<PickerModalOption | null>(null);
  const [promptValue, setPromptValue] = useState<string>('');

  const toggleModal = () => {
    updateArgs({isVisible: !isVisible});
  };

  const handleSelection = ({selectedOption, promptValue}: any) => {
    setSelectedOption(selectedOption);
    setPromptValue(promptValue);
  };

  return (
    <>
      <Card style={{height: '90vh', margin: 'auto', display: 'flex', alignItems: 'center', justifyContent: 'center'}}>
        <Button onClick={toggleModal}>Open modal</Button>
        {selectedOption && (
          <div>
            {selectedOption.label} - {promptValue}
          </div>
        )}
      </Card>
      <PickerModal {...args} isVisible={isVisible} onClose={toggleModal} onSelect={handleSelection} />
    </>
  );
};

export const Default = Story.bind({});
Default.args = {
  isVisible: false,
  title: 'Select Structure',
  description: 'Structure your meeting in real time. Facilitate like an expert!',
  options: [
    {
      icon: ProtocolsIcon,
      label: 'Ask Everyone',
      description: 'Collect feedback from everyone. Avoid groupthink and maximize unique perspectives.',
      setup: {
        label: 'Prompt',
        placeholder: 'What will your team be answering?',
      },
    },
    {
      icon: ProtocolsIcon,
      label: 'Prioritize',
      description: 'As a team, collect and rank a set of options so you can move forward with just a few.',
      setup: {
        label: 'Prompt',
        placeholder: 'What will your team be prioritizing?',
      },
    },
    {
      icon: ProtocolsIcon,
      label: 'Brainstorm',
      description: 'Generate a broad set of ideas, taking advantage of the collective brainpower of your team.',
      setup: {
        label: 'Prompt',
        placeholder: 'What will your team be brainstorming?',
      },
    },
  ],
};
