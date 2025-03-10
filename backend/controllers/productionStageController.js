const ProductionStage = require('../models/ProductionStage');
const notificationService = require('../services/notificationService');

exports.createProductionStage = async (req, res) => {
  try {
    const productionStage = new ProductionStage({
      ...req.body,
      createdBy: req.user._id
    });
    
    await productionStage.save();
    
    const populatedProductionStage = await ProductionStage.findById(productionStage._id)
      .populate('createdBy', 'firstName lastName email')
      .populate('updatedBy', 'firstName lastName email');

    await notificationService.createNotificationForAllUsers(
      'Yeni Üretim Aşaması Eklendi',
      `${productionStage.name} üretim aşaması sisteme eklendi.`,
      'info',
      `/dashboard/production-stages/${productionStage._id}`
    );

    res.status(201).json(populatedProductionStage);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

exports.getProductionStages = async (req, res) => {
  try {
    const { isActive } = req.query;
    const query = {};

    if (isActive !== undefined) {
      query.isActive = isActive === 'true';
    }

    const productionStages = await ProductionStage.find(query)
      .populate('requiredRoles', 'name')
      .populate('createdBy', 'firstName lastName email')
      .populate('updatedBy', 'firstName lastName email')
      .populate('department', '_id name code')
      .sort({ sequence: 1 });

    res.json(productionStages);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.getProductionStage = async (req, res) => {
  try {
    const productionStage = await ProductionStage.findById(req.params.id)
      .populate('requiredRoles', 'name')
      .populate('createdBy', 'firstName lastName email')
      .populate('updatedBy', 'firstName lastName email')
      .populate('department', '_id name code');

    if (!productionStage) {
      return res.status(404).json({ message: 'Production stage not found' });
    }

    res.json(productionStage);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.updateProductionStage = async (req, res) => {
  try {
    const productionStage = await ProductionStage.findById(req.params.id);
    
    if (!productionStage) {
      return res.status(404).json({ message: 'Production stage not found' });
    }

    Object.assign(productionStage, req.body);
    productionStage.updatedBy = req.user._id;
    
    await productionStage.save();

    const updatedProductionStage = await ProductionStage.findById(productionStage._id)
      .populate('createdBy', 'firstName lastName email')
      .populate('updatedBy', 'firstName lastName email');

    await notificationService.createNotificationForAllUsers(
      'Üretim Aşaması Güncellendi',
      `${productionStage.name} üretim aşaması güncellendi.`,
      'info',
      `/dashboard/production-stages/${productionStage._id}`
    );

    res.json(updatedProductionStage);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

exports.deleteProductionStage = async (req, res) => {
  try {
    const productionStage = await ProductionStage.findById(req.params.id);
    
    if (!productionStage) {
      return res.status(404).json({ message: 'Production stage not found' });
    }

    await ProductionStage.findByIdAndDelete(req.params.id);

    await notificationService.createNotificationForAllUsers(
      'Üretim Aşaması Silindi',
      `${productionStage.name} üretim aşaması sistemden silindi.`,
      'error',
      '/dashboard/production-stages'
    );

    res.json({ message: 'Production stage deleted successfully' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.updateProductionStageStatus = async (req, res) => {
  try {
    const { isActive } = req.body;
    const productionStage = await ProductionStage.findById(req.params.id);
    
    if (!productionStage) {
      return res.status(404).json({ message: 'Production stage not found' });
    }

    productionStage.isActive = isActive;
    productionStage.updatedBy = req.user._id;
    await productionStage.save();

    res.json(productionStage);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
}; 