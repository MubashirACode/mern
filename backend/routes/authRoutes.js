import express from 'express';


import { getMe, login, signup } from '../controller/authController.js';
import { authMiddleware } from '../midellwar/authMiddleware.js';

const Authrouter = express.Router();

Authrouter.post('/signup', signup);
Authrouter.post('/login', login);
Authrouter.get('/me', authMiddleware, getMe);

export default Authrouter;
