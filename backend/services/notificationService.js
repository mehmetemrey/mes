const Notification = require('../models/Notification');
const User = require('../models/User');

let io = null;

// Set the Socket.IO instance
exports.setIO = (socketIO) => {
  io = socketIO;
};

// Helper function to emit notification events
const emitNotificationEvent = (userId, eventName, data) => {
  if (io) {
    
    // Make sure we're using the string version of userId for the room
    const room = userId.toString();
    
    // Emit to the user's room
    io.to(room).emit(eventName, data);
  }
};

// Machine anomaly thresholds - Made more strict to reduce notifications
const ANOMALY_THRESHOLDS = {
  temperature: { min: 5, max: 90 }, // Only extreme temperatures
  rpm: { min: 50, max: 3000 }, // Wider range
  power: { min: 0.1, max: 12 }, // Wider range  
  cycleTime: { max: 180 }, // More lenient
  rejectionRate: { max: 25 } // More lenient
};

// Production line status tracking
const productionLineStatus = new Map();

// Notification cooldown system
const anomalyNotificationCooldown = new Map(); // machineId -> lastNotificationTime
const productionLineNotificationCooldown = new Map(); // lineId -> lastNotificationTime
const NOTIFICATION_COOLDOWN_MINUTES = 120; // 2 hours between notifications for same issue
const PRODUCTION_LINE_COOLDOWN_MINUTES = 180; // 3 hours for production line notifications

// Create a notification for a specific user
exports.createNotification = async (userId, title, message, type = 'info', link = null) => {
  try {
    const notification = new Notification({
      userId,
      title,
      message,
      type,
      link,
      createdAt: new Date()
    });
    await notification.save();

    // Emit the notification through Socket.IO
    emitNotificationEvent(userId, 'notification', notification);

    return notification;
  } catch (error) {
    console.error('Error creating notification:', error);
    throw error;
  }
};

// Create notifications for all users
exports.createNotificationForAllUsers = async (title, message, type = 'info', link = null) => {
  try {
    const users = await User.find();
    const notifications = [];
    
    // Create individual notifications for each user
    for (const user of users) {
      const notification = new Notification({
        userId: user._id,
        title,
        message,
        type,
        link,
        createdAt: new Date()
      });
      await notification.save();
      notifications.push(notification);
      
      // Emit to each user individually
      emitNotificationEvent(user._id, 'notification', notification);
    }
    
    return notifications;
  } catch (error) {
    console.error('Error creating notifications for all users:', error);
    throw error;
  }
};

// Machine anomaly detection
exports.checkMachineAnomalies = async (machineData) => {
  try {
    const anomalies = [];
    
    for (const machine of machineData) {
      const issues = [];
      
      // Temperature check
      if (machine.temperature < ANOMALY_THRESHOLDS.temperature.min || 
          machine.temperature > ANOMALY_THRESHOLDS.temperature.max) {
        issues.push(`Sıcaklık anormal: ${machine.temperature}°C`);
      }
      
      // RPM check
      if (machine.rpm < ANOMALY_THRESHOLDS.rpm.min || 
          machine.rpm > ANOMALY_THRESHOLDS.rpm.max) {
        issues.push(`RPM anormal: ${machine.rpm}`);
      }
      
      // Power check
      if (machine.power < ANOMALY_THRESHOLDS.power.min || 
          machine.power > ANOMALY_THRESHOLDS.power.max) {
        issues.push(`Güç tüketimi anormal: ${machine.power}kW`);
      }
      
      // Cycle time check
      if (machine.cycleTime > ANOMALY_THRESHOLDS.cycleTime.max) {
        issues.push(`Döngü süresi çok uzun: ${machine.cycleTime}s`);
      }
      
      // Rejection rate check
      const rejectionRate = machine.totalProduced > 0 ? 
        (machine.rejectedCount / machine.totalProduced) * 100 : 0;
      if (rejectionRate > ANOMALY_THRESHOLDS.rejectionRate.max) {
        issues.push(`Yüksek red oranı: %${rejectionRate.toFixed(1)}`);
      }
      
      // Alarm check
      if (machine.isAlarmActive) {
        issues.push('Makine alarmı aktif');
      }
      
      // Status check
      if (machine.status === 'Breakdown') {
        issues.push('Makine arızalı durumda');
      }
      
      if (issues.length > 0) {
        anomalies.push({
          machineId: machine.machineId,
          machineType: machine.machineType,
          issues: issues,
          severity: this.calculateSeverity(issues),
          timestamp: new Date()
        });
      }
    }
    
    // Send notifications for anomalies
    if (anomalies.length > 0) {
      await this.sendMachineAnomalyNotifications(anomalies);
    }
    
    return anomalies;
  } catch (error) {
    console.error('Error checking machine anomalies:', error);
    throw error;
  }
};

