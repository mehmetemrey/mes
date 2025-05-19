import React, { useEffect, useState } from 'react';
import { Button, message, Modal, Space, Tag, Input, Select, App, Typography } from 'antd';
import { EditOutlined, DeleteOutlined, InfoCircleOutlined, FilterOutlined } from '@ant-design/icons';
import { useNavigate } from 'umi';
import DataTable from '@/components/DataTable';
import { productionStageService, ProductionStage } from '@/services/productionStageService';
import departmentService from '@/services/departmentService';

const { Title } = Typography;
const { Option } = Select;

const ProductionStages: React.FC = () => {
  const navigate = useNavigate();
  const { message: appMessage, modal } = App.useApp();
  const [stages, setStages] = useState<ProductionStage[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchText, setSearchText] = useState('');
  const [statusFilter, setStatusFilter] = useState<boolean | undefined>(undefined);
  const [sequenceFilter, setSequenceFilter] = useState<number | undefined>(undefined);
  const [departmentFilter, setDepartmentFilter] = useState<string | undefined>(undefined);
  const [departments, setDepartments] = useState<any[]>([]);

  const fetchStages = async () => {
    try {
      setLoading(true);
      const [stagesData, departmentsData] = await Promise.all([
        productionStageService.getProductionStages(),
        departmentService.getDepartments()
      ]);
      setStages(stagesData);
      setDepartments(departmentsData);
    } catch (error: any) {
      appMessage.error(error.message || 'Üretim aşamaları yüklenirken bir hata oluştu');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStages();
  }, []);

  const handleDelete = (id: string) => {
    modal.confirm({
      title: 'Üretim Aşamasını Sil',
      content: 'Bu üretim aşamasını silmek istediğinizden emin misiniz?',
      okText: 'Evet',
      cancelText: 'Hayır',
      onOk: async () => {
        try {
          await productionStageService.deleteProductionStage(id);
          appMessage.success('Üretim aşaması başarıyla silindi');
          fetchStages();
        } catch (error: any) {
          appMessage.error(error.message || 'Üretim aşaması silinirken bir hata oluştu');
        }
      }
    });
  };

  const handleBulkDelete = async (selectedIds: React.Key[]) => {
    try {
      await Promise.all(
        selectedIds.map(id => productionStageService.deleteProductionStage(id as string))
      );
      
      appMessage.success(`${selectedIds.length} üretim aşaması başarıyla silindi`);
      fetchStages();
    } catch (error: any) {
      appMessage.error(error.message || 'Silme işlemi başarısız oldu');
    }
  };

  const filterStages = (stages: ProductionStage[]) => {
    if (!stages) return [];
    
    return stages.filter(stage => {
      if (!stage) return false;

      const matchesSearch = !searchText || 
        (stage.name?.toLowerCase().includes(searchText.toLowerCase()));

      const matchesStatus = statusFilter === undefined || stage.isActive === statusFilter;
      
      const matchesSequence = sequenceFilter === undefined || stage.sequence === sequenceFilter;

      const matchesDepartment = departmentFilter === undefined || 
        (typeof stage.department === 'object' && stage.department?._id === departmentFilter);

      return matchesSearch && matchesStatus && matchesSequence && matchesDepartment;
    });
  };

  const handleSearch = (value: string) => {
    setSearchText(value);
  };

  const handleStatusChange = (value: boolean | undefined) => {
    setStatusFilter(value);
  };

  const handleSequenceChange = (value: number | undefined) => {
    setSequenceFilter(value);
  };

  const handleDepartmentChange = (value: string | undefined) => {
    setDepartmentFilter(value);
  };

  const handleResetFilters = () => {
    setSearchText('');
    setStatusFilter(undefined);
    setSequenceFilter(undefined);
    setDepartmentFilter(undefined);
  };

  const getSequenceOptions = () => {
    const uniqueSequences = new Set<number>();
    stages.forEach(stage => {
      if (stage.sequence !== undefined) {
        uniqueSequences.add(stage.sequence);
      }
    });
    return Array.from(uniqueSequences)
      .sort((a, b) => a - b)
      .map(seq => ({
        label: `Sıra ${seq}`,
        value: seq
      }));
  };

  const columns = [
    {
      title: 'Aşama Adı',
      dataIndex: 'name',
      key: 'name',
      width: 200,
    },
    {
      title: 'Sıra',
      dataIndex: 'sequence',
      key: 'sequence',
      width: 80,
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
        onClick: (record: ProductionStage) => navigate(`/dashboard/production-stages/${record._id}`),
        tooltip: 'Detay',
      },
      {
        key: 'edit',
        icon: <EditOutlined />,
        onClick: (record: ProductionStage) => navigate(`/dashboard/production-stages/edit/${record._id}`),
        tooltip: 'Düzenle',
      },
      {
        key: 'delete',
        danger: true,
        icon: <DeleteOutlined style={{ color: '#ff4d4f' }} />,
        onClick: (record: ProductionStage) => handleDelete(record._id),
        tooltip: 'Sil',
      },
    ],
  };

  return (
    <DataTable
      title="Üretim Aşamaları"
      data={filterStages(stages)}
      columns={columns}
      loading={loading}
      onAdd={() => navigate('/dashboard/production-stages/add')}
      addButtonText="Yeni Üretim Aşaması"
      recordType="Üretim Aşaması"
      actions={actions}
      onBulkDelete={handleBulkDelete}
    >
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '12px', alignItems: 'center' }}>
        <Input.Search
          placeholder="Aşama adı ara..."
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
          placeholder="Sıra"
          style={{ width: '100%', maxWidth: 150 }}
          value={sequenceFilter}
          onChange={handleSequenceChange}
          allowClear
          options={getSequenceOptions()}
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

export default ProductionStages;
