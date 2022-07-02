import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import * as request from 'supertest';
import { AppModule } from './../src/app.module';
import { ethers } from 'ethers';

describe('AppController (e2e)', () => {
  let app: INestApplication;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    await app.init();
  });

  it('should login with new account', async () => {
    const wallet = ethers.Wallet.createRandom();
    const getLoginResponse = await request(app.getHttpServer())
      .get(`/auth/login?publicAddress=${wallet.address}`)
      .expect(200);

    expect(getLoginResponse.body).toBeDefined();
    expect(getLoginResponse.body).not.toBeNull();
    expect(getLoginResponse.body?.publicAddress).toEqual(wallet.address);
    expect(getLoginResponse.body?.signature).toBeDefined();
    expect(getLoginResponse.body?.signature).not.toBeNull();

    const signature = getLoginResponse.body?.signature;
    const signedMessage = await wallet.signMessage(signature);

    const response = await request(app.getHttpServer())
      .post('/auth/login')
      .send({
        publicAddress: wallet.address,
        signedMessage,
      })
      .expect(200);

    expect(response.body).toBeDefined();
    expect(response.body).not.toBeNull();
    expect(response.body?.id).toBeDefined();
    expect(response.body?.username).toBeDefined();
  });
});
