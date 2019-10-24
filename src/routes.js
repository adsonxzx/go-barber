import { Router } from 'express';

// Controllers
import UserController from './app/controllers/UserController';

const routes = new Router();

// User
routes.post('/users', UserController.store);

export default routes;
