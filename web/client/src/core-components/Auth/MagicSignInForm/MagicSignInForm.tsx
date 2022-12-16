// Third-party.
import {useCallback, useMemo, useState} from 'react';
import classnames from 'classnames';

import {validateEmail} from 'miter-common/CommonUtil';
import {passwordlessSignUp} from 'model/MagicLinkApi';

// Components.
import {MagicSignInWindow} from 'core-components/Auth/MagicSignInWindow';

// Assets.
import './MagicSignInForm.less';

interface MagicSignInProps {}

const MagicSignInForm: React.FC<MagicSignInProps> = props => {
  const [state, setState] = useState<'Default' | 'Confirm' | 'Error'>('Default');
  const [userData, setUserData] = useState({
    firstName: '',
    lastName: '',
    email: '',
  });
  const [isDirty, setIsDirty] = useState({
    firstName: false,
    lastName: false,
    email: false,
  });
  const [error, setError] = useState('');

  const handleSubmit: React.FormEventHandler<HTMLFormElement> = useCallback(
    async event => {
      event.preventDefault();
      try {
        await passwordlessSignUp(userData);
        setState('Confirm');
      } catch (error) {
        setError(error as string);
        setState('Error');
      }
    },
    [userData]
  );

  const isValidUserData = useMemo(() => {
    return userData.firstName.trim() && userData.lastName.trim() && validateEmail(userData.email);
  }, [userData]);

  const handleInputChange = useCallback(
    (key: string, event: React.FormEvent<HTMLInputElement>) => {
      setUserData(userData => ({
        ...userData,
        [key]: (event.target as HTMLInputElement).value,
      }));
      setIsDirty(dirtyFields => ({
        ...dirtyFields,
        [key]: true,
      }));
    },
    [setIsDirty, setUserData]
  );

  const mainContent = useMemo(() => {
    if (state === 'Confirm') {
      return (
        <div className="SubmitConfirm">Almost there! Check your email for a final step confirming your identity.</div>
      );
    }

    return (
      <form className="MagicSignInForm" name="magicSignInForm" onSubmit={handleSubmit}>
        <label>
          Name
          <div className="Row">
            <input
              autoFocus
              type="text"
              name="firstname"
              value={userData.firstName}
              className={classnames({Dirty: isDirty.firstName})}
              onChange={event => handleInputChange('firstName', event)}
              placeholder="First"
              required
            />
            <input
              type="text"
              name="lastname"
              value={userData.lastName}
              className={classnames({Dirty: isDirty.lastName})}
              onChange={event => handleInputChange('lastName', event)}
              placeholder="Last"
              required
            />
          </div>
        </label>
        <label>
          Email
          <input
            type="email"
            name="email"
            value={userData.email}
            className={classnames({Dirty: isDirty.email})}
            onChange={event => handleInputChange('email', event)}
            required
          />
        </label>
        {state === 'Error' && <div className="SubmitError">{error}</div>}
        <div className="Buttons">
          <button className="Btn" type="submit" disabled={!isValidUserData}>
            Sign Up
          </button>
        </div>
      </form>
    );
  }, [
    state,
    userData.firstName,
    userData.lastName,
    userData.email,
    isDirty.firstName,
    isDirty.lastName,
    isDirty.email,
    handleSubmit,
    handleInputChange,
    isValidUserData,
    error,
  ]);

  return <MagicSignInWindow title="Sign Up via Email">{mainContent}</MagicSignInWindow>;
};

export default MagicSignInForm;
