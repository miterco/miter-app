import ReactDOM from 'react-dom';
import AppRoutes from './AppRoutes';
import reportWebVitals from './reportWebVitals';
import {BrowserRouter as Router} from 'react-router-dom';
import MiterContextProvider from './model/MiterContextProvider';
import MeetingListContextProvider from './model/MeetingListContextProvider';
import ZoomContextProvider from './model/ZoomContextProvider';
import socket from './SocketConnection';
import {setupSentry} from 'Utils';
import MiterTourContextProvider from 'core-components/MiterTourContextProvider';
import InviteColleaguesContextProvider from 'model/InviteColleaguesContextProvider';

setupSentry(process.env.REACT_APP_CLIENT_SENTRY_DSN);

ReactDOM.render(
  // <React.StrictMode> -- strict mode disabled because Ant has some issues with it
  <Router basename="/app">
    <MiterContextProvider>
      <MeetingListContextProvider>
        <ZoomContextProvider>
          <MiterTourContextProvider>
            <InviteColleaguesContextProvider>
              <AppRoutes />
            </InviteColleaguesContextProvider>
          </MiterTourContextProvider>
        </ZoomContextProvider>
      </MeetingListContextProvider>
    </MiterContextProvider>
  </Router>,
  document.getElementById('root')
);

// Initialize the socket when the app starts.
socket.connect();

// If you want to start measuring performance in your app, pass a function
// to log results (for example: reportWebVitals(console.log))
// or send to an analytics endpoint. Learn more: https://bit.ly/CRA-vitals
reportWebVitals();
