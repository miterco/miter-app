import {fetchUserByMiterId} from '../../../data/people/fetch-user';
import {SocketEndpoint} from '../socket-endpoint';

const withSocketUser: SocketEndpoint = async (request, _response) => {
  const {userId} = request;
  request.user = (userId && (await fetchUserByMiterId(userId))) || undefined;
};

export default withSocketUser;
