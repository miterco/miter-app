import {ComponentStory, ComponentMeta} from '@storybook/react';
import Card from 'core-components/Card';
import InviteColleagues from './InviteColleagues';

export default {
  title: 'Invite Colleagues',
  component: InviteColleagues,
  args: {
    people: [
      {email: 'joe.smith@gmail.com', displayName: 'Joe Smith', id: 'ad64c4a5-1a59-421a-8b8c-c8df7e968ce6'},
      {email: 'arlo.joleen@gmail.com', displayName: 'Arlo Joleen', id: '32f51823-3e59-45ac-9942-f61bdbd8b296'},
      {
        email: 'katarina.zartosht@gmail.com',
        displayName: 'Katarina Zartosht',
        id: '40ebd232-8519-4a0a-86aa-b5e40a688b4a',
      },
      {email: 'romay.darrel@gmail.com', displayName: 'Romey Darrel', id: 'c6e49350-b419-4add-a47c-b8ae82bfaaa1'},
      {email: 'malakai.klotild@gmail.com', displayName: 'Malakai Klotild', id: '60ff3f50-eddf-47c6-8963-ea45d4802a26'},
      {email: 'jannah.theo@gmail.com', displayName: 'Jannah Theo', id: '6b1f815a-e35f-4bd3-a7b5-ff85dbdc5054'},
    ],
  },
} as ComponentMeta<typeof InviteColleagues>;

const Story: ComponentStory<typeof InviteColleagues> = args => (
  <Card>
    <InviteColleagues {...args} />
  </Card>
);

export const Default = Story.bind({});
Default.args = {};
