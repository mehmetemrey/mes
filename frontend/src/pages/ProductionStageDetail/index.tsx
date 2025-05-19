import React, { useState, useEffect } from 'react';
import { Tag, Typography, Space, Modal, message } from 'antd';
import { useNavigate, useParams } from 'umi';
import { productionStageService, ProductionStage } from '@/services/productionStageService';
import DetailPage, { DetailField } from '@/components/DetailPage';
import LoadingSpinner from '@/components/LoadingSpinner';

const { Text } = Typography;

// Extend the ProductionStage type to include estimatedDuration
interface ExtendedProductionStage extends ProductionStage {
  estimatedDuration: number;
  department?: {
    _id: string;
    name: string;
    code: string;
  };
}

const ProductionStageDetail: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [productionStage, setProductionStage] = useState<ExtendedProductionStage | null>(null);
  const [modal, modalContextHolder] = Modal.useModal();

  useEffect(() => {
    const fetchData = async () => {
      try {
        const stageData = await productionStageService.getProductionStage(id!);
        setProductionStage(stageData as ExtendedProductionStage);
        setLoading(false);
      } catch (error) {
        message.error('Üretim aşaması bilgileri yüklenemedi');
        navigate('/dashboard/production-stages');
      }
    };
    
    fetchData();
  }, [id]);

  const handleEdit = () => {
    navigate(`/dashboard/production-stages/edit/${id}`);
  };

  const handleDelete = () => {
    modal.confirm({
      title: 'Üretim aşamasını silmek istediğinize emin misiniz?',
      content: 'Bu işlem geri alınamaz.',
      okText: 'Evet',
      cancelText: 'Hayır',
      okType: 'danger',
      onOk: async () => {
        try {
          await productionStageService.deleteProductionStage(id!);
          message.success('Üretim aşaması silindi');
          navigate('/dashboard/production-stages');
        } catch (error: any) {
          message.error(error.message || 'Üretim aşaması silinemedi');
        }
      },
    });
  };

  const getFields = (): DetailField[] => {
    if (!productionStage) return [];

    return [
      {
        label: 'Temel Bilgiler',
        value: (
          <Space direction="vertical" size="middle" style={{ width: '100%' }}>
            <div>
              <Text type="secondary">Aşama Adı</Text>
              <div><Text strong>{productionStage.name}</Text></div>
            </div>
            <div>
              <Text type="secondary">Açıklama</Text>
              <div><Text>{productionStage.description || 'Belirtilmemiş'}</Text></div>
            </div>
          </Space>
        ),
        row: 0, col: 0, span: 12
      },
      {
        label: 'Operasyonel Detaylar',
        value: (
          <Space direction="vertical" size="middle" style={{ width: '100%' }}>
            <div>
              <Text type="secondary">Sıra</Text>
              <div><Tag color="blue">{productionStage.sequence}</Tag></div>
            </div>
            <div>
              <Text type="secondary">Tahmini Süre</Text>
              <div><Text>{productionStage.estimatedDuration} dakika</Text></div>
            </div>
            <div>
              <Text type="secondary">Durum</Text>
              <div>
                <Tag color={productionStage.isActive ? 'success' : 'error'}>
                  {productionStage.isActive ? 'Aktif' : 'Pasif'}
                </Tag>
              </div>
            </div>
          </Space>
        ),
        row: 0, col: 1, span: 12
      },
      {
        label: 'Departman',
        value: (
          <Space direction="vertical" size="middle" style={{ width: '100%' }}>
            {productionStage.department ? (
              <Tag color="blue">{`${productionStage.department.name} (${productionStage.department.code})`}</Tag>
            ) : (
              <Tag color="default">Atanmamış</Tag>
            )}
          </Space>
        ),
        row: 1, col: 0, span: 12
      },
      {
        label: 'Gerekli Roller',
        value: (
          <Space direction="vertical" size="middle" style={{ width: '100%' }}>
            {productionStage.requiredRoles?.map((role: any) => (
              <Tag key={role._id} color="blue">
                {role.name}
              </Tag>
            ))}
          </Space>
        ),
        row: 1, col: 1, span: 12
      }
    ];
  };

  if (loading) return <LoadingSpinner />;

  return (
    <>
      {modalContextHolder}
      <DetailPage
        title="Üretim Aşaması Detayı"
        fields={getFields()}
        loading={loading}
        backButtonText="Üretim Aşamaları Listesine Dön"
        onBack={() => navigate('/dashboard/production-stages')}
        layout={{ rows: 2, columns: 2, gap: 24 }}
        actions={{
          onEdit: handleEdit,
          onDelete: handleDelete
        }}
      />
    </>
  );
};

export default ProductionStageDetail;
