import React, { useState, useEffect } from 'react';
import { 
  Tag, 
  Typography, 
  Space,
  App,
  Modal
} from 'antd';
import { 
  ClockCircleOutlined, 
  CheckCircleOutlined, 
  StopOutlined 
} from '@ant-design/icons';
import { useParams, useNavigate } from 'react-router-dom';
import DetailPage, { DetailField } from '../../components/DetailPage';
import productionLineService, { 
  ProductionLine 
} from '../../services/productionLineService';
import departmentService, { Department } from '../../services/departmentService';
import { machineService, Machine } from '../../services/machineService';
import { format } from 'date-fns';
import { tr } from 'date-fns/locale';

const { Text } = Typography;

const ProductionLineDetail: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { message } = App.useApp();
  
  const [loading, setLoading] = useState(true);
  const [productionLine, setProductionLine] = useState<ProductionLine | null>(null);
  const [department, setDepartment] = useState<Department | null>(null);
  const [machines, setMachines] = useState<Machine[]>([]);
  const [activeTabKey, setActiveTabKey] = useState<'genel' | 'performans' | 'makineler' | 'personel'>('genel');

  const getStatusColor = (status: string) => {
    const colorMap: Record<string, string> = {
      'Aktif': 'green',
      'Bakımda': 'orange',
      'Kapalı': 'red',
      'Planlı Duruş': 'blue',
      'Arıza': 'volcano'
    };
    return colorMap[status] || 'default';
  };

  useEffect(() => {
    const fetchData = async () => {
      try {
        if (!id) {
          message.error('Üretim hattı ID\'si bulunamadı');
          navigate('/dashboard/production-lines');
          return;
        }

        const prodLineData = await productionLineService.getProductionLineById(id);
        const productionLine = prodLineData.data;
        setProductionLine(productionLine);

        // Get department ID from production line
        const departmentId = typeof productionLine.department === 'object' 
          ? productionLine.department._id 
          : productionLine.department;

        // Fetch department and machines in parallel
        const [departmentData, machinesData] = await Promise.all([
          departmentId ? departmentService.getDepartment(departmentId) : null,
          machineService.getMachines()
        ]);

        setDepartment(departmentData);
          setMachines(machinesData);
        setLoading(false);
      } catch (error: any) {
        message.error(error.message || 'Veriler yüklenirken bir hata oluştu');
        navigate('/dashboard/production-lines');
      }
    };

    fetchData();
  }, [id, navigate, message]);

  const handleDelete = async () => {
    Modal.confirm({
      title: 'Üretim Hattını Sil',
      content: `${productionLine?.name} üretim hattını silmek istediğinizden emin misiniz?`,
      okText: 'Evet',
      okType: 'danger',
      cancelText: 'Hayır',
      onOk: async () => {
        try {
          await productionLineService.deleteProductionLine(id!);
          message.success('Üretim hattı başarıyla silindi');
          navigate('/dashboard/production-lines');
        } catch (error: any) {
          message.error(error.message || 'Üretim hattı silinirken bir hata oluştu');
        }
      }
    });
  };

  const generalInfoFields: DetailField[] = productionLine ? [
    {
      label: 'Ad',
      value: <Text strong style={{ fontSize: '16px' }}>{productionLine.name}</Text>,
      type: 'text',
      row: 0,
      col: 0,
      span: 8
    },
    {
      label: 'Kod',
      value: <Text style={{ fontSize: '16px' }}>{productionLine.code}</Text>,
      type: 'text',
      row: 0,
      col: 1,
      span: 8
    },
    {
      label: 'Departman',
      value: <Text style={{ fontSize: '16px' }}>
        {department?.name || 'Bilinmeyen'}
      </Text>,
      type: 'text',
      row: 0,
      col: 2,
      span: 8
    },
    {
      label: 'Durum',
      value: <Tag 
        color={getStatusColor(productionLine.status || '')} 
        style={{ fontSize: '16px', padding: '4px 8px' }}
      >
        {productionLine.status}
      </Tag>,
      type: 'status',
      row: 1,
      col: 0,
      span: 8
    },
    {
      label: 'Lokasyon',
      value: <Text style={{ fontSize: '16px' }}>{productionLine.location || 'Belirtilmemiş'}</Text>,
      type: 'text',
      row: 1,
      col: 1,
      span: 8
    },
    {
      label: 'Kapasite',
      value: <Text style={{ fontSize: '16px' }}>
        {`${productionLine.capacity || 0} ${productionLine.capacityUnit || 'adet/saat'}`}
      </Text>,
      type: 'text',
      row: 1,
      col: 2,
      span: 8
    },
    {
      label: 'Verimlilik',
      value: <Text style={{ fontSize: '16px' }}>{`%${productionLine.efficiency || 0}`}</Text>,
      type: 'text',
      row: 2,
      col: 0,
      span: 8
    }
  ] : [];

  const performanceColumns = [
    {
      title: 'Metrik',
      dataIndex: 'metric',
      key: 'metric',
    },
    {
      title: 'Değer',
      dataIndex: 'value',
      key: 'value',
    }
  ];

  const performanceData = productionLine ? [
    {
      key: '1',
      metric: 'Toplam Çalışma Süresi',
      value: `${productionLine.performanceMetrics?.totalRunTime || 0} dakika`
    },
    {
      key: '2',
      metric: 'Toplam Durma Süresi',
      value: `${productionLine.performanceMetrics?.totalStopTime || 0} dakika`
    },
    {
      key: '3',
      metric: 'Toplam Üretim Süresi',
      value: `${productionLine.performanceMetrics?.totalProductionTime || 0} dakika`
    },
    {
      key: '4',
      metric: 'Genel Ekipman Etkinliği (OEE)',
      value: `%${(productionLine.performanceMetrics?.oee || 0).toFixed(2)}`
    }
  ] : [];

  const machinesColumns = [
    {
      title: 'Makine Adı',
      dataIndex: 'name',
      key: 'name',
    },
    {
      title: 'Kod',
      dataIndex: 'code',
      key: 'code',
    },
    {
      title: 'Durum',
      dataIndex: 'status',
      key: 'status',
      render: (status: string) => {
        const statusColorMap: Record<string, string> = {
          'Aktif': 'green',
          'Operational': 'green',
          'Bakımda': 'orange',
          'Maintenance': 'orange',
          'Kapalı': 'red',
          'Breakdown': 'red',
          'Planlı Duruş': 'blue',
          'Idle': 'blue',
          'Arıza': 'volcano'
        };
        
        const color = Object.keys(statusColorMap).includes(status) 
          ? statusColorMap[status] 
          : 'default';
        
        return <Tag color={color}>{status}</Tag>;
      }
    }
  ];

  const tabContents: Record<'genel' | 'performans' | 'makineler', React.ReactNode> = {
    genel: null,
    performans: (
      <div style={{ 
        padding: '16px', 
        backgroundColor: '#f5f5f5', 
        borderRadius: '8px' 
      }}>
        <table style={{ 
          width: '100%', 
          borderCollapse: 'collapse', 
          backgroundColor: 'white',
        }}>
          <thead>
            <tr>
              {performanceColumns.map(col => (
                <th 
                  key={col.key} 
                  style={{ 
                    border: '1px solid #f0f0f0', 
                    padding: '12px', 
                    textAlign: 'left',
                    backgroundColor: '#fafafa',
                    fontWeight: 600
                  }}
                >
                  {col.title}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {performanceData.map(row => (
              <tr key={row.key}>
                <td style={{ 
                  border: '1px solid #f0f0f0', 
                  padding: '12px',
                  fontWeight: 500
                }}>{row.metric}</td>
                <td style={{ 
                  border: '1px solid #f0f0f0', 
                  padding: '12px',
                  fontWeight: 500
                }}>{row.value}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    ),
    makineler: (
      <div style={{ 
        padding: '16px', 
        backgroundColor: '#f5f5f5', 
        borderRadius: '8px' 
      }}>
        <table style={{ 
          width: '100%', 
          borderCollapse: 'collapse', 
          backgroundColor: 'white',
        }}>
          <thead>
            <tr>
              {machinesColumns.map(col => (
                <th 
                  key={col.key} 
                  style={{ 
                    border: '1px solid #f0f0f0', 
                    padding: '12px', 
                    textAlign: 'left',
                    backgroundColor: '#fafafa',
                    fontWeight: 600
                  }}
                >
                  {col.title}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {machines.map((machine, index) => (
              <tr key={machine._id || index}>
                <td style={{ 
                  border: '1px solid #f0f0f0', 
                  padding: '12px',
                  fontWeight: 500
                }}>{machine.name}</td>
                <td style={{ 
                  border: '1px solid #f0f0f0', 
                  padding: '12px',
                  fontWeight: 500
                }}>{machine.code}</td>
                <td style={{ 
                  border: '1px solid #f0f0f0', 
                  padding: '12px'
                }}>
                  <Tag color={
                    ['Aktif', 'Operational'].includes(machine.status) ? 'green' : 
                    ['Bakımda', 'Maintenance'].includes(machine.status) ? 'orange' :
                    ['Kapalı', 'Breakdown'].includes(machine.status) ? 'red' :
                    ['Planlı Duruş', 'Idle'].includes(machine.status) ? 'blue' : 'default'
                  }>
                    {machine.status}
                  </Tag>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    ),
    personel: (
      <div style={{ 
        padding: '16px', 
        backgroundColor: '#f5f5f5', 
        borderRadius: '8px' 
      }}>
        {(!productionLine?.personnel || productionLine.personnel.length === 0) ? (
          <div style={{ padding: '24px', textAlign: 'center', background: '#fff', borderRadius: '4px' }}>
            <Text type="secondary">Bu üretim hattına atanmış personel bulunmuyor.</Text>
          </div>
        ) : (
          <table style={{ 
            width: '100%', 
            borderCollapse: 'collapse', 
            backgroundColor: 'white',
          }}>
            <thead>
              <tr>
                <th style={{ border: '1px solid #f0f0f0', padding: '12px', textAlign: 'left', backgroundColor: '#fafafa', fontWeight: 600 }}>Personel</th>
                <th style={{ border: '1px solid #f0f0f0', padding: '12px', textAlign: 'left', backgroundColor: '#fafafa', fontWeight: 600 }}>E-posta</th>
                <th style={{ border: '1px solid #f0f0f0', padding: '12px', textAlign: 'left', backgroundColor: '#fafafa', fontWeight: 600 }}>Hat Görevi</th>
                <th style={{ border: '1px solid #f0f0f0', padding: '12px', textAlign: 'left', backgroundColor: '#fafafa', fontWeight: 600 }}>Çalışma Tipi</th>
              </tr>
            </thead>
            <tbody>
              {productionLine.personnel.map((p: any, index: number) => {
                const emp = p.employee;
                const empName = emp ? `${emp.firstName || ''} ${emp.lastName || ''}`.trim() : 'Atanmamış / Silinmiş Kullanıcı';
                const empEmail = emp?.email || '-';
                return (
                  <tr key={p._id || index}>
                    <td style={{ border: '1px solid #f0f0f0', padding: '12px', fontWeight: 500 }}>{empName}</td>
                    <td style={{ border: '1px solid #f0f0f0', padding: '12px' }}>{empEmail}</td>
                    <td style={{ border: '1px solid #f0f0f0', padding: '12px' }}>
                      <Tag color="blue">{p.role || 'Operatör'}</Tag>
                    </td>
                    <td style={{ border: '1px solid #f0f0f0', padding: '12px' }}>
                      <Tag color="cyan">{p.assignmentType || 'Tam Zamanlı'}</Tag>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </div>
    )
  };

  return (
    <DetailPage
      title={`Üretim Hattı Detayları: ${productionLine?.name || 'Yükleniyor'}`}
      loading={loading}
      fields={activeTabKey === 'genel' ? generalInfoFields : []}
      actions={{
        onEdit: () => navigate(`/dashboard/production-lines/edit/${id}`),
        onDelete: handleDelete
      }}
      tabs={{
        activeKey: activeTabKey,
        onChange: (key) => {
          setActiveTabKey(key as 'genel' | 'performans' | 'makineler' | 'personel');
        },
        items: [
          {
            key: 'genel',
            label: 'Genel Bilgiler',
            children: null
          },
          {
            key: 'performans',
            label: 'Performans Metrikleri',
            children: null
          },
          {
            key: 'makineler',
            label: 'Makineler',
            children: null
          },
          {
            key: 'personel',
            label: 'Personel',
            children: null
          }
        ]
      }}
    >
      {tabContents[activeTabKey]}
    </DetailPage>
  );
};

export default ProductionLineDetail;