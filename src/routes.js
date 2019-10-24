import { Router } from 'express';

// Controllers
import UserController from './app/controllers/UserController';
import SessionController from './app/controllers/SessionController';

const routes = new Router();

// User
routes.post('/users', UserController.store);

// Session
routes.post('/sessions', SessionController.store);

export default routes;
