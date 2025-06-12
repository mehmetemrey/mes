import React, { useState, useEffect, useCallback, useRef } from 'react';
import { PageContainer } from '@ant-design/pro-components';
import { 
  Card, 
  Row, 
  Col, 
  Statistic, 
  Button, 
  Empty, 
  Tag,
  Space,
  Typography,
  Progress,
  List,
  Avatar,
  Divider,
  Grid,
  Badge,
  Alert,
  Tooltip
} from 'antd';
import { 
  UserOutlined, 
  ClusterOutlined, 
  DesktopOutlined, 
  FileTextOutlined,
  PlusOutlined,
  EyeOutlined,
  ClockCircleOutlined,
  CheckCircleOutlined,
  PauseCircleOutlined,
  InfoCircleOutlined,
  LineChartOutlined,
  DashboardOutlined,
  WarningOutlined,
  FireOutlined,
  ThunderboltOutlined
} from '@ant-design/icons';
import { useNavigate } from 'umi';
import { Pie, Bar, Line, Column } from '@ant-design/charts';

import { jobOrderService, JobOrder } from '@/services/jobOrderService';
import { userService, User } from '@/services/userService';
import { machineService, Machine } from '@/services/machineService';
import departmentService, { Department } from '@/services/departmentService';
import announcementService, { Announcement } from '@/services/announcementService';
import notificationService, { Notification } from '@/services/notificationService';
import productionLineService, { ProductionLine } from '@/services/productionLineService';

import LoadingSpinner from '@/components/LoadingSpinner';
import { useLiveData, MachineMetrics } from '@/contexts/LiveDataContext';

const { Title, Text } = Typography;
const { useBreakpoint } = Grid;

