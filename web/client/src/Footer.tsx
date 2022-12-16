import {resetUserPreference} from 'model/UserPrefs';

const resetOnboarding = () => {
  resetUserPreference('PromoDismissCounts');
  resetUserPreference('CurrentTourStep');
  window.location.reload();
};

const resetInvitesCTA = () => {
  resetUserPreference('ShowInviteColleaguesCTA');
  window.location.reload();
};

const signOut = () => {
  window.miterLib.signOut();
  window.location.reload();
};

const Footer: React.FC = () => (
  <footer className="AppFooter">
    <a href="https://miter.co">About</a>
    <a href="https://miter.co/privacy">Privacy</a>
    <a href="https://miter.co/contact">Contact</a>
    <a href="https://miter.co/careers">Careers</a>
    {window.Debug && (
      <>
        <a href="#" onClick={resetOnboarding}>
          Reset Onboarding
        </a>
        <a href="#" onClick={resetInvitesCTA}>
          Reset Invites CTA
        </a>
        <a href="#" onClick={signOut}>
          Sign Out
        </a>
      </>
    )}
  </footer>
);

export default Footer;
