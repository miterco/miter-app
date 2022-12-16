/*
 * Server-hosted bridge to connect to our Chrome extension. This file is versioned:
 * older bridge.js versions will be requested by earlier versions of the extension.
 * Since extensions should auto-update, we don't anticipate supporting more than 2-3
 * versions at a time.
 */

(() => {
  const internalConfig = {
    autoCloseTimeoutInSeconds: 10,
  };

  const EventName = {
    ShowCreatePage: 'Show Create Page',
    ShowEditPage: 'Show Edit Page',
    DismissEditPage: 'Cancel Edit Page',
    DismissCreatePage: 'Cancel Create Page',
    SaveEditPage: 'Save Edit Page',
    SaveCreatePage: 'Save Create Page',
    ShowPopupDetails: 'Show Static Popup',
    HidePopupDetails: 'Hide Static Popup',
    DismissPopupDetails: 'Dismiss Details Popup',
    ShowCreatePopup: 'Show Create Popup',
    SaveCreatePopup: 'Save Create Popup',
    CancelCreatePopup: 'Cancel Create Popup',
    CloseSidebar: 'Close Sidebar',
    DOMWarning: 'DOM Warning',
    ClickMiterButton: 'Click Open-in-Miter Button',
  };

  enum MessageType {
    Config = 'CONFIG',
    ShowModal = 'SHOW_MODAL',
    HideModal = 'HIDE_MODAL',
    Passthrough = 'PASSTHROUGH',
    Analytics = 'ANALYTICS',
    ShowSidebar = 'SHOW_SIDEBAR',
    HideSidebar = 'HIDE_SIDEBAR',
    OpenMeeting = 'OPEN_MEETING',
    StaticPopupOpened = 'STATIC_POPUP_OPENED',
    StaticPopupClosed = 'STATIC_POPUP_CLOSED',
    CreatePopupOpened = 'CREATE_POPUP_OPENED',
    CreatePopupCanceled = 'CREATE_POPUP_CANCELED',
    CreatePopupSaved = 'CREATE_POPUP_SAVED',
    CreatePageOpened = 'CREATE_PAGE_OPENED',
    CreatePageCanceled = 'CREATE_PAGE_CANCELED',
    CreatePageSaved = 'CREATE_PAGE_SAVED',
    EditPageOpened = 'EDIT_PAGE_OPENED',
    EditPageCanceled = 'EDIT_PAGE_CANCELED',
    EditPageSaved = 'EDIT_PAGE_SAVED',
    FinishLogin = 'FINISH_LOGIN',
    SidebarOpened = 'SIDEBAR_OPENED',
    SidebarClosed = 'SIDEBAR_CLOSED',
  }

  interface EventData {
    eventIdContext?: string;
  }

  const logoSvg =
    '<svg width="20" height="20" viewBox="0 0 256 256" fill="none" xmlns="http://www.w3.org/2000/svg"><path fill-rule="evenodd" clip-rule="evenodd" d="M79.7373 176.714C60.9985 174.169 42.4989 167.332 28.0868 152.92C-6.70096 118.132 -6.97599 61.922 27.473 27.473C61.922 -6.97596 118.132 -6.70094 152.92 28.0868C167.071 42.2375 173.805 60.6363 176.336 79.3591C140.641 74.5096 104.07 85.2234 93.1796 88.8138C91.135 89.5255 89.5389 91.1385 88.8482 93.1907C85.3567 104.153 74.9154 141.029 79.7373 176.714ZM176.336 79.3591C195.075 81.9045 213.575 88.7414 227.987 103.154C262.775 137.941 263.05 194.152 228.601 228.601C194.152 263.05 137.941 262.775 103.154 227.987C89.0028 213.836 82.2675 195.436 79.7373 176.714C115.432 181.564 152.004 170.85 162.894 167.26C164.938 166.548 166.535 164.935 167.225 162.883C170.717 151.92 181.158 115.045 176.336 79.3591Z" fill="#33B8C1"/></svg>';

  let config = {
    cssFilename: 'miter-cal_v5.css',
    sel: {
      TopContainer: '.tEhMVd',

      Popup: '.RDlrG',
      PopupContainer: '.yDmH0d',

      //StaticPopupHeadingInner: "#rAECCd", -- Remove after Sept 2021 if unused
      StaticPopupHeadingInner: '#xDetDlgWhen',
      // StaticPopupGoal: ".MiterStaticPopupGoal",  -- Remove after Sept 2021 if unused
      StaticPopup: '#xDetDlg', // Outermost popup element that's actually rebuilt when the popup moves around
      //StaticPopupContent: '#xDtlDlgCt',

      //StaticContainerClass: "MiterStaticGoalContainer", -- Remove after Sept 2021 if unused

      EditPopupTitleInput: 'input[aria-label="Add title"]',
      //StaticGoalContainer: "#miterGoal",  -- Remove after Sept 2021 if unused
      MiterStartButton: '#miterStartButton',
      MiterBelowTitleRow: 'MiterStartRow',

      EditPage: '.p9lUpf',
      EditPageTitleInput: 'input[aria-label="Title"]',
      EditPageTitlePlaceholder: '.bojM1c',
      EditPageTitleRow: '.UXzdrb', // title field plus things on the same line with it. We insert after it in its parent.
      EditPageSaveButton: '#xSaveBu',

      EventChip: '[data-eventchip]',
      EventIdContextAttribute: 'jslog',
    },
    content: {
      //EmptyGoal: "Not specified",
      SubjectPrompt: 'What is this meeting about?',
      StartRowHint: 'Use Miter for a goal-driven meeting with clear outcomes.',
      BelowTitleInputRowInner: '', // defined below
      //StaticPopupGoalInner: "", -- Remove after Sept 2021 if unused
      StartButton: `<button id="miterStartButton">${logoSvg}<span>Meet in Miter</span></button>`,
    },
  };

  config.content.BelowTitleInputRowInner = `${config.content.StartButton}<p class="MiterHint">${config.content.StartRowHint}</p>`;
  //config.content.StaticPopupGoalInner = `<label>Goal: </label><strong id="miterGoal"></strong>`; -- Remove after Sept 2021 if unused

  let isSidebarOpen = false;
  let sidebarShouldAutoClose = false;

  const track = (evt: string, props: Record<string, string> = {}) => {
    if (window.heap) window.heap.track(evt, props);
  };

  const log = str => {
    if (window.Debug) console.log(str);
  };

  const handleIncomingMessage = (msg: {type: MessageType; payload: Record<string, any>}) => {
    // Is it a Miter message?
    if (typeof msg === 'object' && msg.type) {
      log(msg.type);
      switch (msg.type) {
        case MessageType.Analytics: // TODO may not need this anymore
          track(msg.payload.name, msg.payload.properties);
          break;
        case MessageType.FinishLogin:
          window.location.reload();
          break;
        case MessageType.StaticPopupOpened:
          track(EventName.ShowPopupDetails);
          openMeeting(msg.payload, true);
          break;
        case MessageType.StaticPopupClosed:
          track(EventName.HidePopupDetails);
          closeMeeting();
          break;
        case MessageType.CreatePopupOpened:
          track(EventName.ShowCreatePopup);
          break;
        case MessageType.CreatePopupCanceled:
          track(EventName.CancelCreatePopup);
          break;
        case MessageType.CreatePopupSaved:
          track(EventName.SaveCreatePopup, {title: msg.payload.title, goal: msg.payload.goal});
          break;
        case MessageType.CreatePageOpened:
          track(EventName.ShowCreatePage);
          break;
        case MessageType.CreatePageCanceled:
          track(EventName.DismissCreatePage);
          break;
        case MessageType.CreatePageSaved:
          track(EventName.SaveCreatePage, {title: msg.payload.title, goal: msg.payload.goal});
          break;
        case MessageType.EditPageOpened:
          track(EventName.ShowEditPage);
          openMeeting(msg.payload, true);
          break;
        case MessageType.EditPageCanceled:
          track(EventName.DismissEditPage);
          closeMeeting();
          break;
        case MessageType.EditPageSaved:
          track(EventName.SaveEditPage, {title: msg.payload.title, goal: msg.payload.goal});
          closeMeeting();
          break;
        case MessageType.SidebarOpened:
          isSidebarOpen = true;
          break;
        case MessageType.SidebarClosed:
          track(EventName.CloseSidebar);
          isSidebarOpen = false;
          break;
        case MessageType.OpenMeeting:
          track(EventName.ClickMiterButton);
          openMeeting(msg.payload);
          break;
        default:
          log('Bridge received unknown message, type: ' + msg.type);
          break;
      }
    }
  };

  const extractPrefixedGoogleEventIdFromContext = (eventData: EventData): string | null => {
    if (eventData.eventIdContext) {
      // eventData should contain the string inside the GCal popup's `jslog` attribute, which in turn encodes the real event ID.
      // Context string is multiple semicolon-delimited items. The second one contains "2:" followed by an array, whose
      // first item is the event ID. The array doesn't seem to contain any colons.
      const googleEventId = JSON.parse(eventData.eventIdContext.split(';')[1].split(':')[1])[0];
      return `g_${googleEventId}`;
    }

    const err = 'While trying to open a meeting, Miter was unable locate any ID for it.';
    console.error(err);
    alert(`Error: ${err}`);
    return null;
  };

  const validateHttpResponse = (res: any) => {
    if (!res) throw new Error('HTTP response was empty.');
    if (typeof res.success !== 'boolean') throw new Error('Received HTTP response with non-boolean success value.');
    if (res.error && typeof res.error !== 'string')
      throw new Error(`Received HTTP response with non-falsy non-string error: ${res.error}`);
    return res;
  };

  const validateFetchMeetingTimeInfoResponse = (json: any) => {
    if (typeof json.isScheduledAroundNow !== 'boolean') {
      throw new Error(
        `Fetch meeting-time response expected a boolean isScheduledAroundNow, got ${json.isScheduledAroundNow}.`
      );
    }
    return json;
  };

  const openMeeting = async (eventData: EventData, onlyIfCurrent: boolean = false) => {
    const qualGoogleId = extractPrefixedGoogleEventIdFromContext(eventData);
    sidebarShouldAutoClose = false;

    if (qualGoogleId) {
      let shouldOpen = false;

      if (onlyIfCurrent && !isSidebarOpen) {
        try {
          const fetchResponse = await fetch(`/api/meeting-times/${qualGoogleId}`);
          const responseJson = await fetchResponse.json();
          const validResponse = validateHttpResponse(responseJson);
          if (validResponse.success) {
            // If we're here, the request came back OK. We don't report when it doesn't because often that just means
            // the user clicked on something outside their primary calendar.
            const validBody = validateFetchMeetingTimeInfoResponse(validResponse.body);
            shouldOpen = validBody.isScheduledAroundNow;
            sidebarShouldAutoClose = true;
            window.setTimeout(() => (sidebarShouldAutoClose = false), internalConfig.autoCloseTimeoutInSeconds * 1000);
          }
        } catch (err) {
          console.error(`Miter was unable to make a request to check meeting times.`);
          console.error(err);
        }
      } else {
        shouldOpen = true;
      }

      if (shouldOpen) {
        const url = `${window.location.protocol}//${window.location.host}/app/m/${qualGoogleId}`;
        log(`Opening ${url}`);
        sendMessage(MessageType.ShowSidebar, {url});
      }
    }
  };

  const closeMeeting = () => {
    if (sidebarShouldAutoClose) sendMessage(MessageType.HideSidebar);
  };

  const sendMessage = (type: MessageType, payload: Record<string, any> = {}) => {
    window.parent.postMessage({miter: true, type: type, payload: payload}, 'https://calendar.google.com');
  };

  window.onmessage = evt => {
    handleIncomingMessage(evt.data);
  };

  // Let the extension know when we're all loaded, and pass over any config
  window.addEventListener('load', () => {
    sendMessage(MessageType.Config, config);
  });

  window.miterLib.fetchLinkedServices().then((linkedServices: LinkedServicesState) => {
    // SHUTDOWN INSTRUCTIONS:
    // 1. During initial phase of shutdown, comment out the sign-in conditional+modal (if (!linkedServices.GoogleCalendar)))
    //    and uncomment the localStorage one below it. This will disable sign-in and warn users of the impending shutdown.
    // 2. During final phase of shutdown, change "viewedShutdownNoticeScreen" to "viewedSecondShutdownNoticeScreen", both
    //    here and in ShutdownNoticeScreen.tsx. This will cause users to see the notice a second time.

    /*
    if (!linkedServices.GoogleCalendar) {
      sendMessage(MessageType.ShowModal, {
        url: `${document.location.origin}/sign-in`,
        width: 680,
        height: 576,
      });
    }
    */

    if (!localStorage.getItem('viewedSecondShutdownNoticeScreen')) {
      sendMessage(MessageType.ShowModal, {
        url: `${document.location.origin}/app/shutdown-notice`,
        width: 600,
        height: 392,
      });
    }
  });
})();
