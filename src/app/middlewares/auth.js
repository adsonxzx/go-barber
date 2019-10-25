import jwt from 'jsonwebtoken';
import { promisify } from 'util';

import authConfig from '../../config/auth';

export default async (req, res, next) => {
  const authorization = req.headers.authentication;

  // verifica se o token foi informado
  if (!authorization) {
    return res.json({ error: 'Token not provided' });
  }

  const [, token] = authorization.split(' ');

  try {
    const { id } = await promisify(jwt.verify)(token, authConfig.secrete);
    req.userId = id;
    return next();
  } catch (e) {
    return res.status(401).json({ error: 'Token is invalid' });
  }
};
