// Don't include "g" at the end of the regexp or it will fail intermittently. See this link for more info:
// https://stackoverflow.com/questions/2630418/javascript-regex-returning-true-then-false-then-true-etc
export const EMAILS_PATTERN =
  /[a-z0-9!#$%&'*+/=?^_`{|}~-]+(?:\.[a-z0-9!#$%&'*+/=?^_`{|}~-]+)*@(?:[a-z0-9](?:[a-z0-9-]*[a-z0-9])?\.)+[a-z0-9](?:[a-z0-9-]*[a-z0-9])?/i;
