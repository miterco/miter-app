import {
  MagicLinkResponse,
  PasswordlessSignUpRequest
} from 'miter-common/SharedTypes';

import {sendRequest} from '../HttpConnection';

export const createMagicLink = async () => {
  const response =
      await sendRequest<MagicLinkResponse>('api/magic-link', {}, 'POST');

  return response.body?.url || null;
};

export const passwordlessSignUp =
    async (userInfo: PasswordlessSignUpRequest) => {
  const response = await fetch(`/api/magic-link/sign-up`, {
    headers : {
      'Content-Type' : 'application/json',
    },
    method : 'POST',
    body : JSON.stringify(userInfo),
  });
  const data = await response.json();

  if (!data.success) {
    throw data.error;
  }
};

export const signInWithMagicLink = async (token: string) => {
  const response = await fetch(`/api/magic-link/${token}`);
  const data = await response.json();

  if (!data.success) {
    throw data.error;
  }
};
