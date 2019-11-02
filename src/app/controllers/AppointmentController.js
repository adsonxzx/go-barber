import * as Yup from 'yup';
import { startOfHour, isBefore, parseISO } from 'date-fns';

import Appointment from '../models/Appointment';
import User from '../models/User';
import File from '../models/File';

class AppointmentController {
  async index(req, res) {
    const { page = 1 } = req.query;

    const myAppointment = await Appointment.findAll({
      where: { user_id: req.userId, canceled_at: null },
      attributes: ['id', 'canceled_at', 'date', 'user_id', 'provider_id'],
      order: ['date'],
      limit: 20,
      offset: (page - 1) * 20,
      include: [
        {
          model: User,
          attributes: ['name', 'email'],
          as: 'user',
          include: [
            {
              model: File,
              as: 'avatar',
              attributes: ['id', 'name', 'url'],
            },
          ],
        },
        {
          model: User,
          attributes: ['id', 'name'],
          as: 'provider',
          include: [
            {
              model: File,
              as: 'avatar',
              attributes: ['id', 'name', 'url'],
            },
          ],
        },
      ],
    });

    return res.json(myAppointment);
  }

  async store(req, res) {
    // Validation
    const schema = Yup.object().shape({
      date: Yup.date().required(),
      provider_id: Yup.number().required(),
    });

    if (!(await schema.isValid(req.body))) {
      return res.status(400).json({ error: 'Validation Fails!' });
    }

    const { provider_id, date } = req.body;

    /**
     * Check if provider_id is is provider
     */
    const isProvider = await User.findOne({
      where: { id: provider_id, provider: true },
    });

    if (!isProvider) {
      return res
        .status(401)
        .json({ error: 'You can only create appointments with providers' });
    }

    /**
     * Check for past dates
     */
    const startHour = startOfHour(parseISO(date));

    if (isBefore(startHour, new Date())) {
      return res.status(401).json({ error: 'Past date are not permitted' });
    }

    /**
     * Check if data is available
     */
    const checkAvailability = Appointment.findOne({
      where: {
        provider_id,
        caceled_at: null,
        date: startHour,
      },
    });

    if (checkAvailability) {
      return res
        .status(401)
        .json({ error: 'Appointment date is not available' });
    }

    const appointment = await Appointment.create({
      provider_id,
      date: startHour,
      user_id: req.userId,
    });

    return res.json(appointment);
  }
}

export default new AppointmentController();
