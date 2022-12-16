class MeetingView {
  // =================================================================================================================
  //                                                    SELECTORS
  // =================================================================================================================
  public get container() {
    return $('.MeetingView');
  }

  public get meetingTitle() {
    return $('.Titlebar .ToggleEdit');
  }

  public get addTopicBtn() {
    return $('.TopicList .AddBtn');
  }

  public get addTopicModal() {
    return $('.AddTopicModal');
  }

  public get addTopicModalCancelBtn() {
    return this.addTopicModal.$('.ant-modal-footer button:nth-of-type(1)');
  }

  public get addTopicModalCreateBtn() {
    return this.addTopicModal.$('.ant-modal-footer button:nth-of-type(2)');
  }

  public get addTopicModalInput() {
    return this.addTopicModal.$('textarea');
  }

  public get addTopicModalCloseBtn() {
    return this.addTopicModal.$('.ant-modal-close');
  }

  public get getLinkBtn() {
    return $('.ActionBar button:nth-of-type(1)');
  }

  public get pastTimesBtn() {
    return $('.ActionBar button:nth-of-type(2)');
  }

  public get feedbackBtn() {
    return $('.ActionBar button:nth-of-type(3)');
  }

  public get newMeetingBtn() {
    return $('.ActionBar button:nth-of-type(4)');
  }

  public get startMeetingBtn() {
    return $('.StartBtn');
  }

  public get protocolsBtn() {
    return $('.ProtocolsBtn');
  }

  // =================================================================================================================
  //                                                      ACTIONS
  // =================================================================================================================
  public async addTopic(title: string) {
    await this.addTopicBtn.waitForExist();
    await this.addTopicBtn.click();

    await this.addTopicModalInput.waitForExist();
    await this.addTopicModalInput.setValue(title);
    await this.addTopicModalCreateBtn.click();
  }

  public getTopicNames(): Promise<string[]> {
    return $$('.TopicList .TopicView .ToggleEdit').map(elt => elt.getText());
  }
}

export default new MeetingView();
