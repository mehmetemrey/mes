import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'umi';
import { message } from 'antd';
import EditPage, { EditField } from '@/components/EditPage';
import { productionStageService } from '@/services/productionStageService';
import { roleService } from '@/services/roleService';
import departmentService from '@/services/departmentService';

const ProductionStagesEdit: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [roles, setRoles] = useState<any[]>([]);
  const [departments, setDepartments] = useState<any[]>([]);
  const [initialValues, setInitialValues] = useState<any>({});

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [rolesData, departmentsData, stageData] = await Promise.all([
          roleService.getRoles(),
          departmentService.getDepartments(),
          productionStageService.getProductionStage(id!)
        ]);
        
        setRoles(rolesData);
        setDepartments(departmentsData);
        
        const formattedInitialValues = {
          ...stageData,
          requiredRoles: Array.isArray(stageData.requiredRoles) 
            ? stageData.requiredRoles.map((role: any) => typeof role === 'string' ? role : role._id)
            : [],
          department: typeof stageData.department === 'object' && stageData.department !== null 
            ? stageData.department._id 
            : stageData.department
        };

        setInitialValues(formattedInitialValues);
        setLoading(false);
      } catch (error: any) {
        message.error(error.message || 'Veriler yüklenirken bir hata oluştu.');
        navigate('/dashboard/production-stages');
      }
    };
    
    fetchData();
  }, [id, navigate]);

  const handleSubmit = async (values: any) => {
    try {
      setLoading(true);
      await productionStageService.updateProductionStage(id!, values);
      message.success('Üretim aşaması başarıyla güncellendi');
      navigate('/dashboard/production-stages');
    } catch (error: any) {
      message.error(error.message || 'Üretim aşaması güncellenemedi');
    } finally {
      setLoading(false);
    }
  };

  const fields: EditField[] = [
    {
      name: 'name',
      label: 'Aşama Adı',
      type: 'text',
      rules: [{ required: true, message: 'Aşama adı zorunludur' }],
      row: 0,
      col: 0,
      span: 12
    },
    {
      name: 'sequence',
      label: 'Sıra',
      type: 'number',
      rules: [{ required: true, message: 'Sıra numarası zorunludur' }],
      row: 0,
      col: 1,
      span: 12
    },
    {
      name: 'description',
      label: 'Açıklama',
      type: 'textarea',
      row: 1,
      col: 0,
      span: 24
    },
    {
      name: 'estimatedDuration',
      label: 'Tahmini Süre (Dakika)',
      type: 'number',
      rules: [{ required: true, message: 'Tahmini süre zorunludur' }],
      row: 2,
      col: 0,
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
      row: 2,
      col: 1,
      span: 12,
      props: {
        allowClear: true
      }
    },
    {
      name: 'requiredRoles',
      label: 'Gerekli Roller',
      type: 'multiselect',
      options: roles.map(role => ({
        label: role.name,
        value: role._id
      })),
      placeholder: 'Gerekli rolleri seçin',
      row: 3,
      col: 0,
      span: 24
    },
    {
      name: 'isActive',
      label: 'Durum',
      type: 'switch',
      row: 4,
      col: 0,
      span: 12,
      props: {
        checkedChildren: 'Aktif',
        unCheckedChildren: 'Pasif'
      }
    }
  ];

  return (
    <EditPage
      title="Üretim Aşamasını Düzenle"
      loading={loading}
      fields={fields}
      onSubmit={handleSubmit}
      submitButtonText="Üretim Aşamasını Güncelle"
      backButtonText="Üretim Aşamaları Listesine Dön"
      initialValues={initialValues}
      layout={{
        rows: 5,
        columns: 2,
        gap: 16
      }}
    />
  );
};

export default ProductionStagesEdit; 