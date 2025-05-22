import React, { useState, useEffect } from 'react';
import { Tag, Typography, Space, Modal, message } from 'antd';
import { useNavigate, useParams } from 'umi';
import departmentService, { Department, DepartmentDetail } from '@/services/departmentService';
import DetailPage, { DetailField } from '@/components/DetailPage';
import LoadingSpinner from '@/components/LoadingSpinner';

const { Text } = Typography;

const DepartmentDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [department, setDepartment] = useState<DepartmentDetail | null>(null);
  const [modal, modalContextHolder] = Modal.useModal();

  useEffect(() => {
    const fetchDepartment = async () => {
      try {
        const data = await departmentService.getDepartment(id!);
        // Convert Department to DepartmentDetail by adding empty arrays for employees and roles
        const departmentDetail: DepartmentDetail = {
          ...data,
          employees: [],
          roles: []
        };
        setDepartment(departmentDetail);
        setLoading(false);
      } catch (error) {
        message.error('Departman bilgileri yüklenemedi');
        navigate('/dashboard/departments');
      }
    };
    fetchDepartment();
  }, [id]);

  const handleEdit = () => {
    navigate(`/dashboard/departments/edit/${id}`);
  };

  const handleDelete = () => {
    modal.confirm({
      title: 'Departmanı silmek istediğinize emin misiniz?',
      content: 'Bu işlem geri alınamaz.',
      okText: 'Evet',
      cancelText: 'Hayır',
      okType: 'danger',
      onOk: async () => {
        try {
          await departmentService.deleteDepartment(id!);
          message.success('Departman silindi');
          navigate('/dashboard/departments');
        } catch (error: any) {
          message.error(error.message || 'Departman silinemedi');
        }
      },
    });
  };

  const getDepartmentTypeColor = (type: string) => {
    const colors: { [key: string]: string } = {
      production: 'blue',
      quality: 'green',
      maintenance: 'orange',
      warehouse: 'cyan',
      hr: 'purple',
      planning: 'red',
      management: 'geekblue',
      system: 'default',
    };
    return colors[type] || 'default';
  };

  const getDepartmentTypeLabel = (type: string) => {
    const labels: { [key: string]: string } = {
      production: 'Üretim',
      quality: 'Kalite',
      maintenance: 'Bakım',
      warehouse: 'Depo',
      hr: 'İnsan Kaynakları',
      planning: 'Planlama',
      management: 'Yönetim',
      system: 'Sistem',
    };
    return labels[type] || type;
  };

  const getFields = (): DetailField[] => {
    if (!department) return [];

    return [
      {
        label: 'Temel Bilgiler',
        value: (
          <Space direction="vertical" size="middle" style={{ width: '100%' }}>
            <div>
              <Text type="secondary">Departman Adı</Text>
              <div><Text strong>{department.name}</Text></div>
            </div>
            <div>
              <Text type="secondary">Departman Kodu</Text>
              <div><Text>{department.code}</Text></div>
            </div>
            <div>
              <Text type="secondary">Açıklama</Text>
              <div><Text>{department.description || 'Açıklama yok'}</Text></div>
            </div>
            <div>
              <Text type="secondary">Departman Tipi</Text>
              <div>
                <Tag color={getDepartmentTypeColor(department.type)}>
                  {getDepartmentTypeLabel(department.type)}
                </Tag>
              </div>
            </div>
          </Space>
        ),
        row: 0, col: 0, span: 12
      },
      {
        label: 'Yönetim Bilgileri',
        value: (
          <Space direction="vertical" size="middle" style={{ width: '100%' }}>
            <div>
              <Text type="secondary">Durum</Text>
              <div>
                <Tag color={department.isActive ? 'success' : 'error'}>
                  {department.isActive ? 'Aktif' : 'Pasif'}
                </Tag>
              </div>
            </div>
            <div>
              <Text type="secondary">Yönetici</Text>
              <div>
                {department.manager ? (
                  <Text>
                    {department.manager.firstName} {department.manager.lastName}
                  </Text>
                ) : <Text type="secondary">Atanmamış</Text>}
              </div>
            </div>
            <div>
              <Text type="secondary">Üst Departman</Text>
              <div>
                {department.parentDepartment ? (
                  <Text>
                    {department.parentDepartment.name} ({department.parentDepartment.code})
                  </Text>
                ) : <Text type="secondary">Yok</Text>}
              </div>
            </div>
          </Space>
        ),
        row: 0, col: 1, span: 12
      },
      {
        label: 'Çalışma Detayları',
        value: (
          <Space direction="vertical" size="middle" style={{ width: '100%' }}>
            <div>
              <Text type="secondary">Çalışma Saatleri</Text>
              <div>
                {department.workingHours?.start && department.workingHours?.end ? (
                  <Text>
                    {department.workingHours.start} - {department.workingHours.end}
                  </Text>
                ) : <Text type="secondary">Belirtilmemiş</Text>}
              </div>
            </div>
            <div>
              <Text type="secondary">Konum</Text>
              <div>
                {department.location ? (
                  <Text>{department.location}</Text>
                ) : <Text type="secondary">Belirtilmemiş</Text>}
              </div>
            </div>
          </Space>
        ),
        row: 1, col: 0, span: 12
      },
      {
        label: 'İletişim Bilgileri',
        value: (
          <Space direction="vertical" size="middle" style={{ width: '100%' }}>
            {department.contactInfo?.phone && (
              <div>
                <Text type="secondary">Telefon</Text>
                <div><Text>{department.contactInfo.phone}</Text></div>
              </div>
            )}
            {department.contactInfo?.email && (
              <div>
                <Text type="secondary">E-posta</Text>
                <div><Text>{department.contactInfo.email}</Text></div>
              </div>
            )}
            {!department.contactInfo?.phone && !department.contactInfo?.email && (
              <Text type="secondary">İletişim bilgisi bulunmamaktadır</Text>
            )}
          </Space>
        ),
        row: 1, col: 1, span: 12
      },
      {
        label: 'Zaman Bilgileri',
        value: (
          <Space direction="vertical" size="middle" style={{ width: '100%' }}>
            <div>
              <Text type="secondary">Oluşturulma Tarihi</Text>
              <div>
                <Text>{new Date(department.createdAt).toLocaleString()}</Text>
              </div>
            </div>
            <div>
              <Text type="secondary">Son Güncelleme Tarihi</Text>
              <div>
                <Text>{new Date(department.updatedAt).toLocaleString()}</Text>
              </div>
            </div>
          </Space>
        ),
        row: 2, col: 0, span: 12
      }
    ];
  };

  if (loading) return <LoadingSpinner />;

  return (
    <>
      {modalContextHolder}
      <DetailPage
        title="Departman Detayı"
        fields={getFields()}
        loading={loading}
        backButtonText="Departmanlar Listesine Dön"
        onBack={() => navigate('/dashboard/departments')}
        layout={{ rows: 3, columns: 2, gap: 24 }}
        actions={{
          onEdit: handleEdit,
          onDelete: handleDelete
        }}
      />
    </>
  );
};

export default DepartmentDetailPage; 