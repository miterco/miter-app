export const SocketServer = jest.fn().mockImplementation(() => {
  return {
    broadcast: jest.fn(),
    send: jest.fn(),
    getExistingChannel: jest.fn(),
    getClientChannel: jest.fn(),
    getUserForClient: jest.fn(),
    setClientChannel: jest.fn(),
    getInfoForChannel: jest.fn(),
    setInfoForChannel: jest.fn(),
    getMembersForChannel: jest.fn(),
  };
});
