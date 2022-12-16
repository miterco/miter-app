import {MagicSignInForm} from 'core-components/Auth/MagicSignInForm';
import {MagicSignInVerifyResult} from 'core-components/Auth/MagicSignInVerifyResult';
import {StandardSignIn} from 'core-components/Auth/StandardSignIn';
import {ShutdownNoticeScreen} from 'core-components/ShutdownNoticeScreen';
import {Navigate, Route, Routes, useParams} from 'react-router-dom';
import App from './App';

const AppRoutes: React.FC = () => (
  <Routes>
    {/* Authentication Routes */}
    <Route path="/sign-in/pwless/verify" element={<MagicSignInVerifyResult />} />
    <Route path="/sign-in/pwless" element={<MagicSignInForm />} />
    <Route path="/sign-in" element={<StandardSignIn />} />
    <Route path="/shutdown-notice" element={<ShutdownNoticeScreen />} />

    {/* App Routes */}
    <Route path="/m/:meetingExternalIdentifier" element={<MeetingRoute />} />
    <Route path="/" element={<App />} />

    {/* Default Route */}
    <Route path="*" element={<Navigate to="/" replace />} />
  </Routes>
);

const MeetingRoute: React.FC = () => {
  const {meetingExternalIdentifier} = useParams<{meetingExternalIdentifier: string}>();
  return <App meetingExternalIdentifier={meetingExternalIdentifier} />;
};

export default AppRoutes;
