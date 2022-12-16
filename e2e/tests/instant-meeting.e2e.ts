import DashboardPage from '../page-objects/Dashboard.page';
import MeetingView from '../page-objects/MeetingView';
import InstantMeetingForm from '../page-objects/InstantMeetingForm';

describe('Creating an instant meeting', () => {
  const meetingTitle = `Test meeting (${new Date().toISOString()})`;

  before(async () => {
    await DashboardPage.open();
    await InstantMeetingForm.createMeeting(meetingTitle);
  });

  it('should redirect you to the meeting room', async () => {
    browser.waitUntil(() => {
      const url = browser.getUrl();
      expect(url).toHaveTextContaining('/app/m/');
    }, 1000); // Wait a second before checking the redirection.
  });

  it('should create a new meeting meeting', async () => {
    await expect(MeetingView.container).toBeExisting();
    await expect(MeetingView.meetingTitle).toHaveTextContaining(meetingTitle);
  });
});
