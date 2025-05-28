import React, { useState, useEffect, CSSProperties } from 'react';
import { 
  Form, Input, Button, Card, message, Select, Switch, 
  Typography, Row, Col, Space
} from 'antd';
import { ArrowLeftOutlined, SaveOutlined, UserAddOutlined } from '@ant-design/icons';
import { useNavigate } from 'umi';
import { userService } from '@/services/userService';
import { roleService } from '@/services/roleService';
import departmentService from '@/services/departmentService';
import { PageContainer } from '@ant-design/pro-layout';
import LoadingSpinner from '@/components/LoadingSpinner';
import AddPage, { AddField } from '@/components/AddPage';

const { Title } = Typography;
const { Option } = Select;

const styles: Record<string, CSSProperties> = {
  container: {
    padding: '0px',
    minHeight: '100vh',
    backgroundColor: '#fff',
    margin: 0,
  },
  card: {
    borderRadius: 0,
    boxShadow: 'none',
    border: 'none',
  },
  cardBody: {
    padding: '24px',
  },
  header: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: '24px',
    flexWrap: 'wrap' as const,
    gap: '16px',
    padding: 0,
  },
  title: {
    margin: 0,
    color: 'rgba(0, 0, 0, 0.85)',
    padding: 0,
    fontWeight: 600,
    fontSize: 20,
    lineHeight: 1.2,
  },
  formContainer: {
    maxWidth: '800px',
    margin: '0 auto',
  },
  buttonsContainer: {
    display: 'flex',
    justifyContent: 'flex-end',
    marginTop: '24px',
    gap: '12px',
  },
  spinner: {
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    height: '300px',
  }
};

interface Role {
  _id: string;
  name: string;
  description: string;
}

const AddUser: React.FC = () => {
  const navigate = useNavigate();
  const [form] = Form.useForm();
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [roles, setRoles] = useState<Role[]>([]);
  const [departments, setDepartments] = useState<any[]>([]);
  const [messageApi, contextHolder] = message.useMessage();
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (error) {
      messageApi.error(error);
      setError(null);
    }
  }, [error, messageApi]);

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        // Rolleri yükle
        const rolesData = await roleService.getRoles();
        setRoles(rolesData);

        // Departmanları yükle
        const departmentsData = await departmentService.getDepartments();
        setDepartments(departmentsData);
      } catch (error: any) {
        setError(error.message || 'Veriler yüklenirken bir hata oluştu.');
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  const formatPhoneNumber = (value: string) => {
    // Remove all non-digit characters
    const cleaned = value.replace(/\D/g, '');
    
    // If the number starts with 0, remove it
    const number = cleaned.startsWith('0') ? cleaned.slice(1) : cleaned;
    
    // Take only first 10 digits
    const trimmedNumber = number.slice(0, 10);
    
    // Format the number
    if (trimmedNumber.length > 0) {
      const formatted = trimmedNumber.length <= 3 ? trimmedNumber :
        trimmedNumber.length <= 6 ? `${trimmedNumber.slice(0, 3)} ${trimmedNumber.slice(3)}` :
        `${trimmedNumber.slice(0, 3)} ${trimmedNumber.slice(3, 6)} ${trimmedNumber.slice(6)}`;
      
      return `0 ${formatted}`;
    }
    
    return value;
  };

  const handlePhoneChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const formatted = formatPhoneNumber(e.target.value);
    form.setFieldValue('phone', formatted);
  };

  const handleSubmit = async (values: any) => {
    setSubmitting(true);
    try {
      // Ensure roles is an array
      const userData = {
        ...values,
        roles: values.roles || [], // Ensure roles is an array, even if empty
        isActive: false // Her durumda pasif olarak ayarla
      };
      
      await userService.createUser(userData);
      messageApi.success('Kullanıcı başarıyla oluşturuldu ve davet e-postası gönderildi');
      
      // Kullanıcı listesine geri dön
      setTimeout(() => {
        navigate('/dashboard/users');
      }, 600);
    } catch (error: any) {
      setError(error.message || 'Kullanıcı oluşturulurken bir hata oluştu');
    } finally {
      setSubmitting(false);
    }
  };

  const handleCancel = () => {
    navigate('/dashboard/users');
  };

  const roleOptions = roles.map(role => ({
    label: role.description,
    value: role.name,
  }));

  const fields: AddField[] = [
    {
      name: 'firstName',
      label: 'Ad',
      type: 'text',
      required: true,
      placeholder: 'Ad',
      row: 0,
      col: 0, 
      span: 24,
    },
    {
      name: 'lastName',
      label: 'Soyad',
      type: 'text',
      required: true,
      placeholder: 'Soyad',
      row: 1,
      col: 0,
      span: 24,
    },
    {
      name: 'email',
      label: 'E-posta',
      type: 'email',
      required: true,
      placeholder: 'E-posta',
      row: 2,
      col: 0,
      span: 24,
    },
    {
      name: 'phone',
      label: 'Telefon',
      type: 'phone',
      required: true,
      placeholder: 'Telefon',
      row: 3,
      col: 0,
      span: 24,
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
    },
    {
      name: 'roles',
      label: 'Roller',
      type: 'select',
      required: true,
      mode: 'multiple',
      options: roleOptions,
      placeholder: 'Kullanıcı rollerini seçin',
      rules: [
        { 
          required: true, 
          message: 'En az bir rol seçmelisiniz', 
          type: 'array', 
          min: 1
        }
      ],
      row: 5,
      col: 0,
      span: 24,
    },
    {
      name: 'isActive',
      label: 'Durum',
      type: 'custom',
      row: 6,
      col: 0,
      span: 24,
      render: () => (
        <Form.Item name="isActive" valuePropName="checked">
          <Switch checked={false} disabled checkedChildren="Aktif" unCheckedChildren="Pasif" />
        </Form.Item>
      ),
    },
  ];

  const initialValues = {
    isActive: false
  };

  if (loading) {
    return <LoadingSpinner />;
  }

  return (
    <div style={styles.container}>
      {contextHolder}
      {submitting && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          width: '100vw',
          height: '100vh',
          background: 'rgba(255,255,255,0.7)',
          zIndex: 9999,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
        }}>
          <LoadingSpinner />
        </div>
      )}
      <div style={styles.formContainer}>
        <AddPage
          title="Kullanıcı Ekle"
          fields={fields}
          loading={loading}
          onBack={() => navigate(-1)}
          onSubmit={handleSubmit}
          onCancel={handleCancel}
          submitText="Kullanıcı Ekle"
          cancelText="İptal"
          backButtonText="Kullanıcı Listesine Dön"
          initialValues={initialValues}
          layout={{ columns: 3, gap: 16 }}
        />
      </div>
    </div>
  );
};

export default AddUser;
