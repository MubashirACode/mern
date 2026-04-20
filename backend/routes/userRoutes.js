import express from 'express';


import { getUserById, getUsers } from '../controller/userController.js';
import { adminMiddleware, authMiddleware } from '../midellwar/authMiddleware.js';

const Userrouter = express.Router();

Userrouter.get('/', authMiddleware, adminMiddleware, getUsers);
Userrouter.get('/:id', authMiddleware, adminMiddleware, getUserById);

export default Userrouter;
