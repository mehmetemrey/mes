import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'umi';
import { Tag, Typography, Space, Modal, message } from 'antd';
import roleService, { Role } from '@/services/roleService';
import DetailPage, { DetailField } from '@/components/DetailPage';
import LoadingSpinner from '@/components/LoadingSpinner';

const { Text } = Typography;

interface RoleDetailResponse { role: Role; users: any[]; }

const RoleDetail: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [role, setRole] = useState<Role | null>(null);
  const [modal, modalContextHolder] = Modal.useModal();

  useEffect(() => {
    const fetchRole = async () => {
      setLoading(true);
      try {
        const data = await roleService.getRole(id!) as any;
        const { role } = data;
        setRole(role);
      } catch (error) {
        console.error('Role fetch error:', error);
        navigate('/dashboard/roles');
      } finally {
        setLoading(false);
      }
    };
    if (id) fetchRole();
  }, [id, navigate]);

  const formatDate = (date: string) => {
    if (!date) return '-';
    return new Date(date).toLocaleString('tr-TR', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const handleEdit = () => {
    navigate(`/dashboard/roles/edit/${id}`);
  };

  const handleDelete = () => {
    modal.confirm({
      title: 'Rolü silmek istediğinize emin misiniz?',
      content: 'Bu işlem geri alınamaz.',
      okText: 'Evet',
      cancelText: 'Hayır',
      okType: 'danger',
      onOk: async () => {
        try {
          await roleService.deleteRole(id!);
          message.success('Rol silindi');
          navigate('/dashboard/roles');
        } catch (error: any) {
          message.error(error.message || 'Rol silinemedi');
        }
      },
    });
  };

  const getFields = (): DetailField[] => {
    if (!role) return [];

    return [
      {
        label: 'Temel Bilgiler',
        value: (
          <Space direction="vertical" size="middle" style={{ width: '100%' }}>
            <div>
              <Text type="secondary">Rol Adı</Text>
              <div><Text strong>{role.name}</Text></div>
            </div>
            <div>
              <Text type="secondary">Açıklama</Text>
              <div><Text>{role.description || 'Açıklama yok'}</Text></div>
            </div>
          </Space>
        ),
        row: 0, col: 0, span: 12
      },
      {
        label: 'Rol Detayları',
        value: (
          <Space direction="vertical" size="middle" style={{ width: '100%' }}>
            <div>
              <Text type="secondary">Kapsam</Text>
              <div>
                <Tag color={
                  role.scope === 'global' ? 'blue' :
                  role.scope === 'department' ? 'green' :
                  role.scope === 'team' ? 'purple' : 'default'
                }>
                  {role.scope === 'global' ? 'Global' :
                   role.scope === 'department' ? 'Departman' :
                   role.scope === 'team' ? 'Takım' : role.scope}
                </Tag>
              </div>
            </div>
            <div>
              <Text type="secondary">Seviye</Text>
              <div>
                <Tag color={
                  role.level >= 9 ? 'red' :
                  role.level >= 7 ? 'orange' :
                  role.level >= 5 ? 'blue' :
                  role.level >= 3 ? 'green' : 'default'
                }>
                  {role.level}
                </Tag>
              </div>
            </div>
            <div>
              <Text type="secondary">Durum</Text>
              <div>
                <Tag color={role.isActive ? 'success' : 'error'}>
                  {role.isActive ? 'Aktif' : 'Pasif'}
                </Tag>
              </div>
            </div>
          </Space>
        ),
        row: 0, col: 1, span: 12
      },
      {
        label: 'İzinler',
        value: role.permissions && role.permissions.length > 0 ? (
          <Space wrap size={[4, 4]}>
            {role.permissions.map((permission: any) => (
              <Tag key={permission._id} color="blue" style={{ fontSize: 13, padding: '2px 8px' }}>
                {permission.name}
              </Tag>
            ))}
          </Space>
        ) : <Text type="secondary">İzin tanımlanmamış</Text>,
        row: 1, col: 0, span: 24
      }
    ];
  };

  if (loading) return <LoadingSpinner />;

  return (
    <>
      {modalContextHolder}
    <DetailPage
      title="Rol Detayı"
      fields={getFields()}
      loading={loading}
      backButtonText="Rol Listesine Dön"
      onBack={() => navigate('/dashboard/roles')}
        layout={{ rows: 2, columns: 2, gap: 24 }}
        actions={{
          onEdit: handleEdit,
          onDelete: handleDelete
        }}
      />
    </>
  );
};

export default RoleDetail; 