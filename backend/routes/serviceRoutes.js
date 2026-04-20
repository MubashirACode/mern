import express from 'express';


import { createService, deleteService, getServices, updateService } from '../controller/serviceController.js';
import { adminMiddleware, authMiddleware } from '../midellwar/authMiddleware.js';

const Servicesrouter = express.Router();

Servicesrouter.get('/', getServices);
Servicesrouter.post('/', authMiddleware, adminMiddleware, createService);
Servicesrouter.put('/:id', authMiddleware, adminMiddleware, updateService);
Servicesrouter.delete('/:id', authMiddleware, adminMiddleware, deleteService);

export default Servicesrouter;
