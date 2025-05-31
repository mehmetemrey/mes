import React, { useEffect, useState } from 'react';
import { Form, Select, Switch, InputNumber, message, ConfigProvider, Typography, Input } from 'antd';
import { useNavigate } from 'umi';
import { roleService, CreateRoleData, Role } from '@/services/roleService';
import { permissionService, Permission } from '@/services/permissionService';
import trTR from 'antd/locale/tr_TR';
import LoadingSpinner from '@/components/LoadingSpinner';
import AddPage, { AddField } from '@/components/AddPage';
import departmentService from '@/services/departmentService';

const { Option } = Select;

const styles = {
  container: {
    padding: 0,
    margin: 0,
    minHeight: '100vh',
    backgroundColor: '#fff',
  },
  formContainer: {
    maxWidth: '800px',
    margin: '0 auto',
  }
};

const AddRole: React.FC = () => {
  const [form] = Form.useForm();
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [messageApi, contextHolder] = message.useMessage();
  const navigate = useNavigate();
  const [allPermissions, setAllPermissions] = useState<Permission[]>([]);
  const [allRoles, setAllRoles] = useState<Role[]>([]);
  const [allDepartments, setAllDepartments] = useState<any[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [role, setRole] = useState<Role | null>(null);

  useEffect(() => {
    if (error) {
      messageApi.error(error);
      setError(null);
    }
  }, [error, messageApi]);

  useEffect(() => {
    const loadPermissions = async () => {
      setLoading(true);
      try {
        const permissions = await permissionService.getPermissions();
        if (permissions && permissions.length > 0) {
          setAllPermissions(permissions);
        } else {
          setError('İzinler yüklenemedi. Lütfen sayfayı yenileyin.');
        }
      } catch (error: any) {
        setError(error.message || 'İzinler yüklenirken bir hata oluştu');
      } finally {
        setLoading(false);
      }
    };

    loadPermissions();
  }, []);

  useEffect(() => {
    const url = window.location.pathname;
    const match = url.match(/roles\/(edit|update)\/(\w+)/);
    const roleId = match ? match[2] : null;
    if (roleId) {
      setLoading(true);
      roleService.getRole(roleId)
        .then((data) => setRole(data))
        .catch(() => setRole(null))
        .finally(() => setLoading(false));
    }
  }, []);

  useEffect(() => {
    const loadRoles = async () => {
      try {
        const roles = await roleService.getRoles();
        setAllRoles(roles);
      } catch (error: any) {
        setError(error.message || 'Roller yüklenirken bir hata oluştu');
      }
    };

    const loadDepartments = async () => {
      try {
        const departments = await departmentService.getDepartments();
        setAllDepartments(departments);
      } catch (error: any) {
        setError(error.message || 'Departmanlar yüklenirken bir hata oluştu');
      }
    };

    loadRoles();
    loadDepartments();
  }, []);

  const handleSubmit = async (values: CreateRoleData) => {
    setSubmitting(true);
    try {
      const formData = {
        ...values,
        permissions: values.permissions || [],
        isActive: values.isActive ?? true,
        scope: values.scope || 'global',
      };
      
      
      await roleService.createRole(formData);
      messageApi.success('Rol başarıyla oluşturuldu');
      setTimeout(() => {
        navigate('/dashboard/roles');
      }, 600);
    } catch (error: any) {
      console.error('Role Creation Error:', error);
      
      // Enhanced error logging
      if (error.response) {
        // The request was made and the server responded with a status code
        console.error('Error Response Data:', error.response.data);
        console.error('Error Response Status:', error.response.status);
        console.error('Error Response Headers:', error.response.headers);
      } else if (error.request) {
        // The request was made but no response was received
        console.error('Error Request:', error.request);
      } else {
        // Something happened in setting up the request that triggered an Error
        console.error('Error Message:', error.message);
      }
      
      const errorMessage = error.response?.data?.message || 
                           error.response?.data?.error || 
                           error.message || 
                           'Rol oluşturulurken bir hata oluştu';
      setError(errorMessage);
      messageApi.error(errorMessage);
    } finally {
      setSubmitting(false);
    }
  };

  const handleCancel = () => {
    navigate('/dashboard/roles');
  };

  const permissionOptions = allPermissions.map(permission => ({
    label: `${permission.description} (${permission.module})`,
    value: permission._id,
  }));

  const fields: AddField[] = [
    {
      name: 'name',
      label: 'Rol Adı',
      type: 'text',
      required: true,
      placeholder: 'Rol adı',
      row: 0,
      col: 0,
      span: 24,
    },
    {
      name: 'description',
      label: 'Açıklama',
      type: 'text',
      required: true,
      placeholder: 'Rol açıklaması',
      row: 1,
      col: 0,
      span: 24,
      render: () => (
        <Form.Item
          name="description"
          label="Açıklama"
          rules={[{ required: true, message: 'Lütfen açıklama girin' }]}
        >
          <Input.TextArea rows={4} placeholder="Rol açıklaması" />
        </Form.Item>
      ),
    },
    {
      name: 'scope',
      label: 'Kapsam',
      type: 'select',
      required: true,
      placeholder: 'Kapsam seçin',
      row: 2,
      col: 0,
      span: 24,
      options: [
        { label: 'Global', value: 'global' },
        { label: 'Departman', value: 'department' },
        { label: 'Takım', value: 'team' },
      ],
    },
    {
      name: 'level',
      label: 'Seviye',
      type: 'number',
      required: true,
      placeholder: 'Seviye',
      row: 3,
      col: 0,
      span: 24,
      render: () => (
        <Form.Item
          name="level"
          label="Seviye"
          rules={[{ required: true, message: 'Lütfen seviye girin' }]}
        >
          <InputNumber min={1} max={10} style={{ width: '100%' }} />
        </Form.Item>
      ),
    },
    {
      name: 'department',
      label: 'Departman',
      type: 'select',
      placeholder: 'Departman seçin',
      row: 4,
      col: 0,
      span: 24,
      options: allDepartments.map(dept => ({
        label: dept.name,
        value: dept._id
      })),
    },
    {
      name: 'parentRole',
      label: 'Üst Rol',
      type: 'select',
      placeholder: 'Üst rol seçin',
      row: 5,
      col: 0,
      span: 24,
      options: allRoles.map(role => ({
        label: role.name,
        value: role._id
      })),
    },
    {
      name: 'permissions',
      label: 'İzinler',
      type: 'custom',
      options: permissionOptions,
      placeholder: 'İzinleri seçin',
      rules: [{ required: true, message: 'Lütfen en az bir izin seçin', type: 'array' }],
      row: 6,
      col: 0,
      span: 24,
      render: () => (
        <Form.Item 
          name="permissions" 
          valuePropName="value"
        >
          <Select
            mode="multiple"
            style={{ width: '100%' }}
            placeholder="İzinleri seçin"
            options={permissionOptions}
            allowClear
            value={[]}
          />
        </Form.Item>
      ),
    },
    {
      name: 'isActive',
      label: 'Aktif Mi?',
      type: 'custom',
      required: false,
      row: 7,
      col: 0,
      span: 24,
      render: () => (
        <Form.Item
          name="isActive"
          label="Aktif Mi?"
          valuePropName="checked"
        >
          <Switch />
        </Form.Item>
      ),
    },
  ];

  const initialValues = {
    scope: role?.scope || 'department',
    level: role?.level || 1,
    isActive: role?.isActive ?? true,
    name: role?.name || '',
    description: role?.description || '',
    permissions: role?.permissions?.map(p => p._id) || [],
    department: role?.department?._id,
    parentRole: role?.parentRole?._id,
  };

  if (loading) {
    return <LoadingSpinner />;
  }

  return (
    <ConfigProvider locale={trTR}>
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
            title="Yeni Rol Ekle"
            fields={fields}
            loading={loading}
            onBack={() => navigate(-1)}
            onSubmit={handleSubmit}
            onCancel={handleCancel}
            submitText="Rol Oluştur"
            cancelText="İptal"
            backButtonText="Roller Listesine Dön"
            initialValues={initialValues}
            layout={{ columns: 2, gap: 16 }}
          />
        </div>
      </div>
    </ConfigProvider>
  );
};

export default AddRole; 