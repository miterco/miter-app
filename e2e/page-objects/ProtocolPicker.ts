interface ProtocolTypeData {
  title: string;
  description: string;
}

class ProtocolPicker {
  // =================================================================================================================
  //                                                    SELECTORS
  // =================================================================================================================
  public get modal() {
    return $('.PickerModal');
  }

  public get title() {
    return $('.PickerModalHeader .Title');
  }

  public get description() {
    return $('.PickerModalHeader .Description');
  }

  public get protocolTypeOptions() {
    return $$('.PickerOptionList .Option');
  }

  public get protocolSetupScreen() {
    return $('.PickerPromptScreen');
  }

  public get protocolTitleInput() {
    return $('.PickerPromptScreen textarea');
  }

  public get addProtocolBtn() {
    return $('.PickerPromptScreen .ConfirmBtn');
  }

  // =================================================================================================================
  //                                                      ACTIONS
  // =================================================================================================================
  public async selectProtocolType(protocolTypeName: string) {
    const options = await this.protocolTypeOptions;

    for (let option of options) {
      await option.waitForDisplayed();

      const titleElt = await option.$('.Title');
      const title = await titleElt.getText();

      if (title === protocolTypeName) {
        option.click();
        break;
      }
    }
  }

  public async getProtocolTypesData(): Promise<ProtocolTypeData[]> {
    const protocolTypesData = [];

    for (let option of await this.protocolTypeOptions) {
      await option.waitForDisplayed();

      protocolTypesData.push({
        title: await option.$('.Title').getText(),
        description: await option.$('.Description').getText(),
      });
    }

    return protocolTypesData;
  }
}

export default new ProtocolPicker();
