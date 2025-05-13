import React, { useState, useEffect, useCallback, useRef } from 'react';
import { 
  Card, 
  Typography, 
  Badge, 
  Alert, 
  Row, 
  Col, 
  Space,
  Tag,
  Input,
  Empty,
  notification,
  Select,
  Grid
} from 'antd';
import { 
  DashboardOutlined, 
  WarningOutlined, 
  CheckCircleOutlined, 
  ExclamationCircleOutlined,
  FilterOutlined,
  SearchOutlined,
  BellOutlined
} from '@ant-design/icons';
import { machineService, Machine } from '@/services/machineService';
import departmentService from '@/services/departmentService';
import { useLiveData, MachineMetrics } from '@/contexts/LiveDataContext';
import LoadingSpinner from '@/components/LoadingSpinner';

const { Title, Text } = Typography;
const { Option } = Select;
const { Search } = Input;
const { useBreakpoint } = Grid;

// Anomaly thresholds for frontend validation
const ANOMALY_THRESHOLDS = {
  temperature: { min: 10, max: 100 },
  rpm: { min: 100, max: 2800 },
  power: { min: 0.5, max: 9.5 },
  cycleTime: { max: 120 },
  rejectionRate: { max: 15 }
};

const LiveMachineData: React.FC = () => {
  const { 
    liveMachineData: machineData, 
    isWebSocketConnected: isConnected, 
    error: contextError 
  } = useLiveData();
  
  const [machineDetails, setMachineDetails] = useState<Machine[]>([]);
  const [departments, setDepartments] = useState<any[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [filterType, setFilterType] = useState<string | null>(null);
  const [filterDepartment, setFilterDepartment] = useState<string | null>(null);
  const [searchText, setSearchText] = useState<string>('');
  const [loading, setLoading] = useState(true);
  const machineDetailsRef = useRef<Machine[]>([]);
  
  // Use Ant Design's responsive breakpoints
  const screens = useBreakpoint();

  useEffect(() => {
    machineDetailsRef.current = machineDetails;
  }, [machineDetails]);

  useEffect(() => {
    setError(contextError);
  }, [contextError]);

  // Frontend anomaly notifications disabled to prevent spam
  // Backend handles anomaly notifications with proper cooldown
  const checkMachineAnomalies = useCallback((newData: MachineMetrics[], oldData: MachineMetrics[]) => {
    // Frontend anomaly checking disabled - backend handles notifications
    return;
  }, []);

  const calculateSeverity = (issues: string[]) => {
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

  const getMachineAnomalyStatus = (machine: MachineMetrics) => {
    const anomalies = [];
    
    if (machine.temperature < ANOMALY_THRESHOLDS.temperature.min || 
        machine.temperature > ANOMALY_THRESHOLDS.temperature.max) {
      anomalies.push('temperature');
    }
    
    if (machine.rpm < ANOMALY_THRESHOLDS.rpm.min || 
        machine.rpm > ANOMALY_THRESHOLDS.rpm.max) {
      anomalies.push('rpm');
    }
    
    if (machine.power < ANOMALY_THRESHOLDS.power.min || 
        machine.power > ANOMALY_THRESHOLDS.power.max) {
      anomalies.push('power');
    }
    
    if (machine.cycleTime > ANOMALY_THRESHOLDS.cycleTime.max) {
      anomalies.push('cycleTime');
    }
    
    const rejectionRate = machine.totalProduced > 0 ? 
      (machine.rejectedCount / machine.totalProduced) * 100 : 0;
    if (rejectionRate > ANOMALY_THRESHOLDS.rejectionRate.max) {
      anomalies.push('rejectionRate');
    }
    
    if (machine.isAlarmActive) {
      anomalies.push('alarm');
    }
    
    return anomalies;
  };

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [machines, deps] = await Promise.all([
          machineService.getMachines(),
          departmentService.getDepartments()
        ]);
        setMachineDetails(machines);
        setDepartments(deps);
      } catch (error) {
        setError('Failed to load machine details');
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  const getStatusInfo = (status: string) => {
    switch(status) {
      case 'Breakdown':
        return { 
          icon: <WarningOutlined style={{ color: 'red' }} />, 
          color: 'red',
          text: 'Arızalı'
        };
      case 'Maintenance':
        return { 
          icon: <ExclamationCircleOutlined style={{ color: 'orange' }} />,
          color: 'orange',
          text: 'Bakımda'
        };
      case 'Idle':
        return { 
          icon: <DashboardOutlined style={{ color: '#faad14' }} />,
          color: 'gold',
          text: 'Boşta'
        };
      default:
        return { 
          icon: <CheckCircleOutlined style={{ color: 'green' }} />,
          color: 'green',
          text: 'Çalışıyor'
        };
    }
  };

  if (loading) {
    return <LoadingSpinner loading={loading} />;
  }

  return (
    <div style={{ padding: screens.xs ? '12px' : '24px' }}>
      <Card>
        <div style={{ 
          display: 'flex', 
          justifyContent: 'space-between', 
          alignItems: screens.xs ? 'flex-start' : 'center',
          flexDirection: screens.xs ? 'column' : 'row',
          gap: screens.xs ? '12px' : '0',
          marginBottom: screens.xs ? 12 : 16 
        }}>
          <Title level={screens.xs ? 4 : 2} style={{ margin: 0, fontSize: screens.xs ? '18px' : '30px' }}>
            Canlı Makine Verileri
          </Title>
          <Space size={screens.xs ? 'small' : 'middle'}>
            <Badge 
              status={isConnected ? 'success' : 'error'} 
              text={isConnected ? 'Bağlı' : 'Bağlantı Kesildi'}
              style={{ fontSize: screens.xs ? '12px' : '14px' }}
            />
            <Tag 
              color={isConnected ? 'green' : 'red'}
              style={{ fontSize: screens.xs ? '11px' : '12px' }}
            >
              {isConnected ? 'Gerçek Zamanlı' : 'Offline'}
            </Tag>
          </Space>
        </div>
        
        {error && (
          <Alert
            message="Bağlantı Hatası"
            description={error}
            type="error"
            showIcon
            style={{ 
              marginBottom: screens.xs ? 12 : 16,
              fontSize: screens.xs ? '12px' : '14px'
            }}
          />
        )}

        <Space 
          direction="vertical" 
          size={screens.xs ? 'small' : 'middle'} 
          style={{ width: '100%', marginBottom: screens.xs ? 12 : 16 }}
        >
          <Row gutter={[screens.xs ? 8 : 16, screens.xs ? 8 : 16]}>
            <Col xs={24} sm={12} md={6}>
              <Select
                style={{ width: '100%' }}
                placeholder="Makine Tipi"
                allowClear
                onChange={setFilterType}
                size={screens.xs ? 'large' : 'middle'}
              >
                {Array.from(new Set(machineDetails.map(m => m.type))).map(type => (
                  <Option key={type} value={type}>{type}</Option>
                ))}
              </Select>
            </Col>
            <Col xs={24} sm={12} md={6}>
              <Select
                style={{ width: '100%' }}
                placeholder="Departman"
                allowClear
                onChange={setFilterDepartment}
                size={screens.xs ? 'large' : 'middle'}
              >
                {departments.map(dept => (
                  <Option key={dept._id} value={dept._id}>{dept.name}</Option>
                ))}
              </Select>
            </Col>
            <Col xs={24} sm={24} md={12}>
              <Search
                placeholder="Makine Ara..."
                allowClear
                enterButton={<SearchOutlined />}
                onChange={(e) => setSearchText(e.target.value)}
                size={screens.xs ? 'large' : 'middle'}
              />
            </Col>
          </Row>
        </Space>

        {(!Array.isArray(machineData) || machineData.length === 0) && (
          <Empty
            description={
              <span style={{ fontSize: screens.xs ? '14px' : '16px' }}>
                {isConnected ? 'Henüz makine verisi yok' : 'Bağlantı bekleniyor...'}
              </span>
            }
            style={{ padding: screens.xs ? '20px 0' : '40px 0' }}
          />
        )}

        <Row gutter={[screens.xs ? 8 : 16, screens.xs ? 8 : 16]}>
          {Array.isArray(machineData) && machineData
            .filter(machine => {
              const matchingDetail = machineDetails.find(d => 
                d.code === machine.machineCode || 
                d._id === machine.machineId
              );
              
              if (!matchingDetail) return false;
              
              const matchesType = !filterType || matchingDetail.type === filterType;
              const matchesDepartment = !filterDepartment || 
                (typeof matchingDetail.department === 'object' && matchingDetail.department?._id === filterDepartment);
              const matchesSearch = !searchText || 
                matchingDetail.name.toLowerCase().includes(searchText.toLowerCase()) ||
                matchingDetail.code.toLowerCase().includes(searchText.toLowerCase());
              
              return matchesType && matchesDepartment && matchesSearch;
            })
            .map(machine => {
              const machineDetail = machineDetails.find(d => 
                d.code === machine.machineCode || 
                d._id === machine.machineId
              );
              
              if (!machineDetail) return null;

              const statusInfo = getStatusInfo(machine.status);
              const anomalies = getMachineAnomalyStatus(machine);
              const rejectionRate = machine.totalProduced > 0 
                ? (machine.rejectedCount / machine.totalProduced) * 100 
                : 0;

              return (
                <Col key={machine.machineId} xs={24} sm={12} md={8} lg={6}>
                  <Card
                    title={
                      <Space size={screens.xs ? 'small' : 'middle'}>
                        {statusInfo.icon}
                        <Text 
                          strong 
                          style={{ 
                            fontSize: screens.xs ? '14px' : '16px',
                            wordBreak: 'break-word'
                          }}
                        >
                          {machineDetail.name}
                        </Text>
                      </Space>
                    }
                    extra={
                      <Tag 
                        color={statusInfo.color}
                        style={{ fontSize: screens.xs ? '11px' : '12px' }}
                      >
                        {statusInfo.text}
                      </Tag>
                    }
                    style={{ 
                      height: '100%',
                      borderRadius: screens.xs ? '8px' : '12px'
                    }}
                    bodyStyle={{ 
                      padding: screens.xs ? '12px' : '16px',
                      fontSize: screens.xs ? '12px' : '14px'
                    }}
                  >
                    <Space 
                      direction="vertical" 
                      style={{ width: '100%' }}
                      size={screens.xs ? 'small' : 'middle'}
                    >
                      <div>
                        <Text 
                          type="secondary"
                          style={{ fontSize: screens.xs ? '11px' : '12px' }}
                        >
                          Makine Kodu: 
                        </Text>
                        <Text 
                          strong
                          style={{ 
                            fontSize: screens.xs ? '12px' : '13px',
                            wordBreak: 'break-word'
                          }}
                        >
                          {machineDetail.code}
                        </Text>
                      </div>
                      
                      <div>
                        <Text 
                          type="secondary"
                          style={{ fontSize: screens.xs ? '11px' : '12px' }}
                        >
                          Sıcaklık: 
                        </Text>
                        <Text 
                          strong 
                          type={anomalies.includes('temperature') ? 'danger' : undefined}
                          style={{ fontSize: screens.xs ? '12px' : '13px' }}
                        >
                          {machine.temperature.toFixed(1)}°C
                        </Text>
                      </div>
                      
                      <div>
                        <Text 
                          type="secondary"
                          style={{ fontSize: screens.xs ? '11px' : '12px' }}
                        >
                          RPM: 
                        </Text>
                        <Text 
                          strong
                          type={anomalies.includes('rpm') ? 'danger' : undefined}
                          style={{ fontSize: screens.xs ? '12px' : '13px' }}
                        >
                          {machine.rpm.toFixed(0)}
                        </Text>
                      </div>
                      
                      <div>
                        <Text 
                          type="secondary"
                          style={{ fontSize: screens.xs ? '11px' : '12px' }}
                        >
                          Güç Tüketimi: 
                        </Text>
                        <Text 
                          strong
                          type={anomalies.includes('power') ? 'danger' : undefined}
                          style={{ fontSize: screens.xs ? '12px' : '13px' }}
                        >
                          {machine.power.toFixed(2)} kW
                        </Text>
                      </div>
                      
                      <div>
                        <Text 
                          type="secondary"
                          style={{ fontSize: screens.xs ? '11px' : '12px' }}
                        >
                          Döngü Süresi: 
                        </Text>
                        <Text 
                          strong
                          type={anomalies.includes('cycleTime') ? 'danger' : undefined}
                          style={{ fontSize: screens.xs ? '12px' : '13px' }}
                        >
                          {machine.cycleTime.toFixed(1)} s
                        </Text>
                      </div>
                      
                      <div>
                        <Text 
                          type="secondary"
                          style={{ fontSize: screens.xs ? '11px' : '12px' }}
                        >
                          Toplam Üretim: 
                        </Text>
                        <Text 
                          strong
                          style={{ fontSize: screens.xs ? '12px' : '13px' }}
                        >
                          {machine.totalProduced}
                        </Text>
                      </div>
                      
                      <div>
                        <Text 
                          type="secondary"
                          style={{ fontSize: screens.xs ? '11px' : '12px' }}
                        >
                          Red Oranı: 
                        </Text>
                        <Text 
                          strong
                          type={anomalies.includes('rejectionRate') ? 'danger' : undefined}
                          style={{ fontSize: screens.xs ? '12px' : '13px' }}
                        >
                          %{rejectionRate.toFixed(1)}
                        </Text>
                      </div>
                      
                      {machine.isAlarmActive && (
                        <Alert
                          message="Alarm Aktif!"
                          type="error"
                          showIcon
                          style={{ 
                            marginTop: screens.xs ? 6 : 8,
                            fontSize: screens.xs ? '11px' : '12px'
                          }}
                        />
                      )}
                    </Space>
                  </Card>
                </Col>
              );
            })}
        </Row>
      </Card>
    </div>
  );
};

export default LiveMachineData;
