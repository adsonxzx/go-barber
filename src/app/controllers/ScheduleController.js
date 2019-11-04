import { startOfDay, endOfDay, parseISO } from 'date-fns';
import { Op } from 'sequelize';

import Appointment from '../models/Appointment';
import User from '../models/User';

class ScheduleController {
  async index(req, res) {
    /**
     * Check if user is provider
     */
    const isProvider = await User.findOne({
      where: { id: req.userId, provider: true },
    });

    if (!isProvider) {
      return res
        .status(401)
        .json({ error: 'Acesso apenas para usuário provider' });
    }

    const scheduleDate = parseISO(req.query.date);

    const schedule = await Appointment.findAll({
      where: {
        provider_id: req.userId,
        canceled_at: null,
        date: {
          [Op.between]: [startOfDay(scheduleDate), endOfDay(scheduleDate)],
        },
      },
      order: ['date'],
    });

    return res.json(schedule);
  }
}

export default new ScheduleController();
