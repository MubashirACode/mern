import orderModel from '../models/Order.js';

// ── Create order ────────────────────────────────────────────────
// FIX: response mein populate karo taake frontend pe userId aur
//      serviceId dono available hon immediately after creation
export const createOrder = async (req, res) => {
  try {
    const { serviceId } = req.body;
    const order = await orderModel.create({
      userId: req.user.id,
      serviceId,
    });

    // Populated order return karo — AdminDashboard instantly show kare
    const populated = await orderModel
      .findById(order._id)
      .populate('userId', 'name email')
      .populate('serviceId', 'title price image');

    res.status(201).json(populated);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// ── Get my orders (user) ────────────────────────────────────────
export const getMyOrders = async (req, res) => {
  try {
    const orders = await orderModel
      .find({ userId: req.user.id })
      .populate('serviceId')
      // FIX: latest orders pehle
      .sort({ createdAt: -1 });

    res.json(orders);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// ── Get all orders (admin) ──────────────────────────────────────
// FIX: sort({ createdAt: -1 }) — latest orders pehle aayenge
//      Isliye overview mein slice(0, 6) latest orders dikhayega
export const getAllOrders = async (req, res) => {
  try {
    const orders = await orderModel
      .find()
      .populate('userId', 'name email')
      .populate('serviceId', 'title price image')
      // ✅ KEY FIX: newest first — overview ke liye zaroori
      .sort({ createdAt: -1 });

    res.json(orders);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// ── Update order status ─────────────────────────────────────────
export const updateOrder = async (req, res) => {
  try {
    const { status, note } = req.body;
    const order = await orderModel.findById(req.params.id);

    if (!order) {
      return res.status(404).json({ message: 'Order not found' });
    }

    if (status) order.status = status;
    if (note) order.updates.push({ text: note });
    await order.save();

    // Populated return karo taake frontend ko re-fetch na karna pade
    const populated = await orderModel
      .findById(order._id)
      .populate('userId', 'name email')
      .populate('serviceId', 'title price image');

    res.json(populated);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};