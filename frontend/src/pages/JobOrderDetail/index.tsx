import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'umi';
import { Modal, Button, Space, Tag, Typography, Card, App } from 'antd';
import { EditOutlined, DeleteOutlined, PlayCircleOutlined, PauseCircleOutlined, StopOutlined, CheckCircleOutlined } from '@ant-design/icons';
import DetailPage, { DetailField } from '@/components/DetailPage';
import { jobOrderService, JobOrder } from '@/services/jobOrderService';
import { format } from 'date-fns';
import { tr } from 'date-fns/locale';

const { Text } = Typography;

const JobOrderDetail: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { message } = App.useApp();
  const [loading, setLoading] = useState(true);
  const [jobOrder, setJobOrder] = useState<JobOrder | null>(null);
  const [activeTab, setActiveTab] = useState('1');
  const [currentFields, setCurrentFields] = useState<DetailField[]>([]);
  const [generalInfoFields, setGeneralInfoFields] = useState<DetailField[]>([]);
  const [workDetailsFields, setWorkDetailsFields] = useState<DetailField[]>([]);
  const [pauseAndDelayFields, setPauseAndDelayFields] = useState<DetailField[]>([]);

  const fetchJobOrder = async () => {
    try {
      if (!id) return;
      const data = await jobOrderService.getJobOrder(id);
      setJobOrder(data);
      
      // Regenerate fields with the loaded job order data
      const newGeneralInfoFields = data ? [
        {
          label: 'İş Emri No',
          value: <Text strong style={{ fontSize: '16px' }}>{data.orderNumber}</Text>,
          type: 'text' as const,
          row: 0,
          col: 0,
          span: 8
        },
        {
          label: 'Başlık',
          value: <Text strong style={{ fontSize: '16px' }}>{data.title}</Text>,
          type: 'text' as const,
          row: 0,
          col: 1,
          span: 8
        },
        {
          label: 'Üretim Aşaması',
          value: <Text style={{ fontSize: '16px' }}>{typeof data.productionStage === 'object' ? data.productionStage.name : data.productionStage}</Text>,
          type: 'text' as const,
          row: 0,
          col: 2,
          span: 8
        },
        {
          label: 'Durum',
          value: <Tag color={getStatusColor(data.status)} style={{ fontSize: '16px', padding: '4px 8px' }}>{getStatusText(data.status)}</Tag>,
          type: 'status' as const,
          row: 1,
          col: 0,
          span: 8
        },
        {
          label: 'Makine',
          value: <Text style={{ fontSize: '16px' }}>{typeof data.machine === 'object' ? data.machine.name : data.machine}</Text>,
          type: 'text' as const,
          row: 1,
          col: 1,
          span: 8
        },
        {
          label: 'Departman',
          value: data.department ? (
            <Tag color="blue" style={{ fontSize: '16px', padding: '4px 8px' }}>
              {typeof data.department === 'object' 
                ? `${data.department.name} (${data.department.code})`
                : data.department}
            </Tag>
          ) : (
            <Tag color="default" style={{ fontSize: '16px', padding: '4px 8px' }}>Atanmamış</Tag>
          ),
          type: 'text' as const,
          row: 1,
          col: 2,
          span: 8
        },
        {
          label: 'Öncelik',
          value: <Tag color={getPriorityColor(data.priority)} style={{ fontSize: '16px', padding: '4px 8px' }}>{getPriorityText(data.priority)}</Tag>,
          type: 'status' as const,
          row: 2,
          col: 0,
          span: 8
        },
        {
          label: 'Planlanan Başlangıç',
          value: <Text style={{ fontSize: '16px' }}>{data.plannedStartTime ? format(new Date(data.plannedStartTime), 'dd MMMM yyyy HH:mm', { locale: tr }) : '-'}</Text>,
          type: 'date' as const,
          row: 2,
          col: 1,
          span: 8
        },
        {
          label: 'Planlanan Bitiş',
          value: <Text style={{ fontSize: '16px' }}>{data.plannedEndTime ? format(new Date(data.plannedEndTime), 'dd MMMM yyyy HH:mm', { locale: tr }) : '-'}</Text>,
          type: 'date' as const,
          row: 2,
          col: 2,
          span: 8
        },
        {
          label: 'Planlanan Süre',
          value: <Text style={{ fontSize: '16px' }}>{data.plannedDuration ? `${data.plannedDuration} dakika` : '-'}</Text>,
          type: 'text' as const,
          row: 2,
          col: 3,
          span: 8
        },
        {
          label: 'Gerçekleşen Başlangıç',
          value: <Text style={{ fontSize: '16px' }}>{data.actualStartTime ? format(new Date(data.actualStartTime), 'dd MMMM yyyy HH:mm', { locale: tr }) : '-'}</Text>,
          type: 'date' as const,
          row: 3,
          col: 0,
          span: 8
        },
        {
          label: 'Gerçekleşen Bitiş',
          value: <Text style={{ fontSize: '16px' }}>{data.actualEndTime ? format(new Date(data.actualEndTime), 'dd MMMM yyyy HH:mm', { locale: tr }) : '-'}</Text>,
          type: 'date' as const,
          row: 3,
          col: 1,
          span: 8
        },
        {
          label: 'Gerçekleşen Süre',
          value: <Text style={{ fontSize: '16px' }}>{data.actualDuration ? `${data.actualDuration} dakika` : '-'}</Text>,
          type: 'text' as const,
          row: 3,
          col: 2,
          span: 8
        },
        {
          label: 'Oluşturan',
          value: data.createdBy ? (
            <Space direction="vertical" size={0}>
              <Text style={{ fontSize: '16px' }}>
                {typeof data.createdBy === 'object' && data.createdBy.firstName 
                  ? `${data.createdBy.firstName} ${data.createdBy.lastName || ''}`
                  : typeof data.createdBy === 'string'
                    ? data.createdBy
                    : '-'}
              </Text>
              <Text type="secondary" style={{ fontSize: '14px' }}>
                {data.createdAt ? format(new Date(data.createdAt), 'dd MMMM yyyy HH:mm', { locale: tr }) : '-'}
              </Text>
            </Space>
          ) : '-',
          type: 'text' as const,
          row: 4,
          col: 0,
          span: 8
        },
        {
          label: 'Güncelleyen',
          value: data.updatedBy ? (
            <Space direction="vertical" size={0}>
              <Text style={{ fontSize: '16px' }}>
                {typeof data.updatedBy === 'object' && data.updatedBy.firstName 
                  ? `${data.updatedBy.firstName} ${data.updatedBy.lastName || ''}`
                  : typeof data.updatedBy === 'string'
                    ? data.updatedBy
                    : '-'}
              </Text>
              <Text type="secondary" style={{ fontSize: '14px' }}>
                {data.updatedAt ? format(new Date(data.updatedAt), 'dd MMMM yyyy HH:mm', { locale: tr }) : '-'}
              </Text>
            </Space>
          ) : '-',
          type: 'text' as const,
          row: 4,
          col: 1,
          span: 8
        },
        {
          label: 'Atanan Kişi',
          value: data.assignedTo ? (
            <Space direction="vertical" size={0}>
              <Text style={{ fontSize: '16px' }}>
                {typeof data.assignedTo === 'object' && data.assignedTo.firstName 
                  ? `${data.assignedTo.firstName} ${data.assignedTo.lastName || ''}`
                  : typeof data.assignedTo === 'string'
                    ? data.assignedTo
                    : '-'}
              </Text>
              <Text type="secondary" style={{ fontSize: '14px' }}>
                {typeof data.assignedTo === 'object' && data.assignedTo.email 
                  ? data.assignedTo.email 
                  : '-'}
              </Text>
            </Space>
          ) : '-',
          type: 'text' as const,
          row: 4,
          col: 2,
          span: 8
        },
        {
          label: 'Açıklama',
          value: <Text style={{ fontSize: '16px' }}>{data.description || '-'}</Text>,
          type: 'text' as const,
          row: 5,
          col: 0,
          span: 24
        },
        {
          label: 'Üretim Hedefi',
          value: data.productionTarget ? (
            <Text style={{ fontSize: '16px' }}>
              {`${data.productionTarget.quantity} ${data.productionTarget.unit}`}
            </Text>
          ) : '-',
          type: 'text' as const,
          row: 6,
          col: 0,
          span: 12
        },
        {
          label: 'Üretilen Miktar',
          value: data.producedQuantity ? (
            <Text style={{ fontSize: '16px' }}>
              {`${data.producedQuantity.quantity} ${data.producedQuantity.unit}`}
            </Text>
          ) : '-',
          type: 'text' as const,
          row: 6,
          col: 1,
          span: 12
        },
        {
          label: 'Üretim İlerleme Durumu',
          value: data.productionTarget && data.producedQuantity ? (
            <Text style={{ fontSize: '16px' }}>
              {`%${((data.producedQuantity.quantity / data.productionTarget.quantity) * 100).toFixed(2)}`}
            </Text>
          ) : '-',
          type: 'text' as const,
          row: 6,
          col: 2,
          span: 12
        },
      ] : [];

      const newWorkDetailsFields = data ? [
        {
          label: 'Toplam Çalışma Süresi',
          value: <Text style={{ fontSize: '16px' }}>
            {data.totalWorkingTime !== undefined && data.totalWorkingTime !== null 
              ? `${data.totalWorkingTime} dakika` 
              : '-'}
          </Text>,
          type: 'text' as const,
          row: 0,
          col: 0,
          span: 12
        },
        {
          label: 'Toplam Duraklatma Süresi',
          value: <Text style={{ fontSize: '16px' }}>
            {data.totalPausedTime !== undefined && data.totalPausedTime !== null 
              ? `${data.totalPausedTime} dakika` 
              : '-'}
          </Text>,
          type: 'text' as const,
          row: 0,
          col: 1,
          span: 12
        },
        {
          label: 'Çalışma Segmentleri',
          value: data.workingTimeSegments && data.workingTimeSegments.length > 0 ? (
            <Space direction="vertical" style={{ width: '100%' }}>
              {data.workingTimeSegments.map((segment, index) => (
                <Card key={index} size="small" style={{ marginBottom: 8 }}>
                  <Space direction="vertical" style={{ width: '100%' }}>
                    <Text strong style={{ fontSize: '16px' }}>
                      Segment {index + 1}
                    </Text>
                    <Space>
                      <Text type="secondary" style={{ fontSize: '14px' }}>
                        Başlangıç: {segment.startTime ? format(new Date(segment.startTime), 'dd MMMM yyyy HH:mm', { locale: tr }) : '-'}
                      </Text>
                      <Text type="secondary" style={{ fontSize: '14px' }}>
                        Bitiş: {segment.endTime ? format(new Date(segment.endTime), 'dd MMMM yyyy HH:mm', { locale: tr }) : 'Devam Ediyor'}
                      </Text>
                      <Tag color="blue" style={{ fontSize: '14px', padding: '4px 8px' }}>
                        {segment.duration} dakika
                      </Tag>
                    </Space>
                  </Space>
                </Card>
              ))}
            </Space>
          ) : <Text type="secondary" style={{ fontSize: '16px' }}>Çalışma segmenti bulunmuyor</Text>,
          type: 'text' as const,
          row: 1,
          col: 0,
          span: 12
        },
        {
          label: 'Duraklatma Geçmişi',
          value: data.pauseHistory && data.pauseHistory.length > 0 ? (
            <Space direction="vertical" style={{ width: '100%' }}>
              {data.pauseHistory.map((pause, index) => (
                <Card key={index} size="small" style={{ marginBottom: 8 }}>
                  <Space direction="vertical" style={{ width: '100%' }}>
                    <Text strong style={{ fontSize: '16px' }}>
                      Duraklatma {index + 1}
                    </Text>
                    <Space>
                      <Text type="secondary" style={{ fontSize: '14px' }}>
                        Başlangıç: {pause.startPauseTime ? format(new Date(pause.startPauseTime), 'dd MMMM yyyy HH:mm', { locale: tr }) : '-'}
                      </Text>
                      <Text type="secondary" style={{ fontSize: '14px' }}>
                        Bitiş: {pause.endPauseTime ? format(new Date(pause.endPauseTime), 'dd MMMM yyyy HH:mm', { locale: tr }) : 'Devam Ediyor'}
                      </Text>
                      <Tag color="orange" style={{ fontSize: '14px', padding: '4px 8px' }}>
                        {pause.pauseDuration} dakika
                      </Tag>
                    </Space>
                  </Space>
                </Card>
              ))}
            </Space>
          ) : <Text type="secondary" style={{ fontSize: '16px' }}>Duraklatma kaydı bulunmuyor</Text>,
          type: 'text' as const,
          row: 1,
          col: 1,
          span: 12
        }
      ] : [];

      const newPauseAndDelayFields = data ? [
        {
          label: 'Gecikmeler',
          value: data.delays && data.delays.length > 0 ? (
            <Space direction="vertical" style={{ width: '100%' }}>
              {data.delays.map((delay, index) => (
                <Card key={index} size="small" style={{ marginBottom: 8 }}>
                  <Space direction="vertical" style={{ width: '100%' }}>
                    <Text strong style={{ fontSize: '16px' }}>{delay.reason}</Text>
                    <Space>
                      <Tag color="orange" style={{ fontSize: '16px', padding: '4px 8px' }}>{delay.duration} dakika</Tag>
                      <Text type="secondary" style={{ fontSize: '14px' }}>
                        {format(new Date(delay.timestamp), 'dd MMMM yyyy HH:mm', { locale: tr })}
                      </Text>
                    </Space>
                  </Space>
                </Card>
              ))}
            </Space>
          ) : <Text type="secondary" style={{ fontSize: '16px' }}>Gecikme kaydı bulunmuyor</Text>,
          type: 'text' as const,
          row: 0,
          col: 0,
          span: 24
        },
      ] : [];

      // Update the state with the new fields
      setGeneralInfoFields(newGeneralInfoFields);
      setWorkDetailsFields(newWorkDetailsFields);
      setPauseAndDelayFields(newPauseAndDelayFields);

      // Set the current fields based on the active tab
      switch(activeTab) {
        case '1':
          setCurrentFields(newGeneralInfoFields);
          break;
        case '2':
          setCurrentFields(newWorkDetailsFields);
          break;
        case '3':
          setCurrentFields(newPauseAndDelayFields);
          break;
      }
    } catch (error: any) {
      message.error(error.message || 'İş emri yüklenirken bir hata oluştu.');
      navigate('/dashboard/job-orders');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchJobOrder();
  }, [id]);

  useEffect(() => {
    if (jobOrder) {
      // Regenerate general info fields
      const newGeneralInfoFields = [
        ...generalInfoFields.map(field => 
          field.label === 'Durum' 
            ? {
                ...field, 
                value: <Tag color={getStatusColor(jobOrder.status)} style={{ fontSize: '16px', padding: '4px 8px' }}>
                  {getStatusText(jobOrder.status)}
                </Tag>
              }
            : field
        )
      ];

      // Update work details fields
      const newWorkDetailsFields = generateWorkDetailsFields(jobOrder);

      // Update state
      setGeneralInfoFields(newGeneralInfoFields);
      setWorkDetailsFields(newWorkDetailsFields);

      // Update current fields based on active tab
      switch(activeTab) {
        case '1':
          setCurrentFields(newGeneralInfoFields);
          break;
        case '2':
          setCurrentFields(newWorkDetailsFields);
          break;
        case '3':
          setCurrentFields(pauseAndDelayFields);
          break;
      }
    }
  }, [jobOrder]);

  useEffect(() => {
    // Sayfa yenilendiğinde önceki aktif sekmeyi yükle
    const savedActiveTab = localStorage.getItem('jobOrderDetailActiveTab');
    if (savedActiveTab) {
      setActiveTab(savedActiveTab);
      
      // Kayıtlı sekmeye göre alanları güncelle
      switch(savedActiveTab) {
        case '1':
          setCurrentFields(generalInfoFields);
          break;
        case '2':
          setCurrentFields(workDetailsFields);
          break;
        case '3':
          setCurrentFields(pauseAndDelayFields);
          break;
      }
    }
  }, []);

  const handleDelete = async () => {
    Modal.confirm({
      title: 'İş Emrini Sil',
      content: 'Bu iş emrini silmek istediğinizden emin misiniz?',
      okText: 'Evet',
      cancelText: 'Hayır',
      onOk: async () => {
        try {
          await jobOrderService.deleteJobOrder(id!);
          message.success('İş emri başarıyla silindi.');
          navigate('/dashboard/job-orders');
        } catch (error) {
          message.error('İş emri silinirken bir hata oluştu.');
        }
      },
    });
  };

  const generateWorkDetailsFields = (response: JobOrder | null): DetailField[] => {
    return response ? [
      {
        label: 'Toplam Çalışma Süresi',
        value: <Text style={{ fontSize: '16px' }}>
          {response.totalWorkingTime !== undefined && response.totalWorkingTime !== null 
            ? `${response.totalWorkingTime} dakika` 
            : '-'}
        </Text>,
        type: 'text' as const,
        row: 0,
        col: 0,
        span: 12
      },
      {
        label: 'Toplam Duraklatma Süresi',
        value: <Text style={{ fontSize: '16px' }}>
          {response.totalPausedTime !== undefined && response.totalPausedTime !== null 
            ? `${response.totalPausedTime} dakika` 
            : '-'}
        </Text>,
        type: 'text' as const,
        row: 0,
        col: 1,
        span: 12
      },
      {
        label: 'Çalışma Segmentleri',
        value: response.workingTimeSegments && response.workingTimeSegments.length > 0 ? (
          <Space direction="vertical" style={{ width: '100%' }}>
            {response.workingTimeSegments.map((segment, index) => (
              <Card key={index} size="small" style={{ marginBottom: 8 }}>
                <Space direction="vertical" style={{ width: '100%' }}>
                  <Text strong style={{ fontSize: '16px' }}>
                    Segment {index + 1}
                  </Text>
                  <Space>
                    <Text type="secondary" style={{ fontSize: '14px' }}>
                      Başlangıç: {segment.startTime ? format(new Date(segment.startTime), 'dd MMMM yyyy HH:mm', { locale: tr }) : '-'}
                    </Text>
                    <Text type="secondary" style={{ fontSize: '14px' }}>
                      Bitiş: {segment.endTime ? format(new Date(segment.endTime), 'dd MMMM yyyy HH:mm', { locale: tr }) : 'Devam Ediyor'}
                    </Text>
                    <Tag color="blue" style={{ fontSize: '14px', padding: '4px 8px' }}>
                      {segment.duration} dakika
                    </Tag>
                  </Space>
                </Space>
              </Card>
            ))}
          </Space>
        ) : <Text type="secondary" style={{ fontSize: '16px' }}>Çalışma segmenti bulunmuyor</Text>,
        type: 'text' as const,
        row: 1,
        col: 0,
        span: 12
      },
      {
        label: 'Duraklatma Geçmişi',
        value: response.pauseHistory && response.pauseHistory.length > 0 ? (
          <Space direction="vertical" style={{ width: '100%' }}>
            {response.pauseHistory.map((pause, index) => (
              <Card key={index} size="small" style={{ marginBottom: 8 }}>
                <Space direction="vertical" style={{ width: '100%' }}>
                  <Text strong style={{ fontSize: '16px' }}>
                    Duraklatma {index + 1}
                  </Text>
                  <Space>
                    <Text type="secondary" style={{ fontSize: '14px' }}>
                      Başlangıç: {pause.startPauseTime ? format(new Date(pause.startPauseTime), 'dd MMMM yyyy HH:mm', { locale: tr }) : '-'}
                    </Text>
                    <Text type="secondary" style={{ fontSize: '14px' }}>
                      Bitiş: {pause.endPauseTime ? format(new Date(pause.endPauseTime), 'dd MMMM yyyy HH:mm', { locale: tr }) : 'Devam Ediyor'}
                    </Text>
                    <Tag color="orange" style={{ fontSize: '14px', padding: '4px 8px' }}>
                      {pause.pauseDuration} dakika
                    </Tag>
                  </Space>
                </Space>
              </Card>
            ))}
          </Space>
        ) : <Text type="secondary" style={{ fontSize: '16px' }}>Duraklatma kaydı bulunmuyor</Text>,
        type: 'text' as const,
        row: 1,
        col: 1,
        span: 12
      }
    ] : [];
  };

  const handleStart = async () => {
    try {
      const response = await jobOrderService.startJob(id!);
      message.success('İş emri başlatıldı.');
      
      // Directly update the job order and regenerate fields
      setJobOrder(response);
      
      // Optionally, you can also update the current tab's fields
      if (activeTab === '2') {
        const newWorkDetailsFields = generateWorkDetailsFields(response);
        
        setWorkDetailsFields(newWorkDetailsFields);
        setCurrentFields(newWorkDetailsFields);
      }
    } catch (error) {
      message.error('İş emri başlatılırken bir hata oluştu.');
    }
  };

  const handleStop = async () => {
    try {
      const response = await jobOrderService.stopJob(id!);
      message.success('İş emri durduruldu.');
      
      // Directly update the job order and regenerate fields
      setJobOrder(response);
      
      // Optionally, you can also update the current tab's fields
      if (activeTab === '2') {
        const newWorkDetailsFields = generateWorkDetailsFields(response);
        
        setWorkDetailsFields(newWorkDetailsFields);
        setCurrentFields(newWorkDetailsFields);
      }
    } catch (error) {
      message.error('İş emri durdurulurken bir hata oluştu.');
    }
  };

  const handlePause = async () => {
        try {
          const response = await jobOrderService.pauseJob(id!);

          message.success('İş emri duraklatıldı.');
          
          // Directly update the job order and regenerate fields
          setJobOrder(response);

          
          // Optionally, you can also update the current tab's fields
          if (activeTab === '2') {
            const newWorkDetailsFields = generateWorkDetailsFields(response);
            
            setWorkDetailsFields(newWorkDetailsFields);
            setCurrentFields(newWorkDetailsFields);
          }
        } catch (error) {
          message.error('İş emri duraklatılırken bir hata oluştu.');
        }
  };

  const handleContinue = async () => {
    try {
      const response = await jobOrderService.startJob(id!);
      message.success('İş emri devam ediyor.');
      
      // Directly update the job order and regenerate fields
      setJobOrder(response);
      
      // Optionally, you can also update the current tab's fields
      if (activeTab === '2') {
        const newWorkDetailsFields = generateWorkDetailsFields(response);
        
        setWorkDetailsFields(newWorkDetailsFields);
        setCurrentFields(newWorkDetailsFields);
      }
    } catch (error) {
      console.error('Continue job error:', error);
      message.error('İş emri devam ettirilirken bir hata oluştu.');
    }
  };

  const handleComplete = async () => {
    try {
      const response = await jobOrderService.updateJobStatus(id!, 'Completed');
      message.success('İş emri tamamlandı.');
      
      // Directly update the job order and regenerate fields
      setJobOrder(response);
      
      // Optionally, you can also update the current tab's fields
      if (activeTab === '2') {
        const newWorkDetailsFields = generateWorkDetailsFields(response);
        
        setWorkDetailsFields(newWorkDetailsFields);
        setCurrentFields(newWorkDetailsFields);
      }
    } catch (error) {
      message.error('İş emri tamamlanırken bir hata oluştu.');
    }
  };

  const handleRestart = async () => {
    try {
      if (!jobOrder) return;

      // Mevcut iş emri numarasından yeni numara oluştur
      const currentNumber = parseInt(jobOrder.orderNumber.split('-')[1]);
      const newOrderNumber = `IE-${(currentNumber + 1).toString().padStart(4, '0')}`;

      // Planlanan ve gerçekleşen zamanları hesapla
      const now = new Date();
      const plannedDuration = jobOrder.plannedDuration || 120; // Varsayılan 2 saat
      const plannedEndTime = new Date(now.getTime() + plannedDuration * 60000);

      // Yeni iş emri verilerini hazırla
      const newJobOrderData: Partial<JobOrder> = {
        orderNumber: newOrderNumber,
        jobNumber: newOrderNumber,
        title: jobOrder.title,
        description: `[Yeniden Başlatma Notu: Önceki iş emri ${jobOrder.orderNumber} yeniden başlatıldı.]`,
        status: 'In Progress', // Doğrudan başlatılmış olarak ayarla
        priority: jobOrder.priority,
        assignedTo: typeof jobOrder.assignedTo === 'object' ? jobOrder.assignedTo._id : jobOrder.assignedTo,
        machine: typeof jobOrder.machine === 'object' ? jobOrder.machine._id : jobOrder.machine,
        productionStage: typeof jobOrder.productionStage === 'object' ? jobOrder.productionStage._id : jobOrder.productionStage,
        
        // Planlanan zamanları ayarla
        plannedStartTime: now.toISOString(),
        plannedEndTime: plannedEndTime.toISOString(),
        plannedDuration: plannedDuration,
        
        // Gerçekleşen zamanları sıfırla
        actualStartTime: now.toISOString(),
        actualEndTime: undefined,
        actualDuration: undefined,
        
        // Çalışma segmentlerini başlat (temiz bir şekilde)
        workingTimeSegments: [{
          startTime: now.toISOString(),
          endTime: undefined,
          duration: 0
        }],
        
        // Zaman ile ilgili alanları sıfırla
        totalWorkingTime: 0,
        totalPausedTime: 0,
        
        // Duraklatma geçmişini temizle
        pauseHistory: [],
        
        // Gecikmeleri kopyala
        delays: jobOrder.delays ? [...jobOrder.delays] : []
      };

      // Yeni iş emrini oluştur
      const response = await jobOrderService.createJobOrder(newJobOrderData);
      message.success('İş emri yeniden başlatıldı.');
      
      // Yeni iş emrinin detay sayfasına yönlendir
      navigate(`/dashboard/job-orders/${response._id}`);
    } catch (error: any) {
      message.error(error.response?.data?.message || 'İş emri yeniden başlatılırken bir hata oluştu.');
    }
  };

  const getStatusColor = (status: JobOrder['status']) => {
    const colors = {
      'Planned': 'blue',
      'In Progress': 'processing',
      'Completed': 'success',
      'Cancelled': 'error',
      'Paused': 'warning',
    };
    return colors[status];
  };

  const getStatusText = (status: JobOrder['status']) => {
    const statusMap = {
      'Planned': 'Planlandı',
      'In Progress': 'Devam Ediyor',
      'Completed': 'Tamamlandı',
      'Cancelled': 'İptal Edildi',
      'Paused': 'Duraklatıldı',
    };
    return statusMap[status];
  };

  const getPriorityColor = (priority: JobOrder['priority']) => {
    const colors = {
      'Low': 'green',
      'Medium': 'blue',
      'High': 'orange',
      'Critical': 'red',
    };
    return colors[priority];
  };

  const getPriorityText = (priority: JobOrder['priority']) => {
    const priorityMap = {
      'Low': 'Düşük',
      'Medium': 'Orta',
      'High': 'Yüksek',
      'Critical': 'Kritik',
    };
    return priorityMap[priority];
  };

  const handleTabChange = (key: string) => {
    // Aktif sekmeyi local storage'a kaydet
    localStorage.setItem('jobOrderDetailActiveTab', key);
    
    setActiveTab(key);
    switch(key) {
      case '1':
        setCurrentFields(generalInfoFields);
        break;
      case '2':
        setCurrentFields(workDetailsFields);
        break;
      case '3':
        setCurrentFields(pauseAndDelayFields);
        break;
    }
  };

  const customActions = (
    <Space>
      {jobOrder?.status === 'Planned' && (
        <Button
          type="primary"
          icon={<PlayCircleOutlined />}
          onClick={handleStart}
        >
          Başlat
        </Button>
      )}
      {jobOrder?.status === 'In Progress' && (
        <>
          <Button
            type="primary"
            danger
            icon={<StopOutlined />}
            onClick={handleStop}
          >
            Durdur
          </Button>
          <Button
            type="primary"
            icon={<PauseCircleOutlined />}
            onClick={handlePause}
          >
            Duraklat
          </Button>
          <Button
            type="primary"
            icon={<CheckCircleOutlined />}
            onClick={handleComplete}
          >
            Tamamla
          </Button>
        </>
      )}
      {jobOrder?.status === 'Paused' && (
        <>
          <Button
            type="primary"
            danger
            icon={<StopOutlined />}
            onClick={handleStop}
          >
            Durdur
          </Button>
          <Button
            type="primary"
            icon={<PlayCircleOutlined />}
            onClick={handleContinue}
          >
            Devam Ettir
          </Button>
          <Button
            type="primary"
            icon={<CheckCircleOutlined />}
            onClick={handleComplete}
          >
            Tamamla
          </Button>
        </>
      )}
      {jobOrder?.status === 'Completed' && (
        <Button
          type="primary"
          icon={<PlayCircleOutlined />}
          onClick={handleRestart}
        >
          Yeniden Başlat
        </Button>
      )}
    </Space>
  );

  const layout = {
    rows: 5,
    columns: 3,
    gap: 24
  };

  return (
    <DetailPage
      title="İş Emri Detayı"
      loading={loading}
      fields={currentFields}
      actions={{
        onEdit: jobOrder?.status !== 'Completed' 
          ? () => navigate(`/dashboard/job-orders/edit/${id}`) 
          : undefined,
        onDelete: handleDelete,
        customActions,
      }}
      backButtonText="İş Emirlerine Dön"
      backUrl="/dashboard/job-orders"
      layout={layout}
      tabs={{
        items: [
          {
            key: '1',
            label: 'Genel Bilgiler',
            children: null
          },
          {
            key: '2',
            label: 'Çalışma Detayları',
            children: null
          },
          {
            key: '3',
            label: 'Gecikme/Duraklatma Bilgileri',
            children: null
          }
        ],
        activeKey: activeTab,
        onChange: handleTabChange
      }}
    />
  );
};

export default JobOrderDetail;
