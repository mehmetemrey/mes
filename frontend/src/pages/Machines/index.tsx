import React, { useEffect, useState } from 'react';
import { Button, message, Modal, Space, Tag, Input, Select, App, Typography } from 'antd';
import { EditOutlined, DeleteOutlined, InfoCircleOutlined, FilterOutlined, LineChartOutlined } from '@ant-design/icons';
import { useNavigate } from 'umi';
import DataTable from '@/components/DataTable';
import { machineService, Machine } from '@/services/machineService';
import departmentService from '@/services/departmentService';

const { Title } = Typography;
const { Option } = Select;

const Machines: React.FC = () => {
  const navigate = useNavigate();
  const { message: appMessage, modal } = App.useApp();
  const [machines, setMachines] = useState<Machine[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchText, setSearchText] = useState('');
  const [statusFilter, setStatusFilter] = useState<string | undefined>(undefined);
  const [typeFilter, setTypeFilter] = useState<string | undefined>(undefined);
  const [departmentFilter, setDepartmentFilter] = useState<string | undefined>(undefined);
  const [departments, setDepartments] = useState<any[]>([]);

  const fetchMachines = async () => {
    try {
      setLoading(true);
      const [machinesData, departmentsData] = await Promise.all([
        machineService.getMachines(),
        departmentService.getDepartments()
      ]);
      setMachines(machinesData);
      setDepartments(departmentsData);
    } catch (error: any) {
      appMessage.error(error.message || 'Makineler yüklenirken bir hata oluştu');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMachines();
  }, []);

  const handleDelete = async (id: string) => {
    modal.confirm({
      title: 'Makineyi Sil',
      content: 'Bu makineyi silmek istediğinizden emin misiniz?',
      okText: 'Evet',
      cancelText: 'Hayır',
      onOk: async () => {
        try {
          await machineService.deleteMachine(id);
          appMessage.success('Makine başarıyla silindi');
          fetchMachines();
        } catch (error: any) {
          if (error.response) {
            switch (error.response.status) {
              case 400:
                appMessage.error('Makine silinemiyor: Geçersiz istek');
                break;
              case 401:
                appMessage.error('Bu işlemi gerçekleştirmek için yetkiniz yok');
                break;
              case 403:
                appMessage.error('Erişim reddedildi');
                break;
              case 404:
                appMessage.error('Makine bulunamadı');
                break;
              case 409:
                appMessage.error('Makine şu anda kullanımda veya bağlı kayıtlar var');
                break;
              case 500:
                appMessage.error('Sunucu hatası: Makine silinemedi');
                break;
              default:
                appMessage.error(error.response.data.message || 'Makine silinirken bir hata oluştu');
            }
          } else if (error.request) {
            appMessage.error('Sunucuyla bağlantı kurulamadı');
          } else {
            appMessage.error(error.message || 'Beklenmedik bir hata oluştu');
          }
        }
      },
    });
  };

  const handleBulkDelete = async (selectedIds: React.Key[]) => {
    try {
      const results = await Promise.allSettled(
        selectedIds.map(id => machineService.deleteMachine(id as string))
      );
      
      const successfulDeletes = results.filter(result => result.status === 'fulfilled').length;
      const failedDeletes = results.filter(result => result.status === 'rejected').length;

      if (successfulDeletes > 0) {
        appMessage.success(`${successfulDeletes} makine başarıyla silindi`);
      }

      if (failedDeletes > 0) {
        const errorDetails = results
          .filter(result => result.status === 'rejected')
          .map((result: any) => {
            if (result.reason.response) {
              switch (result.reason.response.status) {
                case 401: return 'Yetki hatası';
                case 403: return 'Erişim reddedildi';
                case 404: return 'Makine bulunamadı';
                case 409: return 'Makine kullanımda';
                case 500: return 'Sunucu hatası';
                default: return 'Bilinmeyen hata';
              }
            }
            return 'Bağlantı hatası';
          });

        appMessage.error(`${failedDeletes} makine silinemedi: ${errorDetails.join(', ')}`);
      }

      fetchMachines();
    } catch (error: any) {
      appMessage.error('Toplu silme işlemi sırasında bir hata oluştu');
    }
  };

  const filterMachines = (machines: Machine[]) => {
    if (!machines) return [];
    
    return machines.filter(machine => {
      if (!machine) return false;

      const matchesSearch = !searchText || 
        (machine.name?.toLowerCase().includes(searchText.toLowerCase()) ||
        machine.code?.toLowerCase().includes(searchText.toLowerCase()));

      const matchesStatus = !statusFilter || machine.status === statusFilter;
      
      const matchesType = !typeFilter || machine.type === typeFilter;

      const matchesDepartment = !departmentFilter || 
        (machine.department && 
          (typeof machine.department === 'string' 
            ? machine.department === departmentFilter
            : machine.department._id === departmentFilter));

      return matchesSearch && matchesStatus && matchesType && matchesDepartment;
    });
  };

  const handleSearch = (value: string) => {
    setSearchText(value);
  };

  const handleStatusChange = (value: string | undefined) => {
    setStatusFilter(value);
  };

  const handleTypeChange = (value: string | undefined) => {
    setTypeFilter(value);
  };

  const handleDepartmentChange = (value: string | undefined) => {
    setDepartmentFilter(value);
  };

  const handleResetFilters = () => {
    setSearchText('');
    setStatusFilter(undefined);
    setTypeFilter(undefined);
    setDepartmentFilter(undefined);
  };

  const getTypeOptions = () => {
    const uniqueTypes = new Set<string>();
    machines.forEach(machine => {
      if (machine.type) {
        uniqueTypes.add(machine.type);
      }
    });
    return Array.from(uniqueTypes).map(type => ({
      label: type,
      value: type
    }));
  };

  const columns = [
    {
      title: 'Makine Adı',
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
          type === 'CNC' ? 'blue' :
          type === 'Lathe' ? 'green' :
          type === 'Mill' ? 'orange' :
          type === 'Drill' ? 'purple' :
          type === 'Press' ? 'cyan' :
          type === 'Welding' ? 'geekblue' :
          type === 'Assembly' ? 'gold' :
          'default'
        }>
          {type}
        </Tag>
      ),
    },
    {
      title: 'Durum',
      dataIndex: 'status',
      key: 'status',
      width: 120,
      render: (status: string) => (
        <Tag color={
          status === 'Operational' ? 'success' :
          status === 'Maintenance' ? 'warning' :
          status === 'Breakdown' ? 'error' :
          status === 'Idle' ? 'default' :
          'default'
        }>
          {status === 'Operational' ? 'Çalışıyor' :
           status === 'Maintenance' ? 'Bakımda' :
           status === 'Breakdown' ? 'Arızalı' :
           status === 'Idle' ? 'Boşta' :
           status}
        </Tag>
      ),
    },
    {
      title: 'Departman',
      dataIndex: 'department',
      key: 'department',
      width: 150,
      render: (department: any) => (
        department 
          ? <Tag color="blue">{`${department.name} (${department.code})`}</Tag>
          : <Tag color="default">Atanmamış</Tag>
      )
    },
  ];

  const actions = {
    buttons: [
      {
        key: 'live',
        icon: <LineChartOutlined />,
        onClick: (record: Machine) => navigate(`/dashboard/machines-live/${record._id}`),
        tooltip: 'Canlı İzle',
      },
      {
        key: 'view',
        icon: <InfoCircleOutlined />,
        onClick: (record: Machine) => navigate(`/dashboard/machines/${record._id}`),
        tooltip: 'Detay',
      },
      {
        key: 'edit',
        icon: <EditOutlined />,
        onClick: (record: Machine) => navigate(`/dashboard/machines/edit/${record._id}`),
        tooltip: 'Düzenle',
      },
      {
        key: 'delete',
        danger: true,
        icon: <DeleteOutlined style={{ color: '#ff4d4f' }} />,
        onClick: (record: Machine) => handleDelete(record._id),
        tooltip: 'Sil',
      },
    ],
  };

  return (
    <DataTable
      title="Makineler"
      data={filterMachines(machines)}
      columns={columns}
      loading={loading}
      onAdd={() => navigate('/dashboard/machines/add')}
      addButtonText="Yeni Makine"
      recordType="Makine"
      actions={actions}
      onBulkDelete={handleBulkDelete}
    >
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '12px', alignItems: 'center' }}>
        <Input.Search
          placeholder="Makine adı veya kodu ara..."
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
            { label: 'Çalışıyor', value: 'Operational' },
            { label: 'Bakımda', value: 'Maintenance' },
            { label: 'Arızalı', value: 'Breakdown' },
            { label: 'Boşta', value: 'Idle' },
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
        <Select
          placeholder="Departman"
          style={{ width: '100%', maxWidth: 200 }}
          value={departmentFilter}
          onChange={handleDepartmentChange}
          allowClear
          options={departments.map(dept => ({
            label: `${dept.name} (${dept.code})`,
            value: dept._id
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
  );
};

export default Machines;
