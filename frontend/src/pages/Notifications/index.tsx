import React, { useState, useEffect, useMemo } from 'react';
import {
  Button,
  message,
  Modal,
  Typography,
  List,
  Tag,
  Empty,
  Segmented,
  Tooltip,
  Skeleton,
  Row,
  Col,
  Divider,
  Drawer,
  Avatar,
  Space,
  App
} from 'antd';
import {
  CheckCircleOutlined,
  DeleteOutlined,
  InboxOutlined,
  NotificationOutlined,
  ClockCircleOutlined,
  MailOutlined,
  MailTwoTone,
  FilterOutlined,
  InfoCircleOutlined
} from '@ant-design/icons';
import notificationService, { Notification } from '@/services/notificationService';
import { useNavigate } from 'umi';

const { Text, Paragraph, Title } = Typography;

const NotificationsPage: React.FC = () => {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [markingRead, setMarkingRead] = useState<string | null>(null);
  const [filter, setFilter] = useState<'all' | 'unread' | 'read'>('all');
  const [filterDrawerOpen, setFilterDrawerOpen] = useState(false);
  const [selectedNotification, setSelectedNotification] = useState<Notification | null>(null);
  const navigate = useNavigate();
  const { message: appMessage, modal: appModal, notification: appNotification } = App.useApp();

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

  // Fetch notifications
  const fetchNotifications = async () => {
    try {
      setLoading(true);
      const response = await notificationService.getNotifications();
      setNotifications(response);
    } catch (error) {
      appNotification.error({
        message: 'Hata',
        description: 'Bildirimler yüklenirken hata oluştu'
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchNotifications();
  }, []);

  // Filtered notifications
  const filteredNotifications = useMemo(() => {
    switch (filter) {
      case 'unread':
        return notifications.filter(n => !n.read);
      case 'read':
        return notifications.filter(n => n.read);
      default:
        return notifications;
    }
  }, [notifications, filter]);

  // Mark all notifications as read
  const handleMarkAllAsRead = async () => {
    try {
      await notificationService.markAllAsRead();
      appNotification.success({
        message: 'Başarılı',
        description: 'Tüm bildirimler okundu olarak işaretlendi'
      });
      fetchNotifications();
    } catch (error) {
      appNotification.error({
        message: 'Hata',
        description: 'Bildirimler okundu olarak işaretlenirken hata oluştu'
      });
    }
  };

  // Delete all notifications
  const handleDeleteAll = () => {
    appModal.confirm({
      title: 'Tüm Bildirimleri Sil',
      content: 'Tüm bildirimlerinizi silmek istediğinizden emin misiniz?',
      okText: 'Evet',
      cancelText: 'Hayır',
      onOk: async () => {
        try {
          await notificationService.deleteAllNotifications();
          appNotification.success({
            message: 'Başarılı',
            description: 'Tüm bildirimler silindi'
          });
          fetchNotifications();
        } catch (error) {
          appNotification.error({
            message: 'Hata',
            description: 'Bildirimler silinirken hata oluştu'
          });
        }
      }
    });
  };

  // Mark single notification as read
  const handleMarkAsRead = async (id: string) => {
    try {
      setMarkingRead(id);
      await notificationService.markAsRead(id);
      setNotifications(prev =>
        prev.map(n => (n._id === id ? { ...n, read: true } : n))
      );
    } catch (error) {
      appNotification.error({
        message: 'Hata',
        description: 'Bildirim okundu olarak işaretlenirken hata oluştu'
      });
    } finally {
      setMarkingRead(null);
    }
  };

  // Delete single notification
  const handleDeleteNotification = (id: string) => {
    appModal.confirm({
      title: 'Bildirimi Sil',
      content: 'Bu bildirimi silmek istediğinizden emin misiniz?',
      okText: 'Evet',
      cancelText: 'Hayır',
      onOk: async () => {
        try {
          await notificationService.deleteNotification(id);
          appNotification.success({
            message: 'Başarılı',
            description: 'Bildirim silindi'
          });
          fetchNotifications();
        } catch (error) {
          appNotification.error({
            message: 'Hata',
            description: 'Bildirim silinirken hata oluştu'
          });
        }
      }
    });
  };

  // Bildirim detayını aç
  const handleShowFullNotification = (notification: Notification) => {
    if (!notification.read) {
      handleMarkAsRead(notification._id);
    }
    setSelectedNotification(notification);
  };

  // Bildirim detayını kapat
  const handleCloseFullNotification = () => {
    setSelectedNotification(null);
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

  const notificationItemStyle = {
    ...commonTransition,
    ':hover': {
      transform: 'scale(1.02)',
      boxShadow: '0 4px 8px rgba(0,0,0,0.1)'
    }
  };

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
      {loading && <Skeleton active paragraph={{ rows: 5 }} />}
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
            Bildirimler
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
          <Button
            icon={<CheckCircleOutlined />}
            onClick={handleMarkAllAsRead}
            disabled={notifications.length === 0 || notifications.every(n => n.read)}
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
          <Button
            danger
            icon={<DeleteOutlined />}
            onClick={handleDeleteAll}
            disabled={notifications.length === 0}
            style={{
              boxShadow: isMobile ? 'none' : '0 2px 4px rgba(0,0,0,0.05)',
              ...hoverScaleStyle,
              width: '100%',
              maxWidth: isMobile ? '100%' : '200px'
            }}
          >
            Tümünü Sil
          </Button>
        </Col>
      </Row>
      {!loading && filteredNotifications.length === 0 ? (
        <Empty
          description="Henüz bir bildirim bulunmamaktadır"
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
          dataSource={filteredNotifications}
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
                ...notificationItemStyle
              }}
              onClick={() => handleShowFullNotification(item)}
              actions={[
                <Tooltip key="mark-read" title={item.read ? 'Okundu' : 'Okundu İşaretle'}>
                  <Button
                    type={item.read ? 'text' : 'link'}
                    icon={<CheckCircleOutlined />}
                    loading={markingRead === item._id}
                    onClick={(e) => {
                      e.stopPropagation();
                      handleMarkAsRead(item._id);
                    }}
                    disabled={item.read}
                    style={{ color: item.read ? '#999' : '#1890ff' }}
                  >
                    {item.read ? 'Okundu' : 'Okundu İşaretle'}
                  </Button>
                </Tooltip>,
                <Tooltip key="delete" title="Sil">
                  <Button
                    type="text"
                    danger
                    icon={<DeleteOutlined />}
                    onClick={(e) => {
                      e.stopPropagation();
                      handleDeleteNotification(item._id);
                    }}
                  >
                    Sil
                  </Button>
                </Tooltip>
              ]}
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
                    <Tag
                      color={item.read ? 'default' : 'processing'}
                      style={{
                        marginLeft: '8px',
                        opacity: item.read ? 0.7 : 1
                      }}
                    >
                      {item.read ? 'Okundu' : 'Okunmadı'}
                    </Tag>
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
      {/* Full Notification Modal */}
      <Modal
        title={
          <div style={{
            display: 'flex',
            alignItems: 'center',
            color: '#1890ff'
          }}>
            <InfoCircleOutlined style={{ marginRight: 12 }} />
            {selectedNotification?.title}
          </div>
        }
        open={!!selectedNotification}
        onCancel={handleCloseFullNotification}
        footer={[
          selectedNotification?.link && (
            <Button
              key="link"
              type="primary"
              onClick={() => window.open(selectedNotification.link, '_blank')}
            >
              Bağlantıya Git
            </Button>
          ),
          <Button key="close" onClick={handleCloseFullNotification}>
            Kapat
          </Button>
        ]}
      >
        {selectedNotification && (
          <div>
            <Paragraph>
              <Text strong style={{ color: '#1890ff' }}>Başlık: </Text>
              {selectedNotification.title}
            </Paragraph>
            <Divider />
            <Paragraph>
              <Text strong style={{ color: '#1890ff' }}>Mesaj: </Text>
              {selectedNotification.message}
            </Paragraph>
            {selectedNotification.link && (
              <>
                <Divider />
                <Paragraph>
                  <Text strong style={{ color: '#1890ff' }}>Bağlantı: </Text>
                  <a href={selectedNotification.link} target="_blank" rel="noopener noreferrer">
                    {selectedNotification.link}
                  </a>
                </Paragraph>
              </>
            )}
            <Divider />
            <Row gutter={16}>
              <Col span={12}>
                <Paragraph>
                  <Text strong style={{ color: '#1890ff' }}>Tarih: </Text>
                  {new Date(selectedNotification.createdAt).toLocaleString()}
                </Paragraph>
              </Col>
              <Col span={12}>
                <Paragraph>
                  <Text strong style={{ color: '#1890ff' }}>Durum: </Text>
                  <Tag color={selectedNotification.read ? 'default' : 'processing'}>
                    {selectedNotification.read ? 'Okundu' : 'Okunmadı'}
                  </Tag>
                </Paragraph>
              </Col>
            </Row>
          </div>
        )}
      </Modal>
    </div>
  );
};

export default NotificationsPage; 