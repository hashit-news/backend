import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import * as request from 'supertest';
import { AppModule } from './../src/app.module';
import { ethers } from 'ethers';
import { AccessTokenResponse } from '../src/auth/dtos/auth.models';
import { TokenService } from '../src/auth/services/token.service';

describe('AppController (e2e)', () => {
  let app: INestApplication;
  let tokenService: TokenService;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    tokenService = app.get(TokenService);
    await app.init();
  });

  it('should login with new account', async () => {
    const wallet = ethers.Wallet.createRandom();
    const getLoginResponse = await request(app.getHttpServer())
      .get(`/auth/web3?publicAddress=${wallet.address}`)
      .expect(200);

    expect(getLoginResponse.body).toBeDefined();
    expect(getLoginResponse.body).not.toBeNull();
    expect(getLoginResponse.body?.publicAddress).toEqual(wallet.address);
    expect(getLoginResponse.body?.signature).toBeDefined();
    expect(getLoginResponse.body?.signature).not.toBeNull();

    const signature = getLoginResponse.body?.signature;
    const signedMessage = await wallet.signMessage(signature);

    const response = await request(app.getHttpServer())
      .post('/auth/token')
      .send({
        publicAddress: wallet.address,
        signedMessage: signedMessage,
      })
      .expect(200);

    expect(response.body).toBeDefined();
    expect(response.body).not.toBeNull();

    const accessTokenResponse = response.body as AccessTokenResponse;
    await verifyAccessTokenResponse(accessTokenResponse);

    const refreshResponse = await request(app.getHttpServer())
      .post('/auth/token/refresh')
      .send({
        refreshToken: accessTokenResponse.refresh_token,
      })
      .expect(200);

    const refreshedAccessTokenResponse = refreshResponse.body as AccessTokenResponse;
    await verifyAccessTokenResponse(refreshedAccessTokenResponse);
  });

  const verifyAccessTokenResponse = async (accessTokenResponse: AccessTokenResponse) => {
    const signOptions = await tokenService.getAccessTokenSignOptions();

    expect(accessTokenResponse).not.toBeNull();
    expect(accessTokenResponse.expires_in).toBe(signOptions.expiresIn);
    expect(accessTokenResponse.token_type).toBe('Bearer');
    expect(accessTokenResponse.refresh_token).toBeDefined();
    expect(accessTokenResponse.refresh_token).not.toBeNull();

    const jwtPayload = await tokenService.verifyAccessToken(accessTokenResponse.access_token);
    expect(jwtPayload).not.toBeNull();

    const refreshTokenPayload = await tokenService.verifyRefreshToken(accessTokenResponse.refresh_token || '');
    expect(refreshTokenPayload).not.toBeNull();
    expect(jwtPayload.sub).toBe(refreshTokenPayload.sub);
  };
});
