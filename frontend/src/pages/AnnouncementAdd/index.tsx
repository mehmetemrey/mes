import React, { useState } from 'react';
import { message, Input, Select } from 'antd';
import { useNavigate } from 'umi';
import AddPage, { AddField } from '@/components/AddPage';
import announcementService from '@/services/announcementService';

const { TextArea } = Input;
const { Option } = Select;

const AnnouncementAdd: React.FC = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);

  const fields: AddField[] = [
    {
      name: 'title',
      label: 'Başlık',
      type: 'text',
      required: true,
      placeholder: 'Duyuru başlığı',
      row: 0,
      col: 0,
    },
    {
      name: 'type',
      label: 'Duyuru Tipi',
      type: 'custom',
      required: true,
      render: () => (
        <Select placeholder="Duyuru tipini seçin" style={{ width: '100%' }}>
          <Option value="announcement">Duyuru</Option>
          <Option value="info">Bilgi</Option>
          <Option value="update">Güncelleme</Option>
        </Select>
      ),
      row: 1,
      col: 0,
    },
    {
      name: 'message',
      label: 'Mesaj',
      type: 'custom',
      required: true,
      render: () => <TextArea placeholder="Duyuru mesajı" rows={4} />,
      row: 2,
      col: 0,
    },
    {
      name: 'link',
      label: 'Bağlantı (Opsiyonel)',
      type: 'text',
      required: false,
      placeholder: 'İlgili bağlantı (varsa)',
      row: 3,
      col: 0,
    },
  ];

  const handleSubmit = async (values: any) => {
    setLoading(true);
    try {
      await announcementService.createAnnouncement(values);
      message.success('Duyuru başarıyla eklendi!');
      navigate('/dashboard/announcements');
    } catch (error: any) {
      message.error(error.message || 'Duyuru eklenirken bir hata oluştu.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <AddPage
      title="Duyuru Ekle"
      fields={fields}
      loading={loading}
      onSubmit={handleSubmit}
      onBack={() => navigate(-1)}
      backButtonText="Geri"
      submitText="Ekle"
      cancelText="İptal"
      onCancel={() => navigate(-1)}
      layout={{ columns: 1, gap: 16 }}
    />
  );
};

export default AnnouncementAdd;
