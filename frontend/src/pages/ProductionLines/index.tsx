import React, { useState, useEffect } from 'react';
import { Tag, Typography, App, Modal } from 'antd';
import { 
  EditOutlined, 
  DeleteOutlined, 
  EyeOutlined 
} from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';
import productionLineService, { 
  ProductionLine, 
  ProductionLineFilter, 
  ProductionLinePagination 
} from '../../services/productionLineService';
import departmentService from '../../services/departmentService';
import DataTable from '../../components/DataTable';

const { Text } = Typography;

const ProductionLinesDataTable: React.FC = () => {
  const { message, modal } = App.useApp();
  const [productionLines, setProductionLines] = useState<ProductionLine[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [departments, setDepartments] = useState<any[]>([]);
  const [pagination, setPagination] = useState<ProductionLinePagination>({
    page: 1,
    limit: 10,
    sortBy: 'createdAt',
    sortOrder: 'desc'
  });
  const [totalCount, setTotalCount] = useState<number>(0);
  const [filters, setFilters] = useState<ProductionLineFilter>({});

  const navigate = useNavigate();

  useEffect(() => {
    // Fetch departments for filtering
    const fetchDepartments = async () => {
      try {
        const departmentsData = await departmentService.getDepartments();
        setDepartments(departmentsData);
      } catch (error) {
        console.error('Failed to fetch departments', error);
      }
    };
    fetchDepartments();
  }, []);

  useEffect(() => {
    fetchProductionLines();
  }, [pagination, filters]);

  const fetchProductionLines = async () => {
    try {
      setLoading(true);
      const response = await productionLineService.getProductionLines(filters, pagination);
      
      if (response.success && response.productionLines) {
        setProductionLines(response.productionLines);
        setTotalCount(response.total || response.productionLines.length);
      } else {
        setProductionLines([]);
        setTotalCount(0);
        console.error('Unexpected response structure', response);
      }
      
      setLoading(false);
    } catch (error) {
      console.error('Failed to fetch production lines', error);
      setProductionLines([]);
      setTotalCount(0);
      setLoading(false);
    }
  };

  const handleDelete = async (record: ProductionLine) => {
    try {
      if (!record._id) {
        message.error('Üretim hattı ID\'si bulunamadı');
        return;
      }

      modal.confirm({
        title: 'Üretim Hattını Sil',
        content: `${record.name} üretim hattını silmek istediğinizden emin misiniz?`,
        okText: 'Evet',
        cancelText: 'Hayır',
        okButtonProps: { danger: true },
        onOk: async () => {
          try {
            const id = record._id;
            if (!id) {
              message.error('Üretim hattı ID\'si bulunamadı');
              return;
            }
            await productionLineService.deleteProductionLine(id);
            message.success('Üretim hattı başarıyla silindi');
      fetchProductionLines();
          } catch (error: any) {
            message.error(error.message || 'Üretim hattı silinirken bir hata oluştu');
          }
        }
      });
    } catch (error: any) {
      message.error(error.message || 'Üretim hattı silinirken bir hata oluştu');
    }
  };

  const columns = [
    {
      title: 'Kod',
      dataIndex: 'code',
      key: 'code',
      sorter: true,
    },
    {
      title: 'Ad',
      dataIndex: 'name',
      key: 'name',
      sorter: true,
    },
    {
      title: 'Departman',
      dataIndex: 'department',
      key: 'department',
      render: (department: string | { _id?: string; name?: string }) => {
        // Handle different possible input types
        let departmentId: string | undefined;
        
        // If department is an object, try to get its ID
        if (typeof department === 'object') {
          departmentId = department._id;
        } 
        // If department is a string, use it directly
        else if (typeof department === 'string') {
          departmentId = department;
        }

        // Find the department in the loaded departments
        const foundDepartment = departments.find(d => d._id === departmentId);
        
        // Return department name or fallback
        return foundDepartment 
          ? foundDepartment.name 
          : departmentId 
            ? `Bilinmeyen (${departmentId})` 
            : 'Bilinmeyen';
      },
      filters: departments.map(d => ({ 
        text: d.name, 
        value: d._id 
      })),
      onFilter: (value: any, record: ProductionLine) => {
        // Handle different possible department types in the record
        const departmentId = typeof record.department === 'object' 
          ? (record.department as { _id?: string })._id 
          : record.department;
        return departmentId === value;
      },
    },
    {
      title: 'Durum',
      dataIndex: 'status',
      key: 'status',
      render: (status: string) => {
        const colorMap = {
          'Aktif': 'green',
          'Bakımda': 'orange',
          'Kapalı': 'red',
          'Planlı Duruş': 'blue',
          'Arıza': 'volcano'
        };
        return <Tag color={colorMap[status as keyof typeof colorMap]}>{status}</Tag>;
      },
      filters: [
        { text: 'Aktif', value: 'Aktif' },
        { text: 'Bakımda', value: 'Bakımda' },
        { text: 'Kapalı', value: 'Kapalı' },
        { text: 'Planlı Duruş', value: 'Planlı Duruş' },
        { text: 'Arıza', value: 'Arıza' }
      ],
      onFilter: (value: any, record: ProductionLine) => 
        record.status === value,
    },
    {
      title: 'Kapasite',
      dataIndex: 'capacity',
      key: 'capacity',
      render: (capacity: number, record: ProductionLine) => 
        `${capacity || 0} ${record.capacityUnit || 'adet/saat'}`,
      sorter: true,
    },
    {
      title: 'Verimlilik',
      dataIndex: 'efficiency',
      key: 'efficiency',
      render: (efficiency: number) => 
        <Text type={efficiency < 50 ? 'danger' : efficiency < 80 ? 'warning' : 'success'}>
          {efficiency || 0}%
        </Text>,
      sorter: true,
    }
  ];

  const actions = {
    buttons: [
      {
        key: 'view',
        icon: <EyeOutlined />,
        onClick: (record: ProductionLine) => navigate(`/dashboard/production-lines/${record._id}`),
        tooltip: 'Detayları Görüntüle'
      },
      {
        key: 'edit',
        icon: <EditOutlined />,
        onClick: (record: ProductionLine) => navigate(`/dashboard/production-lines/edit/${record._id}`),
        tooltip: 'Düzenle'
      },
      {
        key: 'delete',
        danger: true,
        icon: <DeleteOutlined style={{ color: '#ff4d4f' }} />,
        onClick: (record: ProductionLine) => handleDelete(record),
        tooltip: 'Sil',
      },
    ]
  };

  return (
    <DataTable
      title="Üretim Hatları"
      data={productionLines}
      columns={columns}
      loading={loading}
      total={totalCount}
      pageSize={pagination.limit}
      currentPage={pagination.page}
      onPageChange={(page, pageSize) => {
        setPagination(prev => ({
          ...prev,
          page,
          limit: pageSize || 10
        }));
      }}
      onAdd={() => navigate('/dashboard/production-lines/add')}
      actions={actions}
      rowKey="_id"
    />
  );
};

export default ProductionLinesDataTable; 