import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'umi';
import EditPage, { FieldType } from '@/components/EditPage';
import announcementService from '@/services/announcementService';
import { message } from 'antd';

const AnnouncementEdit: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [initialValues, setInitialValues] = useState<any>(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const announcement = await announcementService.getAnnouncement(id!);
        setInitialValues(announcement);
      } catch (error) {
        message.error('Duyuru bilgileri alınırken bir hata oluştu');
        navigate('/dashboard/announcements');
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [id, navigate]);

  const handleSubmit = async (values: any) => {
    try {
      await announcementService.updateAnnouncement(id!, values);
      message.success('Duyuru başarıyla güncellendi');
      navigate('/dashboard/announcements');
    } catch (error) {
      message.error('Duyuru güncellenirken bir hata oluştu');
    }
  };

  const fields = [
    {
      name: 'title',
      label: 'Başlık',
      type: 'text' as FieldType,
      rules: [{ required: true, message: 'Lütfen başlık giriniz' }],
      col: 24,
      row: 1,
      span: 24
    },
    {
      name: 'message',
      label: 'Mesaj',
      type: 'textarea' as FieldType,
      rules: [{ required: true, message: 'Lütfen mesaj giriniz' }],
      col: 24,
      row: 2,
      span: 24
    },
    {
      name: 'type',
      label: 'Tür',
      type: 'select' as FieldType,
      options: [
        { label: 'Duyuru', value: 'announcement' },
        { label: 'Bilgi', value: 'info' },
        { label: 'Güncelleme', value: 'update' }
      ],
      rules: [{ required: true, message: 'Lütfen tür seçiniz' }],
      col: 12,
      row: 3,
      span: 12
    },
    {
      name: 'link',
      label: 'Bağlantı',
      type: 'text' as FieldType,
      placeholder: 'https://',
      col: 12,
      row: 3,
      span: 12
    }
  ];

  return (
    <EditPage
      title="Duyuru Düzenle"
      fields={fields}
      initialValues={initialValues}
      onSubmit={handleSubmit}
      backUrl="/dashboard/announcements"
      loading={loading}
      backButtonText="Duyurulara Dön"
      submitButtonText="Güncelle"
    />
  );
};

export default AnnouncementEdit; 