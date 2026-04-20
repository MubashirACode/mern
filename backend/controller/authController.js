import jwt from "jsonwebtoken"
import userModel from "../models/User.js";

export const generateToken = (id, role) => {
  return jwt.sign(
    { id, role },
    process.env.JWT_SECRET || 'secret',
    { expiresIn: '30d' }
  );
};

export const signup = async (req, res) => {
  try {
    const { name, email, password, role } = req.body;
    const userExists = await userModel.findOne({ email });
    if (userExists) return res.status(400).json({ message: 'User already exists' });

    const user = await userModel.create({ name, email, password, role });
    res.status(201).json({
      _id: user._id,
      name: user.name,
      email: user.email,
      role: user.role,
      token: generateToken(user._id, user.role)
    });
  } catch (error) {
    res.status(500).json({ message: error.message , "please login": "login" } ,"please login fuck");
  }
};

export const login = async (req, res) => {
  try {
    const { email, password } = req.body;
    const user = await userModel.findOne({ email });
    if (user && (await user.comparePassword(password))) {
      res.json({
        _id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        token: generateToken(user._id, user.role)
      });
    } else {
      res.status(401).json({ message: 'Invalid email or password' });
    }
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
export const getMe = async (req, res) => {
  const user = await userModel.findById(req.user.id).select('-password');
  res.json(user);
};


