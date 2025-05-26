import React, { useEffect, useState } from 'react';
import { useParams, useNavigate, useLocation } from 'umi';
import { App } from 'antd';
import EditPage, { EditField } from '@/components/EditPage';
import { jobOrderService, JobOrder } from '@/services/jobOrderService';
import { userService } from '@/services/userService';
import { machineService } from '@/services/machineService';
import { productionStageService } from '@/services/productionStageService';
import departmentService from '@/services/departmentService';
import dayjs from 'dayjs';

const JobOrderEdit: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { message } = App.useApp();
  const [loading, setLoading] = useState(true);
  const [jobOrder, setJobOrder] = useState<JobOrder | null>(null);
  const [users, setUsers] = useState<any[]>([]);
  const [machines, setMachines] = useState<any[]>([]);
  const [stages, setStages] = useState<any[]>([]);
  const [departments, setDepartments] = useState<any[]>([]);
  const [initialValues, setInitialValues] = useState<any>(null);
  const [activeTab, setActiveTab] = useState('1');
  const [submitStatus, setSubmitStatus] = useState<{ success?: boolean; error?: string }>({});
  const location = useLocation();

  useEffect(() => {
    const fetchData = async () => {
      try {
        if (!id) return;
        const [jobOrderData, usersData, machinesData, stagesData, departmentsData] = await Promise.all([
          jobOrderService.getJobOrder(id),
          userService.getUsers(),
          machineService.getMachines(),
          productionStageService.getProductionStages(true),
          departmentService.getDepartments()
        ]);

        setJobOrder(jobOrderData);
        setUsers(usersData);
        setMachines(machinesData);
        setStages(stagesData);
        setDepartments(departmentsData);

        // Form değerlerini güncelle
        const formValues = {
          orderNumber: jobOrderData.orderNumber,
          title: jobOrderData.title,
          status: jobOrderData.status,
          priority: jobOrderData.priority,
          assignedTo: typeof jobOrderData.assignedTo === 'object' ? jobOrderData.assignedTo._id : jobOrderData.assignedTo,
          machine: typeof jobOrderData.machine === 'object' ? jobOrderData.machine._id : jobOrderData.machine,
          productionStage: typeof jobOrderData.productionStage === 'object' ? jobOrderData.productionStage._id : jobOrderData.productionStage,
          department: typeof jobOrderData.department === 'object' ? jobOrderData.department._id : jobOrderData.department,
          plannedStartTime: jobOrderData.plannedStartTime ? dayjs(jobOrderData.plannedStartTime) : undefined,
          plannedEndTime: jobOrderData.plannedEndTime ? dayjs(jobOrderData.plannedEndTime) : undefined,
          plannedDuration: jobOrderData.plannedDuration,
          description: jobOrderData.description,
          productionTarget: {
            quantity: jobOrderData.productionTarget?.quantity || 0,
            unit: jobOrderData.productionTarget?.unit || 'adet'
          },
          producedQuantity: {
            quantity: jobOrderData.producedQuantity?.quantity || 0,
            unit: jobOrderData.producedQuantity?.unit || 'adet'
          }
        };

        setInitialValues(formValues);
      } catch (error: any) {
        message.error(error.message || 'Veriler yüklenirken bir hata oluştu.');
        navigate('/dashboard/job-orders');
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [id, message, navigate]);

  useEffect(() => {
    if (submitStatus.success) {
      message.success('İş emri başarıyla güncellendi.');
      navigate('/dashboard/job-orders');
    } else if (submitStatus.error) {
      message.error(submitStatus.error);
    }
  }, [submitStatus, message, navigate]);

  useEffect(() => {
    // URL'den tab parametresini al
    const searchParams = new URLSearchParams(location.search);
    const tabParam = searchParams.get('tab');

    // Eğer tab parametresi 'delay' ise, ikinci sekmeyi aç
    if (tabParam === 'delay') {
      setActiveTab('2');
    }
  }, [location]);

  const handleSubmit = async (values: any) => {
    try {
      // Ensure productionTarget and producedQuantity are correctly formatted
      const formData = {
        ...values,
        productionTarget: values.productionTarget ? {
          quantity: Number(values.productionTarget.quantity),
          unit: values.productionTarget.unit
        } : undefined,
        producedQuantity: values.producedQuantity ? {
          quantity: Number(values.producedQuantity.quantity),
          unit: values.producedQuantity.unit
        } : undefined
      };

      await jobOrderService.updateJobOrder(id!, formData);
      setSubmitStatus({ success: true });
    } catch (error) {
      setSubmitStatus({ error: 'İş emri güncellenirken bir hata oluştu.' });
    }
  };

  const handleAddDelay = async (values: any) => {
    try {
      await jobOrderService.addDelay(id!, values.reason, values.duration);
      message.success('Gecikme başarıyla eklendi');
      // Gecikme eklendikten sonra iş emrini yeniden yükle
      const updatedJobOrder = await jobOrderService.getJobOrder(id!);
      setJobOrder(updatedJobOrder);
    } catch (error: any) {
      message.error(error.message || 'Gecikme eklenirken bir hata oluştu');
    }
  };

  const handleTabChange = (key: string) => {
    setActiveTab(key);
  };

  const fields: EditField[] = [
    {
      name: 'orderNumber',
      label: 'İş Emri No',
      type: 'text',
      rules: [{ required: true, message: 'Lütfen iş emri numarasını girin' }],
      row: 0,
      col: 0,
      span: 24
    },
    {
      name: 'title',
      label: 'Başlık',
      type: 'text',
      rules: [{ required: true, message: 'Lütfen başlık girin' }],
      row: 1,
      col: 0,
      span: 24
    },
    {
      name: 'status',
      label: 'Durum',
      type: 'select',
      rules: [{ required: true, message: 'Lütfen durum seçin' }],
      options: [
        { label: 'Planlandı', value: 'Planned' },
        { label: 'Devam Ediyor', value: 'In Progress' },
        { label: 'Tamamlandı', value: 'Completed' },
        { label: 'İptal Edildi', value: 'Cancelled' },
      ],
      row: 2,
      col: 0,
      span: 24
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
      row: 3,
      col: 0,
      span: 24
    },
    {
      name: 'assignedTo',
      label: 'Atanan Kişi',
      type: 'select',
      options: users.map(user => ({
        label: `${user.firstName} ${user.lastName}`,
        value: user._id,
      })),
      row: 4,
      col: 0,
      span: 24
    },
    {
      name: 'machine',
      label: 'Makine',
      type: 'select',
      options: machines.map(machine => ({
        label: machine.name,
        value: machine._id,
      })),
      row: 5,
      col: 0,
      span: 24
    },
    {
      name: 'productionStage',
      label: 'Üretim Aşaması',
      type: 'select',
      options: stages.map(stage => ({
        label: stage.name,
        value: stage._id,
      })),
      row: 6,
      col: 0,
      span: 24
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
      row: 7,
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
      row: 8,
      col: 0,
      span: 24
    },
    {
      name: 'plannedEndTime',
      label: 'Planlanan Bitiş',
      type: 'datetime',
      row: 9,
      col: 0,
      span: 24
    },
    {
      name: 'plannedDuration',
      label: 'Planlanan Süre',
      type: 'number',
      row: 10,
      col: 0,
      span: 24
    },
    {
      name: 'description',
      label: 'Açıklama',
      type: 'textarea',
      row: 13,
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
      row: 11,
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
      row: 11,
      col: 1,
      span: 12
    },
    {
      name: 'producedQuantity.quantity',
      label: 'Üretilen Miktar',
      type: 'number',
      rules: [{ required: true, message: 'Lütfen üretilen miktarı girin' }],
      row: 12,
      col: 0,
      span: 12,
      props: {
        min: 0
      }
    },
    {
      name: 'producedQuantity.unit',
      label: 'Üretilen Miktar Birimi',
      type: 'select',
      rules: [{ required: true, message: 'Lütfen üretilen miktar birimini seçin' }],
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
      row: 12,
      col: 1,
      span: 12
    }
  ];

  // Merge the original fields with production fields
  const mergedFields = [...fields, ...productionFields];

  const delayFields: EditField[] = [
    {
      name: 'reason',
      label: 'Gecikme Nedeni',
      type: 'textarea' as const,
      rules: [{ required: true, message: 'Gecikme nedeni zorunludur' }],
      row: 0,
      col: 0,
      span: 24
    },
    {
      name: 'duration',
      label: 'Gecikme Süresi (Dakika)',
      type: 'number' as const,
      rules: [{ required: true, message: 'Gecikme süresi zorunludur' }],
      row: 1,
      col: 0,
      span: 24
    }
  ];

  return (
    <EditPage
      title={jobOrder?.title || 'İş Emri Düzenle'}
      loading={loading}
      fields={activeTab === '1' ? mergedFields : delayFields}
      onSubmit={activeTab === '1' ? handleSubmit : handleAddDelay}
      submitButtonText={activeTab === '1' ? 'Kaydet' : 'Gecikme Ekle'}
      backButtonText="İş Emirlerine Dön"
      backUrl="/dashboard/job-orders"
      initialValues={initialValues}
      layout={{
        rows: activeTab === '1' ? 14 : 2,
        columns: 2,
        gap: 24
      }}
      tabs={{
        items: [
          {
            key: '1',
            label: 'İş Emri Düzenle',
            children: null
          },
          {
            key: '2',
            label: 'Gecikme Ekle',
            children: null
          }
        ],
        activeKey: activeTab,
        onChange: handleTabChange
      }}
    />
  );
};

export default JobOrderEdit;
