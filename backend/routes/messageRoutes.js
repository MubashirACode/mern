import express from 'express';

import { getMessages, markSeen } from '../controller/messageController.js';
import { authMiddleware } from '../midellwar/authMiddleware.js';

const Messagerouter = express.Router();

Messagerouter.get('/:userId', authMiddleware, getMessages);
Messagerouter.put('/seen/:userId', authMiddleware, markSeen);

export default Messagerouter;
