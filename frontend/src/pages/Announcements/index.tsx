import React, { useState, useEffect, useMemo } from 'react';
import { 
  ProCard 
} from '@ant-design/pro-components';
import { 
  Button, 
  message, 
  Modal, 
  Typography, 
  List, 
  Avatar, 
  Space, 
  Tag, 
  Empty, 
  Segmented,
  Tooltip,
  Skeleton,
  Card,
  Row,
  Col,
  Divider,
  Drawer,
  App,
  Select
} from 'antd';
import { 
  CheckCircleOutlined, 
  DeleteOutlined, 
  InboxOutlined,
  NotificationOutlined,
  ClockCircleOutlined,
  MailOutlined,
  MailTwoTone,
  BellOutlined,
  PlusOutlined,
  EyeOutlined,
  FilterOutlined,
  InfoCircleOutlined,
  EditOutlined
} from '@ant-design/icons';
import announcementService, { Announcement } from '@/services/announcementService';
import { useNavigate } from 'umi';
import Cookies from 'js-cookie';
import LoadingSpinner from '@/components/LoadingSpinner';
import socketService from '@/services/socketService';

const { Text, Paragraph, Title } = Typography;
const { Option } = Select;

const getTypeColor = (type: string) => {
  switch (type) {
    case 'announcement':
      return 'blue';
    case 'info':
      return 'cyan';
    case 'update':
      return 'green';
    default:
      return 'default';
  }
};

const getTypeText = (type: string) => {
  switch (type) {
    case 'announcement':
      return 'Duyuru';
    case 'info':
      return 'Bilgi';
    case 'update':
      return 'Güncelleme';
    default:
      return type;
  }
};

