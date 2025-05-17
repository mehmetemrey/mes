import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'umi';
import { App } from 'antd';
import LoadingSpinner from '@/components/LoadingSpinner';
import EditPage, { EditField } from '@/components/EditPage';
import productionLineService, { ProductionLine } from '@/services/productionLineService';
import departmentService from '@/services/departmentService';
import { machineService } from '@/services/machineService';

interface Department {
  _id: string;
  name: string;
  code: string;
}

interface Machine {
  _id: string;
  name: string;
  code: string;
}

const ProductionLineEdit: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { message } = App.useApp();
  
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [departments, setDepartments] = useState<Department[]>([]);
  const [machines, setMachines] = useState<Machine[]>([]);
  const [initialValues, setInitialValues] = useState<any>({});
  const [productionLine, setProductionLine] = useState<ProductionLine | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        if (!id) {
          message.error('Üretim hattı ID\'si bulunamadı');
          navigate('/dashboard/production-lines');
          return;
        }

        const [prodLineData, departmentsData, machinesData] = await Promise.all([
          productionLineService.getProductionLineById(id),
          departmentService.getDepartments(),
          machineService.getMachines()
        ]);
        
        const actualProdLineData = prodLineData.data;
        
        const normalizedProdLine = {
          ...actualProdLineData,
          department: actualProdLineData.department?._id,
          machines: actualProdLineData.machines?.map((machine: any) => machine._id) || []
        };
        
        setProductionLine(actualProdLineData);
        setInitialValues(normalizedProdLine);
        setDepartments(departmentsData);
        setMachines(machinesData);
        setLoading(false);
      } catch (error: any) {
        message.error(error.message || 'Veriler yüklenirken bir hata oluştu');
        navigate('/dashboard/production-lines');
      }
    };

    fetchData();
  }, [id, navigate, message]);

  const handleSubmit = async (values: any) => {
    setSubmitting(true);
    try {
      await productionLineService.updateProductionLine(id!, values);
      message.success('Üretim hattı başarıyla güncellendi');
      navigate('/dashboard/production-lines');
    } catch (error: any) {
      message.error(error.message || 'Üretim hattı güncellenirken bir hata oluştu');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async () => {
    try {
      await productionLineService.deleteProductionLine(id!);
      message.success('Üretim hattı başarıyla silindi');
      navigate('/dashboard/production-lines');
    } catch (error: any) {
      message.error(error.message || 'Üretim hattı silinirken bir hata oluştu');
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
      options: departments.map(dept => ({
        label: `${dept.name} (${dept.code})`,
        value: dept._id
      })),
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
      options: machines.map(machine => ({
        label: `${machine.name} (${machine.code})`,
        value: machine._id
      })),
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
      rules: [{ required: true, message: 'Durum zorunludur' }],
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

  if (loading) {
    return <LoadingSpinner loading={true} />;
  }

  return (
    <EditPage
      title={`Üretim Hattını Düzenle: ${productionLine?.name || ''}`}
      loading={submitting}
      fields={fields}
      initialValues={initialValues}
      onSubmit={handleSubmit}
      onDelete={handleDelete}
      backUrl="/dashboard/production-lines"
      layout={{
        rows: 5,
        columns: 3,
        gap: 16
      }}
    />
  );
};

export default ProductionLineEdit;
