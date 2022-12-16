import {fetchUserByMiterId} from '../../data/people/fetch-user';
import axios from 'axios';
import httpEndpoint from '../../server-core/http/http-endpoint';
import {fetchPersonById} from '../../data/people/fetch-person';
import {validate as uuidValidate} from 'uuid';

export const proxyPictureEndpoint = httpEndpoint(async (request, response) => {
  const {idType, id} = request.params;

  if (id && id !== 'undefined' && uuidValidate(id)) {
    const objectWithPic = idType === 'person' ? await fetchPersonById(id) : await fetchUserByMiterId(id);

    if (objectWithPic?.picture) {
      try {
        // Proxy the user picture image.
        const pictureRes = await axios.request({
          method: 'get',
          url: objectWithPic.picture,
          responseType: 'stream',
        });

        pictureRes.data.pipe(response);
      } catch (error) {
        response.end();
      }
    } else response.end();
  } else {
    console.error(`proxy-picture endpoint received an invalid UUID ${id}`);
    response.end();
  }
});
