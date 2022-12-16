import {createUser} from './create-user';
import {v4 as uuid} from 'uuid';
import {ProductSurface, SignUpService} from '.prisma/client';
import {fetchPersonByEmail} from './fetch-person';
import {fetchUserByMiterId} from './fetch-user';

test('createUser', async () => {
  const serviceId = uuid().toString();
  const zoomUserId = uuid().toString();
  const loginEmail = `${serviceId}@test.miter.co`;
  const displayName = 'Miter User';
  const firstName = 'Miter';
  const lastName = 'User';
  const picture = 'https://lh3.googleusercontent.com/a-/12345';
  const googleCredentials = {
    access_token: 'ya29.0a93480932f8290h49f08h340984ah098haf9340h8f09a83hw948hw3093fh098f3h409',
    scope: 'https://www.googleapis.com/auth/userinfo.email https://www.googleapis.com/auth/calendar.readonly openid',
    token_type: 'Bearer',
    id_token:
      'eyJhbGciOiJSUzI1NiIsImtpZCI6Ijg0NjJhNzFkYTRmNmQ2MTFmYzBmZWNmMGZjNGJhOWMzN2Q2NWU2Y2QiLCJ0eXAiOiJKV1QifQ.eyJpc3MiOiJodHRwczovL2FjY291bnRzLmdvb2dsZS5jb20iLCJhenAiOiIzNjQzMzQxODA2MzAtY2oxcWprYTk1YmNvOGFrYmFuZjhlcmk4NDVmNHEzanEuYXBwcy5nb29nbGV1c2VyY29udGVudC5jb20iLCJhdWQiOiIzNjQzMzQxODA2MzAtY2oxcWprYTk1YmNvOGFrYmFuZjhlcmk4NDVmNHEzanEuYXBwcy5nb29nbGV1c2VyY29udGVudC5jb20iLCJzdWIiOiIxMDQxNjk5NDg4ODA2NDg0NjExNTgiLCJoZCI6Im1pdGVyLmNvIiwiZW1haWwiOiJkYW1pYW5AbWl0ZXIuY28iLCJlbWFpbF92ZXJpZmllZCI6dHJ1ZSwiYXRfaGFzaCI6IlUxR1lqSDJRclZpeVc1NXd1MlJxUlEiLCJpYXQiOjE2MTU5MDg1MDcsImV4cCI6MTYxNTkxMjEwN30.pvJa4A50FRNhLndasywHIXOqTDSR2tY4T55Ht_MUaj91qmVvzpJT_4XoUkT0FegIVgy4111H_pYN13fgAaBRSUGIYYt_0SgWGUcGOqcJwi_aZheRk5BbEFCdFbxktU0C60WVALe002n9fi5ZSLKsAN3PEREdgVzxmhehxHx_qPQbQBldmZqPIOwIZNbSmoGr3DquAYRFxdsa1SKrHTZp12VskQBqXwbj_weQ0MBsEPM38MeQprxsKcf5kRUzU7xQZNCpsD8V9zVhKhcSoXN4-P8zlQbDzvmEHcTM0zxa-ahIqD6bhn7NygH47h6WXMHm7Q2B8bTKLMrkKoZ-4mSqMg',
    expiry_date: 1615912106590,
  };
  const zoomCredentials = {
    access_token: uuid().toString(),
    refresh_token: uuid().toString(),
  };

  const newUser = await createUser(
    {
      serviceId,
      firstName,
      lastName,
      displayName,
      loginEmail,
      picture,
      zoomUserId,
      signUpService: SignUpService.Google,
      signUpProductSurface: ProductSurface.WebApp,
    },
    googleCredentials,
    zoomCredentials
  );

  const {id} = newUser;

  expect(newUser?.displayName).toBe('Miter User');

  const fetchUserResponse = await fetchUserByMiterId(id);
  expect(fetchUserResponse?.firstName).toBe(firstName);
  expect(fetchUserResponse?.lastName).toBe(lastName);
  expect(fetchUserResponse?.picture).toBe(picture);
  expect(fetchUserResponse?.signUpProductSurface).toBe(ProductSurface.WebApp);

  const associatedPerson = await fetchPersonByEmail(loginEmail);
  expect(associatedPerson?.displayName).toBe(displayName);
  expect(associatedPerson?.picture).toBe(picture);

  // Zoom data.
  expect(fetchUserResponse?.zoomUserId).toBe(zoomUserId);
});
