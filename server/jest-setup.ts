import dotenv from 'dotenv';
dotenv.config();

import {getPrismaClient} from './data/prisma-client';

afterAll(() => {
  getPrismaClient().$disconnect();
});
