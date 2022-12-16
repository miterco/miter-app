import DashboardPage from '../page-objects/Dashboard.page';
import InstantMeetingForm from '../page-objects/InstantMeetingForm';
import MeetingView from '../page-objects/MeetingView';

describe('The action bar in the meeting view', () => {
  before(async () => {
    await DashboardPage.open();
    await InstantMeetingForm.createMeeting('Action Bar Test');
  });

  it('should copy the current URL to the clipboard when pressing the Get Link button', async () => {
    await MeetingView.getLinkBtn.waitForDisplayed();
    await MeetingView.getLinkBtn.click();

    const clipboardContent = await DashboardPage.getClipboard();
    const url = await browser.getUrl();

    expect(clipboardContent).toEqual(url);
  });
});
