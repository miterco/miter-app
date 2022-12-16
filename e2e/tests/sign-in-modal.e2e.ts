import DashboardPage from '../page-objects/Dashboard.page';
import WelcomePage from '../page-objects/Welcome.page';

describe('The welcome modal', () => {
  it('should open when clicking the Sign In button in the sidebar', async () => {
    await DashboardPage.open();
    await DashboardPage.openSignInModalFromSidebar();
    await expect(DashboardPage.WelcomePageIframe).toBeDisplayed();
  });

  it('should open when clicking the Sign In button in the app header', async () => {
    await DashboardPage.open();
    await DashboardPage.openSignInModalFromAppHeader();
    await expect(DashboardPage.WelcomePageIframe).toBeDisplayed();
  });

  it('should open when clicking the Sign In button in the app header', async () => {
    await DashboardPage.open();
    await DashboardPage.openSignInModalFromTaskList();
    await expect(DashboardPage.WelcomePageIframe).toBeDisplayed();
  });

  it('should close when pressing the close button in the modal', async () => {
    await DashboardPage.open();
    await DashboardPage.openSignInModalFromSidebar();

    await DashboardPage.WelcomePageIframe.waitForExist();
    await WelcomePage.focus();
    await WelcomePage.closeModal();
    await WelcomePage.blur();

    await expect(DashboardPage.WelcomePageIframe).not.toExist();
  });

  it('should allow you to sign in with Google when pressing the sign in button', async () => {
    await DashboardPage.open();
    await DashboardPage.openSignInModalFromSidebar();
    await WelcomePage.focus();
    await WelcomePage.signIn();

    await expect(DashboardPage.WelcomePageIframe).not.toExist();
  });
});
