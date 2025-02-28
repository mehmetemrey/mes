const ProductionLine = require('../models/ProductionLine');

class ProductionLineService {
  // Get all production lines with optional filtering and pagination
  async getProductionLines(filters = {}, pagination = {}) {
    try {
      const { page = 1, limit = 10, sortBy = 'createdAt', sortOrder = 'desc' } = pagination;
      const skip = (page - 1) * limit;

      // Build query
      const query = {};
      
      if (filters.department) {
        query.department = filters.department;
      }
      
      if (filters.status) {
        query.status = filters.status;
      }
      
      if (filters.machines) {
        query.machines = { $in: Array.isArray(filters.machines) ? filters.machines : [filters.machines] };
      }

      // Execute query with pagination and sorting
      const [productionLines, total] = await Promise.all([
        ProductionLine.find(query)
          .sort({ [sortBy]: sortOrder === 'desc' ? -1 : 1 })
          .skip(skip)
          .limit(limit)
          .populate('department', 'name code')
          .populate('machines', 'name code status')
          .populate({
            path: 'personnel.employee',
            select: 'firstName lastName email roles department',
            populate: { path: 'roles', select: 'name description' }
          }),
        ProductionLine.countDocuments(query)
      ]);

      return {
        productionLines,
        total,
        page,
        totalPages: Math.ceil(total / limit)
      };
    } catch (error) {
      console.error('Production Lines Fetch Error:', error);
      throw error;
    }
  }

  // Create a new production line
  async createProductionLine(data, createdBy) {
    try {
      const productionLine = new ProductionLine({
        ...data,
        createdBy
      });
      await productionLine.save();
      return productionLine;
    } catch (error) {
      throw error;
    }
  }

  // Update a production line
  async updateProductionLine(id, data, updatedBy) {
    try {
      const productionLine = await ProductionLine.findByIdAndUpdate(
        id,
        { 
          ...data,
          updatedBy,
          updatedAt: Date.now()
        },
        { new: true }
      );
      return productionLine;
    } catch (error) {
      throw error;
    }
  }

  // Delete a production line
  async deleteProductionLine(id) {
    try {
      await ProductionLine.findByIdAndDelete(id);
    } catch (error) {
      throw error;
    }
  }

  // Assign personnel
  async assignPersonnel(id, personnel) {
    const productionLine = await ProductionLine.findById(id);
    if (!productionLine) {
      throw new Error('Production line not found');
    }
    productionLine.personnel = personnel;
    await productionLine.save();
    return productionLine;
  }

  // Assign job order
  async assignJobOrder(id, jobOrderId) {
    const productionLine = await ProductionLine.findById(id);
    if (!productionLine) {
      throw new Error('Production line not found');
    }
    if (!productionLine.currentJobOrders) {
      productionLine.currentJobOrders = [];
    }
    if (!productionLine.currentJobOrders.includes(jobOrderId)) {
      productionLine.currentJobOrders.push(jobOrderId);
    }
    await productionLine.save();
    return productionLine;
  }

  // Record maintenance
  async recordMaintenance(id, maintenanceData) {
    const productionLine = await ProductionLine.findById(id);
    if (!productionLine) {
      throw new Error('Production line not found');
    }
    if (!productionLine.maintenanceHistory) {
      productionLine.maintenanceHistory = [];
    }
    productionLine.maintenanceHistory.push(maintenanceData);
    await productionLine.save();
    return productionLine;
  }

  // Update quality metrics
  async updateQualityMetrics(id, metricsData) {
    const productionLine = await ProductionLine.findById(id);
    if (!productionLine) {
      throw new Error('Production line not found');
    }
    if (!productionLine.qualityMetrics) {
      productionLine.qualityMetrics = {};
    }
    Object.assign(productionLine.qualityMetrics, metricsData);
    await productionLine.save();
    return productionLine;
  }

  // Start shift
  async startShift(id, shiftData) {
    try {
      const productionLine = await ProductionLine.findById(id);
      if (!productionLine) {
        throw new Error('Production line not found');
      }
      
      // Update production line with shift data
      productionLine.currentShift = shiftData;
      await productionLine.save();
      
      return productionLine;
    } catch (error) {
      throw error;
    }
  }
}

module.exports = new ProductionLineService(); 