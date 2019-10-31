import User from '../models/User';
import File from '../models/File';

class ProviderController {
  async index(req, res) {
    const providers = await User.findAll({
      where: { provider: true },
      attributes: ['name', 'email', 'provider', 'avatar_id'],
      include: {
        model: File,
        attributes: ['name', 'path', 'url'],
        as: 'avatar',
      },
    });

    return res.json(providers);
  }
}

export default new ProviderController();
