import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'umi';
import { message, Modal } from 'antd';
import EditPage, { EditField } from '@/components/EditPage';
import userService, { User } from '@/services/userService';
import { roleService, Role } from '@/services/roleService';
import LoadingSpinner from '@/components/LoadingSpinner';
import departmentService from '@/services/departmentService';

const UserEdit: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState<User | null>(null);
  const [roles, setRoles] = useState<Role[]>([]);
  const [departments, setDepartments] = useState<any[]>([]);

  const fetchUser = async () => {
    try {
      setLoading(true);
      const userData = await userService.getUser(id!);
      setUser(userData);
      // Fetch all roles for the select field
      const allRoles = await roleService.getRoles();
      setRoles(allRoles);

      // Fetch departments
      const departmentsData = await departmentService.getDepartments();
      setDepartments(departmentsData);
    } catch (error: any) {
      message.error(error.message || 'Kullanıcı bilgileri alınamadı');
      navigate('/dashboard/users');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (id) {
      fetchUser();
    }
  }, [id]);

  const handleSubmit = async (values: any) => {
    try {
      setLoading(true);
      await userService.updateUser(id!, values);
      message.success('Kullanıcı başarıyla güncellendi');
      navigate('/dashboard/users');
    } catch (error: any) {
      message.error(error.message || 'Kullanıcı güncellenemedi');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = () => {
    Modal.confirm({
      title: 'Kullanıcıyı Sil',
      content: 'Bu kullanıcıyı silmek istediğinizden emin misiniz?',
      okText: 'Evet',
      cancelText: 'Hayır',
      okButtonProps: { danger: true },
      onOk: async () => {
        try {
          await userService.deleteUser(id!);
          message.success('Kullanıcı başarıyla silindi');
          navigate('/dashboard/users');
        } catch (error: any) {
          message.error(error.message || 'Kullanıcı silinemedi');
        }
      },
    });
  };

  const getFields = (): EditField[] => {
    if (!user) return [];

    return [
      {
        name: 'firstName',
        label: 'Ad',
        type: 'text',
        rules: [{ required: true, message: 'Ad alanı zorunludur' }],
        defaultValue: user.firstName,
        placeholder: 'Adı giriniz',
        row: 0,
        col: 0,
        span: 12
      },
      {
        name: 'lastName',
        label: 'Soyad',
        type: 'text',
        rules: [{ required: true, message: 'Soyad alanı zorunludur' }],
        defaultValue: user.lastName,
        placeholder: 'Soyadı giriniz',
        row: 0,
        col: 1,
        span: 12
      },
      {
        name: 'email',
        label: 'E-posta',
        type: 'email',
        rules: [
          { required: true, message: 'E-posta alanı zorunludur' },
          { type: 'email', message: 'Geçerli bir e-posta adresi giriniz' }
        ],
        defaultValue: user.email,
        placeholder: 'E-posta adresini giriniz',
        row: 1,
        col: 0,
        span: 12
      },
      {
        name: 'phone',
        label: 'Telefon',
        type: 'phone',
        rules: [{ required: true, message: 'Telefon alanı zorunludur' }],
        defaultValue: user.phone,
        placeholder: 'Telefon numarasını giriniz',
        row: 1,
        col: 1,
        span: 12
      },
      {
        name: 'roles',
        label: 'Roller',
        type: 'multiselect',
        rules: [{ required: true, message: 'En az bir rol seçilmelidir' }],
        options: roles.map(role => ({
          label: role.description,
          value: role._id
        })),
        defaultValue: user.roles,
        placeholder: 'Kullanıcı rollerini seçin',
        row: 2,
        col: 0,
        span: 12,
        props: {
          allowClear: true
        }
      },
      {
        name: 'isActive',
        label: 'Durum',
        type: 'switch',
        defaultValue: user.isActive,
        row: 3,
        col: 0,
        span: 12,
        props: {
          checkedChildren: 'Aktif',
          unCheckedChildren: 'Pasif'
        }
      },
      {
        name: 'department',
        label: 'Departman',
        type: 'select',
        defaultValue: user?.department?._id,
        options: departments.map(dept => ({
          label: `${dept.name}`,
          value: dept._id
        })),
        placeholder: 'Departman Seçin',
        row: 2,
        col: 1,
        span: 12,
        props: {
          allowClear: true
        }
      }
    ];
  };

  if (loading && !user) {
    return <LoadingSpinner />;
  }

  return (
    <EditPage
      title="Kullanıcı Düzenle"
      loading={loading}
      fields={getFields()}
      initialValues={{
        ...user,
        department: user?.department?._id
      }}
      onSubmit={handleSubmit}
      onDelete={handleDelete}
      backButtonText="Kullanıcı Listesine Dön"
      submitButtonText="Güncelle"
      layout={{
        rows: 4,
        columns: 2,
        gap: 16
      }}
    />
  );
};

export default UserEdit;
