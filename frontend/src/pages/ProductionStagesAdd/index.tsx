import React, { useState, useEffect } from 'react';
import { useNavigate } from 'umi';
import { App } from 'antd';
import EditPage, { EditField } from '@/components/EditPage';
import { productionStageService } from '@/services/productionStageService';
import { roleService } from '@/services/roleService';
import authService from '@/services/authService';
import departmentService from '@/services/departmentService';

const ProductionStagesAdd: React.FC = () => {
  const navigate = useNavigate();
  const { message } = App.useApp();
  
  const [roles, setRoles] = useState<any[]>([]);
  const [departments, setDepartments] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentUser, setCurrentUser] = useState<any>(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        // Fetch roles and current user in parallel
        const [rolesData, userData, departmentsData] = await Promise.all([
          roleService.getRoles(),
          authService.getProfile(),
          departmentService.getDepartments()
        ]);
        
        setRoles(rolesData);
        setCurrentUser(userData.data);
        setDepartments(departmentsData);
      } catch (error: any) {
        message.error(error.message || 'Veriler yüklenirken bir hata oluştu.');
      } finally {
        setLoading(false);
      }
    };
    
    fetchData();
  }, []);

  const handleSubmit = async (values: any) => {
    try {
      // Add createdBy from current user
      const submissionData = {
        ...values,
        createdBy: currentUser?._id
      };

      await productionStageService.createProductionStage(submissionData);
      message.success('Üretim aşaması başarıyla oluşturuldu');
      
      setTimeout(() => {
        navigate('/dashboard/production-stages');
      }, 1000);
    } catch (error: any) {
      message.error(error.message || 'İşlem sırasında bir hata oluştu');
    }
  };

  const fields: EditField[] = [
    {
      name: 'name',
      label: 'Aşama Adı',
      type: 'text',
      rules: [{ required: true, message: 'Lütfen aşama adını girin' }],
      row: 0,
      col: 0,
      span: 12
    },
    {
      name: 'sequence',
      label: 'Sıra',
      type: 'number',
      rules: [{ required: true, message: 'Lütfen sıra numarasını girin' }],
      row: 0,
      col: 1,
      span: 12,
      props: {
        min: 1
      }
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
      name: 'department',
      label: 'Departman',
      type: 'select',
      options: departments.map(dept => ({
        label: `${dept.name} (${dept.code})`,
        value: dept._id
      })),
      placeholder: 'Departman Seçin',
      row: 2,
      col: 0,
      span: 12,
      props: {
        allowClear: true
      }
    },
    {
      name: 'requiredRoles',
      label: 'Gerekli Roller',
      type: 'select',
      rules: [{ required: true, message: 'Lütfen en az bir rol seçin' }],
      options: roles.map(role => ({
        label: role.name,
        value: role._id
      })),
      row: 2,
      col: 1,
      span: 12,
      props: {
        mode: 'multiple'
      }
    },
    {
      name: 'estimatedDuration',
      label: 'Tahmini Süre (Dakika)',
      type: 'number',
      rules: [{ required: true, message: 'Lütfen tahmini süreyi girin' }],
      row: 3,
      col: 0,
      span: 12,
      props: {
        min: 1
      }
    },
    {
      name: 'isActive',
      label: 'Durum',
      type: 'switch',
      row: 3,
      col: 1,
      span: 12,
      props: {
        checkedChildren: 'Aktif',
        unCheckedChildren: 'Pasif'
      }
    }
  ];

  return (
    <EditPage
      title="Yeni Üretim Aşaması"
      loading={loading}
      fields={fields}
      onSubmit={handleSubmit}
      submitButtonText="Üretim Aşaması Oluştur"
      backButtonText="Üretim Aşamaları Listesine Dön"
      initialValues={{
        isActive: true,
        sequence: 10,
        estimatedDuration: 60,
      }}
      layout={{
        rows: 5,
        columns: 2,
        gap: 16
      }}
    />
  );
};

export default ProductionStagesAdd; 