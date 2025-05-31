import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'umi';
import { message } from 'antd';
import roleService, { Role, UpdateRoleData } from '@/services/roleService';
import permissionService, { Permission } from '@/services/permissionService';
import EditPage, { EditField } from '@/components/EditPage';

const RoleEdit: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [role, setRole] = useState<Role | null>(null);
  const [permissions, setPermissions] = useState<Permission[]>([]);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        const data = await roleService.getRole(id!) as any;
        setRole(data.role);
        const allPermissions = await permissionService.getPermissions();
        setPermissions(allPermissions);
      } catch (error: any) {
        message.error(error.message || 'Rol veya izinler alınamadı');
        navigate('/dashboard/roles');
      } finally {
        setLoading(false);
      }
    };
    if (id) fetchData();
  }, [id, navigate]);

  const handleSubmit = async (values: any) => {
    setSubmitting(true);
    try {
      await roleService.updateRole(id!, values as UpdateRoleData);
      message.success('Rol başarıyla güncellendi');
      navigate('/dashboard/roles');
    } catch (error: any) {
      message.error(error.message || 'Rol güncellenemedi');
    } finally {
      setSubmitting(false);
    }
  };

  const fields: EditField[] = [
    {
      name: 'name',
      label: 'Rol Adı',
      type: 'text',
      placeholder: 'Rol adı',
      row: 0, col: 0,
      span: 24,
      rules: [{ required: true, message: 'Rol adı zorunlu' }],
    },
    {
      name: 'description',
      label: 'Açıklama',
      type: 'text',
      placeholder: 'Açıklama',
      row: 1, col: 0,
      span: 24,
      rules: [{ required: true, message: 'Açıklama zorunlu' }],
    },
    {
      name: 'level',
      label: 'Seviye',
      type: 'number',
      placeholder: 'Seviye',
      row: 2, col: 0,
      span: 24,
      rules: [{ required: true, message: 'Seviye zorunlu' }],
    },
    {
      name: 'scope',
      label: 'Kapsam',
      type: 'select',
      options: [
        { label: 'Global', value: 'global' },
        { label: 'Departman', value: 'department' },
        { label: 'Takım', value: 'team' },
      ],
      placeholder: 'Kapsam seçin',
      row: 3, col: 0,
      span: 24,
      rules: [{ required: true, message: 'Kapsam zorunlu' }],
    },
    {
      name: 'isActive',
      label: 'Durum',
      type: 'switch',
      row: 4, col: 0,
      span: 24,
    },
    {
      name: 'permissions',
      label: 'Yetkiler',
      type: 'multiselect',
      options: permissions.map(p => ({ key: p._id, label: p.description, value: p._id })),
      placeholder: 'Yetkileri seçin',
      row: 5, col: 0,
      span: 24,
      rules: [{ type: 'array' }],
    },
  ];

  const initialValues = role
    ? { ...role, permissions: (role.permissions || []).map(p => p._id) }
    : {};

  return (
    <EditPage
      title="Rolü Düzenle"
      fields={fields}
      loading={loading || submitting}
      initialValues={initialValues}
      backButtonText="Rol Listesine Dön"
      onSubmit={handleSubmit}
      layout={{ columns: 2, gap: 16 }}
    />
  );
};

export default RoleEdit; 