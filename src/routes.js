import { Router } from 'express';

import multer from 'multer';
import auth from './app/middlewares/auth';

import multerConfig from './config/multer';

// Controllers
import UserController from './app/controllers/UserController';
import SessionController from './app/controllers/SessionController';
import FileController from './app/controllers/FileController';
import ProviderController from './app/controllers/ProviderController';

const upload = multer(multerConfig);

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

// File
routes.post('/files', upload.single('file'), FileController.store);

// Provider
routes.get('/providers', ProviderController.index);

export default routes;
