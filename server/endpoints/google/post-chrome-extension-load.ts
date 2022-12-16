import {ValidationError} from 'miter-common/SharedTypes';
import {updateUser} from '../../data/people/update-user';
import httpEndpoint from '../../server-core/http/http-endpoint';
import withHttpUser from '../../server-core/http/middlewares/with-http-user';

export const postChromeExtensionLoadEndpoint = httpEndpoint(withHttpUser, async ({user}, res) => {
  if (!user) throw new ValidationError('postChromeExtensionLoadEndpoint failed to receive valid authentication.');
  if (!user.installedChromeExtension) updateUser(user.id, {installedChromeExtension: true}); // Intentionally not awaiting.
  res.json({success: true});
});
