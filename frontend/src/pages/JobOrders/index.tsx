import React, { useState, useEffect } from 'react';
import { Button, message, Modal, Tag, Typography, Tooltip, Space, Input, Select, App } from 'antd';
import { 
  EditOutlined, DeleteOutlined, ExclamationCircleOutlined,
  InfoCircleOutlined, ClockCircleOutlined, RightCircleOutlined, 
  CheckCircleOutlined, StopOutlined, PauseCircleOutlined, PlayCircleOutlined, FilterOutlined
} from '@ant-design/icons';
import type { ColumnsType } from 'antd/es/table';
import { jobOrderService, JobOrder } from '@/services/jobOrderService';
import userService from '@/services/userService';
import { machineService } from '@/services/machineService';
import { productionStageService } from '@/services/productionStageService';
import { useNavigate } from 'umi';
import dayjs from 'dayjs';
import DataTable from '@/components/DataTable';
import departmentService from '@/services/departmentService';

const { Text } = Typography;
const { confirm } = Modal;
const { Title } = Typography;
const { Option } = Select;

const getStatusColor = (status: JobOrder['status']) => {
  switch (status) {
    case 'Planned':
      return 'default';
    case 'In Progress':
      return 'processing';
    case 'Completed':
      return 'success';
    case 'Cancelled':
      return 'error';
    default:
      return 'default';
  }
};

const getStatusIcon = (status: JobOrder['status']) => {
  switch (status) {
    case 'Planned':
      return <ClockCircleOutlined />;
    case 'In Progress':
      return <RightCircleOutlined />;
    case 'Completed':
      return <CheckCircleOutlined />;
    case 'Cancelled':
      return <StopOutlined />;
    default:
      return null;
  }
};

const getPriorityColor = (priority: JobOrder['priority']) => {
  switch (priority) {
    case 'Low':
      return 'blue';
    case 'Medium':
      return 'orange';
    case 'High':
      return 'red';
    case 'Critical':
      return 'volcano';
    default:
      return 'blue';
  }
};

const getPriorityText = (priority: JobOrder['priority']) => {
  switch (priority) {
    case 'Low':
      return 'Düşük';
    case 'Medium':
      return 'Orta';
    case 'High':
      return 'Yüksek';
    case 'Critical':
      return 'Kritik';
    default:
      return priority;
  }
};

