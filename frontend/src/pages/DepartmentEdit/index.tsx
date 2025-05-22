import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'umi';
import { App } from 'antd';
import dayjs from 'dayjs';
import EditPage, { EditField } from '@/components/EditPage';
import departmentService, { Department } from '@/services/departmentService';
import userService from '@/services/userService';
import { TimePicker } from 'antd';

const DepartmentEdit: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { message } = App.useApp();
  
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [departments, setDepartments] = useState<Department[]>([]);
  const [users, setUsers] = useState<any[]>([]);
  const [initialValues, setInitialValues] = useState<any>({});

  const departmentTypes = [
    { value: 'production', label: 'Üretim' },
    { value: 'quality', label: 'Kalite' },
    { value: 'maintenance', label: 'Bakım' },
    { value: 'warehouse', label: 'Depo' },
    { value: 'hr', label: 'İnsan Kaynakları' },
    { value: 'planning', label: 'Planlama' },
    { value: 'management', label: 'Yönetim' },
    { value: 'system', label: 'Sistem' },
  ];

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [departmentsData, usersData, departmentData] = await Promise.all([
          departmentService.getDepartments(),
          userService.getUsers(),
          departmentService.getDepartment(id!),
        ]);

        setDepartments(departmentsData.filter((d) => d._id !== id));
        setUsers(usersData);

        // Convert time strings to dayjs objects
        const startTime = departmentData.workingHours?.start ? dayjs(departmentData.workingHours.start, 'HH:mm') : null;
        const endTime = departmentData.workingHours?.end ? dayjs(departmentData.workingHours.end, 'HH:mm') : null;

        const formattedInitialValues = {
          name: departmentData.name,
          code: departmentData.code,
          description: departmentData.description || '',
          manager: departmentData.manager?._id,
          parentDepartment: departmentData.parentDepartment?._id,
          location: departmentData.location || '',
          phone: departmentData.contactInfo?.phone || '',
          email: departmentData.contactInfo?.email || '',
          workingHoursStart: startTime,
          workingHoursEnd: endTime,
          type: departmentData.type,
          isActive: departmentData.isActive,
        };

        setInitialValues(formattedInitialValues);
        setLoading(false);
      } catch (error: any) {
        message.error({
          content: error.response?.data?.message || error.message || 'Veriler yüklenirken bir hata oluştu',
          duration: 5,
        });
        navigate('/dashboard/departments');
      }
    };
    fetchData();
  }, [id]);

  const handleSubmit = async (values: any) => {
    setSubmitting(true);
    try {
      // Format working hours
      const formattedValues = {
        ...values,
        workingHours: values.workingHoursStart && values.workingHoursEnd ? {
          start: values.workingHoursStart.format('HH:mm'),
          end: values.workingHoursEnd.format('HH:mm')
        } : undefined,
        contactInfo: {
          phone: values.phone,
          email: values.email
        }
      };

      await departmentService.updateDepartment(id!, formattedValues);
      message.success({
        content: 'Departman başarıyla güncellendi',
        duration: 3,
      });
      navigate('/dashboard/departments');
    } catch (error: any) {
      message.error({
        content: error.response?.data?.message || error.message || 'Departman güncellenirken bir hata oluştu',
        duration: 5,
      });
    } finally {
      setSubmitting(false);
    }
  };

  const fields: EditField[] = [
    {
      name: 'name',
      label: 'Departman Adı',
      type: 'text',
      rules: [{ required: true, message: 'Lütfen departman adını girin' }],
      row: 0,
      col: 0,
      span: 12
    },
    {
      name: 'code',
      label: 'Departman Kodu',
      type: 'text',
      rules: [{ required: true, message: 'Lütfen departman kodunu girin' }],
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
      name: 'manager',
      label: 'Departman Yöneticisi',
      type: 'select',
      options: users.map(user => ({
        label: `${user.firstName} ${user.lastName}`,
        value: user._id,
      })),
      row: 2,
      col: 0,
      span: 12
    },
    {
      name: 'parentDepartment',
      label: 'Üst Departman',
      type: 'select',
      options: departments.map(dept => ({
        label: `${dept.name} (${dept.code})`,
        value: dept._id,
      })),
      row: 2,
      col: 1,
      span: 12,
      props: {
        allowClear: true
      }
    },
    {
      name: 'location',
      label: 'Konum',
      type: 'text',
      row: 3,
      col: 0,
      span: 12
    },
    {
      name: 'type',
      label: 'Departman Tipi',
      type: 'select',
      rules: [{ required: true, message: 'Lütfen departman tipini seçin' }],
      options: departmentTypes,
      row: 3,
      col: 1,
      span: 12
    },
    {
      name: 'phone',
      label: 'Telefon',
      type: 'text',
      row: 4,
      col: 0,
      span: 6
    },
    {
      name: 'email',
      label: 'E-Posta',
      type: 'email',
      row: 4,
      col: 1,
      span: 6
    },
    {
      name: 'workingHoursStart',
      label: 'Çalışma Başlangıç Saati',
      type: 'custom',
      render: () => (
        <TimePicker 
          format="HH:mm" 
          minuteStep={15}
          style={{ width: '100%' }}
        />
      ),
      row: 4,
      col: 2,
      span: 6,
      props: {
        format: 'HH:mm',
        minuteStep: 15
      }
    },
    {
      name: 'workingHoursEnd',
      label: 'Çalışma Bitiş Saati',
      type: 'custom',
      render: () => (
        <TimePicker 
          format="HH:mm" 
          minuteStep={15}
          style={{ width: '100%' }}
        />
      ),
      row: 4,
      col: 3,
      span: 6,
      props: {
        format: 'HH:mm',
        minuteStep: 15
      }
    },
    {
      name: 'isActive',
      label: 'Durum',
      type: 'switch',
      row: 5,
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
      title="Departman Düzenle"
      loading={loading || submitting}
      fields={fields}
      onSubmit={handleSubmit}
      submitButtonText="Departmanı Güncelle"
      backButtonText="Departmanlar Listesine Dön"
      initialValues={initialValues}
      layout={{
        rows: 6,
        columns: 2,
        gap: 16
      }}
    />
  );
};

export default DepartmentEdit; 