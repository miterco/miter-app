// Simple browser-side preferences -- maybe move to server at some point
// TODO is there something more type-safe worth doing here?
export type UserPreferenceKey =
  | 'EmailRecipients'
  | 'ShowProtocolIntroModal'
  | 'CurrentTourStep'
  | 'PromoDismissCounts'
  | 'ShowInviteColleaguesCTA';
export type UserPreferenceValue = any;
const UserPreferenceDefaults: Record<UserPreferenceKey, UserPreferenceValue> = {
  EmailRecipients: {},
  ShowProtocolIntroModal: true,
  CurrentTourStep: 0,
  PromoDismissCounts: {},
  ShowInviteColleaguesCTA: true,
};

// TODO need a solution other than localStorage since we don't have access to it
// when running in an iframe when the user has disabled third-party cookies.
export const getUserPreference = (key: UserPreferenceKey): UserPreferenceValue => {
  try {
    const retrieved = localStorage.getItem(`pref_${key}`);
    return retrieved === null ? UserPreferenceDefaults[key] : JSON.parse(retrieved);
  } catch {
    return UserPreferenceDefaults[key];
  }
};

export const setUserPreference = (key: UserPreferenceKey, val: UserPreferenceValue) => {
  try {
    localStorage.setItem(`pref_${key}`, JSON.stringify(val));
  } catch {
    // Empty
  }
};

export const resetUserPreference = (key: UserPreferenceKey) => {
  localStorage.removeItem(`pref_${key}`);
};