// Calculate anomaly severity
exports.calculateSeverity = (issues) => {
  const highSeverityKeywords = ['arızalı', 'alarm', 'sıcaklık'];
  const mediumSeverityKeywords = ['rpm', 'güç', 'red oranı'];
  
  const hasHighSeverity = issues.some(issue => 
    highSeverityKeywords.some(keyword => 
      issue.toLowerCase().includes(keyword)
    )
  );
  
  if (hasHighSeverity) return 'high';
  
  const hasMediumSeverity = issues.some(issue => 
    mediumSeverityKeywords.some(keyword => 
      issue.toLowerCase().includes(keyword)
    )
  );
  
  return hasMediumSeverity ? 'medium' : 'low';
};

// Send machine anomaly notifications
exports.sendMachineAnomalyNotifications = async (anomalies) => {
  try {
    const currentTime = new Date();
    
    for (const anomaly of anomalies) {
      const machineId = anomaly.machineId;
      
      // Create a unique key for this specific anomaly combination
      const anomalyKey = `${machineId}-${anomaly.issues.sort().join('|')}`;
      const lastNotificationTime = anomalyNotificationCooldown.get(anomalyKey);
      
      // Check cooldown - if last notification was recent, skip this anomaly
      if (lastNotificationTime) {
        const timeDiff = (currentTime - lastNotificationTime) / (1000 * 60); // in minutes
        if (timeDiff < NOTIFICATION_COOLDOWN_MINUTES) {
          console.log(`Skipping anomaly notification for ${machineId} - cooldown active (${timeDiff.toFixed(1)} min ago)`);
          continue;
        }
      }
      
      // Only send notification for CRITICAL issues only
      const criticalKeywords = ['arızalı', 'alarm aktif', 'breakdown'];
      const isCritical = anomaly.issues.some(issue => 
        criticalKeywords.some(keyword => 
          issue.toLowerCase().includes(keyword)
        )
      );
      
      // Skip ALL non-critical anomalies to reduce spam
      if (!isCritical && anomaly.severity !== 'high') {
        continue;
      }
      
      // Extra filter: Only send if temperature is EXTREMELY high/low or machine is broken
      const hasExtremeTempIssue = anomaly.issues.some(issue => {
        const tempMatch = issue.match(/sıcaklık.*?(\d+)/);
        if (tempMatch) {
          const temp = parseInt(tempMatch[1]);
          return temp > 90 || temp < 5; // Only extreme temperatures
        }
        return false;
      });
      
      if (!isCritical && !hasExtremeTempIssue) {
        continue;
      }
      
      const title = `⚠️ Makine Anomalisi - ${anomaly.machineType}`;
      const message = `Makine ID: ${anomaly.machineId}\n\nTespit edilen sorunlar:\n${anomaly.issues.join('\n')}`;
      
      const notificationType = anomaly.severity === 'high' ? 'error' : 
                              anomaly.severity === 'medium' ? 'warning' : 'info';
      
      // Send to all users (can be filtered by role/department later)
      await this.createNotificationForAllUsers(
        title, 
        message, 
        notificationType,
        `dashboard/machines/${anomaly.machineId}`
      );
      
      // Update cooldown for this specific anomaly combination
      anomalyNotificationCooldown.set(anomalyKey, currentTime);
      console.log(`Sent anomaly notification for ${machineId} - cooldown set for ${NOTIFICATION_COOLDOWN_MINUTES} minutes`);
    }
  } catch (error) {
    console.error('Error sending machine anomaly notifications:', error);
    throw error;
  }
};

