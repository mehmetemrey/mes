import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'umi';
import { message, Modal, Tag, Space, Typography, Card } from 'antd';
import DetailPage, { DetailField } from '@/components/DetailPage';
import userService, { User } from '@/services/userService';
import { roleService, Role } from '@/services/roleService';
import LoadingSpinner from '@/components/LoadingSpinner';

const { Text } = Typography;

interface RoleResponse {
  role: Role;
  users: any[];
  }

const UserDetail: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState<User | null>(null);
  const [roles, setRoles] = useState<Role[]>([]);

    const fetchUser = async () => {
    try {
      setLoading(true);
      const userData = await userService.getUser(id!);
      setUser(userData);

      if (userData.roles && userData.roles.length > 0) {
        try {
          const rolePromises = userData.roles.map(async (roleId: string) => {
            try {
              const response = await roleService.getRole(roleId);
              return (response as unknown as RoleResponse).role;
            } catch (error) {
              return null;
            }
          });

          const roleDetails = await Promise.all(rolePromises);
          const validRoles = roleDetails.filter((role): role is Role => role !== null);
          setRoles(validRoles);
        } catch (error: any) {
          message.warning('Kullanıcı rolleri tam olarak yüklenemedi');
        }
      }
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

  const handleEdit = () => {
    navigate(`/dashboard/users/edit/${id}`);
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

  const formatDate = (dateString: string) => {
    if (!dateString) return '-';
    return new Date(dateString).toLocaleString('tr-TR', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const getFields = (): DetailField[] => {
    if (!user) return [];

    return [
      {
        label: 'Kişisel Bilgiler',
        value: (
          <Space direction="vertical" size="middle" style={{ width: '100%' }}>
            <div>
              <Text type="secondary">Ad Soyad</Text>
              <div>
                <Text strong>{user.firstName} {user.lastName}</Text>
              </div>
            </div>
            <div>
              <Text type="secondary">E-posta</Text>
              <div>
                <Text 
                  style={{ color: '#1890ff', cursor: 'pointer' }}
                  onClick={() => window.location.href = `mailto:${user.email}`}
                >
                  {user.email}
                </Text>
              </div>
            </div>
            <div>
              <Text type="secondary">Telefon</Text>
              <div>
                <Text 
                  style={{ color: '#1890ff', cursor: 'pointer' }}
                  onClick={() => window.location.href = `tel:${user.phone}`}
                >
                  {user.phone}
                </Text>
              </div>
            </div>
          </Space>
        ),
        row: 0,
        col: 0,
        span: 12
      },
      {
        label: 'Hesap Bilgileri',
        value: (
          <Space direction="vertical" size="middle" style={{ width: '100%' }}>
            <div>
              <Text type="secondary">Durum</Text>
              <div>
                <Tag color={user.isActive ? 'success' : 'error'}>
                  {user.isActive ? 'Aktif' : 'Pasif'}
                </Tag>
              </div>
            </div>
            <div>
              <Text type="secondary">Kullanıcı ID</Text>
              <div>
                <Text copyable>{user._id}</Text>
              </div>
            </div>
            <div>
              <Text type="secondary">Son Giriş</Text>
              <div>
                <Text>{formatDate(user.lastLogin)}</Text>
              </div>
            </div>
          </Space>
        ),
        row: 0,
        col: 1,
        span: 12
      },
      {
        label: 'Roller',
        value: roles.length > 0 ? (
          <Space wrap size={[4, 4]}>
            {roles.map((role) => (
              <Tag key={role._id} color="blue" style={{ padding: '4px 8px', fontSize: '12px' }}>
                {role.description}
              </Tag>
            ))}
          </Space>
        ) : (
          <Text type="secondary">Kullanıcının rolü bulunmuyor</Text>
        ),
        row: 1,
        col: 0,
        span: 12
      },
      {
        label: 'Yetkiler',
        value: roles.length > 0 ? (
          <Space wrap size={[4, 4]}>
            {Array.from(new Set(
              roles.flatMap(role => (role.permissions || []).map(p => p.description))
            )).map((desc, idx) => (
              <Tag key={idx} color="green" style={{ padding: '2px 6px', fontSize: '14px', marginBottom: 0, lineHeight: 1.2 }}>
                {desc}
              </Tag>
            ))}
          </Space>
        ) : (
          <Text type="secondary">Kullanıcının yetkisi bulunmuyor</Text>
        ),
        row: 2,
        col: 0,
        span: 24
      },
      {
        label: 'Departman',
        value: (
          <Space direction="vertical" size="middle" style={{ width: '100%' }}>
            <div>
              <div>
                <Text strong>
                  {user.department 
                    ? `${user.department.name} (${user.department.code})` 
                    : 'Atanmamış'}
                </Text>
              </div>
            </div>
          </Space>
        ),
        row: 1,
        col: 1,
        span: 12
      },
    ];
  };

  if (loading) {
    return <LoadingSpinner />;
  }

  return (
    <DetailPage
      title="Kullanıcı Detayları"
      loading={loading}
      fields={getFields()}
      actions={{
        onEdit: handleEdit,
        onDelete: handleDelete,
      }}
      backButtonText="Kullanıcı Listesine Dön"
      layout={{ rows: 3, columns: 2, gap: 24 }}
    />
  );
};

export default UserDetail; 