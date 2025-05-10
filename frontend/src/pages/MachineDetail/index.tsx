import React, { useState, useEffect, useRef } from 'react';
import { Tag, Typography, Space, Modal, message, Button } from 'antd';
import { 
  PlayCircleOutlined, 
  PauseCircleOutlined, 
  StopOutlined, 
  DesktopOutlined,
  WifiOutlined
} from '@ant-design/icons';
import { useParams, useNavigate } from 'umi';
import { machineService, Machine } from '@/services/machineService';
import departmentService from '@/services/departmentService';
import DetailPage, { DetailField } from '@/components/DetailPage';
import LoadingSpinner from '@/components/LoadingSpinner';
import dayjs from 'dayjs';

const { Text } = Typography;

const getStatusColor = (status: Machine['status']) => {
  switch (status) {
    case 'Operational':
      return 'success';
    case 'Maintenance':
      return 'processing';
    case 'Breakdown':
      return 'error';
    case 'Idle':
      return 'warning';
    default:
      return 'default';
  }
};

const MachineDetail: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [machine, setMachine] = useState<Machine | null>(null);
  const [department, setDepartment] = useState<any>(null);
  const [modal, modalContextHolder] = Modal.useModal();
  const [websocketStatus, setWebsocketStatus] = useState<'connected' | 'disconnected'>('disconnected');
  const socketRef = useRef<WebSocket | null>(null);

  useEffect(() => {
    const fetchMachine = async () => {
      if (!id) return;
      
      setLoading(true);
      try {
        const data = await machineService.getMachine(id);
        setMachine(data);

        // If department is a string ID, fetch department details
        if (data.department && typeof data.department === 'string') {
          try {
            const departmentDetails = await departmentService.getDepartment(data.department);
            setDepartment(departmentDetails);
          } catch (error) {
            console.error('Departman bilgileri alınamadı:', error);
          }
        } else if (data.department && typeof data.department === 'object') {
          setDepartment(data.department);
        }

        // Establish WebSocket connection
        setupWebSocket(id);
      } catch (error: any) {
        console.error('Makine yüklenirken hata oluştu:', error);
        message.error('Makine bilgileri yüklenemedi');
        navigate('/dashboard/machines');
      } finally {
        setLoading(false);
      }
    };
    
    fetchMachine();

    // Cleanup WebSocket on component unmount
    return () => {
      if (socketRef.current) {
        socketRef.current.close();
      }
    };
  }, [id]);

  const setupWebSocket = (machineId: string) => {
    const websocketUrl = process.env.NODE_ENV === 'production'
      ? `wss://${window.location.hostname}/ws/`  // Production'da aynı domain
      : 'ws://localhost:8765';     // Development'da localhost
    const socket = new WebSocket(websocketUrl);

    socket.onopen = () => {
      setWebsocketStatus('connected');
      console.log('WebSocket connection established');
      
      // Subscribe to machine updates
      socket.send(JSON.stringify({
        type: 'subscribe',
        machineId: machineId
      }));
    };

    socket.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);
        
        // Handle different types of machine updates
        if (data.type === 'machine_status_update') {
          setMachine(prevMachine => {
            if (!prevMachine) return null;
            return {
              ...prevMachine,
              status: data.status
            };
          });
        }
      } catch (parseError) {
        console.error('Error processing WebSocket message:', parseError);
      }
    };

    socket.onerror = (event) => {
      console.error('WebSocket error:', event);
      setWebsocketStatus('disconnected');
      message.error('WebSocket bağlantısı kesildi');
    };

    socket.onclose = () => {
      console.log('WebSocket connection closed');
      setWebsocketStatus('disconnected');
    };

    socketRef.current = socket;
  };

  const handleStatusChange = async (status: 'Operational' | 'Maintenance' | 'Breakdown' | 'Idle') => {
    if (!id) return;

    try {
      const updatedMachine = await machineService.updateMachineStatus(id, status);
      setMachine(updatedMachine);
      message.success(`Makine durumu "${status}" olarak güncellendi`);
    } catch (error: any) {
      console.error('Makine durumu güncellenirken hata oluştu:', error);
      message.error(error.message || 'Makine durumu güncellenemedi');
    }
  };

  const handleEdit = () => {
    navigate(`/dashboard/machines/edit/${id}`);
  };

  const handleDelete = () => {
    modal.confirm({
      title: 'Makineyi silmek istediğinize emin misiniz?',
      content: 'Bu işlem geri alınamaz.',
      okText: 'Evet',
      cancelText: 'Hayır',
      okType: 'danger',
      onOk: async () => {
        try {
          await machineService.deleteMachine(id!);
          message.success('Makine silindi');
          navigate('/dashboard/machines');
        } catch (error: any) {
          message.error(error.message || 'Makine silinemedi');
        }
      },
    });
  };

  const getStatusButtons = () => {
    if (!machine) return null;

    const statusButtons = [
      {
        status: 'Operational',
        icon: <PlayCircleOutlined />,
        text: 'Çalışıyor',
        disabled: machine.status === 'Operational'
      },
      {
        status: 'Maintenance',
        icon: <PauseCircleOutlined />,
        text: 'Bakımda',
        disabled: machine.status === 'Maintenance'
      },
      {
        status: 'Breakdown',
        icon: <StopOutlined />,
        text: 'Arızalı',
        disabled: machine.status === 'Breakdown'
      },
      {
        status: 'Idle',
        icon: <DesktopOutlined />,
        text: 'Boşta',
        disabled: machine.status === 'Idle'
      }
    ];

    return (
      <Space>
        {statusButtons.map((btn) => (
          <Button
            key={btn.status}
            type={btn.disabled ? 'default' : 'primary'}
            icon={btn.icon}
            onClick={() => handleStatusChange(btn.status as 'Operational' | 'Maintenance' | 'Breakdown' | 'Idle')}
            disabled={btn.disabled}
          >
            {btn.text}
          </Button>
        ))}
      </Space>
    );
  };

  const getFields = (): DetailField[] => {
    if (!machine) return [];

    return [
      {
        label: 'Temel Bilgiler',
        value: (
          <Space direction="vertical" size="middle" style={{ width: '100%' }}>
            <div>
              <Text type="secondary">Makine Adı</Text>
              <div><Text strong>{machine.name}</Text></div>
            </div>
            <div>
              <Text type="secondary">Makine Kodu</Text>
              <div><Text>{machine.code}</Text></div>
            </div>
            <div>
              <Text type="secondary">Makine Tipi</Text>
              <div><Text>{machine.type}</Text></div>
            </div>
            <div>
              <Text type="secondary">Departman</Text>
              <div>
                {department ? (
                  <Tag color="blue">{`${department.name} (${department.code})`}</Tag>
                ) : (
                  <Tag color="default">Atanmamış</Tag>
                )}
              </div>
            </div>
          </Space>
        ),
        row: 0, col: 0, span: 12
      },
      {
        label: 'Durum ve İşlemler',
        value: (
          <Space direction="vertical" size="middle" style={{ width: '100%' }}>
            <div>
              <Text type="secondary">Çalışma Durumu</Text>
              <div>
                <Tag color={getStatusColor(machine.status)}>
                  {machine.status === 'Operational' ? 'Çalışıyor' :
                   machine.status === 'Maintenance' ? 'Bakımda' :
                   machine.status === 'Breakdown' ? 'Arızalı' :
                   machine.status === 'Idle' ? 'Boşta' : machine.status}
                </Tag>
              </div>
            </div>
            <div>
              <Text type="secondary">Durum Değiştirme</Text>
              <div>{getStatusButtons()}</div>
            </div>
          </Space>
        ),
        row: 0, col: 1, span: 12
      },
      {
        label: 'Durum ve Performans',
        value: (
          <Space direction="vertical" size="middle" style={{ width: '100%' }}>
            <div>
              <Text type="secondary">Model</Text>
              <div><Text>{machine.model || '-'}</Text></div>
            </div>
            <div>
              <Text type="secondary">Seri Numarası</Text>
              <div><Text>{machine.serialNumber || '-'}</Text></div>
            </div>
          </Space>
        ),
        row: 1, col: 1, span: 12
      },
      {
        label: 'Üretim ve Bakım Bilgileri',
        value: (
          <Space direction="vertical" size="middle" style={{ width: '100%' }}>
            <div>
              <Text type="secondary">Üretici</Text>
              <div><Text>{machine.manufacturer || '-'}</Text></div>
            </div>
            <div>
              <Text type="secondary">Satın Alma Tarihi</Text>
              <div>
                <Text>
                  {machine.purchaseDate ? dayjs(machine.purchaseDate).format('DD.MM.YYYY') : '-'}
                </Text>
              </div>
            </div>
            <div>
              <Text type="secondary">Son Bakım Tarihi</Text>
              <div>
                <Text>
                  {machine.lastMaintenance ? dayjs(machine.lastMaintenance).format('DD.MM.YYYY') : '-'}
                </Text>
              </div>
            </div>
          </Space>
        ),
        row: 1, col: 0, span: 12
      },
      {
        label: 'Gelecek Bakım ve Garanti',
        value: (
          <Space direction="vertical" size="middle" style={{ width: '100%' }}>
            <div>
              <Text type="secondary">Sonraki Bakım Tarihi</Text>
              <div>
                <Text>
                  {machine.nextMaintenance ? dayjs(machine.nextMaintenance).format('DD.MM.YYYY') : '-'}
                </Text>
              </div>
            </div>
            <div>
              <Text type="secondary">Garanti Bitiş Tarihi</Text>
              <div>
                <Text>
                  {machine.warrantyEnd ? dayjs(machine.warrantyEnd).format('DD.MM.YYYY') : '-'}
                </Text>
              </div>
            </div>
            <div>
              <Text type="secondary">Açıklama</Text>
              <div><Text>{machine.specifications || '-'}</Text></div>
            </div>
          </Space>
        ),
        row: 2, col: 0, span: 12
      },
      {
        label: 'Departman Bilgisi',
        value: (
          <Space direction="vertical" size="middle" style={{ width: '100%' }}>
            <div>
              <Text type="secondary">Departman</Text>
              <div>
                <Text strong>
                  {department 
                    ? `${department.name} (${department.code})` 
                    : 'Atanmamış'}
                </Text>
              </div>
            </div>
          </Space>
        ),
        row: 1, col: 0, span: 12
      },
      {
        label: 'WebSocket Bağlantısı',
        value: (
          <Space direction="vertical" size="middle" style={{ width: '100%' }}>
            <div>
              <Text type="secondary">Gerçek Zamanlı Durum</Text>
              <div>
                <Tag 
                  color={websocketStatus === 'connected' ? 'success' : 'error'}
                  icon={<WifiOutlined />}
                >
                  {websocketStatus === 'connected' 
                    ? 'Bağlı' 
                    : 'Bağlantı Kesildi'}
                </Tag>
              </div>
            </div>
          </Space>
        ),
        row: 2, col: 1, span: 12
      },
    ];
  };

  if (loading) return <LoadingSpinner />;

  if (!machine) {
    return <div>Makine bulunamadı</div>;
  }

  return (
    <>
      {modalContextHolder}
      <DetailPage
        title="Makine Detayı"
        fields={getFields()}
        loading={loading}
        backButtonText="Makineler Listesine Dön"
        onBack={() => navigate('/dashboard/machines')}
        layout={{ rows: 3, columns: 2, gap: 24 }}
        actions={{
          onEdit: handleEdit,
          onDelete: handleDelete
        }}
      />
    </>
  );
};

export default MachineDetail;