// Production line monitoring
exports.monitorProductionLine = async (productionLineId, machineData) => {
  try {
    const lineData = machineData.filter(machine => 
      machine.productionLineId === productionLineId
    );
    
    if (lineData.length === 0) return;
    
    const currentStatus = this.analyzeProductionLineStatus(lineData);
    const previousStatus = productionLineStatus.get(productionLineId);
    
    // Check for status changes
    if (previousStatus && previousStatus.status !== currentStatus.status) {
      await this.sendProductionLineNotification(productionLineId, currentStatus, previousStatus);
    }
    
    // Update status
    productionLineStatus.set(productionLineId, {
      ...currentStatus,
      lastUpdated: new Date()
    });
    
    return currentStatus;
  } catch (error) {
    console.error('Error monitoring production line:', error);
    throw error;
  }
};

// Analyze production line status
exports.analyzeProductionLineStatus = (lineData) => {
  const totalMachines = lineData.length;
  const runningMachines = lineData.filter(m => m.status === 'Running').length;
  const brokenMachines = lineData.filter(m => m.status === 'Breakdown').length;
  const maintenanceMachines = lineData.filter(m => m.status === 'Maintenance').length;
  
  const efficiency = (runningMachines / totalMachines) * 100;
  const totalProduction = lineData.reduce((sum, m) => sum + m.totalProduced, 0);
  const totalRejected = lineData.reduce((sum, m) => sum + m.rejectedCount, 0);
  const qualityRate = totalProduction > 0 ? 
    ((totalProduction - totalRejected) / totalProduction) * 100 : 100;
  
  let status = 'optimal';
  if (efficiency < 50) {
    status = 'critical';
  } else if (efficiency < 75 || qualityRate < 85) {
    status = 'warning';
  } else if (efficiency < 90 || qualityRate < 95) {
    status = 'suboptimal';
  }
  
  return {
    status,
    efficiency: efficiency.toFixed(1),
    qualityRate: qualityRate.toFixed(1),
    totalMachines,
    runningMachines,
    brokenMachines,
    maintenanceMachines,
    totalProduction,
    totalRejected
  };
};

