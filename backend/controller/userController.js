import userModel from "../models/User.js";


export const getUsers = async (req, res) => {
  const users = await userModel.find({ role: 'user' }).select('-password');
  res.json(users);
};

export const getUserById = async (req, res) => {
  const user = await userModel.findById(req.params.id).select('-password');
  res.json(user);
};
