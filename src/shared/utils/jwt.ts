import jwt from 'jsonwebtoken';
import config from '../../config';

interface ITokenPayload {
  _id: string;
  email: string;
  user_type: string;
}

interface ITokenPair {
  accessToken: string;
  refreshToken: string;
}

const generateAccessToken = (payload: ITokenPayload): string => {
  return jwt.sign(payload, config.jwt.accessSecret, {
    expiresIn: config.jwt.accessExpiresIn,
  } as jwt.SignOptions);
};

const generateRefreshToken = (payload: ITokenPayload): string => {
  return jwt.sign(payload, config.jwt.refreshSecret, {
    expiresIn: config.jwt.refreshExpiresIn,
  } as jwt.SignOptions);
};

const generateTokenPair = (payload: ITokenPayload): ITokenPair => {
  return {
    accessToken: generateAccessToken(payload),
    refreshToken: generateRefreshToken(payload),
  };
};

const verifyAccessToken = (token: string): ITokenPayload => {
  return jwt.verify(token, config.jwt.accessSecret) as ITokenPayload;
};

const verifyRefreshToken = (token: string): ITokenPayload => {
  return jwt.verify(token, config.jwt.refreshSecret) as ITokenPayload;
};

export {
  ITokenPayload,
  ITokenPair,
  generateAccessToken,
  generateRefreshToken,
  generateTokenPair,
  verifyAccessToken,
  verifyRefreshToken,
};
