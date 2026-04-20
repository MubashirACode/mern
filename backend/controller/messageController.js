import messageModel from "../models/Message.js";




export const getMessages = async (req, res) => {
  const messages = await messageModel.find({ userId: req.params.userId }).sort({ createdAt: 1 });
  res.json(messages);
};

export const markSeen = async (req, res) => {
  await messageModel.updateMany(
    { userId: req.params.userId, sender: req.user.role === 'admin' ? 'user' : 'admin', status: { $ne: 'seen' } },
    { status: 'seen' }
  );
  res.json({ message: 'Messages marked as seen' });
};
