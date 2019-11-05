import * as Yup from 'yup';
import { startOfHour, isBefore, parseISO, format, subHours } from 'date-fns';
import pt from 'date-fns/locale/pt';

import Appointment from '../models/Appointment';
import User from '../models/User';
import File from '../models/File';
import Notification from '../schemas/Notification';
import Mail from '../../lib/Mail';

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
    const checkAvailability = await Appointment.findOne({
      where: {
        provider_id,
        canceled_at: null,
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

    /**
     * Notify Appointment provider
     */
    const { name } = await User.findByPk(req.userId);
    const formattedDate = format(
      startHour,
      "'dia' dd 'de' MMMM', às' H:mm'h'",
      { locale: pt }
    );

    await Notification.create({
      content: `Novo agendamento de ${name} para o ${formattedDate}`,
      user: provider_id,
      read: false,
    });

    return res.json(appointment);
  }

  /**
   * Cancelamento de Agendamento
   */
  async delete(req, res) {
    const appointment = await Appointment.findByPk(req.params.id, {
      include: [
        {
          model: User,
          as: 'provider',
          attributes: ['name', 'email'],
        },
        {
          model: User,
          as: 'user',
          attributes: ['name', 'email'],
        },
      ],
    });

    if (req.userId !== appointment.user_id) {
      return res.status(401).json({
        error: "You don't have permission to cancel this appontent",
      });
    }

    /**
     * Check if permmited canceled appontment
     */
    const dateWithSub = subHours(appointment.date, 2);

    if (isBefore(dateWithSub, new Date())) {
      return res.status(401).json({
        error: 'you can only canceled appointments 2 hours in advance',
      });
    }

    await appointment.update({ canceled_at: new Date() });

    /**
     * Send email warning about canceled appontment
     */

    await Mail.sendMail({
      to: `${appointment.provider.name} <${appointment.provider.email}>`,
      subject: 'Agendamento Cancelado',
      template: 'cancellation',
      context: {
        provider: appointment.provider.name,
        user: appointment.user.name,
        date: format(appointment.date, "'dia' dd 'de' MMMM', às' H:mm'h'", {
          locale: pt,
        }),
      },
    });

    return res.json(appointment);
  }
}

export default new AppointmentController();
