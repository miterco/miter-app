// __mocks__/ws.ts

export { WebSocket as default } from "mock-socket";

jest.mock('ws', () => {
  return {
    Server: jest.fn().mockImplementation(() => {
    })
  };
});
