import React, { useEffect, useState } from 'react';
import { useNavigate } from 'umi';
import { App } from 'antd';
import EditPage, { EditField } from '@/components/EditPage';
import { jobOrderService } from '@/services/jobOrderService';
import { userService } from '@/services/userService';
import { machineService } from '@/services/machineService';
import { productionStageService } from '@/services/productionStageService';
import departmentService from '@/services/departmentService';
import dayjs from 'dayjs';

const JobOrderCreate: React.FC = () => {
  const navigate = useNavigate();
  const { message } = App.useApp();
  
  const [users, setUsers] = useState<any[]>([]);
  const [machines, setMachines] = useState<any[]>([]);
  const [stages, setStages] = useState<any[]>([]);
  const [departments, setDepartments] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchInitialData = async () => {
      try {
        const [usersData, machinesData, stagesData, departmentsData] = await Promise.all([
          userService.getUsers(),
          machineService.getMachines(),
          productionStageService.getProductionStages(true),
          departmentService.getDepartments()
        ]);

        setUsers(usersData);
        setMachines(machinesData);
        setStages(stagesData);
        setDepartments(departmentsData);
      } catch (error) {
        message.error('Başlangıç verileri yüklenemedi.');
      } finally {
        setLoading(false);
      }
    };

    fetchInitialData();
  }, []);

  const handleSubmit = async (values: any) => {
    try {
      // Generate job number (e.g., JO-YYYYMMDD-XXXX)
      const generateJobNumber = () => {
        const date = dayjs().format('YYYYMMDD');
        const randomPart = Math.floor(1000 + Math.random() * 9000).toString(); // 4-digit random number
        return `JO-${date}-${randomPart}`;
      };

      const plannedStart = values.plannedStartTime ? new Date(values.plannedStartTime) : undefined;
      const plannedEnd = values.plannedEndTime ? new Date(values.plannedEndTime) : undefined;
      
      const plannedDuration = plannedStart && plannedEnd
        ? Math.floor((plannedEnd.getTime() - plannedStart.getTime()) / 60000) // dakika cinsinden
        : 0;
      
      const formData = {
        ...values,
        jobNumber: generateJobNumber(),
        plannedStartTime: plannedStart?.toISOString(),
        plannedEndTime: plannedEnd?.toISOString(),
        plannedDuration, // hesaplanan süreyi ekle
        status: 'Planned',
        // Ensure productionTarget is correctly formatted
        productionTarget: values.productionTarget ? {
          quantity: Number(values.productionTarget.quantity),
          unit: values.productionTarget.unit
        } : undefined,
        // Initialize producedQuantity with 0
        producedQuantity: {
          quantity: 0,
          unit: values.productionTarget?.unit || 'adet'
        }
      };

      const response = await jobOrderService.createJobOrder(formData);
      message.success('İş emri başarıyla oluşturuldu.');
      navigate(`/dashboard/job-orders`);
    } catch (error: any) {
      // Detaylı hata mesajları
      if (error.response) {
        switch (error.response.status) {
          case 400:
            // Mongoose validation error veya duplicate key hatası
            if (error.response.data.code === 11000) {
              // Duplicate key hatası
              const duplicateField = Object.keys(error.response.data.keyPattern)[0];
              switch (duplicateField) {
                case 'orderNumber':
                  message.error('Bu iş emri numarası zaten kullanılmış. Lütfen farklı bir numara seçin.');
                  break;
                case 'jobNumber':
                  message.error('Bu iş emri numarası sistemde zaten mevcut. Lütfen yeniden deneyin.');
                  break;
                default:
                  message.error('Girilen bilgilerle eşleşen bir kayıt zaten var. Lütfen kontrol edin.');
              }
            } else {
              // Diğer validation hataları
              message.error(error.response.data.message || 'Girilen bilgilerde eksik veya hatalı alanlar var.');
            }
            break;
          case 401:
            message.error('Bu işlemi gerçekleştirmek için yetkiniz yok.');
            break;
          case 403:
            message.error('Erişim reddedildi. Lütfen yöneticinizle iletişime geçin.');
            break;
          case 500:
            message.error('Sunucu hatası oluştu. Lütfen daha sonra tekrar deneyin.');
            break;
          default:
            message.error('İş emri oluşturulurken bir hata oluştu. Lütfen tüm alanları doğru doldurduğunuzdan emin olun.');
        }
      } else if (error.message) {
        // Ağ hatası veya diğer hatalar
        message.error(error.message);
      } else {
        // Bilinmeyen hata
        message.error('Beklenmedik bir hata oluştu. Lütfen daha sonra tekrar deneyin.');
      }
    }
  };

  const fields: EditField[] = [
    {
      name: 'orderNumber',
      label: 'İş Emri No',
      type: 'text',
      rules: [{ required: true, message: 'Lütfen iş emri numarasını girin' }],
      row: 0,
      col: 0,
      span: 12
    },
    {
      name: 'title',
      label: 'Başlık',
      type: 'text',
      rules: [{ required: true, message: 'Lütfen başlık girin' }],
      row: 0,
      col: 1,
      span: 12
    },
    {
      name: 'priority',
      label: 'Öncelik',
      type: 'select',
      rules: [{ required: true, message: 'Lütfen öncelik seçin' }],
      options: [
        { label: 'Düşük', value: 'Low' },
        { label: 'Orta', value: 'Medium' },
        { label: 'Yüksek', value: 'High' },
        { label: 'Kritik', value: 'Critical' },
      ],
      row: 1,
      col: 0,
      span: 12
    },
    {
      name: 'assignedTo',
      label: 'Atanan Kişi',
      type: 'select',
      rules: [{ required: true, message: 'Lütfen atanan kişiyi seçin' }],
      options: users.map(user => ({
        label: `${user.firstName} ${user.lastName}`,
        value: user._id,
      })),
      row: 1,
      col: 1,
      span: 12
    },
    {
      name: 'machine',
      label: 'Makine',
      type: 'select',
      rules: [{ required: true, message: 'Lütfen makine seçin' }],
      options: machines.map(machine => ({
        label: `${machine.name} (${machine.code})`,
        value: machine._id,
      })),
      row: 2,
      col: 0,
      span: 12
    },
    {
      name: 'productionStage',
      label: 'Üretim Aşaması',
      type: 'select',
      rules: [{ required: true, message: 'Lütfen üretim aşaması seçin' }],
      options: stages.map(stage => ({
        label: `${stage.name} (Sıra: ${stage.sequence})`,
        value: stage._id,
      })),
      row: 2,
      col: 1,
      span: 12
    },
    {
      name: 'department',
      label: 'Departman',
      type: 'select',
      options: departments.map(dept => ({
        label: `${dept.name} (${dept.code})`,
        value: dept._id
      })),
      placeholder: 'Departman Seçin',
      row: 4,
      col: 0,
      span: 24,
      props: {
        allowClear: true
      }
    },
    {
      name: 'plannedStartTime',
      label: 'Planlanan Başlangıç',
      type: 'datetime',
      row: 3,
      col: 0,
      span: 12
    },
    {
      name: 'plannedEndTime',
      label: 'Planlanan Bitiş',
      type: 'datetime',
      row: 3,
      col: 1,
      span: 12
    },
    {
      name: 'description',
      label: 'Açıklama',
      type: 'textarea',
      row: 6,
      col: 0,
      span: 24
    }
  ];

  // Add production target and produced quantity fields
  const productionFields: EditField[] = [
    {
      name: 'productionTarget.quantity',
      label: 'Üretim Hedefi Miktarı',
      type: 'number',
      rules: [{ required: true, message: 'Lütfen üretim hedefi miktarını girin' }],
      row: 5,
      col: 0,
      span: 12,
      props: {
        min: 0
      }
    },
    {
      name: 'productionTarget.unit',
      label: 'Üretim Hedefi Birimi',
      type: 'select',
      rules: [{ required: true, message: 'Lütfen üretim hedefi birimini seçin' }],
      options: [
        { label: 'Adet', value: 'adet' },
        { label: 'Metre', value: 'metre' },
        { label: 'Kg', value: 'kg' },
        { label: 'Ton', value: 'ton' },
        { label: 'Litre', value: 'litre' },
        { label: 'Cm', value: 'cm' },
        { label: 'm²', value: 'm2' },
        { label: 'm³', value: 'm3' },
        { label: 'Paket', value: 'paket' },
        { label: 'Kutu', value: 'kutu' }
      ],
      row: 5,
      col: 1,
      span: 12
    }
  ];

  // Merge the original fields with production fields
  const mergedFields = [...fields, ...productionFields];

  return (
    <EditPage
      title="Yeni İş Emri Oluştur"
      loading={loading}
      fields={mergedFields}
      onSubmit={handleSubmit}
      backButtonText="İş Emirlerine Dön"
      backUrl="/dashboard/job-orders"
      submitButtonText="İş Emri Oluştur"
      layout={{
        rows: 8,
        columns: 2,
        gap: 24
      }}
    />
  );
};

export default JobOrderCreate; 