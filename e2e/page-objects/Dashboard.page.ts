import Page from './page';

class DashboardPage extends Page {
  // =================================================================================================================
  //                                                    SELECTORS
  // =================================================================================================================
  public get signInBtnInAppHeader() {
    return $('.SignInCard > button');
  }

  public get signInBtnInTaskList() {
    return $('.TaskSection .SignInCard > button');
  }

  public get signInBtnInSidebar() {
    return $('.SignInCard .Btn');
  }

  public get WelcomePageIframe() {
    return $('#sign_in_iframe');
  }

  public get meetingTitles() {
    return $$('.MeetingListItem').map(meetingListItem => meetingListItem.$('h4').getText());
  }

  // =================================================================================================================
  //                                                      ACTIONS
  // =================================================================================================================
  public async openSignInModalFromSidebar(): Promise<void> {
    await this.signInBtnInSidebar.waitForDisplayed();
    await this.signInBtnInSidebar.click();
  }

  public async openSignInModalFromAppHeader(): Promise<void> {
    await this.signInBtnInAppHeader.waitForDisplayed();
    await this.signInBtnInAppHeader.click();
  }

  public async openSignInModalFromTaskList(): Promise<void> {
    await this.signInBtnInTaskList.waitForDisplayed();
    await this.signInBtnInTaskList.click();
  }

  // =================================================================================================================
  //                                                      GENERAL
  // =================================================================================================================
  public open(): Promise<string> {
    return super.open('app');
  }
}

export default new DashboardPage();
