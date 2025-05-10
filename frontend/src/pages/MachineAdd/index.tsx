import React, { useState, useEffect } from 'react';
import { useNavigate } from 'umi';
import { App } from 'antd';
import EditPage, { EditField } from '@/components/EditPage';
import { machineService } from '@/services/machineService';
import dayjs from 'dayjs';
import departmentService from '@/services/departmentService';

const machineTypes = [
  'Kesim', 'Delme', 'Taşlama', 'Frezeleme', 'Torna', 
  'CNC', '3D Yazıcı', 'Kaynak', 'Montaj', 'Diğer'
];

const MachineAdd: React.FC = () => {
  const navigate = useNavigate();
  const { message } = App.useApp();
  const [submitting, setSubmitting] = useState(false);
  const [departments, setDepartments] = useState<any[]>([]);

  useEffect(() => {
    const fetchDepartments = async () => {
      try {
        const departmentsData = await departmentService.getDepartments();
        setDepartments(departmentsData);
      } catch (error) {
        message.error('Departmanlar yüklenemedi');
      }
    };
    fetchDepartments();
  }, []);

  const handleSubmit = async (values: any) => {
    setSubmitting(true);
    try {
      const formattedValues = {
        ...values,
        purchaseDate: values.purchaseDate?.format('YYYY-MM-DD'),
        lastMaintenance: values.lastMaintenance?.format('YYYY-MM-DD'),
        nextMaintenance: values.nextMaintenance?.format('YYYY-MM-DD'),
        status: values.status || 'Operational', // Default status if not provided
        department: values.department, // Add department
      };

      const response = await machineService.createMachine(formattedValues);
      message.success('Makine başarıyla oluşturuldu');
      
      setTimeout(() => {
        navigate('/dashboard/machines');
      }, 1000);
    } catch (error: any) {
      // More detailed error handling
      if (error.response) {
        switch (error.response.status) {
          case 400:
            if (error.response.data.code === 11000) {
              // Duplicate key error
              message.error('Bu makine kodu zaten kullanılmış. Lütfen farklı bir kod seçin.');
            } else {
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
            message.error('Makine oluşturulurken bir hata oluştu.');
        }
      } else {
        message.error(error.message || 'İşlem sırasında bir hata oluştu');
      }
    } finally {
      setSubmitting(false);
    }
  };

  const fields: EditField[] = [
    {
      name: 'name',
      label: 'Makine Adı',
      type: 'text',
      rules: [{ required: true, message: 'Lütfen makine adını girin' }],
      row: 0,
      col: 0,
      span: 12
    },
    {
      name: 'type',
      label: 'Makine Tipi',
      type: 'select',
      rules: [{ required: true, message: 'Lütfen makine tipini seçin' }],
      options: machineTypes.map(type => ({
        label: type,
        value: type
      })),
      row: 0,
      col: 1,
      span: 12
    },
    {
      name: 'code',
      label: 'Makine Kodu',
      type: 'text',
      rules: [{ required: true, message: 'Lütfen makine kodunu girin' }],
      row: 1,
      col: 0,
      span: 12
    },
    {
      name: 'model',
      label: 'Model',
      type: 'text',
      row: 1,
      col: 1,
      span: 12
    },
    {
      name: 'manufacturer',
      label: 'Üretici',
      type: 'text',
      row: 2,
      col: 0,
      span: 12
    },
    {
      name: 'serialNumber',
      label: 'Seri No',
      type: 'text',
      row: 2,
      col: 1,
      span: 12
    },
    {
      name: 'purchaseDate',
      label: 'Satın Alma Tarihi',
      type: 'date',
      row: 3,
      col: 0,
      span: 12
    },
    {
      name: 'warrantyEnd',
      label: 'Garanti Bitiş Tarihi',
      type: 'date',
      row: 3,
      col: 1,
      span: 12
    },
    {
      name: 'description',
      label: 'Açıklama',
      type: 'textarea',
      row: 5,
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
      row: 4,
      col: 0,
      span: 24
    }
  ];

  return (
    <EditPage
      title="Yeni Makine"
      loading={submitting}
      fields={fields}
      onSubmit={handleSubmit}
      submitButtonText="Makine Oluştur"
      backButtonText="Makineler Listesine Dön"
      layout={{
        rows: 5,
        columns: 2,
        gap: 16
      }}
    />
  );
};

export default MachineAdd;