// Send production line notification
exports.sendProductionLineNotification = async (lineId, currentStatus, previousStatus) => {
  try {
    const currentTime = new Date();
    
    let title = '';
    let message = '';
    let type = 'info';
    let shouldSend = false;
    
    if (currentStatus.status === 'critical' && previousStatus.status !== 'critical') {
      title = '🚨 Üretim Hattı Kritik Durumda';
      message = `Üretim Hattı ${lineId} kritik duruma geçti.\nVerimlilik: %${currentStatus.efficiency}\nKalite Oranı: %${currentStatus.qualityRate}\nÇalışan Makine: ${currentStatus.runningMachines}/${currentStatus.totalMachines}`;
      type = 'error';
      shouldSend = true;
    } else if (currentStatus.status === 'warning' && previousStatus.status === 'optimal') {
      title = '⚠️ Üretim Hattı Dikkat Gerektiriyor';
      message = `Üretim Hattı ${lineId} performans düşüşü yaşıyor.\nVerimlilik: %${currentStatus.efficiency}\nKalite Oranı: %${currentStatus.qualityRate}`;
      type = 'warning';
      shouldSend = true;
    } else if (currentStatus.status === 'optimal' && previousStatus.status !== 'optimal') {
      title = '✅ Üretim Hattı Normale Döndü';
      message = `Üretim Hattı ${lineId} optimal duruma geçti.\nVerimlilik: %${currentStatus.efficiency}\nKalite Oranı: %${currentStatus.qualityRate}`;
      type = 'success';
      shouldSend = true;
    }
    
    if (title && shouldSend) {
      // Check cooldown for production line notifications
      const notificationKey = `${lineId}-${currentStatus.status}`;
      const lastNotificationTime = productionLineNotificationCooldown.get(notificationKey);
      
      if (lastNotificationTime) {
        const timeDiff = (currentTime - lastNotificationTime) / (1000 * 60); // in minutes
        if (timeDiff < PRODUCTION_LINE_COOLDOWN_MINUTES) {
          console.log(`Skipping production line notification for ${lineId} - cooldown active (${timeDiff.toFixed(1)} min ago)`);
          return;
        }
      }
      
      await this.createNotificationForAllUsers(
        title,
        message,
        type,
        `/production-lines/${lineId}`
      );
      
      // Set cooldown for this notification
      productionLineNotificationCooldown.set(notificationKey, currentTime);
      console.log(`Sent production line notification for ${lineId} - cooldown set for ${PRODUCTION_LINE_COOLDOWN_MINUTES} minutes`);
    }
  } catch (error) {
    console.error('Error sending production line notification:', error);
    throw error;
  }
};

// Shift change notifications
exports.createShiftChangeNotification = async (shiftData) => {
  try {
    const title = '🔄 Vardiya Değişimi';
    const message = `Yeni vardiya başladı: ${shiftData.newShift}\nÖnceki vardiya performansı:\n- Toplam üretim: ${shiftData.totalProduction}\n- Kalite oranı: %${shiftData.qualityRate}\n- Verimlilik: %${shiftData.efficiency}`;
    
    await this.createNotificationForAllUsers(
      title,
      message,
      'info',
      '/dashboard'
    );
  } catch (error) {
    console.error('Error creating shift change notification:', error);
    throw error;
  }
};

// Production target notifications
const targetNotificationCooldown = new Map(); // departmentId-type -> lastNotificationTime

exports.checkProductionTargets = async (departmentTargets) => {
  try {
    const currentTime = new Date();
    
    for (const target of departmentTargets) {
      const achievement = (target.currentProduction / target.dailyTarget) * 100;
      
      if (achievement >= 100 && !target.targetReachedNotified) {
        const notificationKey = `${target.departmentId}-target-reached`;
        const lastNotificationTime = targetNotificationCooldown.get(notificationKey);
        
        // Only send once per day for target reached
        if (!lastNotificationTime || 
            (currentTime - lastNotificationTime) / (1000 * 60 * 60) > 24) {
          
          await this.createNotificationForAllUsers(
            '🎯 Hedef Tamamlandı!',
            `${target.departmentName} günlük üretim hedefini tamamladı!\nHedef: ${target.dailyTarget}\nGerçekleşen: ${target.currentProduction}`,
            'success',
            `/departments/${target.departmentId}`
          );
          
          targetNotificationCooldown.set(notificationKey, currentTime);
          target.targetReachedNotified = true;
        }
      } else if (achievement < 80 && target.timeRemaining < 4) { // 4 hours remaining
        const notificationKey = `${target.departmentId}-target-risk`;
        const lastNotificationTime = targetNotificationCooldown.get(notificationKey);
        
        // Only send once every 2 hours for risk warnings
        if (!lastNotificationTime || 
            (currentTime - lastNotificationTime) / (1000 * 60) > 120) {
          
          await this.createNotificationForAllUsers(
            '⏰ Hedef Risk Altında',
            `${target.departmentName} günlük hedefi risk altında!\nHedef: ${target.dailyTarget}\nMevcut: ${target.currentProduction} (%${achievement.toFixed(1)})\nKalan süre: ${target.timeRemaining} saat`,
            'warning',
            `/departments/${target.departmentId}`
          );
          
          targetNotificationCooldown.set(notificationKey, currentTime);
        }
      }
    }
  } catch (error) {
    console.error('Error checking production targets:', error);
    throw error;
  }
};

