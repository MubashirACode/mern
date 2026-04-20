import servicesModel from "../models/Service.js";


export const getServices = async (req, res) => {
  const services = await servicesModel.find();
  res.json(services);
};

export const createService = async (req, res) => {
  const service = await servicesModel.create(req.body);
  res.status(201).json(service);
};

export const updateService = async (req, res) => {
  const service = await servicesModel.findByIdAndUpdate(req.params.id, req.body, { new: true });
  res.json(service);
};

export const deleteService = async (req, res) => {
  await Service.findByIdAndDelete(req.params.id);
  res.json({ message: 'Service removed' });
};
