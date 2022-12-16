import {MeetingView} from './core-components/MeetingView';
import './App.less';
import {useMemo} from 'react';
import classnames from 'classnames';
import MeetingNav from './core-components/MeetingNav';
import AppHeader from './core-components/AppHeader';
import Footer from './Footer';
import TaskList from './core-components/TaskList';
import TaskListContextProvider from './model/TaskListContextProvider';
import {useMiterContext} from './model/MiterContextProvider';
import {useZoomContext, ZoomAppContext} from './model/ZoomContextProvider';
import {Slide, ToastContainer} from 'react-toastify';
import SignInDialog from 'core-components/SignInDialog';
import {useInviteColleaguesContext} from 'model/InviteColleaguesContextProvider';
import {InviteColleaguesModal} from 'core-components/InviteColleagues';

// const ExtensionInstallLink = 'https://chrome.google.com/webstore/detail/miter-for-chrome/apfbllfpenpdgffjkgiidmgnaalplkog';

window.LoadTimestamp = new Date().getTime();

interface AppProps {
  meetingExternalIdentifier?: string;
}

const App: React.FC<AppProps> = ({meetingExternalIdentifier}) => {
  const {isInSidebar} = useMiterContext();
  const {shouldShowInviteColleaguesModal} = useInviteColleaguesContext();
  const {zoomContext} = useZoomContext();
  const shouldShowMeetingList = useMemo(
    () => !isInSidebar || !meetingExternalIdentifier,
    [isInSidebar, meetingExternalIdentifier]
  );
  const shouldShowDetailView = useMemo(
    () => !isInSidebar || meetingExternalIdentifier,
    [isInSidebar, meetingExternalIdentifier]
  );

  return (
    <div
      id="appContainer"
      className={classnames({
        SidebarMode: isInSidebar,
        DesktopMode: !isInSidebar,
        InZoomApp: zoomContext !== ZoomAppContext.NotInZoom,
      })}
    >
      <div className="App">
        <SignInDialog />
        <AppHeader />
        <div className="AppContent">
          {shouldShowMeetingList && <MeetingNav />}
          {shouldShowDetailView && <AppDetailView meetingExternalIdentifier={meetingExternalIdentifier} />}
        </div>
        {!isInSidebar && <Footer />}

        {shouldShowInviteColleaguesModal && <InviteColleaguesModal />}
      </div>
      <ToastContainer
        position="bottom-center"
        autoClose={4000}
        closeOnClick={false}
        pauseOnHover={false}
        hideProgressBar={false}
        transition={Slide}
        theme="dark"
        className="Toast"
      />
    </div>
  );
};

const AppDetailView: React.FC<AppProps> = ({meetingExternalIdentifier}) => {
  const embedded = useMemo(() => window !== window.top, []);

  if (meetingExternalIdentifier) {
    return <MeetingView embedded={embedded} meetingExternalIdentifier={meetingExternalIdentifier} />;
  } else {
    return (
      <TaskListContextProvider>
        <TaskList />
      </TaskListContextProvider>
    );
  }
};

export default App;
