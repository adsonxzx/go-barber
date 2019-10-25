import { Router } from 'express';

import auth from './app/middlewares/auth';

// Controllers
import UserController from './app/controllers/UserController';
import SessionController from './app/controllers/SessionController';

const routes = new Router();

/**
 * Public Routes
 */

// User
routes.post('/users', UserController.store);

// Session
routes.post('/sessions', SessionController.store);

routes.use(auth);

/**
 * Private Routes
 */

// User
routes.put('/users', UserController.update);

export default routes;
