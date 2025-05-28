import React, { useState, useEffect } from 'react';
import { Button, Space, Typography, message, Modal, Tag, Tooltip, Drawer, Input, Select, Form, Grid } from 'antd';
import { PlusOutlined, DeleteOutlined, InfoCircleOutlined, EditOutlined, FilterOutlined } from '@ant-design/icons';
import type { ColumnsType } from 'antd/es/table';
import { userService, User } from '@/services/userService';
import { useNavigate } from 'umi';
import Cookies from 'js-cookie';
import { jwtDecode } from 'jwt-decode';
import type { Breakpoint } from 'antd';
import DataTable from '@/components/DataTable';
import departmentService from '@/services/departmentService';

const { Text } = Typography;
const { confirm } = Modal;
const { Search } = Input;
const { useBreakpoint } = Grid;

const Users: React.FC = () => {
  const [users, setUsers] = useState<User[]>([]);
  const [departments, setDepartments] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [messageApi, contextHolder] = message.useMessage();
  const [modal, modalContextHolder] = Modal.useModal();
  const navigate = useNavigate();
  const [userRoles, setUserRoles] = useState<string[]>([]);
  const [pageSize, setPageSize] = useState(10);
  const [currentPage, setCurrentPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [searchText, setSearchText] = useState('');
  const [statusFilter, setStatusFilter] = useState<boolean | undefined>(undefined);
  const [roleFilter, setRoleFilter] = useState<string | null>(null);
  const [departmentFilter, setDepartmentFilter] = useState<string | null>(null);
  const [isFilterDrawerVisible, setIsFilterDrawerVisible] = useState(false);
  const screens = useBreakpoint();

  useEffect(() => {
    const token = Cookies.get('token');
    if (token) {
      try {
        const decoded: any = jwtDecode(token);
        setUserRoles(decoded.roles || []);
      } catch (error) {
        setUserRoles([]);
      }
    } else {
      setUserRoles([]);
    }
  }, []);

  useEffect(() => {
    const fetchInitialData = async () => {
      try {
        const [usersData, departmentsData] = await Promise.all([
          userService.getUsers(),
          departmentService.getDepartments()
        ]);
        setUsers(usersData);
        setDepartments(departmentsData);
        setTotal(usersData.length);
      } catch (error: any) {
        messageApi.error(error.message);
      }
    };

    fetchInitialData();
  }, []);

  const isAdminOrManager = () => {
    const isAdmin = userRoles.includes('Admin');
    const isManager = userRoles.includes('Yönetici');
    return isAdmin || isManager;
  };

  const loadUsers = async () => {
    setLoading(true);
    try {
      const data = await userService.getUsers();
      setUsers(data);
      setTotal(data.length);
    } catch (error: any) {
      messageApi.error(error.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadUsers();
  }, []);

  const handleEdit = (user: User) => {
    if (!user._id) {
      messageApi.error('Kullanıcı ID bulunamadı');
      return;
    }
    navigate(`/dashboard/users/edit/${user._id as string}`);
  };

  const handleDelete = (user: User) => {
    if (!user._id) {
      messageApi.error('Kullanıcı ID bulunamadı');
      return;
    }

    modal.confirm({
      title: 'Bu kullanıcıyı silmek istediğinize emin misiniz?',
      icon: <InfoCircleOutlined />,
      content: 'Bu işlem geri alınamaz.',
      okText: 'Evet',
      okType: 'danger',
      cancelText: 'İptal',
      onOk: async () => {
        try {
          await userService.deleteUser(user._id as string);
          messageApi.success('Kullanıcı başarıyla silindi');
          loadUsers();
        } catch (error: any) {
          messageApi.error(error.message || 'Silme işlemi başarısız oldu');
        }
      },
    });
  };

  const handleAdd = () => {
    navigate('/dashboard/users/add');
  };

  const handlePageChange = (page: number, pageSize?: number) => {
    setCurrentPage(page);
    if (pageSize) setPageSize(pageSize);
  };

  const filterUsers = (users: User[]) => {
    if (!users) return [];
    
    return users.filter(user => {
      if (!user) return false;

      const matchesSearch = !searchText || 
        (user.firstName?.toLowerCase().includes(searchText.toLowerCase()) ||
        user.lastName?.toLowerCase().includes(searchText.toLowerCase()) ||
        user.email?.toLowerCase().includes(searchText.toLowerCase()) ||
        user.phone?.includes(searchText));

      const matchesStatus = statusFilter === undefined || user.isActive === statusFilter;
      
      const matchesRole = !roleFilter || 
        (user.roles && user.roles.some(role => {
          const normalizedRoleDesc = role.description?.toLowerCase().trim();
          const normalizedFilter = roleFilter.toLowerCase().trim();
          return normalizedRoleDesc === normalizedFilter;
        }));

      const matchesDepartment = !departmentFilter || 
        (user.department && user.department._id === departmentFilter);

      return matchesSearch && matchesStatus && matchesRole && matchesDepartment;
    });
  };

  const handleSearch = (value: string) => {
    setSearchText(value);
  };

  const handleStatusChange = (value: boolean | undefined) => {
    setStatusFilter(value);
  };

  const handleRoleChange = (value: string | null) => {
    setRoleFilter(value);
  };

  const handleDepartmentChange = (value: string | null) => {
    setDepartmentFilter(value);
  };

  const handleResetFilters = () => {
    setSearchText('');
    setStatusFilter(undefined);
    setRoleFilter(null);
    setDepartmentFilter(null);
  };

  // Rol seçeneklerini dinamik olarak oluştur
  const getRoleOptions = () => {
    const uniqueRoles = new Set<string>();
    users.forEach(user => {
      user.roles.forEach(role => {
        if (role.description) {
          // Orijinal rol açıklamasını koru
          uniqueRoles.add(role.description);
        }
      });
    });
    return Array.from(uniqueRoles).map(role => ({
      label: role,
      value: role
    }));
  };

  const getDepartmentOptions = () => {
    return departments.map(dept => ({
      label: `${dept.name} (${dept.code})`,
      value: dept._id
    }));
  };

  const columns: ColumnsType<User> = [
    {
      title: 'Ad Soyad',
      dataIndex: 'fullName',
      key: 'fullName',
      width: 200,
    },
    {
      title: 'E-posta',
      dataIndex: 'email',
      key: 'email',
      width: 200,
    },
    {
      title: 'Telefon',
      dataIndex: 'phone',
      key: 'phone',
      width: 150,
    },
    {
      title: 'Roller',
      dataIndex: 'roles',
      key: 'roles',
      width: 200,
      render: (roles: any[] = [], record: User) => (
        <Space key={`roles-${record._id}`} size={[0, 8]} wrap>
          {roles.map((role, idx) => (
            <Tag key={(role as any)._id || idx} color="blue">
              {role.description}
            </Tag>
          ))}
        </Space>
      ),
    },
    {
      title: 'Departman',
      dataIndex: 'department',
      key: 'department',
      width: 150,
      render: (department: any) => (
        department 
          ? <Tag color="green">{`${department.name} (${department.code})`}</Tag>
          : <Tag color="default">Atanmamış</Tag>
      )
    },
    {
      title: 'Durum',
      dataIndex: 'isActive',
      key: 'isActive',
      width: 100,
      render: (isActive: boolean) => (
        <Tag color={isActive ? 'success' : 'error'}>
          {isActive ? 'Aktif' : 'Pasif'}
        </Tag>
      )
    },
    {
      title: 'Son Giriş',
      dataIndex: 'lastLogin',
      key: 'lastLogin',
      width: 180,
      render: (date: string, record: User) => (
        <span key={`lastLogin-${record._id}`}>
          {new Date(date).toLocaleString('tr-TR')}
        </span>
      ),
    },
  ];

  const actions = {
    buttons: [
      {
        key: 'detail',
        icon: <InfoCircleOutlined />,
        onClick: (record: User) => {
          if (!record._id) {
            messageApi.error('Kullanıcı ID bulunamadı');
            return;
          }
          navigate(`/dashboard/users/${record._id as string}`);
        },
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
        tooltip: 'Sil'
      }
    ]
  };

  const FilterContent = () => (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
      <Form layout="vertical">
        <Form.Item label="Arama">
          <Search
            placeholder="Ad, soyad, e-posta veya telefon ara..."
            value={searchText}
            onChange={(e) => setSearchText(e.target.value)}
            allowClear
          />
        </Form.Item>
        <Form.Item label="Durum">
          <Select
            placeholder="Durum seçin"
            value={statusFilter}
            onChange={handleStatusChange}
            allowClear
            options={[
              { label: 'Aktif', value: true },
              { label: 'Pasif', value: false },
            ]}
          />
        </Form.Item>
        <Form.Item label="Rol">
          <Select
            placeholder="Rol seçin"
            value={roleFilter}
            onChange={handleRoleChange}
            allowClear
            options={getRoleOptions()}
            style={{ width: '100%' }}
          />
        </Form.Item>
        <Form.Item label="Departman">
          <Select
            placeholder="Departman seçin"
            value={departmentFilter}
            onChange={handleDepartmentChange}
            allowClear
            options={getDepartmentOptions()}
            style={{ width: '100%' }}
          />
        </Form.Item>
        <Form.Item>
          <Button 
            type="primary" 
            onClick={handleResetFilters}
            block
          >
            Filtreleri Sıfırla
          </Button>
        </Form.Item>
      </Form>
    </div>
  );

  const handleBulkDelete = async (selectedIds: React.Key[]) => {
    try {
      await Promise.all(
        selectedIds.map(id => userService.deleteUser(id as string))
      );
      
      messageApi.success(`${selectedIds.length} kullanıcı başarıyla silindi`);
      loadUsers();
    } catch (error: any) {
      messageApi.error(error.message || 'Silme işlemi başarısız oldu');
    }
  };

  return (
    <>
      {contextHolder}
      {modalContextHolder}
      <DataTable
        title="Kullanıcılar"
        data={filterUsers(users)}
        columns={columns}
        loading={loading}
        total={total}
        pageSize={pageSize}
        currentPage={currentPage}
        recordType="Kullanıcı"
        onPageChange={handlePageChange}
        actions={isAdminOrManager() ? actions : undefined}
        onAdd={isAdminOrManager() ? handleAdd : undefined}
        onBulkDelete={handleBulkDelete}
        addButtonText="Yeni Kullanıcı"
        showAddButton={isAdminOrManager()}
      >
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '12px', alignItems: 'center' }}>
          <Search
            placeholder="Ad, soyad, e-posta veya telefon ara..."
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
            placeholder="Rol"
            style={{ width: '100%', maxWidth: 150 }}
            value={roleFilter}
            onChange={handleRoleChange}
            allowClear
            options={getRoleOptions()}
          />
          <Select
            placeholder="Departman"
            style={{ width: '100%', maxWidth: 150 }}
            value={departmentFilter}
            onChange={handleDepartmentChange}
            allowClear
            options={getDepartmentOptions()}
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

export default Users; 