import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'umi';
import { App } from 'antd';
import dayjs from 'dayjs';
import EditPage, { EditField } from '@/components/EditPage';
import { machineService, Machine } from '@/services/machineService';
import departmentService from '@/services/departmentService';

interface Department {
  _id: string;
  name: string;
  code: string;
}

interface MachineWithDepartment extends Machine {
  department?: Department;
}

const machineTypes = [
  'Kesim', 'Delme', 'Taşlama', 'Frezeleme', 'Torna', 
  'CNC', '3D Yazıcı', 'Kaynak', 'Montaj', 'Diğer'
];

const MachineEdit: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { message } = App.useApp();
  
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [departments, setDepartments] = useState<Department[]>([]);
  const [initialValues, setInitialValues] = useState<any>({});

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [machineData, departmentsData] = await Promise.all([
          machineService.getMachine(id!),
          departmentService.getDepartments()
        ]);
        
        setDepartments(departmentsData);
        setInitialValues({
          ...machineData,
          department: (machineData as MachineWithDepartment).department?._id,
          purchaseDate: machineData.purchaseDate ? dayjs(machineData.purchaseDate) : undefined,
          warrantyEnd: machineData.warrantyEnd ? dayjs(machineData.warrantyEnd) : undefined,
          lastMaintenance: machineData.lastMaintenance ? dayjs(machineData.lastMaintenance) : undefined,
          nextMaintenance: machineData.nextMaintenance ? dayjs(machineData.nextMaintenance) : undefined
        });
        setLoading(false);
      } catch (error: any) {
        message.error(error.message || 'Veriler yüklenirken bir hata oluştu.');
        navigate('/dashboard/machines');
      }
    };
    
    fetchData();
  }, [id, navigate]);

  const handleSubmit = async (values: any) => {
    setSubmitting(true);
    try {
      const formattedValues = {
        ...values,
        purchaseDate: values.purchaseDate?.format('YYYY-MM-DD'),
        warrantyEnd: values.warrantyEnd?.format('YYYY-MM-DD'),
        lastMaintenance: values.lastMaintenance?.format('YYYY-MM-DD'),
        nextMaintenance: values.nextMaintenance?.format('YYYY-MM-DD')
      };

      await machineService.updateMachine(id!, formattedValues);
      message.success('Makine başarıyla güncellendi');
      navigate('/dashboard/machines');
    } catch (error: any) {
      message.error(error.message || 'Makine güncellenirken bir hata oluştu');
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
      name: 'description',
      label: 'Açıklama',
      type: 'textarea',
      row: 4,
      col: 1,
      span: 24
    },
    {
      name: 'status',
      label: 'Durum',
      type: 'select',
      rules: [{ required: true, message: 'Durum zorunludur' }],
      options: [
        { label: 'Çalışıyor', value: 'Operational' },
        { label: 'Bakımda', value: 'Maintenance' },
        { label: 'Arızalı', value: 'Breakdown' },
        { label: 'Boşta', value: 'Idle' },
      ],
      row: 5,
      col: 0,
      span: 24
    }
  ];

  return (
    <EditPage
      title="Makineyi Düzenle"
      loading={loading || submitting}
      fields={fields}
      onSubmit={handleSubmit}
      submitButtonText="Makineyi Güncelle"
      backButtonText="Makineler Listesine Dön"
      initialValues={initialValues}
      layout={{
        rows: 6,
        columns: 2,
        gap: 16
      }}
    />
  );
};

export default MachineEdit;
