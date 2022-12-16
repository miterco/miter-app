import socketEndpoint from '{% relativeSocketDir %}/socket-endpoint';

export default socketEndpoint(async (request, sendResponse, broadcast, _halt) => {
  sendResponse('{% responseType %}', {});
});
