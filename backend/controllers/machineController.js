const Machine = require('../models/Machine');
const notificationService = require('../services/notificationService');

exports.createMachine = async (req, res) => {
  try {
    const machine = new Machine({
      ...req.body,
      createdBy: req.user._id
    });
    
    await machine.save();
    
    const populatedMachine = await Machine.findById(machine._id)
      .populate('department', '_id name code')
      .populate('createdBy', 'firstName lastName email')
      .populate('updatedBy', 'firstName lastName email');

    await notificationService.createNotificationForAllUsers(
      'Yeni Makine Eklendi',
      `${machine.name} makinesi sisteme eklendi.`,
      'info',
      `/dashboard/machines/${machine._id}`
    );

    res.status(201).json(populatedMachine);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

exports.getMachines = async (req, res) => {
  try {
    const { status, type } = req.query;
    const query = {};

    if (status) query.status = status;
    if (type) query.type = type;

    const machines = await Machine.find(query)
      .populate('createdBy', 'firstName lastName email')
      .populate('updatedBy', 'firstName lastName email')
      .populate('department', '_id name code')
      .sort({ name: 1 });

    res.json(machines);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.getMachine = async (req, res) => {
  try {
    const machine = await Machine.findById(req.params.id)
      .populate('createdBy', 'firstName lastName email')
      .populate('updatedBy', 'firstName lastName email')
      .populate('department', '_id name code');

    if (!machine) {
      return res.status(404).json({ message: 'Machine not found' });
    }

    res.json(machine);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.updateMachine = async (req, res) => {
  try {
    const machine = await Machine.findById(req.params.id);
    if (!machine) {
      return res.status(404).json({ message: 'Machine not found' });
    }

    Object.assign(machine, {
      ...req.body,
      updatedBy: req.user._id,
    });

    await machine.save();
    res.json(machine);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

exports.deleteMachine = async (req, res) => {
  try {
    const machine = await Machine.findById(req.params.id);
    
    if (!machine) {
      return res.status(404).json({ message: 'Machine not found' });
    }

    await Machine.findByIdAndDelete(req.params.id);

    await notificationService.createNotificationForAllUsers(
      'Makine Silindi',
      `${machine.name} makinesi sistemden silindi.`,
      'error',
      '/dashboard/machines'
    );

    res.json({ message: 'Machine deleted successfully' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.updateMachineStatus = async (req, res) => {
  try {
    const { status } = req.body;
    const machine = await Machine.findById(req.params.id);
    
    if (!machine) {
      return res.status(404).json({ message: 'Machine not found' });
    }

    machine.status = status;
    machine.updatedBy = req.user._id;
    machine.lastStatusUpdate = new Date();

    await machine.save();

    const updatedMachine = await Machine.findById(machine._id)
      .populate('department', '_id name code')
      .populate('createdBy', 'firstName lastName email')
      .populate('updatedBy', 'firstName lastName email');

    let notificationTitle = '';
    let notificationMessage = '';
    let notificationType = 'info';

    switch (status) {
      case 'active':
        notificationTitle = 'Makine Aktif';
        notificationMessage = `${machine.name} makinesi aktif duruma geçti.`;
        notificationType = 'success';
        break;
      case 'maintenance':
        notificationTitle = 'Makine Bakımda';
        notificationMessage = `${machine.name} makinesi bakım durumuna geçti.`;
        notificationType = 'warning';
        break;
      case 'inactive':
        notificationTitle = 'Makine Pasif';
        notificationMessage = `${machine.name} makinesi pasif duruma geçti.`;
        notificationType = 'error';
        break;
    }

    await notificationService.createNotificationForAllUsers(
      notificationTitle,
      notificationMessage,
      notificationType,
      `/dashboard/machines/${machine._id}`
    );

    res.json(updatedMachine);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

exports.getMachineBasicInfo = async (req, res) => {
  try {
    const { type } = req.query;
    const query = type ? { type } : {};

    const machines = await Machine.find(query)
      .select('_id code name type')
      .sort({ name: 1 });

    if (machines.length === 0) {
      return res.json([]);
    }

    const basicMachineInfo = machines.map(machine => ({
      id: machine._id,
      code: machine.code,
      name: machine.name,
      type: machine.type
    }));

    res.json(basicMachineInfo);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
}; 