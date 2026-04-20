import express from 'express';


import { createOrder, getAllOrders, getMyOrders, updateOrder } from '../controller/orderController.js';
import { adminMiddleware, authMiddleware } from '../midellwar/authMiddleware.js';

const Orderrouter = express.Router();

Orderrouter.post('/', authMiddleware, createOrder);
Orderrouter.get('/my', authMiddleware, getMyOrders);
Orderrouter.get('/', authMiddleware, adminMiddleware, getAllOrders);
Orderrouter.put('/:id', authMiddleware, adminMiddleware, updateOrder);

export default Orderrouter;
