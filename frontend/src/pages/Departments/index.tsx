import React, { useEffect, useState } from 'react';
import { Button, message, Modal, Space, Tag, Input, Select, App, Typography } from 'antd';
import { EditOutlined, DeleteOutlined, InfoCircleOutlined, FilterOutlined } from '@ant-design/icons';
import { useNavigate } from 'umi';
import DataTable from '@/components/DataTable';
import departmentService, { Department } from '@/services/departmentService';

const { Title } = Typography;

const Departments: React.FC = () => {
  const navigate = useNavigate();
  const { message: appMessage, modal } = App.useApp();
  const [departments, setDepartments] = useState<Department[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchText, setSearchText] = useState('');
  const [statusFilter, setStatusFilter] = useState<boolean | undefined>(undefined);
  const [typeFilter, setTypeFilter] = useState<string | null>(null);

  const fetchDepartments = async () => {
    try {
      setLoading(true);
      const data = await departmentService.getDepartments();
      setDepartments(data);
    } catch (error: any) {
      appMessage.error(error.message || 'Departmanlar yüklenirken bir hata oluştu');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDepartments();
  }, []);

  const handleDelete = (id: string) => {
    modal.confirm({
      title: 'Departmanı Sil',
      content: 'Bu departmanı silmek istediğinizden emin misiniz?',
      okText: 'Evet',
      cancelText: 'Hayır',
      onOk: async () => {
        try {
          await departmentService.deleteDepartment(id);
          appMessage.success('Departman başarıyla silindi');
          fetchDepartments();
        } catch (error: any) {
          appMessage.error(error.message || 'Departman silinirken bir hata oluştu');
        }
      }
    });
  };

  const handleBulkDelete = async (selectedIds: React.Key[]) => {
    try {
      await Promise.all(
        selectedIds.map(id => departmentService.deleteDepartment(id as string))
      );
      
      appMessage.success(`${selectedIds.length} departman başarıyla silindi`);
      fetchDepartments();
    } catch (error: any) {
      appMessage.error(error.message || 'Silme işlemi başarısız oldu');
    }
  };

  const filterDepartments = (departments: Department[]) => {
    if (!departments) return [];
    
    return departments.filter(department => {
      if (!department) return false;

      const matchesSearch = !searchText || 
        (department.name?.toLowerCase().includes(searchText.toLowerCase()) ||
        department.code?.toLowerCase().includes(searchText.toLowerCase()));

      const matchesStatus = statusFilter === undefined || department.isActive === statusFilter;
      
      const matchesType = !typeFilter || department.type === typeFilter;

      return matchesSearch && matchesStatus && matchesType;
    });
  };

  const handleSearch = (value: string) => {
    setSearchText(value);
  };

  const handleStatusChange = (value: boolean | undefined) => {
    setStatusFilter(value);
  };

  const handleTypeChange = (value: string | null) => {
    setTypeFilter(value);
  };

  const handleResetFilters = () => {
    setSearchText('');
    setStatusFilter(undefined);
    setTypeFilter(null);
  };

  const getTypeOptions = () => {
    const uniqueTypes = new Set<string>();
    departments.forEach(dept => {
      if (dept.type) {
        uniqueTypes.add(dept.type);
      }
    });
    return Array.from(uniqueTypes).map(type => ({
      label: type.charAt(0).toUpperCase() + type.slice(1),
      value: type
    }));
  };

  const columns = [
    {
      title: 'Departman Adı',
      dataIndex: 'name',
      key: 'name',
      width: 200,
    },
    {
      title: 'Kod',
      dataIndex: 'code',
      key: 'code',
      width: 120,
    },
    {
      title: 'Tip',
      dataIndex: 'type',
      key: 'type',
      width: 150,
      render: (type: string) => (
        <Tag color={
          type === 'production' ? 'blue' :
          type === 'quality' ? 'green' :
          type === 'maintenance' ? 'orange' :
          type === 'warehouse' ? 'purple' :
          type === 'hr' ? 'cyan' :
          type === 'planning' ? 'geekblue' :
          type === 'management' ? 'gold' :
          'default'
        }>
          {type.charAt(0).toUpperCase() + type.slice(1)}
        </Tag>
      ),
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
      ),
    },
  ];

  const actions = {
    buttons: [
      {
        key: 'view',
        icon: <InfoCircleOutlined />,
        onClick: (record: Department) => navigate(`/dashboard/departments/${record._id}`),
        tooltip: 'Detay',
      },
      {
        key: 'edit',
        icon: <EditOutlined />,
        onClick: (record: Department) => navigate(`/dashboard/departments/edit/${record._id}`),
        tooltip: 'Düzenle',
      },
      {
        key: 'delete',
        danger: true,
        icon: <DeleteOutlined style={{ color: '#ff4d4f' }} />,
        onClick: (record: Department) => handleDelete(record._id),
        tooltip: 'Sil',
      },
    ],
  };

  return (
    <DataTable
      title="Departmanlar"
      data={filterDepartments(departments)}
      columns={columns}
      loading={loading}
      onAdd={() => navigate('/dashboard/departments/add')}
      addButtonText="Yeni Departman"
      recordType="Departman"
      actions={actions}
      onBulkDelete={handleBulkDelete}
    >
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '12px', alignItems: 'center' }}>
        <Input.Search
          placeholder="Departman adı veya kodu ara..."
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
          placeholder="Tip"
          style={{ width: '100%', maxWidth: 150 }}
          value={typeFilter}
          onChange={handleTypeChange}
          allowClear
          options={getTypeOptions()}
        />
        <Button 
          icon={<FilterOutlined />} 
          onClick={handleResetFilters}
        >
          Sıfırla
        </Button>
      </div>
    </DataTable>
  );
};

export default Departments; 