const Dashboard: React.FC = () => {
  const navigate = useNavigate();
  const screens = useBreakpoint();

  const [jobOrders, setJobOrders] = useState<JobOrder[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [machines, setMachines] = useState<Machine[]>([]);
  const [departments, setDepartments] = useState<Department[]>([]);
  const [announcements, setAnnouncements] = useState<Announcement[]>([]);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [productionLines, setProductionLines] = useState<ProductionLine[]>([]);

  const { 
    liveMachineData, 
    isWebSocketConnected: isLiveConnected, 
    error: liveDataError 
  } = useLiveData();

  const [loading, setLoading] = useState<boolean>(true);

  const [stats, setStats] = useState({
    jobOrders: {
      total: 0,
      inProgress: 0,
      completed: 0,
      paused: 0
    },
    users: {
      total: 0,
      active: 0,
      inactive: 0
    },
    machines: {
      total: 0,
      operational: 0,
      maintenance: 0,
      breakdown: 0
    },
    departments: {
      total: 0,
      types: {} as Record<string, number>
    },
    productionLines: {
      total: 0,
      averageEfficiency: 0,
      totalCapacity: 0,
      activeLines: 0
    }
  });

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        setLoading(true);

        const jobOrderResponse = await jobOrderService.getJobOrders({ 
          page: 1, 
          limit: 10 
        });
        setJobOrders(jobOrderResponse.jobOrders || []);

        const usersData = await userService.getUsers();
        setUsers(usersData || []);

        const machinesData = await machineService.getMachines();
        setMachines(machinesData || []);

        const departmentsData = await departmentService.getDepartments();
        setDepartments(departmentsData || []);

        const productionLinesResponse = await productionLineService.getProductionLines();
        setProductionLines(productionLinesResponse.productionLines || []);

        const annData: Announcement[] = await announcementService.getAnnouncements();
        const safeAnnData = Array.isArray(annData) ? annData : [];
        const filteredAnnouncements = safeAnnData.filter(a => a.type === 'announcement') || [];
        setAnnouncements(filteredAnnouncements.slice(0, 3));

        const notifData = await notificationService.getNotifications();
        const safeNotifData = Array.isArray(notifData) ? notifData : [];
        const filteredNotifications = safeNotifData.filter(n => 
          ['info', 'success', 'warning', 'error'].includes(n.type)
        ) || [];
        setNotifications(filteredNotifications.slice(0, 3));

        const calculatedStats = {
          jobOrders: calculateJobOrderStats(jobOrderResponse.jobOrders || []),
          users: calculateUserStats(usersData || []),
          machines: calculateMachineStats(machinesData || []),
          departments: calculateDepartmentStats(departmentsData || []),
          productionLines: calculateProductionLineStats(productionLinesResponse.productionLines || [])
        };
        setStats(calculatedStats);

        setLoading(false);
      } catch (error) {
        setLoading(false);
      }
    };

    fetchDashboardData();
  }, []);

  // Dashboard specific analytics (live data is now handled by context)
  useEffect(() => {

  }, [liveMachineData, isLiveConnected, liveDataError]);

  // Live data analysis functions
  const analyzeLiveData = useCallback(() => {
    // Ensure liveMachineData is always an array
    const safeData = Array.isArray(liveMachineData) ? liveMachineData : [];
    
    if (safeData.length === 0) {
      return {
        totalMachines: 0,
        runningMachines: 0,
        anomalies: 0,
        averageTemperature: 0,
        averageEfficiency: 0,
        totalProduction: 0,
        criticalMachines: []
      };
    }

    // Status helper functions
    const getRunningStatus = (status: string) => {
      return status === 'Running' || status === 'Operational' || status === 'Çalışır Durumda';
    };

    const getBreakdownStatus = (status: string) => {
      return status === 'Breakdown' || status === 'Arızalı';
    };

    const getMaintenanceStatus = (status: string) => {
      return status === 'Maintenance' || status === 'Bakımda';
    };

    const getIdleStatus = (status: string) => {
      return status === 'Idle' || status === 'Boşta';
    };

    const runningMachines = safeData.filter(m => getRunningStatus(m.status)).length;
    
    // Add safety checks for numeric operations
    const totalTemperature = safeData.reduce((sum, m) => {
      const temp = typeof m.temperature === 'number' ? m.temperature : 0;
      return sum + temp;
    }, 0);
    
    const totalProduction = safeData.reduce((sum, m) => {
      const produced = typeof m.totalProduced === 'number' ? m.totalProduced : 0;
      return sum + produced;
    }, 0);

    // Enhanced anomaly detection with safety checks
    const anomalyMachines = safeData.filter(m => {
      if (!m || typeof m !== 'object') return false;
      
      const temp = typeof m.temperature === 'number' ? m.temperature : 0;
      const rpm = typeof m.rpm === 'number' ? m.rpm : 0;
      const power = typeof m.power === 'number' ? m.power : 0;
      
      const tempAnomaly = temp > 85 || temp < 10;
      const rpmAnomaly = rpm > 2800 || rpm < 100;
      const powerAnomaly = power > 9.5 || power < 0.5;
      const alarmActive = Boolean(m.isAlarmActive);
      const statusAnomaly = getBreakdownStatus(m.status || '');
      
      return tempAnomaly || rpmAnomaly || powerAnomaly || alarmActive || statusAnomaly;
    });

    // Critical machines with safety checks
    const criticalMachines = safeData.filter(m => {
      if (!m || typeof m !== 'object') return false;
      
      const temp = typeof m.temperature === 'number' ? m.temperature : 0;
      return (
        temp >= 85 || 
        Boolean(m.isAlarmActive) || 
        getBreakdownStatus(m.status || '') ||
        (temp > 80 && Boolean(m.isAlarmActive))
      );
    });

    return {
      totalMachines: safeData.length,
      runningMachines,
      anomalies: anomalyMachines.length,
      averageTemperature: safeData.length > 0 ? totalTemperature / safeData.length : 0,
      averageEfficiency: safeData.length > 0 ? (runningMachines / safeData.length) * 100 : 0,
      totalProduction,
      criticalMachines,
      anomalyDetails: anomalyMachines.map(m => ({
        id: m.machineId || 'unknown',
        type: m.machineType || 'unknown',
        issues: [
          ...(m.temperature > 85 || m.temperature < 10 ? [`Sıcaklık: ${m.temperature}°C`] : []),
          ...(m.rpm > 2800 || m.rpm < 100 ? [`RPM: ${m.rpm}`] : []),
          ...(m.power > 9.5 || m.power < 0.5 ? [`Güç: ${m.power}kW`] : []),
          ...(m.isAlarmActive ? ['Alarm Aktif'] : []),
          ...(getBreakdownStatus(m.status || '') ? ['Arızalı'] : [])
        ]
      }))
    };
  }, [liveMachineData]);

  // Helper functions to calculate statistics with safety checks
  const calculateJobOrderStats = (orders: JobOrder[]) => {
    if (!Array.isArray(orders)) return { total: 0, inProgress: 0, completed: 0, paused: 0 };
    
    return orders.reduce((acc, order) => {
      if (!order || typeof order !== 'object') return acc;
      
      acc.total++;
      const status = String(order.status || '').toLowerCase();
      
      if (status === 'in progress' || status === 'devam ediyor') {
        acc.inProgress++;
      } else if (status === 'completed' || status === 'tamamlandı') {
        acc.completed++;
      } else if (status === 'paused' || status === 'duraklatıldı') {
        acc.paused++;
      }
      
      return acc;
    }, { total: 0, inProgress: 0, completed: 0, paused: 0 });
  };

  const calculateUserStats = (users: User[]) => {
    if (!Array.isArray(users)) return { total: 0, active: 0, inactive: 0 };
    
    return users.reduce((acc, user) => {
      if (!user || typeof user !== 'object') return acc;
      
      acc.total++;
      if (user.isActive) {
        acc.active++;
      } else {
        acc.inactive++;
      }
      return acc;
    }, { total: 0, active: 0, inactive: 0 });
  };

  const calculateMachineStats = (machines: Machine[]) => {
    if (!Array.isArray(machines)) return { total: 0, operational: 0, maintenance: 0, breakdown: 0 };
    
    return machines.reduce((acc, machine) => {
      if (!machine || typeof machine !== 'object') return acc;
      
      acc.total++;
      const status = String(machine.status || '').toLowerCase();
      
      if (status === 'operational' || status === 'çalışır durumda') {
        acc.operational++;
      } else if (status === 'maintenance' || status === 'bakımda') {
        acc.maintenance++;
      } else if (status === 'breakdown' || status === 'arızalı') {
        acc.breakdown++;
      }
      
      return acc;
    }, { total: 0, operational: 0, maintenance: 0, breakdown: 0 });
  };

  const calculateDepartmentStats = (departments: Department[]) => {
    if (!Array.isArray(departments)) return { total: 0, types: {} as Record<string, number> };
    
    return departments.reduce((acc, dept) => {
      if (!dept || typeof dept !== 'object') return acc;
      
      acc.total++;
      const type = String(dept.type || 'Diğer');
      acc.types[type] = (acc.types[type] || 0) + 1;
      return acc;
    }, { total: 0, types: {} as Record<string, number> });
  };

  const calculateProductionLineStats = (lines: ProductionLine[]) => {
    if (!Array.isArray(lines)) return { total: 0, averageEfficiency: 0, totalCapacity: 0, activeLines: 0 };
    
    return lines.reduce((acc, line) => {
      if (!line || typeof line !== 'object') return acc;
      
      acc.total++;
      acc.averageEfficiency += Number(line.efficiency) || 0;
      acc.totalCapacity += Number(line.capacity) || 0;
      if (String(line.status).toLowerCase() === 'aktif') {
        acc.activeLines++;
      }
      return acc;
    }, { total: 0, averageEfficiency: 0, totalCapacity: 0, activeLines: 0 });
  };


  // Render functions
  const renderLiveDataSummary = () => {
    const liveAnalysis = analyzeLiveData();
    
    return (
      <Card 
        title={
          <Space>
            <DashboardOutlined />
            <span>Canlı Makine Verileri</span>
            <Badge 
              status={isLiveConnected ? 'success' : 'error'} 
              text={isLiveConnected ? 'Bağlı' : 'Bağlantı Yok'} 
            />
          </Space>
        }
        extra={
          <Button 
            type="link" 
            onClick={() => navigate('/dashboard/machines-live')}
          >
            Detaylı Görünüm
          </Button>
        }
        style={{ marginBottom: 16 }}
      >
        {liveDataError && (
          <Alert 
            message={liveDataError} 
            type="warning" 
            showIcon 
            style={{ marginBottom: 16 }} 
          />
        )}
        
        {/* İlk Satır: Genel Durum */}
        <Row gutter={[16, 16]}>
          <Col xs={12} sm={6} md={6}>
            <Statistic
              title="Toplam Makine"
              value={liveAnalysis.totalMachines}
              prefix={<DesktopOutlined />}
              valueStyle={{ color: '#1890ff' }}
            />
          </Col>
          <Col xs={12} sm={6} md={6}>
            <Statistic
              title="Çalışan"
              value={liveAnalysis.runningMachines}
              prefix={<CheckCircleOutlined />}
              valueStyle={{ color: '#52c41a' }}
            />
            <Progress 
              percent={liveAnalysis.totalMachines > 0 ? 
                Math.round((liveAnalysis.runningMachines / liveAnalysis.totalMachines) * 100) : 0
              } 
              size="small" 
              status="active"
            />
          </Col>
          <Col xs={12} sm={6} md={6}>
            <Statistic
              title="Anomali"
              value={liveAnalysis.anomalies}
              prefix={<WarningOutlined />}
              valueStyle={{ color: liveAnalysis.anomalies > 0 ? '#ff4d4f' : '#52c41a' }}
            />
          </Col>
          <Col xs={12} sm={6} md={6}>
            <Statistic
              title="Verimlilik"
              value={liveAnalysis.averageEfficiency.toFixed(1)}
              suffix="%"
              prefix={<LineChartOutlined />}
              valueStyle={{ 
                color: liveAnalysis.averageEfficiency >= 80 ? '#52c41a' : 
                       liveAnalysis.averageEfficiency >= 60 ? '#faad14' : '#ff4d4f' 
              }}
            />
          </Col>
        </Row>

        {/* İkinci Satır: Performans Metrikleri */}
        <Row gutter={[16, 16]} style={{ marginTop: 16 }}>
          <Col xs={12} sm={8} md={6}>
            <Statistic
              title="Ort. Sıcaklık"
              value={liveAnalysis.averageTemperature.toFixed(1)}
              suffix="°C"
              prefix={<FireOutlined />}
              valueStyle={{ 
                color: liveAnalysis.averageTemperature > 80 ? '#ff4d4f' : 
                       liveAnalysis.averageTemperature > 60 ? '#faad14' : '#52c41a' 
              }}
            />
          </Col>
          <Col xs={12} sm={8} md={6}>
            <Statistic
              title="Toplam Üretim"
              value={liveAnalysis.totalProduction}
              prefix={<ThunderboltOutlined />}
              valueStyle={{ color: '#1890ff' }}
            />
          </Col>
          <Col xs={24} sm={8} md={12}>
            <div style={{ textAlign: 'center' }}>
              <Text strong>Kritik Durum Makineleri</Text>
              <div style={{ marginTop: 8 }}>
                {liveAnalysis.criticalMachines.length > 0 ? (
                  <Space wrap>
                    {liveAnalysis.criticalMachines.slice(0, 3).map((machine, index) => {
                      const issues = [];
                      if (machine.temperature >= 85) issues.push(`Sıcaklık: ${machine.temperature}°C`);
                      if (machine.isAlarmActive) issues.push('Alarm Aktif');
                      if (machine.status === 'Breakdown' || machine.status === 'Arızalı') issues.push('Arızalı');
                      
                      return (
                        <Tooltip 
                          key={index}
                          title={
                            <div>
                              <div><strong>{machine.machineType}</strong></div>
                              <div>Durum: {machine.status}</div>
                              <div>Sorunlar:</div>
                              <ul style={{ margin: 0, paddingLeft: 16 }}>
                                {issues.map((issue, i) => (
                                  <li key={i}>{issue}</li>
                                ))}
                              </ul>
                            </div>
                          }
                        >
                          <Tag color="red" icon={<WarningOutlined />}>
                            {machine.machineType}
                          </Tag>
                        </Tooltip>
                      );
                    })}
                    {liveAnalysis.criticalMachines.length > 3 && (
                      <Tag color="red">+{liveAnalysis.criticalMachines.length - 3} daha</Tag>
                    )}
                  </Space>
                ) : (
                  <Tag color="green" icon={<CheckCircleOutlined />}>
                    Tüm makineler normal
                  </Tag>
                )}
              </div>
            </div>
          </Col>
        </Row>

        {/* Üçüncü Satır: Durum Dağılımı */}
        <Row gutter={[16, 16]} style={{ marginTop: 16 }}>
          <Col span={24}>
            <div style={{ textAlign: 'center' }}>
              <Text strong>Makine Durum Dağılımı</Text>
              <div style={{ marginTop: 8 }}>
                <Space wrap>
                  {Object.entries(
                    liveMachineData.reduce((acc, machine) => {
                      // Normalize status names
                      let normalizedStatus = 'Diğer';
                      if (machine.status === 'Running' || machine.status === 'Operational' || machine.status === 'Çalışır Durumda') {
                        normalizedStatus = 'Çalışıyor';
                      } else if (machine.status === 'Breakdown' || machine.status === 'Arızalı') {
                        normalizedStatus = 'Arızalı';
                      } else if (machine.status === 'Maintenance' || machine.status === 'Bakımda') {
                        normalizedStatus = 'Bakımda';
                      } else if (machine.status === 'Idle' || machine.status === 'Boşta') {
                        normalizedStatus = 'Boşta';
                      }
                      
                      acc[normalizedStatus] = (acc[normalizedStatus] || 0) + 1;
                      return acc;
                    }, {} as Record<string, number>)
                  ).map(([status, count]) => (
                    <Tag 
                      key={status}
                      color={
                        status === 'Çalışıyor' ? 'green' :
                        status === 'Arızalı' ? 'red' :
                        status === 'Bakımda' ? 'orange' :
                        status === 'Boşta' ? 'yellow' : 'blue'
                      }
                    >
                      {status}: {count}
                    </Tag>
                  ))}
                </Space>
              </div>
            </div>
          </Col>
        </Row>
      </Card>
    );
  };

  const renderQuickActions = () => (
    <Card 
      title="Hızlı İşlemler" 
      style={{ marginBottom: 16 }}
      styles={{ body: { padding: screens.xs ? 12 : 24 } }}
    >
      <Row gutter={[16, 16]}>
        <Col xs={12} sm={8} md={6} lg={6}>
                <Button 
            type="primary" 
                  icon={<PlusOutlined />} 
            block
                  onClick={() => navigate('/dashboard/job-orders/add')}
                >
            Yeni İş Emri
          </Button>
        </Col>
        <Col xs={12} sm={8} md={6} lg={6}>
          <Button 
            icon={<UserOutlined />} 
            block
            onClick={() => navigate('/dashboard/users')}
          >
            Kullanıcılar
          </Button>
        </Col>
        <Col xs={12} sm={8} md={6} lg={6}>
          <Button 
            icon={<DesktopOutlined />} 
            block
            onClick={() => navigate('/dashboard/machines')}
          >
            Makineler
          </Button>
        </Col>
        <Col xs={12} sm={8} md={6} lg={6}>
          <Button 
            icon={<ClusterOutlined />} 
            block
            onClick={() => navigate('/dashboard/departments')}
          >
            Departmanlar
                </Button>
        </Col>
      </Row>
    </Card>
  );

  const renderStatistics = () => (
    <Row gutter={[16, 16]} style={{ marginTop: 16 }}>
      <Col xs={24} sm={12} md={6}>
        <Card hoverable onClick={() => navigate('/dashboard/job-orders')}>
          <Statistic
            title="Toplam İş Emri"
            value={stats.jobOrders.total}
            prefix={<FileTextOutlined />}
          />
          <Progress 
            percent={stats.jobOrders.total > 0 ? Math.round((stats.jobOrders.completed / stats.jobOrders.total) * 100) : 0} 
            size="small" 
            status="active"
            />
          </Card>
        </Col>
      <Col xs={24} sm={12} md={6}>
        <Card hoverable onClick={() => navigate('/dashboard/users')}>
            <Statistic 
            title="Aktif Kullanıcılar"
            value={stats.users.active}
              prefix={<UserOutlined />} 
          />
          <Progress 
            percent={stats.users.total > 0 ? Math.round((stats.users.active / stats.users.total) * 100) : 0} 
            size="small" 
            status="active"
          />
        </Card>
      </Col>
      <Col xs={24} sm={12} md={6}>
        <Card hoverable onClick={() => navigate('/dashboard/machines')}>
          <Statistic
            title="Çalışan Makineler"
            value={stats.machines.operational}
            prefix={<DesktopOutlined />}
          />
          <Progress 
            percent={stats.machines.total > 0 ? Math.round((stats.machines.operational / stats.machines.total) * 100) : 0} 
            size="small" 
            status="active"
          />
        </Card>
      </Col>
      <Col xs={24} sm={12} md={6}>
        <Card hoverable onClick={() => navigate('/dashboard/departments')}>
          <Statistic
            title="Departmanlar"
            value={stats.departments.total}
            prefix={<ClusterOutlined />}
          />
        </Card>
      </Col>
    </Row>
  );

  const renderNotificationsAndAnnouncements = () => (
    <Row gutter={[16, 16]} style={{ marginTop: 16 }}>
      <Col xs={24} md={12}>
        <Card 
          title="Son Duyurular" 
          extra={
                <Button 
                  type="link" 
              onClick={() => navigate('/dashboard/announcements')}
            >
              Tümünü Gör
            </Button>
          }
          style={{ height: '400px', overflow: 'auto' }}
        >
          {announcements.length > 0 ? (
            <List
              dataSource={announcements}
              renderItem={(item) => (
                <List.Item 
                  onClick={() => navigate(`/dashboard/announcements`)}
                  style={{ cursor: 'pointer' }}
                >
                  <List.Item.Meta
                    avatar={<Avatar icon={<InfoCircleOutlined />} />}
                    title={item.title}
                    description={
                      <Space direction="vertical" size={0}>
                        <Text type="secondary">{item.message}</Text>
                        <Text type="secondary" style={{ fontSize: '12px' }}>
                          {new Date(item.createdAt).toLocaleDateString('tr-TR')}
                        </Text>
                      </Space>
                    }
                  />
                </List.Item>
              )}
            />
          ) : (
            <Empty description="Henüz duyuru bulunmamaktadır" />
          )}
          </Card>
        </Col>
      <Col xs={24} md={12}>
        <Card 
          title="Son Bildirimler" 
          extra={
                <Button 
                  type="link" 
              onClick={() => navigate('/dashboard/notifications')}
            >
              Tümünü Gör
            </Button>
          }
          style={{ height: '400px', overflow: 'auto' }}
        >
          {notifications.length > 0 ? (
            <List
              dataSource={notifications}
              renderItem={(item) => (
                <List.Item 
                  onClick={() => navigate(`/dashboard/notifications`)}
                  style={{ cursor: 'pointer' }}
                >
                  <List.Item.Meta
                    avatar={
                      <Avatar 
                        icon={
                          item.type === 'success' ? <CheckCircleOutlined /> : 
                          item.type === 'warning' ? <ClockCircleOutlined /> : 
                          item.type === 'error' ? <PauseCircleOutlined /> : 
                          <InfoCircleOutlined />
                        }
                        style={{
                          backgroundColor: 
                            item.type === 'success' ? '#52c41a' : 
                            item.type === 'warning' ? '#faad14' : 
                            item.type === 'error' ? '#f5222d' : 
                            '#1890ff'
                        }}
                      />
                    }
                    title={item.title}
                    description={
                      <Space direction="vertical" size={0}>
                        <Text type="secondary">{item.message}</Text>
                        <Text type="secondary" style={{ fontSize: '12px' }}>
                          {new Date(item.createdAt).toLocaleDateString('tr-TR')}
                        </Text>
                      </Space>
                    }
                  />
                </List.Item>
              )}
            />
          ) : (
            <Empty description="Henüz bildirim bulunmamaktadır" />
          )}
          </Card>
        </Col>
    </Row>
  );

  const renderRecentJobOrders = () => (
    <Card 
      title="Son İş Emirleri" 
      extra={
        <Button 
          type="link" 
          onClick={() => navigate('/dashboard/job-orders')}
        >
          Tümünü Gör
        </Button>
      }
      style={{ marginTop: 16 }}
    >
      {jobOrders.length > 0 ? (
        <List
          dataSource={jobOrders}
          renderItem={(item) => (
            <List.Item
              onClick={() => navigate(`/dashboard/job-orders/${item._id}`)}
              style={{ cursor: 'pointer' }}
              actions={[
                <Button 
                  type="link" 
                  icon={<EyeOutlined />}
                  onClick={(e) => {
                    e.stopPropagation();
                    navigate(`/dashboard/job-orders/${item._id}`);
                  }}
                >
                  Detay
                </Button>
              ]}
            >
              <List.Item.Meta
                avatar={<Avatar icon={<FileTextOutlined />} />}
                title={item.title}
                description={
                  <Space>
                    <Tag color={
                      (item.status as string) === 'In Progress' || (item.status as string) === 'Devam Ediyor' ? 'blue' :
                      (item.status as string) === 'Completed' || (item.status as string) === 'Tamamlandı' ? 'green' :
                      (item.status as string) === 'Paused' || (item.status as string) === 'Duraklatıldı' ? 'orange' : 'default'
                    }>
                      {(item.status as string) === 'In Progress' ? 'Devam Ediyor' :
                       (item.status as string) === 'Completed' ? 'Tamamlandı' :
                       (item.status as string) === 'Paused' ? 'Duraklatıldı' : 
                       item.status}
                    </Tag>
                    <Text type="secondary">
                      {item.orderNumber}
                    </Text>
                  </Space>
                }
              />
            </List.Item>
          )}
        />
      ) : (
        <Empty description="Henüz iş emri bulunmamaktadır" />
      )}
          </Card>
  );

  const renderProductionLineCharts = () => {
    const efficiencyData = (Array.isArray(productionLines) ? productionLines : [])
      .filter(line => line.efficiency !== undefined)
      .map(line => ({
        name: line.name,
        efficiency: Number(line.efficiency) || 0
      }));

    const capacityData = (Array.isArray(productionLines) ? productionLines : [])
      .filter(line => line.capacity !== undefined)
      .map(line => ({
        name: line.name,
        capacity: Number(line.capacity) || 0,
        unit: line.capacityUnit || 'adet/saat'
      }));

    const jobOrderProgressData = (Array.isArray(jobOrders) ? jobOrders : [])
      .map(order => {
        const target = Number(order.productionTarget?.quantity || order.targetQuantity || 0);
        const produced = Number(order.producedQuantity?.quantity || 0);
        const progress = target > 0 ? Math.min(100, Math.round((produced / target) * 100)) : 0;
        return {
          name: order.title || order.orderNumber,
          target,
          produced,
          progress
        };
      })
      .filter(order => order.target > 0 || order.produced > 0);

    return (
      <>
        <Row gutter={[16, 16]} style={{ marginTop: 16 }}>
          <Col span={24}>
            <Card 
              title="Üretim Hattı Verimliliği" 
              extra={
                <Button 
                  type="link" 
                  onClick={() => navigate('/dashboard/production-lines')}
                >
                  Tümünü Gör
                </Button>
              }
            >
              {efficiencyData.length > 0 ? (
                <Column 
                  data={efficiencyData}
                  xField="name"
                  yField="efficiency"
                  colorField={() => '#52c41a'}
                  legend={false}
                  label={{
                    text: (d: any) => `${d.efficiency}%`,
                    position: 'inside',
                    fill: '#ffffff',
                    fontSize: 12,
                    fontWeight: 600,
                    style: {
                      fill: '#ffffff',
                      fontWeight: 600,
                    },
                  }}
                  scale={{
                    y: { domain: [0, 100] }
                  }}
                  height={280}
                />
              ) : (
                <Empty description="Veri bulunamadı" />
              )}
            </Card>
          </Col>
        </Row>

        <Row gutter={[16, 16]} style={{ marginTop: 16 }}>
          <Col span={24}>
            <Card 
              title="Üretim Hattı Kapasitesi" 
              extra={
                <Button 
                  type="link" 
                  onClick={() => navigate('/dashboard/production-lines')}
                >
                  Tümünü Gör
                </Button>
              }
            >
              {capacityData.length > 0 ? (
                <Column 
                  data={capacityData}
                  xField="name"
                  yField="capacity"
                  colorField={() => '#1890ff'}
                  legend={false}
                  label={{
                    text: (d: any) => `${d.capacity} ${d.unit}`,
                    position: 'inside',
                    fill: '#ffffff',
                    fontSize: 12,
                    fontWeight: 600,
                    style: {
                      fill: '#ffffff',
                      fontWeight: 600,
                    },
                  }}
                  height={280}
                />
              ) : (
                <Empty description="Veri bulunamadı" />
              )}
            </Card>
          </Col>
        </Row>

        <Row gutter={[16, 16]} style={{ marginTop: 16 }}>
          <Col span={24}>
            <Card 
              title="İş Emirleri İlerleme Durumu" 
              extra={
                <Button 
                  type="link" 
                  onClick={() => navigate('/dashboard/job-orders')}
                >
                  Tümünü Gör
                </Button>
              }
            >
              {jobOrderProgressData.length > 0 ? (
                <Column 
                  data={jobOrderProgressData}
                  xField="name"
                  yField="progress"
                  colorField={() => '#1890ff'}
                  legend={false}
                  label={{
                    text: (d: any) => `${d.progress}%`,
                    position: 'inside',
                    fill: '#ffffff',
                    fontSize: 12,
                    fontWeight: 600,
                    style: {
                      fill: '#ffffff',
                      fontWeight: 600,
                    },
                  }}
                  scale={{
                    y: { domain: [0, 100] }
                  }}
                  height={280}
                />
              ) : (
                <Empty description="İlerleme verisi olan iş emri bulunamadı" />
              )}
            </Card>
          </Col>
        </Row>
      </>
    );
  };

  return (
    <PageContainer>
      <LoadingSpinner loading={loading} />
      
      {/* 1. Hızlı İşlemler */}
      {renderQuickActions()}
      
      {/* 2. Canlı Makine Verileri */}
      {renderLiveDataSummary()}
      
      {/* 3. İstatistikler */}
      {renderStatistics()}
      
      {/* 4. Duyurular ve Bildirimler */}
      {renderNotificationsAndAnnouncements()}
      
      {/* 5. Son İş Emirleri */}
      {renderRecentJobOrders()}

      {/* 6. Üretim Hattı Grafikleri */}
      {renderProductionLineCharts()}
    </PageContainer>
  );
};

export default Dashboard;
