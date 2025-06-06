const express = require('express');
const router = express.Router();
const {
  getMachinePerformanceReport,
  getFactoryPerformanceReport,
  getAnomalyReport,
  getCollectionStatus,
  startMetricsCollection,
  stopMetricsCollection,
  getMachinesForReporting
} = require('../controllers/reportsController');
const { protect } = require('../middleware/auth');

router.use(protect);

router.get('/machines', getMachinesForReporting);
router.get('/machine/:machineId/performance', getMachinePerformanceReport);
router.get('/factory/performance', getFactoryPerformanceReport);
router.get('/anomalies', getAnomalyReport);
router.get('/collection/status', getCollectionStatus);
router.post('/collection/start', startMetricsCollection);
router.post('/collection/stop', stopMetricsCollection);

module.exports = router;