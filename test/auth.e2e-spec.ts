import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import * as request from 'supertest';
import { AppModule } from './../src/app.module';
import { ethers } from 'ethers';

describe('AppController (e2e)', () => {
  let app: INestApplication;
  let wallet: ethers.Wallet;
  let signature: string;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    await app.init();
    wallet = ethers.Wallet.createRandom();
  });

  it('[GET] /auth/login - should get login info', async () => {
    const response = await request(app.getHttpServer()).get(`/auth/login?publicAddress=${wallet.address}`).expect(200);

    expect(response.body).toBeDefined();
    expect(response.body).not.toBeNull();
    expect(response.body?.publicAddress).toEqual(wallet.address);
    expect(response.body?.signature).toBeDefined();
    expect(response.body?.signature).not.toBeNull();

    signature = response.body?.signature;
  });

  it('[GET] /auth/login - should validate signature and login', async () => {
    const signedMessage = wallet.signMessage(signature);
    const response = await request(app.getHttpServer())
      .post('/auth/login')
      .send({
        publicAddress: wallet.address,
        signedMessage,
      })
      .expect(200);

    expect(response.body).toBeDefined();
    expect(response.body).not.toBeNull();
    expect(response.body?.userId).toBeDefined();
    expect(response.body?.username).toBeDefined();
  });
});
