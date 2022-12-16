class InstantMeetingForm {
  // =================================================================================================================
  //                                                    SELECTORS
  // =================================================================================================================
  public get meetingNameInput() {
    return $('#create > input');
  }

  public get createMeetingBtn() {
    return $('#create > button');
  }

  // =================================================================================================================
  //                                                      ACTIONS
  // =================================================================================================================
  public async createMeeting(meetingName: string): Promise<void> {
    await this.meetingNameInput.waitForDisplayed();
    await this.meetingNameInput.setValue(meetingName);
    await this.createMeetingBtn.click();
  }
}

export default new InstantMeetingForm();
