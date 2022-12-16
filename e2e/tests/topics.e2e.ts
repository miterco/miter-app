import DashboardPage from '../page-objects/Dashboard.page';
import MeetingView from '../page-objects/MeetingView';
import InstantMeetingForm from '../page-objects/InstantMeetingForm';

describe('Add Topic Modal', () => {
  before(async () => {
    await DashboardPage.open();
    await InstantMeetingForm.createMeeting(`Test Topics (${new Date().toISOString()})`);
  });

  it('should be shown when clicking on the add topic button', async () => {
    await MeetingView.addTopicBtn.waitForExist();
    await MeetingView.addTopicBtn.click();

    expect(MeetingView.addTopicModal).toBeDisplayed();
  });

  it('should disable the "Add Topic" button if no text is entered', async () => {
    expect(MeetingView.addTopicModalCreateBtn).toBeDisabled();
  });

  it('should enable the button as soon as text is entered', async () => {
    await MeetingView.addTopicModalInput.setValue('Some topic');
    expect(MeetingView.addTopicModalCreateBtn).toBeEnabled();
  });

  it('should close the modal when clicking the cancel button', async () => {
    await MeetingView.addTopicModalCancelBtn.waitForExist();
    await MeetingView.addTopicModalCancelBtn.click();

    expect(MeetingView.addTopicModal).not.toBeDisplayed();
  });

  it('should close the modal when clicking the X button', async () => {
    // Open the modal.
    await MeetingView.addTopicBtn.waitForExist();
    await MeetingView.addTopicBtn.click();

    // Click the X button.
    await MeetingView.addTopicModalCloseBtn.waitForExist();
    await MeetingView.addTopicModalCloseBtn.click();

    expect(MeetingView.addTopicModal).not.toBeDisplayed();
  });

  it('should show create topics', async () => {
    const topics = ['Topic 1', 'Topic 2', 'Topic 3'];

    for (let topic of topics) {
      await MeetingView.addTopic(topic);
    }

    browser.waitUntil(async () => {
      const topicNames = await MeetingView.getTopicNames();
      expect(topicNames).toContain(topics[0]);
      expect(topicNames).toContain(topics[1]);
      expect(topicNames).toContain(topics[2]);
    }, 2000); // Give it a couple of seconds for the API to respond.
  });
});
