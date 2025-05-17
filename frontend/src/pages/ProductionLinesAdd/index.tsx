import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { App } from 'antd';
import EditPage, { EditField } from '../../components/EditPage';
import productionLineService, { ProductionLine } from '../../services/productionLineService';
import departmentService, { Department } from '../../services/departmentService';
import { machineService, Machine } from '../../services/machineService';

const ProductionLineAddPage: React.FC = () => {
  const navigate = useNavigate();
  const { message } = App.useApp();
  const [departmentOptions, setDepartmentOptions] = useState<{ label: string; value: string }[]>([]);
  const [machineOptions, setMachineOptions] = useState<{ label: string; value: string }[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const fetchOptions = async () => {
      try {
        // Fetch departments
        const departments = await departmentService.getDepartments();
        const departmentOpts = departments.map((dept: Department) => ({
          label: dept.name,
          value: dept._id
        }));
        setDepartmentOptions(departmentOpts);

        // Fetch machines
        const machines = await machineService.getMachines();
        const machineOpts = machines.map((machine: Machine) => ({
          label: machine.name,
          value: machine._id
        }));
        setMachineOptions(machineOpts);
      } catch (error) {
        console.error('Failed to fetch options', error);
      }
    };

    fetchOptions();
  }, []);

  const handleSubmit = async (values: ProductionLine) => {
    try {
      setLoading(true);
      await productionLineService.createProductionLine(values);
      message.success('Üretim hattı başarıyla oluşturuldu');
      navigate('/dashboard/production-lines');
    } catch (error: any) {
      message.error(error.message || 'Üretim hattı oluşturulurken bir hata oluştu');
    } finally {
      setLoading(false);
    }
  };

  const fields: EditField[] = [
    {
      name: 'name',
      label: 'Üretim Hattı Adı',
      type: 'text',
      rules: [
        { required: true, message: 'Lütfen üretim hattı adını girin' },
        { min: 2, message: 'Ad en az 2 karakter olmalıdır' },
        { max: 100, message: 'Ad en fazla 100 karakter olabilir' }
      ],
      placeholder: 'Üretim hattı adını girin',
      row: 1,
      col: 1,
      span: 12
    },
    {
      name: 'code',
      label: 'Üretim Hattı Kodu',
      type: 'text',
      rules: [
        { required: true, message: 'Lütfen üretim hattı kodunu girin' },
        { min: 2, message: 'Kod en az 2 karakter olmalıdır' },
        { max: 20, message: 'Kod en fazla 20 karakter olabilir' },
        { 
          pattern: /^[A-Z0-9-]+$/, 
          message: 'Kod yalnızca büyük harfler, rakamlar ve tire içermelidir' 
        }
      ],
      placeholder: 'Üretim hattı kodunu girin',
      row: 1,
      col: 2,
      span: 12
    },
    {
      name: 'department',
      label: 'Departman',
      type: 'select',
      rules: [{ required: true, message: 'Lütfen bir departman seçin' }],
      placeholder: 'Departman seçin',
      options: departmentOptions,
      row: 2,
      col: 1,
      span: 12
    },
    {
      name: 'location',
      label: 'Lokasyon',
      type: 'text',
      rules: [{ max: 200, message: 'Lokasyon en fazla 200 karakter olabilir' }],
      placeholder: 'Lokasyon bilgisini girin',
      row: 2,
      col: 2,
      span: 12
    },
    {
      name: 'machines',
      label: 'Makineler',
      type: 'multiselect',
      placeholder: 'Makineleri seçin',
      options: machineOptions,
      row: 3,
      col: 1,
      span: 12
    },
    {
      name: 'capacity',
      label: 'Kapasite',
      type: 'number',
      rules: [{ type: 'number', min: 0, message: 'Kapasite 0\'dan büyük olmalıdır' }],
      placeholder: 'Kapasite girin',
      props: {
        min: 0
      },
      row: 3,
      col: 2,
      span: 6
    },
    {
      name: 'capacityUnit',
      label: 'Kapasite Birimi',
      type: 'select',
      options: [
        { label: 'Adet/Saat', value: 'adet/saat' },
        { label: 'Kg/Saat', value: 'kg/saat' },
        { label: 'Metre/Saat', value: 'metre/saat' },
        { label: 'Litre/Saat', value: 'litre/saat' }
      ],
      defaultValue: 'adet/saat',
      row: 3,
      col: 3,
      span: 6
    },
    {
      name: 'efficiency',
      label: 'Verimlilik (%)',
      type: 'number',
      rules: [
        { type: 'number', min: 0, max: 100, message: 'Verimlilik 0-100 arasında olmalıdır' }
      ],
      placeholder: 'Verimlilik girin',
      props: {
        min: 0,
        max: 100
      },
      defaultValue: 100,
      row: 4,
      col: 1,
      span: 6
    },
    {
      name: 'status',
      label: 'Durum',
      type: 'select',
      options: [
        { label: 'Aktif', value: 'Aktif' },
        { label: 'Bakımda', value: 'Bakımda' },
        { label: 'Kapalı', value: 'Kapalı' },
        { label: 'Planlı Duruş', value: 'Planlı Duruş' },
        { label: 'Arıza', value: 'Arıza' }
      ],
      defaultValue: 'Aktif',
      row: 4,
      col: 2,
      span: 6
    },
    {
      name: 'description',
      label: 'Açıklama',
      type: 'textarea',
      rules: [{ max: 500, message: 'Açıklama en fazla 500 karakter olabilir' }],
      placeholder: 'Üretim hattı açıklamasını girin',
      row: 5,
      col: 1,
      span: 24
    }
  ];

  return (
    <EditPage
      title="Yeni Üretim Hattı Oluştur"
      fields={fields}
      onSubmit={handleSubmit}
      backUrl="/dashboard/production-lines"
      layout={{
        rows: 5,
        columns: 3,
        gap: 16
      }}
      loading={loading}
    />
  );
};

export default ProductionLineAddPage; 