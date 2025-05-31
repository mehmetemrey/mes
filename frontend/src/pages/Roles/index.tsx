import React, { useEffect, useState } from 'react';
import { message, Tag, Modal, Input, Select, Form, Button } from 'antd';
import { useNavigate } from 'umi';
import { roleService } from '@/services/roleService';
import DataTable from '@/components/DataTable';
import { InfoCircleOutlined, EditOutlined, DeleteOutlined, FilterOutlined } from '@ant-design/icons';
import { ColumnsType } from 'antd/es/table';
import { permissionService } from '@/services/permissionService';

interface Role {
  _id: string;
  name: string;
  description: string;
  permissions: { _id: string; description: string }[];
  isActive: boolean;
  scope: string;
  level: number;
}

const Roles: React.FC = () => {
  const [roles, setRoles] = useState<Role[]>([]);
  const [loading, setLoading] = useState(false);
  const [messageApi, contextHolder] = message.useMessage();
  const navigate = useNavigate();
  const [modal, modalContextHolder] = Modal.useModal();
  const [searchText, setSearchText] = useState('');
  const [statusFilter, setStatusFilter] = useState<boolean | undefined>(undefined);
  const [scopeFilter, setScopeFilter] = useState<string | null>(null);
  const [levelFilter, setLevelFilter] = useState<number | undefined>(undefined);
  const [permissionFilter, setPermissionFilter] = useState<string | null>(null);
  const [allPermissions, setAllPermissions] = useState<{ _id: string; description: string }[]>([]);

  const loadRoles = async () => {
    setLoading(true);
    try {
      const data = await roleService.getRoles();
      setRoles(data);
    } catch (error: any) {
      messageApi.error(error.message || 'Roller alınamadı');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadRoles();
  }, []);

  useEffect(() => {
    const fetchPermissions = async () => {
      try {
        const permissions = await permissionService.getPermissions();
        setAllPermissions(permissions);
      } catch (error: any) {
        messageApi.error('Yetkiler alınamadı');
      }
    };
    fetchPermissions();
  }, []);

  const handleDetail = (role: Role) => {
    navigate(`/dashboard/roles/${role._id}`);
  };

  const handleEdit = (role: Role) => {
    navigate(`/dashboard/roles/edit/${role._id}`);
  };

  const handleDelete = async (role: Role) => {
    modal.confirm({
      title: 'Rolü silmek istediğinize emin misiniz?',
      content: 'Bu işlem geri alınamaz.',
      okText: 'Evet',
      cancelText: 'Hayır',
      okType: 'danger',
      onOk: async () => {
        try {
          await roleService.deleteRole(role._id);
          messageApi.success('Rol silindi');
          loadRoles();
        } catch (error: any) {
          messageApi.error(error.message || 'Rol silinemedi');
        }
      },
    });
  };

  const handleBulkDelete = async (selectedIds: React.Key[]) => {
    try {
      await Promise.all(
        selectedIds.map(id => roleService.deleteRole(id as string))
      );
      
      messageApi.success(`${selectedIds.length} rol başarıyla silindi`);
      loadRoles();
    } catch (error: any) {
      messageApi.error(error.message || 'Silme işlemi başarısız oldu');
    }
  };

  const getLevelColor = (level: number): string => {
    if (level >= 90) return 'red';
    if (level >= 70) return 'orange';
    if (level >= 50) return 'blue';
    if (level >= 30) return 'green';
    return 'default';
  };

  const getScopeColor = (scope: string): string => {
    const scopeColors: Record<string, string> = {
      global: 'blue',
      department: 'green',
      team: 'purple',
    };
    return scopeColors[scope] || 'default';
  };

  const getScopeLabel = (scope: string): string => {
    const scopeLabels: Record<string, string> = {
      global: 'Global',
      department: 'Departman',
      team: 'Takım',
    };
    return scopeLabels[scope] || scope.toUpperCase();
  };

  const columns: ColumnsType<Role> = [
    {
      title: 'Rol Adı',
      dataIndex: 'name',
      key: 'name',
      width: 150,
      responsive: ['xs', 'sm', 'md', 'lg', 'xl'],
    },
    {
      title: 'Açıklama',
      dataIndex: 'description',
      key: 'description',
      width: 200,
      responsive: ['xs', 'sm', 'md', 'lg', 'xl'],
    },
    {
      title: 'Seviye',
      dataIndex: 'level',
      key: 'level',
      width: 100,
      responsive: ['xs', 'sm', 'md', 'lg', 'xl'],
      render: (level: number) => (
        <Tag color={getLevelColor(level)}>
          {level}
        </Tag>
      ),
    },
    {
      title: 'Kapsam',
      dataIndex: 'scope',
      key: 'scope',
      width: 120,
      responsive: ['xs', 'sm', 'md', 'lg', 'xl'],
      render: (scope: string) => (
        <Tag color={getScopeColor(scope)}>
          {getScopeLabel(scope)}
        </Tag>
      ),
    },
    {
      title: 'Durum',
      dataIndex: 'isActive',
      key: 'isActive',
      width: 100,
      responsive: ['xs', 'sm', 'md', 'lg', 'xl'],
      render: (isActive: boolean) => (
        <Tag color={isActive ? 'success' : 'error'}>
          {isActive ? 'Aktif' : 'Pasif'}
        </Tag>
      ),
    },
  ];

  const actions = {
    buttons: [
      {
        key: 'detail',
        icon: <InfoCircleOutlined />,
        onClick: handleDetail,
        tooltip: 'Detay',
      },
      {
        key: 'edit',
        icon: <EditOutlined />,
        onClick: handleEdit,
        tooltip: 'Düzenle',
      },
      {
        key: 'delete',
        icon: <DeleteOutlined style={{ color: '#ff4d4f' }} />,
        onClick: handleDelete,
        tooltip: 'Sil',
      },
    ],
  };

  const filterRoles = (roles: Role[]) => {
    if (!roles) return [];
    
    return roles.filter(role => {
      if (!role) return false;

      const matchesSearch = !searchText || 
        (role.name?.toLowerCase().includes(searchText.toLowerCase()) ||
        role.description?.toLowerCase().includes(searchText.toLowerCase()));

      const matchesStatus = statusFilter === undefined || role.isActive === statusFilter;
      
      const matchesScope = !scopeFilter || role.scope === scopeFilter;

      const matchesLevel = levelFilter === undefined || role.level === levelFilter;

      const matchesPermission = !permissionFilter || 
        (role.permissions && role.permissions.some(p => p._id === permissionFilter));

      return matchesSearch && matchesStatus && matchesScope && matchesLevel && matchesPermission;
    });
  };

  const handleSearch = (value: string) => {
    setSearchText(value);
  };

  const handleStatusChange = (value: boolean | undefined) => {
    setStatusFilter(value);
  };

  const handleScopeChange = (value: string | null) => {
    setScopeFilter(value);
  };

  const handleLevelChange = (value: number | undefined) => {
    setLevelFilter(value);
  };

  const handlePermissionChange = (value: string | null) => {
    setPermissionFilter(value);
  };

  const handleResetFilters = () => {
    setSearchText('');
    setStatusFilter(undefined);
    setScopeFilter(null);
    setLevelFilter(undefined);
    setPermissionFilter(null);
  };

  return (
    <>
      {contextHolder}
      {modalContextHolder}
      <DataTable
        title="Roller"
        data={filterRoles(roles)}
        columns={columns}
        loading={loading}
        actions={actions}
        recordType="Rol"
        showAddButton={true}
        addButtonText="Yeni Rol"
        onAdd={() => navigate('/dashboard/roles/add')}
        onBulkDelete={handleBulkDelete}
      >
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '12px', alignItems: 'center' }}>
          <Input.Search
            placeholder="Rol adı veya açıklama ara..."
            onSearch={handleSearch}
            onChange={(e) => setSearchText(e.target.value)}
            value={searchText}
            style={{ width: '100%', maxWidth: 300 }}
            allowClear
          />
          <Select
            placeholder="Durum"
            style={{ width: '100%', maxWidth: 150 }}
            value={statusFilter}
            onChange={handleStatusChange}
            allowClear
            options={[
              { label: 'Aktif', value: true },
              { label: 'Pasif', value: false },
            ]}
          />
          <Select
            placeholder="Kapsam"
            style={{ width: '100%', maxWidth: 150 }}
            value={scopeFilter}
            onChange={handleScopeChange}
            allowClear
            options={[
              { label: 'Global', value: 'global' },
              { label: 'Departman', value: 'department' },
              { label: 'Takım', value: 'team' },
            ]}
          />
          <Select
            placeholder="Seviye"
            style={{ width: '100%', maxWidth: 150 }}
            value={levelFilter}
            onChange={handleLevelChange}
            allowClear
            options={[
              { label: 'Seviye 1', value: 1 },
              { label: 'Seviye 2', value: 2 },
              { label: 'Seviye 3', value: 3 },
              { label: 'Seviye 4', value: 4 },
              { label: 'Seviye 5', value: 5 },
            ]}
          />
          <Select
            placeholder="Yetki"
            style={{ width: '100%', maxWidth: 200 }}
            value={permissionFilter}
            onChange={handlePermissionChange}
            allowClear
            showSearch
            filterOption={(input, option) =>
              (option?.label ?? '').toLowerCase().includes(input.toLowerCase())
            }
            options={allPermissions.map(p => ({
              label: p.description,
              value: p._id
            }))}
          />
          <Button 
            icon={<FilterOutlined />} 
            onClick={handleResetFilters}
          >
            Sıfırla
          </Button>
        </div>
      </DataTable>
    </>
  );
};

export default Roles; 