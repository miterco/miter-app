import Page from './page';

class WelcomePage extends Page {
  // ===================================================================================================================
  //                                                     SELECTORS
  // ===================================================================================================================
  public get signInModal() {
    return $('.SignInDialog');
  }

  public get signInButton() {
    return $('.GoogleSignIn');
  }

  public get closeButton() {
    return $('.CloseBtn');
  }

  public get gAuthEmailField() {
    return $('input[type=email]');
  }

  public get gAuthPasswordField() {
    return $('input[type=password]');
  }

  public get gAuthEmailNextBtn() {
    return $('#identifierNext button');
  }

  public get gAuthPasswordNextBtn() {
    return $('#passwordNext button');
  }

  public get gAuthAllowAcessBtn() {
    return $('#submit_approve_access button');
  }

  // ===================================================================================================================
  //                                                      ACTIONS
  // ===================================================================================================================
  public async closeModal(): Promise<void> {
    await this.closeButton.waitForExist();
    await this.closeButton.click();
  }

  public async getOpenWindows(options: {ignoreWindows: string[]}): Promise<string[]> {
    const browserWindows = await browser.getWindowHandles();
    return browserWindows.filter(window => !options.ignoreWindows.includes(window));
  }

  public async signIn(): Promise<void> {
    await this.signInButton.waitForDisplayed();
    await this.signInButton.click();
    await browser.pause(1000);

    // Switch the focus to the new Google Auth popup.
    const parentWindow = await browser.getWindowHandle();
    const [gAuthWindow] = await this.getOpenWindows({ignoreWindows: [parentWindow]});
    browser.switchWindow(gAuthWindow);

    // Set the email and click next.
    await this.gAuthEmailField.waitForDisplayed();
    await this.gAuthEmailField.setValue(process.env.GOOGLE_EMAIL);
    await this.gAuthEmailNextBtn.click();
    await browser.pause(1000);

    // Set the password and click next.
    await this.gAuthPasswordField.waitForDisplayed();
    await this.gAuthPasswordField.setValue(process.env.GOOGLE_PASSWORD);
    await this.gAuthPasswordNextBtn.click();
    await browser.pause(1000);

    // Approve permissions.
    await this.gAuthAllowAcessBtn.waitForDisplayed();
    await this.gAuthAllowAcessBtn.click();
    await browser.pause(5000);

    const windows = await this.getOpenWindows({ignoreWindows: []});
    browser.switchWindow(windows[0]);
  }

  // =================================================================================================================
  //                                                      GENERAL
  // =================================================================================================================
  public async focus(): Promise<void> {
    const iframe = await browser.findElement('css selector', '#sign_in_iframe');
    await browser.switchToFrame(iframe);
  }

  public async blur(): Promise<void> {
    await browser.switchToParentFrame();
  }
}

export default new WelcomePage();