// Get notifications for a user
exports.getUserNotifications = async (userId, limit = 30) => {
  try {
    return await Notification.find({ userId })
      .sort({ createdAt: -1 })
      .limit(limit);
  } catch (error) {
    console.error('Error getting user notifications:', error);
    throw error;
  }
};

// Mark notification as read
exports.markAsRead = async (notificationId) => {
  try {
    const notification = await Notification.findByIdAndUpdate(
      notificationId,
      { read: true },
      { new: true }
    );

    if (notification) {
      // Emit the updated notification through Socket.IO
      emitNotificationEvent(notification.userId, 'notification-update', notification);
    }

    return notification;
  } catch (error) {
    console.error('Error marking notification as read:', error);
    throw error;
  }
};

// Toggle notification read status
exports.toggleReadStatus = async (notificationId) => {
  try {
    const notification = await Notification.findById(notificationId);
    
    if (!notification) {
      return null;
    }

    // Toggle the read status
    notification.read = !notification.read;
    await notification.save();

    // Emit the updated notification through Socket.IO
    emitNotificationEvent(notification.userId, 'notification-update', notification);

    return notification;
  } catch (error) {
    console.error('Error toggling notification read status:', error);
    throw error;
  }
};

// Mark all notifications as read for a user
exports.markAllAsRead = async (userId) => {
  try {
    const result = await Notification.updateMany(
      { userId, read: false },
      { read: true }
    );

    // Emit the update through Socket.IO
    emitNotificationEvent(userId, 'notifications-all-read', null);

    return result;
  } catch (error) {
    console.error('Error marking all notifications as read:', error);
    throw error;
  }
};

// Delete a notification
exports.deleteNotification = async (notificationId) => {
  try {
    const notification = await Notification.findById(notificationId);
    
    if (!notification) {
      return null;
    }
    
    const userId = notification.userId;
    
    // Delete the notification
    await Notification.findByIdAndDelete(notificationId);

    // Emit the deletion through Socket.IO
    emitNotificationEvent(userId, 'notification-delete', notificationId);

    return notification;
  } catch (error) {
    throw error;
  }
};

// Delete all notifications for a user
exports.deleteAllNotifications = async (userId) => {
  try {
    const result = await Notification.deleteMany({ userId });
    
    // Emit event to clear notifications
    emitNotificationEvent(userId, 'notifications-all-deleted', null);
    
    return result;
  } catch (error) {
    throw error;
  }
};

// Clean up old cooldown entries (call this periodically)
exports.cleanupCooldowns = () => {
  try {
    const currentTime = new Date();
    const maxAge = 24 * 60 * 60 * 1000; // 24 hours in milliseconds
    
    // Clean anomaly cooldowns
    for (const [key, timestamp] of anomalyNotificationCooldown.entries()) {
      if (currentTime - timestamp > maxAge) {
        anomalyNotificationCooldown.delete(key);
      }
    }
    
    // Clean production line cooldowns
    for (const [key, timestamp] of productionLineNotificationCooldown.entries()) {
      if (currentTime - timestamp > maxAge) {
        productionLineNotificationCooldown.delete(key);
      }
    }
    
    // Clean target cooldowns
    for (const [key, timestamp] of targetNotificationCooldown.entries()) {
      if (currentTime - timestamp > maxAge) {
        targetNotificationCooldown.delete(key);
      }
    }
    
  } catch (error) {
  }
};

// Start periodic cooldown cleanup (call this when server starts)
exports.startCooldownCleanup = () => {
  // Clean up every hour
  setInterval(this.cleanupCooldowns, 60 * 60 * 1000);
}; 
