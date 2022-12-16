import DashboardPage from '../page-objects/Dashboard.page';
import WelcomePage from '../page-objects/Welcome.page';
import InstantMeetingForm from '../page-objects/InstantMeetingForm';
import MeetingView from '../page-objects/MeetingView';
import ProtocolPicker from '../page-objects/ProtocolPicker';
import ProtocolDrawer from '../page-objects/ProtocolDrawer';

const TestMeetingName = `Protocols ${new Date().toISOString()}`;
const TestProtocolTitle = 'What should we focus on in Q3?';

const ProtocolTypes = [
  {
    title: 'Ask Everyone',
    description: 'Collect feedback from everyone individually. Maximize unique perspectives.',
  },
  {
    title: 'Prioritize',
    description: 'As a team, collect and rank a set of options so you can move forward with just a few.',
  },
];

describe('Protocols', () => {
  before(async () => {
    // Sign in.
    await DashboardPage.open();
    await DashboardPage.openSignInModalFromSidebar();
    await WelcomePage.focus();
    await WelcomePage.signIn();

    // Create and start the meeting.
    await InstantMeetingForm.createMeeting(TestMeetingName);
    await MeetingView.startMeetingBtn.waitForDisplayed();
    await MeetingView.startMeetingBtn.click();
  });

  it('should show the "Protocols" button when the meeting is started', async () => {
    await MeetingView.protocolsBtn.waitForDisplayed();
    expect(MeetingView.protocolsBtn).toBeDisplayed();
  });

  it('should open the protocol picker modal when the "Protocols" button is clicked', async () => {
    await MeetingView.protocolsBtn.click();
    await ProtocolPicker.modal.waitForDisplayed();

    expect(ProtocolPicker.title).toBeDisplayed();
    expect(ProtocolPicker.description).toBeDisplayed();
  });

  it('should list each protocol type in the picker modal', async () => {
    const actualProtocolTypes = await ProtocolPicker.getProtocolTypesData();

    for (let expectedType of ProtocolTypes) {
      const matchingType = actualProtocolTypes.find(
        ({title, description}) => title === expectedType.title && description === expectedType.description
      );
      expect(matchingType).toExist();
    }
  });

  it('should take you to the protocol setup page when selecting a protocol type in the picker', async () => {
    await ProtocolPicker.selectProtocolType('Ask Everyone');
    await ProtocolPicker.protocolSetupScreen.waitForDisplayed();

    expect(ProtocolPicker.protocolTitleInput).toBeDisplayed();
    expect(ProtocolPicker.addProtocolBtn).toBeDisplayed();
  });

  it('should create and open the protocol when the "Add" button in the protocol picker is clicked', async () => {
    await ProtocolPicker.protocolTitleInput.waitForDisplayed();
    await ProtocolPicker.protocolTitleInput.setValue(TestProtocolTitle);
    await ProtocolPicker.addProtocolBtn.click();

    // Should show the protocol drawer.
    expect(ProtocolDrawer.titleBar).toBeDisplayed();
  });
});