const AnnouncementsPage: React.FC = () => {
  const [announcements, setAnnouncements] = useState<Announcement[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [markingRead, setMarkingRead] = useState<string | null>(null);
  const [filter, setFilter] = useState<'all' | 'unread' | 'read'>('all');
  const navigate = useNavigate();
  const { message: appMessage, modal: appModal } = App.useApp();
  
  // Get user role from cookies
  const userRoles = JSON.parse(Cookies.get('user') || '{}').roles || [];

  // Check if user has permission to create announcements
  const canCreateAnnouncements = userRoles.some(
    (role: string) => ['Admin', 'General Manager'].includes(role)
  );

  // Check if user has permission to delete announcements completely
  const canDeleteAnnouncements = userRoles.some(
    (role: string) => ['Admin', 'General Manager'].includes(role)
  );

  // Check if user has permission to edit announcements
  const canEditAnnouncements = userRoles.some(
    (role: string) => ['Admin', 'General Manager'].includes(role)
  );

  // State for detailed announcement view
  const [selectedAnnouncement, setSelectedAnnouncement] = useState<Announcement | null>(null);

  // Mobil kontrolü (576px ve altı için)
  const [isMobile, setIsMobile] = useState(false);
  useEffect(() => {
    const handleResize = () => {
      setIsMobile(window.innerWidth <= 576);
    };
    handleResize();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Get user ID from cookies
  const userId = JSON.parse(Cookies.get('user') || '{}').id;

  // Socket connection and event listeners
  useEffect(() => {
    const userData = JSON.parse(Cookies.get('user') || '{}');
    if (userData.id) {
      socketService.connect(userData.id);
      
      // Subscribe to announcement events
      const announcementReceivedUnsub = socketService.subscribe('announcement', (newAnnouncement: Announcement) => {
        setAnnouncements(prev => [newAnnouncement, ...prev]);
      });
      
      const announcementUpdatedUnsub = socketService.subscribe('announcement-update', (updatedAnnouncement: Announcement) => {
        setAnnouncements(prev => 
          prev.map(a => a._id === updatedAnnouncement._id ? {
            ...updatedAnnouncement,
            readBy: a.readBy // Mevcut readBy bilgisini koru
          } : a)
        );
      });
      
      const announcementDeletedUnsub = socketService.subscribe('announcement-delete', (deletedId: string) => {
        setAnnouncements(prev => prev.filter(a => a._id !== deletedId));
      });
      
      const allAnnouncementsReadUnsub = socketService.subscribe('announcements-all-read', () => {
        setAnnouncements(prev => prev.map(a => ({
          ...a,
          readBy: [...(a.readBy || []), userData.id]
        })));
      });
      
      const allAnnouncementsDeletedUnsub = socketService.subscribe('announcements-all-deleted', () => {
        setAnnouncements([]);
      });

      // Cleanup on unmount
      return () => {
        socketService.disconnect();
        announcementReceivedUnsub();
        announcementUpdatedUnsub();
        announcementDeletedUnsub();
        allAnnouncementsReadUnsub();
        allAnnouncementsDeletedUnsub();
      };
    }
  }, []);

  // Filtered announcements
  const filteredAnnouncements = useMemo(() => {
    const announcementsWithReadStatus = announcements.map(announcement => ({
      ...announcement,
      read: announcement.readBy?.includes(userId) || false
    }));

    switch (filter) {
      case 'unread':
        return announcementsWithReadStatus.filter(a => !a.read);
      case 'read':
        return announcementsWithReadStatus.filter(a => a.read);
      default:
        return announcementsWithReadStatus;
    }
  }, [announcements, filter, userId]);

  // Mark all announcements as read
  const handleMarkAllAsRead = async () => {
    try {
      await announcementService.markAllAsRead();
      // Tüm duyuruları okundu olarak işaretle
      setAnnouncements(prevAnnouncements =>
        prevAnnouncements.map(announcement => ({
          ...announcement,
          readBy: [...(announcement.readBy || []), userId]
        }))
      );
      appMessage.success('Tüm duyurular okundu olarak işaretlendi');
    } catch (error) {
      appMessage.error('Duyurular okundu olarak işaretlenirken bir hata oluştu');
    }
  };

  // Delete all announcements
  const handleDeleteAll = async () => {
    try {
      if (canDeleteAnnouncements) {
        // Admin/Manager için tamamen silme
        appModal.confirm({
          title: 'Tüm Duyuruları Sil',
          content: 'Tüm duyuruları tamamen silmek istediğinizden emin misiniz? Bu işlem geri alınamaz.',
          okText: 'Evet, Sil',
          okType: 'danger',
          cancelText: 'İptal',
          onOk: async () => {
            await announcementService.deleteAllAnnouncements();
            appMessage.success('Tüm duyurular başarıyla silindi');
            fetchAnnouncements();
          }
        });
      } else {
        // Normal kullanıcılar için görünümden kaldırma
        appModal.confirm({
          title: 'Tüm Duyuruları Sil',
          content: 'Tüm duyuruları silmek istediğinizden emin misiniz?',
          okText: 'Evet, Kaldır',
          cancelText: 'İptal',
          onOk: async () => {
            // Tüm duyuruları sırayla görünümden kaldır
            for (const announcement of announcements) {
              await announcementService.removeFromView(announcement._id);
            }
            appMessage.success('Tüm duyurular silindi');
            fetchAnnouncements();
          }
        });
      }
    } catch (error) {
      console.error('Error handling all announcements:', error);
      appMessage.error('Bir hata oluştu');
    }
  };

  // Mark single announcement as read
  const handleMarkAsRead = async (id: string) => {
    try {
      await announcementService.markAsRead(id);
      // Duyuruyu listeden kaldırmak yerine sadece okundu olarak işaretle
      setAnnouncements(prevAnnouncements => 
        prevAnnouncements.map(announcement => 
          announcement._id === id 
            ? {
                ...announcement,
                readBy: [...(announcement.readBy || []), userId]
              }
            : announcement
        )
      );
    } catch (error) {
      appMessage.error('Duyuru okundu olarak işaretlenirken bir hata oluştu');
    }
  };

  // Delete single announcement (admin/manager only)
  const handleDeleteAnnouncement = (id: string) => {
    if (!canDeleteAnnouncements) {
      appMessage.error('Bu işlem için yetkiniz bulunmamaktadır');
      return;
    }

    appModal.confirm({
      title: 'Duyuruyu Tamamen Sil',
      content: 'Bu duyuruyu sistemden tamamen silmek istediğinizden emin misiniz? Bu işlem geri alınamaz.',
      okText: 'Evet',
      cancelText: 'Hayır',
      onOk: async () => {
        try {
          await announcementService.deleteAnnouncement(id);
          appMessage.success('Duyuru sistemden silindi');
          fetchAnnouncements();
        } catch (error) {
          appMessage.error('Duyuru silinirken hata oluştu');
        }
      }
    });
  };

  // Remove announcement from user's view
  const handleRemoveFromView = async (id: string) => {
    try {
      await announcementService.removeFromView(id);
      // Duyuruyu listeden kaldır
      setAnnouncements(prevAnnouncements =>
        prevAnnouncements.filter(announcement => announcement._id !== id)
      );
      appMessage.success('Duyuru görünümden kaldırıldı');
    } catch (error) {
      appMessage.error('Duyuru görünümden kaldırılırken bir hata oluştu');
    }
  };

  // Common transition style
  const commonTransition = {
    transition: 'all 0.3s ease',
  };

  // Hover and scale styles
  const hoverScaleStyle = {
    ...commonTransition,
    ':hover': {
      transform: 'scale(1.05)'
    }
  };

  const announcementItemStyle = {
    ...commonTransition,
    ':hover': {
      transform: 'scale(1.02)',
      boxShadow: '0 4px 8px rgba(0,0,0,0.1)'
    }
  };

  const [filterDrawerOpen, setFilterDrawerOpen] = useState(false);

  // Update the render function to include both delete options and edit
  const renderAnnouncementActions = (announcement: Announcement) => {
    const actions = [];

    if (canEditAnnouncements) {
      actions.push(
        <Button
          key="edit"
          type="text"
          icon={<EditOutlined />}
          onClick={(e) => {
            e.stopPropagation();
            navigate(`/dashboard/announcements/edit/${announcement._id}`);
          }}
        >
          Düzenle
        </Button>
      );

      actions.push(
        <Button
          key="delete"
          type="text"
          danger
          icon={<DeleteOutlined />}
          onClick={(e) => {
            e.stopPropagation();
            handleDeleteAnnouncement(announcement._id);
          }}
        >
          Tamamen Sil
        </Button>
      );
    }

    actions.push(
      <Button
        key="remove"
        type="text"
        danger
        icon={<InboxOutlined />}
        onClick={(e) => {
          e.stopPropagation();
          handleRemoveFromView(announcement._id);
        }}
      >
        Sil
      </Button>
    );

    return actions;
  };

  // Function to open detailed announcement modal
  const handleShowFullAnnouncement = (announcement: Announcement) => {
    // Mark as read if not already read
    if (!announcement.readBy?.includes(userId)) {
      handleMarkAsRead(announcement._id);
    }
    setSelectedAnnouncement(announcement);
  };

  // Function to close detailed announcement modal
  const handleCloseFullAnnouncement = () => {
    setSelectedAnnouncement(null);
  };

  // Fetch announcements
  const fetchAnnouncements = async () => {
    try {
      setLoading(true);
      const response = await announcementService.getAnnouncements();
      setAnnouncements(response);
    } catch (error) {
      appMessage.error('Duyumlar yüklenirken hata oluştu');
    } finally {
      setLoading(false);
    }
  };

  // Initial fetch
  useEffect(() => {
    fetchAnnouncements();
  }, []);

  return (
    <div style={{ 
      display: 'flex', 
      flexDirection: 'column', 
      height: '100%', 
      padding: isMobile ? 0 : '16px',
      maxWidth: isMobile ? '100%' : '1800px', 
      margin: isMobile ? 0 : '0 auto',
      width: '100%'
    }}>
      <LoadingSpinner loading={loading} />

      <Row 
        gutter={[isMobile ? 0 : 16, isMobile ? 0 : 16]} 
        align="middle" 
        justify="space-between" 
        style={{ 
          marginBottom: isMobile ? 8 : '24px',
          width: '100%',
          padding: isMobile ? 0 : '16px',
          background: 'white',
          borderRadius: isMobile ? 0 : '12px',
          boxShadow: isMobile ? 'none' : '0 2px 4px rgba(0,0,0,0.05)'
        }}
      >
        <Col xs={24} sm={24} md={8} lg={6} xl={6} style={{ 
          display: 'flex', 
          justifyContent: isMobile ? 'center' : 'flex-start', 
          alignItems: 'center',
          marginBottom: isMobile ? 4 : 16
        }}>
          <Title 
            level={3} 
            style={{ 
              margin: 0, 
              display: 'flex', 
              alignItems: 'center',
              color: '#1890ff',
              fontSize: isMobile ? 20 : undefined
            }}
          >
            Duyurular
          </Title>
        </Col>
        
        <Col xs={24} sm={24} md={16} lg={12} xl={10} style={{ 
          display: 'flex', 
          justifyContent: 'center', 
          marginBottom: isMobile ? 8 : 16
        }}>
          {!isMobile && (
            <Segmented
              block
              value={filter}
              onChange={(value) => setFilter(value as 'all' | 'unread' | 'read')}
              options={[
                { label: 'Tümü', value: 'all' },
                { label: 'Okunmamış', value: 'unread' },
                { label: 'Okunmuş', value: 'read' }
              ]}
              style={{
                background: '#f0f2f5',
                padding: '4px',
                borderRadius: '8px',
                width: '100%',
                maxWidth: '400px'
              }}
            />
          )}
          {isMobile && (
            <Button
              icon={<FilterOutlined />}
              style={{ width: '100%', maxWidth: 1200, fontSize: 16 }}
              onClick={() => setFilterDrawerOpen(true)}
            >
              Filtrele
            </Button>
          )}
        </Col>
        
        <Col xs={24} sm={24} md={24} lg={6} xl={8} style={{ 
          display: 'flex', 
          justifyContent: 'center', 
          flexWrap: 'wrap',
          gap: isMobile ? 4 : '8px' 
        }}>
          {canCreateAnnouncements && (
            <Button 
              type="primary" 
              icon={<PlusOutlined />} 
              onClick={() => navigate('/dashboard/announcements/add')}
              style={{
                background: '#52c41a',
                borderColor: '#52c41a',
                boxShadow: isMobile ? 'none' : '0 2px 4px rgba(0,0,0,0.1)',
                ...hoverScaleStyle,
                width: '100%',
                maxWidth: isMobile ? '100%' : '200px',
                marginBottom: isMobile ? 4 : 8
              }}
            >
              Yeni Duyuru
            </Button>
          )}
          <Tooltip title="Tümünü Okundu İşaretle">
            <Button 
              icon={<CheckCircleOutlined />} 
              onClick={handleMarkAllAsRead}
              disabled={announcements.length === 0 || announcements.every(a => a.read)}
              style={{
                color: '#1890ff',
                borderColor: '#1890ff',
                boxShadow: isMobile ? 'none' : '0 2px 4px rgba(0,0,0,0.05)',
                ...hoverScaleStyle,
                width: '100%',
                maxWidth: isMobile ? '100%' : '200px',
                marginBottom: isMobile ? 4 : 8
              }}
            >
              Tümünü Oku
            </Button>
          </Tooltip>
          <Tooltip title={canDeleteAnnouncements ? "Tümünü Tamamen Sil" : "Tümünü Sil"}>
            <Button 
              danger 
              icon={<DeleteOutlined />} 
              onClick={handleDeleteAll}
              disabled={announcements.length === 0}
              style={{
                boxShadow: isMobile ? 'none' : '0 2px 4px rgba(0,0,0,0.05)',
                ...hoverScaleStyle,
                width: '100%',
                maxWidth: isMobile ? '100%' : '200px'
              }}
            >
              {canDeleteAnnouncements ? "Tümünü Tamamen Sil" : "Tümünü Sil"}
            </Button>
          </Tooltip>
        </Col>
      </Row>

      {!loading && filteredAnnouncements.length === 0 ? (
        <Empty 
          description="Henüz bir duyuru bulunmamaktadır" 
          image={Empty.PRESENTED_IMAGE_SIMPLE} 
          style={{
            background: 'white',
            padding: '24px',
            borderRadius: '12px',
            boxShadow: '0 2px 4px rgba(0,0,0,0.05)'
          }}
        />
      ) : !loading && (
        <List
          itemLayout="vertical"
          dataSource={filteredAnnouncements}
          renderItem={(item) => (
            <List.Item
              key={item._id}
              style={{ 
                marginBottom: '16px', 
                backgroundColor: item.read ? '#f5f5f5' : 'white', 
                borderRadius: '12px',
                border: `1px solid ${item.read ? '#e0e0e0' : '#1890ff'}`,
                padding: '16px',
                cursor: 'pointer',
                opacity: markingRead === item._id ? 0.5 : 1,
                boxShadow: '0 2px 4px rgba(0,0,0,0.05)',
                transform: 'scale(1)',
                transformOrigin: 'center',
                ...announcementItemStyle
              }}
              onClick={() => handleShowFullAnnouncement(item)}
              actions={renderAnnouncementActions(item)}
              extra={
                item.link && (
                  <Button 
                    type="link" 
                    onClick={(e) => {
                      e.stopPropagation();
                      window.open(item.link, '_blank');
                    }}
                    style={{ color: '#1890ff' }}
                  >
                    Bağlantıya Git
                  </Button>
                )
              }
            >
              <List.Item.Meta
                title={
                  <div style={{ 
                    display: 'flex', 
                    justifyContent: 'space-between', 
                    alignItems: 'center' 
                  }}>
                    <span style={{ 
                      fontWeight: 600, 
                      color: item.read ? '#999' : '#000' 
                    }}>
                      {item.title}
                    </span>
                    <Space>
                      <Tag color={getTypeColor(item.type)}>
                        {getTypeText(item.type)}
                      </Tag>
                    <Tag 
                      color={item.read ? 'default' : 'processing'}
                      style={{ 
                        opacity: item.read ? 0.7 : 1
                      }}
                    >
                      {item.read ? 'Okundu' : 'Okunmadı'}
                    </Tag>
                    </Space>
                  </div>
                }
                description={
                  <div 
                    style={{ 
                      maxHeight: '100px', 
                      overflow: 'hidden', 
                      textOverflow: 'ellipsis',
                      color: item.read ? '#666' : '#333'
                    }}
                  >
                    {item.message}
                  </div>
                }
              />
            </List.Item>
          )}
          style={{
            background: 'white',
            borderRadius: '12px',
            boxShadow: '0 2px 4px rgba(0,0,0,0.05)',
            padding: '16px'
          }}
        />
      )}

      {/* Full Announcement Modal */}
      <Modal
        title={
          <div style={{ 
            display: 'flex', 
            alignItems: 'center', 
            color: '#1890ff' 
          }}>
            <InfoCircleOutlined style={{ marginRight: 12 }} />
            {selectedAnnouncement?.title}
          </div>
        }
        open={!!selectedAnnouncement}
        onCancel={handleCloseFullAnnouncement}
        footer={[
          selectedAnnouncement?.link && (
            <Button 
              key="link" 
              type="primary" 
              onClick={() => window.open(selectedAnnouncement.link, '_blank')}
            >
              Bağlantıya Git
            </Button>
          ),
          <Button key="close" onClick={handleCloseFullAnnouncement}>
            Kapat
          </Button>
        ]}
      >
        {selectedAnnouncement && (
          <div>
            <Paragraph>
              <Text strong style={{ color: '#1890ff' }}>Başlık: </Text>
              {selectedAnnouncement.title}
            </Paragraph>
            <Divider />
            <Paragraph>
              <Text strong style={{ color: '#1890ff' }}>Mesaj: </Text>
              {selectedAnnouncement.message}
            </Paragraph>
            {selectedAnnouncement.link && (
              <>
                <Divider />
                <Paragraph>
                  <Text strong style={{ color: '#1890ff' }}>Bağlantı: </Text>
                  <a href={selectedAnnouncement.link} target="_blank" rel="noopener noreferrer">
                    {selectedAnnouncement.link}
                  </a>
                </Paragraph>
              </>
            )}
            <Divider />
            <Row gutter={16}>
              <Col span={12}>
                <Paragraph>
                  <Text strong style={{ color: '#1890ff' }}>Tarih: </Text>
                  {new Date(selectedAnnouncement.createdAt).toLocaleString()}
                </Paragraph>
              </Col>
              <Col span={12}>
                <Paragraph>
                  <Text strong style={{ color: '#1890ff' }}>Durum: </Text>
                  <Tag color={selectedAnnouncement.read ? 'default' : 'processing'}>
                    {selectedAnnouncement.read ? 'Okundu' : 'Okunmadı'}
                  </Tag>
                </Paragraph>
              </Col>
            </Row>
          </div>
        )}
      </Modal>

      {/* Mobilde filtre drawer */}
      <Drawer
        title="Filtrele"
        placement="bottom"
        open={filterDrawerOpen}
        onClose={() => setFilterDrawerOpen(false)}
        height={220}
        closeIcon={false}
        styles={{
          body: {
            display: 'flex',
            flexDirection: 'column',
            gap: 16,
            padding: 24,
            borderRadius: '16px 16px 0 0',
          },
        }}
      >
        <Button
          type={filter === 'all' ? 'primary' : 'default'}
          block
          size="large"
          onClick={() => { setFilter('all'); setFilterDrawerOpen(false); }}
        >
          Tümü
        </Button>
        <Button
          type={filter === 'unread' ? 'primary' : 'default'}
          block
          size="large"
          onClick={() => { setFilter('unread'); setFilterDrawerOpen(false); }}
        >
          Okunmamış
        </Button>
        <Button
          type={filter === 'read' ? 'primary' : 'default'}
          block
          size="large"
          onClick={() => { setFilter('read'); setFilterDrawerOpen(false); }}
        >
          Okunmuş
        </Button>
      </Drawer>
    </div>
  );
};

export default AnnouncementsPage; 