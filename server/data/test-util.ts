import WebSocket from 'ws';
import { Server } from 'http';
import { SocketServer } from '../server-core/socket-server';

jest.mock('../server-core/socket-server');
jest.mock('ws');

export const mockWebSocket = () => {
  return new WebSocket('wss://not-actually-used');
};

export const mockSocketServer = () => {
  return new SocketServer({} as Server);
};