const JobOrders: React.FC = () => {
  const [jobOrders, setJobOrders] = useState<JobOrder[]>([]);
  const [loading, setLoading] = useState(true);
  const { message: appMessage, modal } = App.useApp();
  
  const [filterStatus, setFilterStatus] = useState<string | undefined>(undefined);
  const [filterAssignedTo, setFilterAssignedTo] = useState<string | undefined>(undefined);
  const [filterMachine, setFilterMachine] = useState<string | undefined>(undefined);
  const [filterProductionStage, setFilterProductionStage] = useState<string | undefined>(undefined);
  const [filterDepartment, setFilterDepartment] = useState<string | undefined>(undefined);
  const [searchText, setSearchText] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [total, setTotal] = useState(0);
  
  const [users, setUsers] = useState<any[]>([]);
  const [machines, setMachines] = useState<any[]>([]);
  const [productionStages, setProductionStages] = useState<any[]>([]);
  const [departments, setDepartments] = useState<any[]>([]);
  
  const [filterProductionTargetUnit, setFilterProductionTargetUnit] = useState<string | undefined>(undefined);
  const [filterProducedQuantityUnit, setFilterProducedQuantityUnit] = useState<string | undefined>(undefined);
  
  const navigate = useNavigate();

  useEffect(() => {
    const loadFilterOptions = async () => {
      try {
        const [usersData, machinesData, stagesData, departmentsData] = await Promise.all([
          userService.getUsers(),
          machineService.getMachines(),
          productionStageService.getProductionStages(true),
          departmentService.getDepartments()
        ]);
        
        setUsers(usersData);
        setMachines(machinesData);
        setProductionStages(stagesData);
        setDepartments(departmentsData);
      } catch (error: any) {
        appMessage.error('Filtre seçenekleri yüklenirken bir hata oluştu.');
        console.error('Error loading filter options:', error);
      }
    };
    
    loadFilterOptions();
  }, []);

  const loadJobOrders = async () => {
    setLoading(true);
    try {
      const params: any = {
        page: currentPage,
        limit: pageSize
      };
      
      if (filterStatus) params.status = filterStatus;
      if (filterAssignedTo) params.assignedTo = filterAssignedTo;
      if (filterMachine) params.machine = filterMachine;
      if (filterProductionStage) params.productionStage = filterProductionStage;
      if (filterDepartment) params.department = filterDepartment;
      if (filterProductionTargetUnit) params['productionTarget.unit'] = filterProductionTargetUnit;
      if (filterProducedQuantityUnit) params['producedQuantity.unit'] = filterProducedQuantityUnit;
      
      const response = await jobOrderService.getJobOrders(params);
      
      if (response.jobOrders.length === 0) {
        appMessage.info('Seçilen kriterlere uygun iş emri bulunamadı.');
      }
      
      setJobOrders(response.jobOrders);
      setTotal(response.total);
    } catch (error: any) {
      appMessage.error(error.message || 'İş emirleri yüklenirken hata oluştu');
      setJobOrders([]);
      setTotal(0);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadJobOrders();
  }, [currentPage, pageSize, filterStatus, filterAssignedTo, filterMachine, filterProductionStage, filterDepartment, filterProductionTargetUnit, filterProducedQuantityUnit]);

  const filterJobOrders = (jobOrders: JobOrder[]) => {
    if (!jobOrders) return [];
    
    return jobOrders.filter(jobOrder => {
      if (!jobOrder) return false;

      const matchesSearch = !searchText || 
        (jobOrder.title?.toLowerCase().includes(searchText.toLowerCase()) ||
        jobOrder.orderNumber?.toLowerCase().includes(searchText.toLowerCase()) ||
        jobOrder.jobNumber?.toLowerCase().includes(searchText.toLowerCase()));

      const matchesStatus = !filterStatus || jobOrder.status === filterStatus;
      
      const matchesAssignedTo = !filterAssignedTo || 
        (jobOrder.assignedTo && 
          (typeof jobOrder.assignedTo === 'string' 
            ? jobOrder.assignedTo === filterAssignedTo
            : jobOrder.assignedTo._id === filterAssignedTo));

      const matchesMachine = !filterMachine || 
        (jobOrder.machine && 
          (typeof jobOrder.machine === 'string' 
            ? jobOrder.machine === filterMachine
            : jobOrder.machine._id === filterMachine));

      const matchesProductionStage = !filterProductionStage || 
        (jobOrder.productionStage && 
          (typeof jobOrder.productionStage === 'string' 
            ? jobOrder.productionStage === filterProductionStage
            : jobOrder.productionStage._id === filterProductionStage));

      const matchesDepartment = !filterDepartment || 
        (jobOrder.department && 
          (typeof jobOrder.department === 'string' 
            ? jobOrder.department === filterDepartment
            : jobOrder.department._id === filterDepartment));

      const matchesProductionTargetUnit = !filterProductionTargetUnit || 
        jobOrder.productionTarget?.unit === filterProductionTargetUnit;

      const matchesProducedQuantityUnit = !filterProducedQuantityUnit || 
        jobOrder.producedQuantity?.unit === filterProducedQuantityUnit;

      return matchesSearch && matchesStatus && matchesAssignedTo && 
             matchesMachine && matchesProductionStage && matchesDepartment &&
             matchesProductionTargetUnit && matchesProducedQuantityUnit;
    });
  };

  const filteredJobOrders = filterJobOrders(jobOrders);

  const handleSearch = (value: string) => {
    setSearchText(value);
  };

  const handleEdit = (record: JobOrder) => {
    if (record.status === 'Completed') {
      navigate(`/dashboard/job-orders/${record._id}`);
      return;
    }
    navigate(`/dashboard/job-orders/edit/${record._id}`);
  };

  const handleDetail = (record: JobOrder) => {
    navigate(`/dashboard/job-orders/${record._id}`);
  };

  const handleDelete = (record: JobOrder) => {
    modal.confirm({
      title: 'Bu iş emrini silmek istediğinize emin misiniz?',
      icon: <ExclamationCircleOutlined />,
      content: 'Bu işlem geri alınamaz.',
      okText: 'Evet',
      okType: 'danger',
      cancelText: 'İptal',
      onOk: async () => {
        try {
          await jobOrderService.deleteJobOrder(record._id);
          appMessage.success('İş emri başarıyla silindi');
          loadJobOrders();
        } catch (error: any) {
          appMessage.error(error.message || 'Silme işlemi başarısız oldu');
        }
      },
    });
  };

  const handleStatusChange = async (id: string, status: JobOrder['status']) => {
    try {
      await jobOrderService.updateJobStatus(id, status);
      appMessage.success(`İş emri durumu değiştirildi: ${
        status === 'Planned' ? 'Planlandı' :
        status === 'In Progress' ? 'Devam Ediyor' :
        status === 'Completed' ? 'Tamamlandı' :
        status === 'Cancelled' ? 'İptal' : status
      }`);
      loadJobOrders();
    } catch (error: any) {
      appMessage.error(error.message || 'Durum güncelleme başarısız oldu');
    }
  };

  const handleAdd = () => {
    navigate('/dashboard/job-orders/add');
  };

  const handlePageChange = (page: number, pageSize?: number) => {
    setCurrentPage(page);
    if (pageSize) setPageSize(pageSize);
  };

  const handleBulkDelete = async (selectedIds: React.Key[]) => {
    try {
      await Promise.all(
        selectedIds.map(id => jobOrderService.deleteJobOrder(id as string))
      );
      
      appMessage.success(`${selectedIds.length} iş emri başarıyla silindi`);
      loadJobOrders();
    } catch (error: any) {
      appMessage.error(error.message || 'Silme işlemi başarısız oldu');
    }
  };

  const columns: ColumnsType<JobOrder> = [
    {
      title: 'İş Emri No',
      dataIndex: 'orderNumber',
      key: 'orderNumber',
      render: (text, record) => (
        <Tooltip title={record.title}>
          <Text strong>{text}</Text>
        </Tooltip>
      ),
      width: 150,
      sorter: (a, b) => a.orderNumber.localeCompare(b.orderNumber)
    },
    {
      title: 'Başlık',
      dataIndex: 'title',
      key: 'title',
      ellipsis: { showTitle: false },
      render: (title) => (
        <Tooltip placement="topLeft" title={title}>
          {title}
        </Tooltip>
      ),
    },
    {
      title: 'Durum',
      dataIndex: 'status',
      key: 'status',
      render: (status) => (
        <Tag 
          color={getStatusColor(status)} 
          icon={getStatusIcon(status)}
        >
          {status === 'Planned' ? 'Planlandı' :
           status === 'In Progress' ? 'Devam Ediyor' :
           status === 'Completed' ? 'Tamamlandı' :
           status === 'Cancelled' ? 'İptal Edildi' :
           status === 'Paused' ? 'Duraklatıldı' : status}
        </Tag>
      ),
      width: 150,
      filters: [
        { text: 'Planlandı', value: 'Planned' },
        { text: 'Devam Ediyor', value: 'In Progress' },
        { text: 'Tamamlandı', value: 'Completed' },
        { text: 'İptal Edildi', value: 'Cancelled' },
        { text: 'Duraklatıldı', value: 'Paused' }
      ],
      onFilter: (value, record) => record.status === value
    },
    {
      title: 'Öncelik',
      dataIndex: 'priority',
      key: 'priority',
      render: (priority) => (
        <Tag color={getPriorityColor(priority)}>
          {getPriorityText(priority)}
        </Tag>
      ),
      width: 100,
      filters: [
        { text: 'Düşük', value: 'Low' },
        { text: 'Orta', value: 'Medium' },
        { text: 'Yüksek', value: 'High' },
        { text: 'Kritik', value: 'Critical' }
      ],
      onFilter: (value, record) => record.priority === value
    },
    {
      title: 'Üretim Hedefi',
      key: 'productionTarget',
      render: (_, record) => (
        record.productionTarget ? (
          <Text>
            {`${record.productionTarget.quantity} ${record.productionTarget.unit}`}
          </Text>
        ) : '-'
      ),
      width: 150,
      filters: [
        { text: 'Adet', value: 'adet' },
        { text: 'Metre', value: 'metre' },
        { text: 'Kg', value: 'kg' },
        { text: 'Ton', value: 'ton' },
        { text: 'Litre', value: 'litre' },
        { text: 'Cm', value: 'cm' },
        { text: 'm²', value: 'm2' },
        { text: 'm³', value: 'm3' },
        { text: 'Paket', value: 'paket' },
        { text: 'Kutu', value: 'kutu' }
      ],
      onFilter: (value, record) => record.productionTarget?.unit === value
    },
    {
      title: 'Üretilen Miktar',
      key: 'producedQuantity',
      render: (_, record) => (
        record.producedQuantity ? (
          <Text>
            {`${record.producedQuantity.quantity} ${record.producedQuantity.unit}`}
          </Text>
        ) : '-'
      ),
      width: 150,
      filters: [
        { text: 'Adet', value: 'adet' },
        { text: 'Metre', value: 'metre' },
        { text: 'Kg', value: 'kg' },
        { text: 'Ton', value: 'ton' },
        { text: 'Litre', value: 'litre' },
        { text: 'Cm', value: 'cm' },
        { text: 'm²', value: 'm2' },
        { text: 'm³', value: 'm3' },
        { text: 'Paket', value: 'paket' },
        { text: 'Kutu', value: 'kutu' }
      ],
      onFilter: (value, record) => record.producedQuantity?.unit === value
    },
    {
      title: 'İlerleme',
      key: 'progress',
      render: (_, record) => (
        record.productionTarget && record.producedQuantity ? (
          <Text>
            {`%${((record.producedQuantity.quantity / record.productionTarget.quantity) * 100).toFixed(2)}`}
          </Text>
        ) : '-'
      ),
      width: 100
    },
    {
      title: 'Atanan Kişi',
      dataIndex: 'assignedTo',
      key: 'assignedTo',
      render: (assignedTo) => {
        if (!assignedTo) return <Text type="secondary">-</Text>;
        
        if (typeof assignedTo === 'string') {
          const user = users.find(u => u._id === assignedTo);
          return user ? `${user.firstName} ${user.lastName}` : <Text type="secondary">-</Text>;
        }
        
        if (typeof assignedTo === 'object') {
          if (assignedTo._id) {
            const user = users.find(u => u._id === assignedTo._id);
            return user ? `${user.firstName} ${user.lastName}` : <Text type="secondary">-</Text>;
          }
          
          if (assignedTo.firstName || assignedTo.lastName) {
            return `${assignedTo.firstName || ''} ${assignedTo.lastName || ''}`.trim();
          }
          
          if (assignedTo.name) {
            return assignedTo.name;
          }
        }
        
        return <Text type="secondary">-</Text>;
      },
    },
    {
      title: 'Makine',
      dataIndex: 'machine',
      key: 'machine',
      render: (machine) => {
        if (!machine) return <Text type="secondary">-</Text>;
        const name = typeof machine === 'string' 
          ? machine 
          : machine.name;
        return name;
      },
    },
    {
      title: 'Planlanan Başlangıç',
      dataIndex: 'plannedStartTime',
      key: 'plannedStartTime',
      render: (date) => date ? dayjs(date).format('DD.MM.YYYY HH:mm') : '-',
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

  const filters = [
    {
      key: 'status',
      label: 'Durum Filtresi',
      options: [
        { key: 'planned', label: 'Planlandı', value: 'Planned' },
        { key: 'in-progress', label: 'Devam Ediyor', value: 'In Progress' },
        { key: 'completed', label: 'Tamamlandı', value: 'Completed' },
        { key: 'cancelled', label: 'İptal Edildi', value: 'Cancelled' },
      ],
      value: filterStatus,
      onChange: setFilterStatus,
    },
    {
      key: 'assignedTo',
      label: 'Atanan Kişi',
      options: users.map(user => ({ 
        key: user._id, 
        label: `${user.firstName} ${user.lastName}`,
        value: user._id 
      })),
      value: filterAssignedTo,
      onChange: setFilterAssignedTo,
    },
    {
      key: 'machine',
      label: 'Makine',
      options: machines.map(machine => ({ 
        key: machine._id, 
        label: machine.name,
        value: machine._id 
      })),
      value: filterMachine,
      onChange: setFilterMachine,
    },
    {
      key: 'productionStage',
      label: 'Üretim Aşaması',
      options: productionStages.map(stage => ({ 
        key: stage._id, 
        label: stage.name,
        value: stage._id 
      })),
      value: filterProductionStage,
      onChange: setFilterProductionStage,
    },
    {
      key: 'department',
      label: 'Departman',
      options: departments.map(dept => ({
        key: dept._id,
        label: `${dept.name} (${dept.code})`,
        value: dept._id
      })),
      value: filterDepartment,
      onChange: setFilterDepartment,
    },
  ];

  const actions = {
    buttons: [
      {
        key: 'view',
        icon: <InfoCircleOutlined />,
        onClick: handleDetail,
        tooltip: 'Detay',
      },
      {
        key: 'edit',
        icon: <EditOutlined />,
        onClick: handleEdit,
        tooltip: 'Düzenle',
        disabled: (record: JobOrder) => record.status === 'Completed',
      },
    ],
    dropdown: [
      {
        key: 'status-planned',
        disabled: (record: JobOrder) => record.status === 'Planned' || record.status === 'Completed',
        onClick: (record: JobOrder) => handleStatusChange(record._id, 'Planned'),
        icon: <ClockCircleOutlined />,
        label: 'Planlandı'
      },
      {
        key: 'status-in-progress',
        disabled: (record: JobOrder) => record.status === 'In Progress' || record.status === 'Completed',
        onClick: (record: JobOrder) => handleStatusChange(record._id, 'In Progress'),
        icon: <RightCircleOutlined />,
        label: 'Devam Ediyor'
      },
      {
        key: 'status-paused',
        disabled: (record: JobOrder) => record.status === 'Paused' || record.status === 'Completed',
        onClick: (record: JobOrder) => handleStatusChange(record._id, 'Paused'),
        icon: <PauseCircleOutlined />,
        label: 'Duraklatıldı'
      },
      {
        key: 'status-completed',
        disabled: (record: JobOrder) => record.status === 'Completed',
        onClick: (record: JobOrder) => handleStatusChange(record._id, 'Completed'),
        icon: <CheckCircleOutlined />,
        label: 'Tamamlandı'
      },
      {
        key: 'status-cancelled',
        disabled: (record: JobOrder) => record.status === 'Cancelled' || record.status === 'Completed',
        onClick: (record: JobOrder) => handleStatusChange(record._id, 'Cancelled'),
        icon: <StopOutlined />,
        label: 'İptal'
      },
      {
        key: 'divider-1',
        type: 'divider' as const
      },
      {
        key: 'add-delay',
        disabled: (record: JobOrder) => record.status === 'Completed',
        onClick: (record: JobOrder) => navigate(`/dashboard/job-orders/edit/${record._id}?tab=delay`),
        icon: <ClockCircleOutlined />,
        label: 'Gecikme Ekle'
      },
      {
        key: 'restart',
        disabled: (record: JobOrder) => record.status !== 'Completed',
        onClick: (record: JobOrder) => handleStatusChange(record._id, 'In Progress'),
        icon: <PlayCircleOutlined />,
        label: 'Yeniden Başlat'
      },
      {
        key: 'delete',
        danger: true,
        onClick: handleDelete,
        icon: <DeleteOutlined />,
        label: 'Sil'
      }
    ],
  };

  return (
    <>
      <DataTable
        title="İş Emirleri"
        data={filteredJobOrders}
        columns={columns}
        loading={loading}
        onAdd={handleAdd}
        addButtonText="Yeni İş Emri"
        recordType="İş Emri"
        actions={actions}
        onBulkDelete={handleBulkDelete}
        total={total}
        pageSize={pageSize}
        currentPage={currentPage}
        onPageChange={handlePageChange}
      >
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '12px', alignItems: 'center' }}>
          <Input.Search
            placeholder="İş emri no veya başlık ara..."
            onSearch={handleSearch}
            onChange={(e) => setSearchText(e.target.value)}
            value={searchText}
            style={{ width: '100%', maxWidth: 300 }}
            allowClear
          />
          <Select
            placeholder="Durum"
            style={{ width: '100%', maxWidth: 150 }}
            value={filterStatus}
            onChange={(value) => setFilterStatus(value)}
            allowClear
            options={[
              { label: 'Planlandı', value: 'Planned' },
              { label: 'Devam Ediyor', value: 'In Progress' },
              { label: 'Tamamlandı', value: 'Completed' },
              { label: 'İptal', value: 'Cancelled' },
            ]}
          />
          <Select
            placeholder="Departman"
            style={{ width: '100%', maxWidth: 200 }}
            value={filterDepartment}
            onChange={(value) => setFilterDepartment(value)}
            allowClear
            options={departments.map(dept => ({
              label: `${dept.name}`,
              value: dept._id
            }))}
          />
          <Select
            placeholder="Atanan Kişi"
            style={{ width: '100%', maxWidth: 200 }}
            value={filterAssignedTo}
            onChange={setFilterAssignedTo}
            allowClear
            options={users.map(user => ({
              label: `${user.firstName} ${user.lastName}`,
              value: user._id
            }))}
          />
          <Select
            placeholder="Makine"
            style={{ width: '100%', maxWidth: 200 }}
            value={filterMachine}
            onChange={(value) => setFilterMachine(value)}
            allowClear
            showSearch
            filterOption={(input, option) =>
              (option?.label ?? '').toLowerCase().includes(input.toLowerCase())
            }
            options={machines.map(machine => ({
              label: machine.name,
              value: machine._id
            }))}
          />
          <Select
            placeholder="Üretim Aşaması"
            style={{ width: '100%', maxWidth: 200 }}
            value={filterProductionStage}
            onChange={setFilterProductionStage}
            allowClear
            options={productionStages.map(stage => ({
              label: stage.name,
              value: stage._id
            }))}
          />
          <Button 
            icon={<FilterOutlined />} 
            onClick={() => {
              setFilterStatus(undefined);
              setFilterAssignedTo(undefined);
              setFilterMachine(undefined);
              setFilterProductionStage(undefined);
              setFilterDepartment(undefined);
              setFilterProductionTargetUnit(undefined);
              setFilterProducedQuantityUnit(undefined);
              setSearchText('');
            }}
          >
            Sıfırla
          </Button>
        </div>
      </DataTable>
    </>
  );
};

export default JobOrders;
