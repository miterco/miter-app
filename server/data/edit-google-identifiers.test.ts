import {ProductSurface, SignUpService} from '@prisma/client';
import {fetchUserByMiterId} from './people/fetch-user';
import {createUser} from './people/create-user';
import {editGoogleIdentifiers} from './edit-google-identifiers';
import {fetchGoogleIdentifiers} from './fetch-google-identifiers';
import {v4 as uuid} from 'uuid';

test('editGoogleIdentifiers', async () => {
  const serviceId = uuid().toString();
  const mockTokens = {
    access_token: 'ya29.isthethingthatallthesetokensseemtostartwith',
    refresh_token: '1//refreshtokenisnotasgoodasanother',
    scope:
      'https://www.googleapis.com/auth/userinfo.email https://www.googleapis.com/auth/calendar.readonly https://www.googleapis.com/auth/userinfo.profile openid',
    token_type: 'Bearer',
    id_token: 'I am a very long ID token masquerading as a short sentence',
    expiry_date: 1621904967223,
  };

  const newUser = await createUser(
    {
      serviceId,
      zoomUserId: null,
      displayName: 'Miter User For Google Identifiers',
      firstName: 'Miter',
      lastName: 'User For Google Identifiers',
      loginEmail: `${serviceId}@test.miter.co`,
      signUpService: SignUpService.Google,
      signUpProductSurface: ProductSurface.ChromeExtension,
    },
    {
      access_token: 'ya29.0a93480932f8290h49f08h340984ah098haf9340h8f09a83hw948hw3093fh098f3h409',
      scope: 'https://www.googleapis.com/auth/userinfo.email https://www.googleapis.com/auth/calendar.readonly openid',
      token_type: 'Bearer',
      id_token:
        'eyJhbGciOiJSUzI1NiIsImtpZCI6Ijg0NjJhNzFkYTRmNmQ2MTFmYzBmZWNmMGZjNGJhOWMzN2Q2NWU2Y2QiLCJ0eXAiOiJKV1QifQ.eyJpc3MiOiJodHRwczovL2FjY291bnRzLmdvb2dsZS5jb20iLCJhenAiOiIzNjQzMzQxODA2MzAtY2oxcWprYTk1YmNvOGFrYmFuZjhlcmk4NDVmNHEzanEuYXBwcy5nb29nbGV1c2VyY29udGVudC5jb20iLCJhdWQiOiIzNjQzMzQxODA2MzAtY2oxcWprYTk1YmNvOGFrYmFuZjhlcmk4NDVmNHEzanEuYXBwcy5nb29nbGV1c2VyY29udGVudC5jb20iLCJzdWIiOiIxMDQxNjk5NDg4ODA2NDg0NjExNTgiLCJoZCI6Im1pdGVyLmNvIiwiZW1haWwiOiJkYW1pYW5AbWl0ZXIuY28iLCJlbWFpbF92ZXJpZmllZCI6dHJ1ZSwiYXRfaGFzaCI6IlUxR1lqSDJRclZpeVc1NXd1MlJxUlEiLCJpYXQiOjE2MTU5MDg1MDcsImV4cCI6MTYxNTkxMjEwN30.pvJa4A50FRNhLndasywHIXOqTDSR2tY4T55Ht_MUaj91qmVvzpJT_4XoUkT0FegIVgy4111H_pYN13fgAaBRSUGIYYt_0SgWGUcGOqcJwi_aZheRk5BbEFCdFbxktU0C60WVALe002n9fi5ZSLKsAN3PEREdgVzxmhehxHx_qPQbQBldmZqPIOwIZNbSmoGr3DquAYRFxdsa1SKrHTZp12VskQBqXwbj_weQ0MBsEPM38MeQprxsKcf5kRUzU7xQZNCpsD8V9zVhKhcSoXN4-P8zlQbDzvmEHcTM0zxa-ahIqD6bhn7NygH47h6WXMHm7Q2B8bTKLMrkKoZ-4mSqMg',
      expiry_date: 1615912106590,
    }
  );

  const userId = newUser.id;

  const pushId1 = uuid();
  const pushId2 = uuid();
  const gcalResourceId = 'ret08u3rv24htgh289h';
  const gcalSyncToken = 'CPDAlvWDx70CEPDAlvWDx70CGAV';

  expect(newUser?.displayName).toBe('Miter User For Google Identifiers');

  const fetchUserResponse = await fetchUserByMiterId(userId);
  expect(fetchUserResponse?.firstName).toBe('Miter');
  expect(fetchUserResponse?.lastName).toBe('User For Google Identifiers');

  const editedUser = await editGoogleIdentifiers(userId, {gcalPushChannel: pushId1, gcalResourceId, gcalSyncToken});
  expect(editedUser?.gcalResourceId).toBe(gcalResourceId);

  const fetchedIdentifiers = await fetchGoogleIdentifiers(userId);
  expect(fetchedIdentifiers?.gcalPushChannel).toBe(pushId1);
  expect(fetchedIdentifiers?.gcalResourceId).toBe(gcalResourceId);
  expect(fetchedIdentifiers?.gcalSyncToken).toBe(gcalSyncToken);

  const partiallyEditedUser = await editGoogleIdentifiers(userId, {gcalPushChannel: pushId2, gcalResourceId: ''});
  expect(partiallyEditedUser?.gcalResourceId).toBe('');
  expect(partiallyEditedUser?.gcalPushChannel).toBe(pushId2);
  expect(partiallyEditedUser?.gcalSyncToken).toBe(gcalSyncToken);

  const tokenEditedUser = await editGoogleIdentifiers(userId, {tokens: mockTokens});
  expect(tokenEditedUser?.tokens).toEqual(mockTokens);
});
