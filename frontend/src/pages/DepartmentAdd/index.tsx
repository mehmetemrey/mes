import React, { useEffect, useState } from 'react';
import { useNavigate } from 'umi';
import { 
  App, 
  Form, 
  Input, 
  TimePicker 
} from 'antd';
import dayjs from 'dayjs';
import EditPage, { EditField } from '@/components/EditPage';
import departmentService, { Department } from '@/services/departmentService';
import userService from '@/services/userService';

const DepartmentAdd: React.FC = () => {
  const navigate = useNavigate();
  const { message } = App.useApp();
  
  const [users, setUsers] = useState<any[]>([]);
  const [departments, setDepartments] = useState<Department[]>([]);
  const [loading, setLoading] = useState(true);

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
    const fetchInitialData = async () => {
      try {
        const [usersData, departmentsData] = await Promise.all([
          userService.getUsers(),
          departmentService.getDepartments()
        ]);

        setUsers(usersData);
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
      // Prepare department data
      const formData: Partial<Department> = {
        ...values,
        // Convert working hours to string format
        workingHours: values.workingHoursStart && values.workingHoursEnd
          ? {
              start: values.workingHoursStart.format('HH:mm'),
              end: values.workingHoursEnd.format('HH:mm')
            }
          : undefined,
        // Ensure contactInfo is properly formatted
        contactInfo: {
          phone: values.phone,
          email: values.email
        },
        // Ensure manager and parentDepartment are set correctly
        manager: values.manager 
          ? { _id: values.manager } as any 
          : undefined,
        parentDepartment: values.parentDepartment 
          ? { _id: values.parentDepartment } as any 
          : undefined,
      };

      const response = await departmentService.createDepartment(formData);
      message.success('Departman başarıyla oluşturuldu.');
      navigate('/dashboard/departments');
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
                case 'name':
                  message.error('Bu departman adı zaten kullanılmış. Lütfen farklı bir ad seçin.');
                  break;
                case 'code':
                  message.error('Bu departman kodu zaten sistemde mevcut. Lütfen farklı bir kod seçin.');
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
            message.error('Departman oluşturulurken bir hata oluştu. Lütfen tüm alanları doğru doldurduğunuzdan emin olun.');
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
      rules: [
        { required: true, message: 'Lütfen departman kodunu girin' },
        { 
          pattern: /^[A-Z0-9]+$/, 
          message: 'Departman kodu büyük harf ve rakamlardan oluşmalıdır' 
        }
      ],
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
      name: 'type',
      label: 'Departman Tipi',
      type: 'select',
      rules: [{ required: true, message: 'Lütfen departman tipini seçin' }],
      options: departmentTypes,
      row: 2,
      col: 0,
      span: 12
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
      col: 1,
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
      row: 3,
      col: 0,
      span: 12
    },
    {
      name: 'location',
      label: 'Konum',
      type: 'text',
      row: 3,
      col: 1,
      span: 12
    },
    {
      name: 'phone',
      label: 'Telefon Numarası',
      type: 'text',
      row: 4,
      col: 0,
      span: 6
    },
    {
      name: 'email',
      label: 'E-Posta Adresi',
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
          style={{ width: '100%' }} 
          format="HH:mm" 
          placeholder="Başlangıç"
          minuteStep={15}
          use12Hours={false}
        />
      ),
      row: 4,
      col: 2,
      span: 6
    },
    {
      name: 'workingHoursEnd',
      label: 'Çalışma Bitiş Saati',
      type: 'custom',
      render: () => (
        <TimePicker 
          style={{ width: '100%' }} 
          format="HH:mm" 
          placeholder="Bitiş"
          minuteStep={15}
          use12Hours={false}
        />
      ),
      row: 4,
      col: 3,
      span: 6
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
      title="Yeni Departman Oluştur"
      loading={loading}
      fields={fields}
      onSubmit={handleSubmit}
      submitButtonText="Departman Oluştur"
      backButtonText="Departmanlar Listesine Dön"
      initialValues={{
        isActive: true,
        type: 'production'
      }}
      layout={{
        rows: 7,
        columns: 2,
        gap: 16
      }}
    />
  );
};

export default DepartmentAdd;
