import * as hubspot from '@hubspot/api-client';

const accessToken = process.env.HS_PRIVATE_APP_TOKEN;

let _HSClient: hubspot.Client | null = null;

export const getHubspotClient = async () => {
  if (!_HSClient) {
    _HSClient = new hubspot.Client({accessToken});
  }

  return _HSClient;
};
