const JobOrder = require('../models/JobOrder');
const notificationService = require('../services/notificationService');

exports.createJobOrder = async (req, res) => {
  try {
    const now = new Date();
    const plannedDuration = req.body.plannedDuration || 120;
    const plannedEndTime = new Date(now.getTime() + plannedDuration * 60000);

    const jobOrder = new JobOrder({
      ...req.body,
      createdBy: req.user._id,
      plannedStartTime: req.body.plannedStartTime || now,
      plannedEndTime: req.body.plannedEndTime || plannedEndTime,
      actualStartTime: req.body.status === 'In Progress' ? now : req.body.actualStartTime,
      plannedDuration: plannedDuration,
      workingTimeSegments: req.body.status === 'In Progress' ? [{
        startTime: now,
        endTime: undefined,
        duration: 0
      }] : req.body.workingTimeSegments || [],
      pauseHistory: [],
      totalPausedTime: 0,
      totalWorkingTime: 0,
      status: req.body.status || 'Planned'
    });
    
    try {
      await jobOrder.save();
    } catch (saveError) {
      if (saveError.code === 11000) {
        return res.status(400).json({
          code: 11000,
          message: 'Duplicate key error',
          keyPattern: saveError.keyPattern
        });
      }
      throw saveError;
    }
    
    const populatedJobOrder = await JobOrder.findById(jobOrder._id)
      .populate('assignedTo', 'firstName lastName email')
      .populate('machine', 'name type')
      .populate('productionStage', 'name sequence')
      .populate('createdBy', 'firstName lastName email')
      .populate('updatedBy', 'firstName lastName email')
      .populate('department', '_id name code');

    if (jobOrder.assignedTo) {
      await notificationService.createNotification(
        jobOrder.assignedTo,
        'Yeni İş Emri',
        `${jobOrder.title} iş emri size atandı.`,
        'info',
        `/dashboard/job-orders/${jobOrder._id}`
      );
    }

    res.status(201).json(populatedJobOrder);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

// Get all job orders with filtering and pagination
exports.getJobOrders = async (req, res) => {
  try {
    const { status, assignedTo, machine, productionStage, department, page = 1, limit = 10 } = req.query;
    const query = {};

    if (status) query.status = status;
    if (assignedTo) query.assignedTo = assignedTo;
    if (machine) query.machine = machine;
    if (productionStage) query.productionStage = productionStage;
    if (department) query.department = department;

    const jobOrders = await JobOrder.find(query)
      .populate('assignedTo', 'firstName lastName email fullName')
      .populate('machine', 'name type')
      .populate('productionStage', 'name sequence')
      .populate('department', '_id name code')
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(parseInt(limit));

    const total = await JobOrder.countDocuments(query);

    res.json({
      jobOrders,
      totalPages: Math.ceil(total / limit),
      currentPage: parseInt(page),
      total,
    });
  } catch (error) {
    // Eğer duplicate key hatası varsa, boş sonuç döndür
    if (error.code === 11000) {
      return res.json({
        jobOrders: [],
        totalPages: 0,
        currentPage: parseInt(req.query.page) || 1,
        total: 0,
      });
    }
    res.status(500).json({ message: error.message });
  }
};

// Get a single job order
exports.getJobOrder = async (req, res) => {
  try {
    const jobOrder = await JobOrder.findById(req.params.id)
      .populate('assignedTo', 'firstName lastName email')
      .populate('machine', 'name type')
      .populate('productionStage', 'name sequence')
      .populate('createdBy', 'firstName lastName email')
      .populate('updatedBy', 'firstName lastName email')
      .populate('department', '_id name code');

    if (!jobOrder) {
      return res.status(404).json({ 
        success: false,
        message: 'İş emri bulunamadı veya silinmiş olabilir.',
        code: 'JOB_ORDER_NOT_FOUND'
      });
    }

    res.json({
      success: true,
      data: jobOrder
    });
  } catch (error) {
    res.status(500).json({ 
      success: false,
      message: error.message,
      code: 'SERVER_ERROR'
    });
  }
};

// Update a job order
exports.updateJobOrder = async (req, res) => {
  try {
    const jobOrder = await JobOrder.findById(req.params.id);
    if (!jobOrder) {
      return res.status(404).json({ message: 'Job order not found' });
    }

    Object.assign(jobOrder, {
      ...req.body,
      updatedBy: req.user._id,
    });

    await jobOrder.save();

    // Populate user information after saving
    const updatedJobOrder = await JobOrder.findById(jobOrder._id)
      .populate('assignedTo', 'firstName lastName email')
      .populate('machine', 'name type')
      .populate('productionStage', 'name sequence')
      .populate('createdBy', 'firstName lastName email')
      .populate('updatedBy', 'firstName lastName email')
      .populate('department', '_id name code');

    res.json(updatedJobOrder);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

// Delete a job order
exports.deleteJobOrder = async (req, res) => {
  try {
    const jobOrder = await JobOrder.findByIdAndDelete(req.params.id);
    if (!jobOrder) {
      return res.status(404).json({ message: 'Job order not found' });
    }

    res.json({ message: 'Job order deleted successfully' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.updateJobStatus = async (req, res) => {
  try {
    const { status } = req.body;
    const jobOrder = await JobOrder.findById(req.params.id);
    
    if (!jobOrder) {
      return res.status(404).json({ message: 'Job order not found' });
    }

    const now = new Date();
    
    const calculateDuration = (startTime, endTime) => {
      const durationMs = endTime.getTime() - startTime.getTime();
      return Math.ceil(durationMs / (1000 * 60));
    };

    switch (status) {
      case 'In Progress':
        if (jobOrder.status === 'Planned' || jobOrder.status === 'Paused') {
          if (jobOrder.status === 'Planned') {
            jobOrder.actualStartTime = now;
            jobOrder.workingTimeSegments.push({
              startTime: now,
              endTime: null,
              duration: 0
            });
          } else if (jobOrder.status === 'Paused') {
            const lastPauseRecord = jobOrder.pauseHistory[jobOrder.pauseHistory.length - 1];
            if (lastPauseRecord && !lastPauseRecord.endPauseTime) {
              lastPauseRecord.endPauseTime = now;
              lastPauseRecord.pauseDuration = calculateDuration(lastPauseRecord.startPauseTime, now);
              jobOrder.totalPausedTime += lastPauseRecord.pauseDuration;
            }
            
            jobOrder.workingTimeSegments.push({
              startTime: now,
              endTime: null,
              duration: 0
            });
          }
        }
        break;
      
      case 'Paused':
        if (jobOrder.status === 'In Progress') {
          const lastWorkSegment = jobOrder.workingTimeSegments[jobOrder.workingTimeSegments.length - 1];
          if (lastWorkSegment && !lastWorkSegment.endTime) {
            lastWorkSegment.endTime = now;
            lastWorkSegment.duration = calculateDuration(lastWorkSegment.startTime, now);
            jobOrder.totalWorkingTime += lastWorkSegment.duration;
          }
          
          jobOrder.pauseHistory.push({
            startPauseTime: now,
            endPauseTime: null,
            pauseDuration: 0
          });
        }
        break;
      
      case 'Completed':
        if (jobOrder.status === 'In Progress' || jobOrder.status === 'Paused') {
          const lastWorkSegment = jobOrder.workingTimeSegments[jobOrder.workingTimeSegments.length - 1];
          if (lastWorkSegment && !lastWorkSegment.endTime) {
            lastWorkSegment.endTime = now;
            lastWorkSegment.duration = calculateDuration(lastWorkSegment.startTime, now);
            jobOrder.totalWorkingTime += lastWorkSegment.duration;
          }

          const lastPauseRecord = jobOrder.pauseHistory[jobOrder.pauseHistory.length - 1];
          if (lastPauseRecord && !lastPauseRecord.endPauseTime) {
            lastPauseRecord.endPauseTime = now;
            lastPauseRecord.pauseDuration = calculateDuration(lastPauseRecord.startPauseTime, now);
            jobOrder.totalPausedTime += lastPauseRecord.pauseDuration;
          }

          jobOrder.actualEndTime = now;
          jobOrder.actualDuration = calculateDuration(jobOrder.actualStartTime, now);
        }
        break;
      
      case 'Cancelled':
        const openWorkSegments = jobOrder.workingTimeSegments.filter(segment => !segment.endTime);
        openWorkSegments.forEach(segment => {
          segment.endTime = now;
          segment.duration = calculateDuration(segment.startTime, now);
          jobOrder.totalWorkingTime += segment.duration;
        });

        const openPauseRecords = jobOrder.pauseHistory.filter(record => !record.endPauseTime);
        openPauseRecords.forEach(record => {
          record.endPauseTime = now;
          record.pauseDuration = calculateDuration(record.startPauseTime, now);
          jobOrder.totalPausedTime += record.pauseDuration;
        });
        break;
    }

    jobOrder.status = status;
    jobOrder.updatedBy = req.user._id;

    await jobOrder.save();

    // Populate user information after saving
    const updatedJobOrder = await JobOrder.findById(jobOrder._id)
      .populate('assignedTo', 'firstName lastName email')
      .populate('machine', 'name type')
      .populate('productionStage', 'name sequence')
      .populate('createdBy', 'firstName lastName email')
      .populate('updatedBy', 'firstName lastName email')
      .populate('department', '_id name code');

    // Send notifications based on status change
    if (jobOrder.assignedTo) {
      let notificationTitle = '';
      let notificationMessage = '';
      let notificationType = 'info';

      switch (status) {
        case 'In Progress':
          notificationTitle = 'İş Emri Başlatıldı';
          notificationMessage = `${jobOrder.title} iş emri başlatıldı.`;
          break;
        case 'Paused':
          notificationTitle = 'İş Emri Duraklatıldı';
          notificationMessage = `${jobOrder.title} iş emri duraklatıldı.`;
          notificationType = 'warning';
          break;
        case 'Completed':
          notificationTitle = 'İş Emri Tamamlandı';
          notificationMessage = `${jobOrder.title} iş emri tamamlandı.`;
          notificationType = 'success';
          break;
        case 'Cancelled':
          notificationTitle = 'İş Emri İptal Edildi';
          notificationMessage = `${jobOrder.title} iş emri iptal edildi.`;
          notificationType = 'error';
          break;
      }

      await notificationService.createNotification(
        jobOrder.assignedTo,
        notificationTitle,
        notificationMessage,
        notificationType,
        `/dashboard/job-orders/${jobOrder._id}`
      );
    }

    res.json(updatedJobOrder);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

// Add delay record
exports.addDelay = async (req, res) => {
  try {
    const { reason, duration } = req.body;
    const jobOrder = await JobOrder.findById(req.params.id);
    
    if (!jobOrder) {
      return res.status(404).json({ message: 'Job order not found' });
    }

    jobOrder.delays.push({
      reason,
      duration,
      timestamp: new Date(),
    });

    await jobOrder.save();
    res.json(jobOrder);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
}; 