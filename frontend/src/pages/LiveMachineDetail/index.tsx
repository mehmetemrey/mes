import React, { useState, useEffect } from 'react';
import { 
  Card, 
  Typography, 
  Badge, 
  Spin, 
  Alert, 
  Row, 
  Col, 
  Statistic, 
  Progress,
  Tag,
  Button
} from 'antd';
import { 
  DashboardOutlined, 
  WarningOutlined, 
  CheckCircleOutlined, 
  ExclamationCircleOutlined,
  ArrowLeftOutlined
} from '@ant-design/icons';
import { useParams, useNavigate } from 'umi';
import { machineService, Machine } from '@/services/machineService';
import { useLiveData, MachineMetrics } from '@/contexts/LiveDataContext';

const { Title, Text } = Typography;

const LiveMachineDetail: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  
  // Get live data from global context
  const { liveMachineData, isWebSocketConnected: isConnected, error: contextError } = useLiveData();
  
  // Find specific machine data from live data
  const machineData = liveMachineData.find(m => m.machineId === id) || null;
  
  const [machineDetails, setMachineDetails] = useState<Machine | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  // Update error state when context error changes
  useEffect(() => {
    if (contextError) {
      setError(contextError);
    }
  }, [contextError]);

  // Fetch machine details
  useEffect(() => {
    const fetchMachineDetails = async () => {
      if (!id) {
        setError('Makine ID bulunamadı');
        setLoading(false);
        return;
      }

      try {
        const machine = await machineService.getMachine(id);
        setMachineDetails(machine);
      } catch (error) {
        console.error('Error fetching machine details:', error);
        setError('Makine detayları yüklenemedi');
      } finally {
        setLoading(false);
      }
    };

    fetchMachineDetails();
  }, [id]);

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
          icon: <ExclamationCircleOutlined style={{ color: 'yellow' }} />, 
          color: 'yellow',
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
    return (
      <div style={{ textAlign: 'center', padding: '50px' }}>
        <Spin size="large" />
      </div>
    );
  }

  if (!machineDetails) {
    return (
      <div style={{ padding: '24px' }}>
        <Alert
          message="Hata"
          description="Makine bulunamadı"
          type="error"
          showIcon
        />
      </div>
    );
  }

  const statusInfo = machineData ? getStatusInfo(machineData.status) : getStatusInfo(machineDetails.status);
  const departmentName = typeof machineDetails.department === 'object' ? machineDetails.department?.name : undefined;

  return (
    <div style={{ padding: '24px' }}>
      <Button 
        icon={<ArrowLeftOutlined />} 
        onClick={() => navigate('/dashboard/machines')}
        style={{ marginBottom: 16 }}
      >
        Geri Dön
      </Button>

      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
        <Title level={2}>
          <DashboardOutlined /> {machineDetails.name}
        </Title>
        <Badge 
          status={isConnected ? 'success' : 'error'} 
          text={isConnected ? 'Canlı Veri Aktif' : 'Bağlantı Yok'} 
        />
      </div>

      {error && (
        <Alert
          message="Bağlantı Hatası"
          description={error}
          type="error"
          showIcon
          style={{ marginBottom: 16 }}
        />
      )}

      <Card
        style={{ 
          marginBottom: 16, 
          boxShadow: '0 4px 6px rgba(0,0,0,0.1)',
          borderColor: statusInfo.color
        }}
      >
        <Row gutter={[16, 16]}>
          <Col xs={24} sm={12} md={8}>
            <Statistic 
              title="Durum" 
              value={statusInfo.text}
              prefix={statusInfo.icon}
              valueStyle={{ color: statusInfo.color }}
            />
          </Col>
          <Col xs={24} sm={12} md={8}>
            <Statistic 
              title="Tip" 
              value={machineDetails.type}
            />
          </Col>
          <Col xs={24} sm={12} md={8}>
            <Statistic 
              title="Departman" 
              value={departmentName || 'Atanmamış'}
            />
          </Col>
        </Row>
      </Card>

      {machineData && (
        <Row gutter={[16, 16]}>
          <Col xs={24} sm={12} md={8}>
            <Card>
              <Statistic 
                title="Sıcaklık" 
                value={machineData.temperature.toFixed(1)} 
                suffix="°C" 
                valueStyle={{ 
                  color: machineData.temperature > 80 ? 'red' : 
                         machineData.temperature > 60 ? 'orange' : 'green' 
                }}
              />
              <Progress 
                percent={(machineData.temperature / 100) * 100} 
                showInfo={false} 
                status={machineData.temperature > 80 ? 'exception' : 'normal'}
              />
            </Card>
          </Col>
          <Col xs={24} sm={12} md={8}>
            <Card>
              <Statistic 
                title="Güç" 
                value={machineData.power.toFixed(2)} 
                suffix="kW" 
              />
              <Progress 
                percent={(machineData.power / 10) * 100} 
                showInfo={false} 
              />
            </Card>
          </Col>
          <Col xs={24} sm={12} md={8}>
            <Card>
              <Statistic 
                title="RPM" 
                value={machineData.rpm} 
              />
              <Progress 
                percent={(machineData.rpm / 3000) * 100} 
                showInfo={false} 
              />
            </Card>
          </Col>
          <Col xs={24} sm={12} md={8}>
            <Card>
              <Statistic 
                title="Toplam Üretim" 
                value={machineData.totalProduced} 
                prefix={<CheckCircleOutlined />}
              />
            </Card>
          </Col>
          <Col xs={24} sm={12} md={8}>
            <Card>
              <Statistic 
                title="Reddedilen" 
                value={machineData.rejectedCount} 
                valueStyle={{ color: 'red' }}
              />
            </Card>
          </Col>
          <Col xs={24} sm={12} md={8}>
            <Card>
              <Statistic 
                title="Döngü Süresi" 
                value={machineData.cycleTime} 
                suffix="sn"
              />
            </Card>
          </Col>
        </Row>
      )}

      {!machineData && (
        <Alert
          message="Canlı Veri Bekleniyor"
          description="Makine verileri yükleniyor..."
          type="info"
          showIcon
        />
      )}
    </div>
  );
};

export default LiveMachineDetail; 