import jwt from 'jsonwebtoken';
import * as Yup from 'yup';

import User from '../models/User';
import File from '../models/File';
import authConfig from '../../config/auth';

class SessionController {
  async store(req, res) {
    // Validaçào
    const schema = Yup.object().shape({
      email: Yup.string()
        .email()
        .required(),
      password: Yup.string().required(),
    });

    if (!(await schema.isValid(req.body))) {
      return res.status(400).json({ error: 'Valitation error' });
    }

    const { email, password } = req.body;

    const user = await User.findOne({
      where: { email },
      include: [
        {
          model: File,
          as: 'avatar',
          attributes: ['id', 'path', 'url'],
        },
      ],
    });

    // verifica se o usuário existe
    if (!user) {
      return res.status(400).json({ error: 'user does exists' });
    }

    // verifica se a senha esta correta
    if (!(await user.checkPassword(password))) {
      return res.status(400).json({ error: 'incorrect password' });
    }

    const { id, name, avatar, provider } = user;

    const token = jwt.sign({ id, name }, authConfig.secrete, {
      expiresIn: authConfig.expireIn,
    });

    return res.json({
      user: {
        id,
        name,
        email,
        avatar,
        provider,
      },
      token,
    });
  }
}

export default new SessionController();
