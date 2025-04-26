import {
  DashboardOutlined,
  LogoutOutlined,
  UserOutlined,
  BellOutlined,
  TeamOutlined,
  DeploymentUnitOutlined,
  ToolOutlined,
  ScheduleOutlined,
  RadarChartOutlined,
  DeleteOutlined,
  CheckCircleOutlined,
  EyeOutlined,
  MailOutlined,
  SoundOutlined,
  LineChartOutlined,
  NotificationOutlined,
  InfoCircleOutlined,
  BarChartOutlined,
} from '@ant-design/icons';
import { ProLayout } from '@ant-design/pro-components';
import type { MenuDataItem } from '@ant-design/pro-components';
import { ConfigProvider, Dropdown, Avatar, Typography, Badge, Button, theme, App, Modal, notification, Divider, Space } from 'antd';
import React, { useState, useEffect } from 'react';
import { Outlet, useLocation, useNavigate, Link } from 'umi';
import defaultProps from './defaultProps';
import Cookies from 'js-cookie';
import { authService } from '@/services/authService';
import trTR from 'antd/locale/tr_TR';
import notificationService, { Notification } from '@/services/notificationService';
import socketService from '@/services/socketService';
import announcementService, { Announcement } from '@/services/announcementService';
import { LiveDataProvider } from '@/contexts/LiveDataContext';

const { Text } = Typography;
const { useToken } = theme;

type BaseItem = {
  _id: string;
  title: string;
  message: string;
  read: boolean;
  createdAt: string;
  link?: string;
};

type NotificationItem = BaseItem & {
  type: 'notification';
  notificationType: 'info' | 'success' | 'warning' | 'error' | 'announcement';
};

type AnnouncementItem = BaseItem & {
  type: 'announcement';
  notificationType: 'info' | 'success' | 'warning' | 'error';
};

type NotificationListItem = NotificationItem | AnnouncementItem;

const iconMap: Record<string, React.ReactNode> = {
  dashboard: <DashboardOutlined />,
  user: <UserOutlined />,
  team: <TeamOutlined />,
  'deployment-unit': <DeploymentUnitOutlined />,
  tool: <ToolOutlined />,
  schedule: <ScheduleOutlined />,
  'line-chart': <LineChartOutlined />,
  SoundOutlined: <SoundOutlined />,
  mail: <MailOutlined />,
  'bar-chart': <BarChartOutlined />,
};

const MainContent: React.FC = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const [pathname, setPathname] = useState(location.pathname);
  const [collapsed, setCollapsed] = useState(false);
  const [isMobile, setIsMobile] = useState<boolean>(false);
  const [isTablet, setIsTablet] = useState<boolean>(false);
  const [user, setUser] = useState<any>(null);
  const { token } = useToken();
  const { message, modal } = App.useApp();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [announcements, setAnnouncements] = useState<Announcement[]>([]);
  const [notificationCount, setNotificationCount] = useState(0);
  const [announcementCount, setAnnouncementCount] = useState(0);
  const [api, contextHolder] = notification.useNotification();

  useEffect(() => {
    const loadUserData = async () => {
      try {
        const userData = await authService.checkAuth();
        setUser(userData.user);
      } catch (error) {
        console.error('Kullanıcı bilgileri yüklenemedi:', error);
      }
    };

    loadUserData();
  }, []);

  useEffect(() => {
    const handleResize = () => {
      const width = window.innerWidth;
      setIsMobile(width <= 576);
      setIsTablet(width > 576 && width <= 768);
      setCollapsed(width <= 768);
    };

    handleResize();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  useEffect(() => {
    setPathname(location.pathname);
  }, [location.pathname]);

  useEffect(() => {
    const fetchNotificationsAndAnnouncements = async () => {
      try {
        const notificationData = await notificationService.getNotifications();
        const announcementData = await announcementService.getAnnouncements();
        
        setNotifications(notificationData);
        setAnnouncements(announcementData);
        
        setNotificationCount(notificationData.filter(n => !n.read).length);
        setAnnouncementCount(announcementData.filter(a => !a.read).length);
      } catch (error) {
        console.error('Error fetching notifications and announcements:', error);
      }
    };

    fetchNotificationsAndAnnouncements();
  }, []);

  useEffect(() => {
    const userData = JSON.parse(Cookies.get('user') || '{}');
    if (userData.id) {
      socketService.connect(userData.id);
      
      // Subscribe to notification events
      const notificationReceivedUnsub = socketService.subscribe('notification-received', (newNotification: Notification) => {
        setNotifications(prev => [newNotification, ...prev]);
        setNotificationCount(prev => prev + 1);
      });
      
      const notificationUpdatedUnsub = socketService.subscribe('notification-updated', (updatedNotification: Notification) => {
        setNotifications(prev => 
          prev.map(n => n._id === updatedNotification._id ? updatedNotification : n)
        );
      });
      
      const notificationDeletedUnsub = socketService.subscribe('notification-deleted', (deletedId: string) => {
        setNotifications(prev => prev.filter(n => n._id !== deletedId));
        // Update count if needed
        setNotifications(prev => {
          const deletedNotification = prev.find(n => n._id === deletedId);
          if (deletedNotification && !deletedNotification.read) {
            setNotificationCount(count => Math.max(0, count - 1));
          }
          return prev.filter(n => n._id !== deletedId);
        });
      });
      
      const allReadUnsub = socketService.subscribe('notifications-read', () => {
        setNotifications(prev => prev.map(n => ({ ...n, read: true })));
        setNotificationCount(0);
      });
      
      const allDeletedUnsub = socketService.subscribe('notifications-all-deleted', () => {
        setNotifications([]);
        setNotificationCount(0);
      });

      // Subscribe to announcement events
      const announcementReceivedUnsub = socketService.subscribe('announcement', (newAnnouncement: Announcement) => {
        setAnnouncements(prev => [newAnnouncement, ...prev]);
        setAnnouncementCount(prev => prev + 1);
      });
      
      const announcementUpdatedUnsub = socketService.subscribe('announcement-update', (updatedAnnouncement: Announcement) => {
        setAnnouncements(prev => 
          prev.map(a => a._id === updatedAnnouncement._id ? updatedAnnouncement : a)
        );
      });
      
      const announcementDeletedUnsub = socketService.subscribe('announcement-delete', (deletedId: string) => {
        setAnnouncements(prev => prev.filter(a => a._id !== deletedId));
        // Update count if needed
        setAnnouncements(prev => {
          const deletedAnnouncement = prev.find(a => a._id === deletedId);
          if (deletedAnnouncement && !deletedAnnouncement.read) {
            setAnnouncementCount(count => Math.max(0, count - 1));
          }
          return prev.filter(a => a._id !== deletedId);
        });
      });
      
      const allAnnouncementsReadUnsub = socketService.subscribe('announcements-all-read', () => {
        setAnnouncements(prev => prev.map(a => ({ ...a, read: true })));
        setAnnouncementCount(0);
      });
      
      const allAnnouncementsDeletedUnsub = socketService.subscribe('announcements-all-deleted', () => {
        setAnnouncements([]);
        setAnnouncementCount(0);
      });

      // Disconnect when component unmounts
      return () => {
        socketService.disconnect();
        notificationReceivedUnsub();
        notificationUpdatedUnsub();
        notificationDeletedUnsub();
        allReadUnsub();
        allDeletedUnsub();
        announcementReceivedUnsub();
        announcementUpdatedUnsub();
        announcementDeletedUnsub();
        allAnnouncementsReadUnsub();
        allAnnouncementsDeletedUnsub();
      };
    }
  }, []);

  const handleNotificationClick = async (item: NotificationListItem) => {
    if (!item.read) {
      if (item.type === 'notification') {
        await notificationService.markAsRead(item._id);
        setNotifications(notifications.map(n => 
          n._id === item._id ? { ...n, read: true } : n
        ));
        setNotificationCount(prev => Math.max(0, prev - 1));
      } else {
        await announcementService.markAsRead(item._id);
        setAnnouncements(announcements.map(a => 
          a._id === item._id ? { ...a, read: true } : a
        ));
        setAnnouncementCount(prev => Math.max(0, prev - 1));
      }
    }
    if (item.link) {
      navigate(item.link);
    }
  };

  const handleMarkAllAsRead = async () => {
    await notificationService.markAllAsRead();
    setNotifications(notifications.map(n => ({ ...n, read: true })));
    setNotificationCount(0);
  };

  const handleDeleteAll = async () => {
    try {
      modal.confirm({
        title: 'Tüm Bildirimleri Sil',
        content: 'Tüm bildirimlerinizi silmek istediğinizden emin misiniz?',
        okText: 'Evet',
        cancelText: 'Hayır',
        onOk: async () => {
          // Use the new service method instead of deleting one by one
          await notificationService.deleteAllNotifications();
          setNotifications([]);
          setNotificationCount(0);
          message.success('Tüm bildirimler silindi');
        }
      });
    } catch (error) {
      message.error('Bildirimler silinirken bir hata oluştu');
    }
  };

  const handleLogout = () => {
    authService.logout();
    navigate('/login');
    message.success('Başarıyla çıkış yapıldı');
  };

  return (
    <div style={{ height: '100vh', overflow: 'auto', background: '#fff' }}>
      {contextHolder}
      <ProLayout
        {...defaultProps}
        location={{ pathname }}
        title="MES"
        logo={false}
        fixSiderbar
        collapsed={collapsed}
        onCollapse={setCollapsed}
        layout="mix"
        contentWidth="Fluid"
        breakpoint="lg"
        siderMenuType="group"
        navTheme="light"
        siderWidth={240}
        style={{ minHeight: '100vh', border: 'none', background: '#fff' }}
        contentStyle={{ padding: -10, margin: -10, background: '#fff' }}
        bgLayoutImgList={[]}
        token={{
          header: {
            colorBgHeader: '#fff',
            colorHeaderTitle: token.colorTextHeading,
            colorTextMenu: token.colorTextSecondary,
            colorTextMenuSelected: token.colorPrimary,
            colorBgMenuItemSelected: token.colorBgTextHover,
          },
          sider: {
            colorMenuBackground: '#fff',
            colorTextMenu: token.colorTextSecondary,
            colorTextMenuSelected: token.colorPrimary,
            colorTextMenuItemHover: token.colorPrimary,
            colorBgMenuItemHover: token.colorBgTextHover,
            colorBgMenuItemSelected: token.colorBgTextHover,
          },
        }}
        headerTitleRender={() => (
          <div
            onClick={() => navigate('/dashboard')}
            style={{
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: 8,
              padding: '4px 0',
            }}
          >
            <div style={{
              width: 30,
              height: 30,
              borderRadius: 6,
              background: '#1890ff',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#fff',
              fontWeight: 800,
              fontSize: 15,
            }}>
              M
            </div>
            <span style={{ 
              fontSize: 18,
              fontWeight: 700,
              color: '#1890ff',
              letterSpacing: '0.8px',
            }}>
              MES
            </span>
          </div>
        )}
        headerContentRender={() => (
          <div
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              width: '100%',
            }}
          >
          </div>
        )}
        actionsRender={(props) => {
          if (props.isMobile) {
            return [
              <Badge count={notificationCount + announcementCount} dot key="mobile-bell">
                <Button
                  type="text"
                  style={{ fontSize: '20px' }}
                  icon={<BellOutlined />}
                  shape="circle"
                  onClick={() => {
                    api.info({
                      message: 'Bildirimler',
                      description: (
                        <div>
                          {notifications.length === 0
                            ? 'Henüz bildiriminiz bulunmamaktadır.'
                            : notifications.slice(0, 5).map(n => (
                                <div key={n._id} style={{ marginBottom: 8 }}>
                                  <b>{n.title}</b>
                                  <div style={{ fontSize: 12, color: '#666' }}>{n.message}</div>
                                  <div style={{ fontSize: 11, color: '#999' }}>{new Date(n.createdAt).toLocaleString()}</div>
                                  <Divider style={{ margin: '8px 0' }} />
                                </div>
                              ))}
                        </div>
                      ),
                      placement: 'top',
                      duration: 4,
                      style: { width: '100%', maxWidth: 600 },
                    });
                  }}
                />
              </Badge>
            ];
          }
          // Masaüstü için mevcut Dropdown
          return [
            <Dropdown
              key="notification"
              menu={{
                items: [
                  {
                    key: 'notification-header',
                    label: (
                      <div style={{ 
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                        padding: '8px 12px',
                        borderBottom: '1px solid #f0f0f0',
                        fontWeight: 'bold',
                        width: '100%',
                      }}>
                        <span>Bildirimler</span>
                        <div>
                          <Button
                            type="text"
                            size="small"
                            icon={<CheckCircleOutlined />}
                            style={{ marginRight: '8px' }}
                            onClick={() => {
                              notificationService.markAllAsRead();
                              announcementService.markAllAsRead();
                              setNotifications(prev => prev.map(n => ({ ...n, read: true })));
                              setAnnouncements(prev => prev.map(a => ({ ...a, read: true })));
                              setNotificationCount(0);
                              setAnnouncementCount(0);
                            }}
                            disabled={notificationCount + announcementCount === 0}
                          >
                            Tümünü Okundu İşaretle
                          </Button>
                          <Button
                            type="text"
                            size="small"
                            icon={<EyeOutlined />}
                            onClick={() => navigate('/dashboard/notifications')}
                          >
                            Tümünü Görüntüle
                          </Button>
                        </div>
                      </div>
                    ),
                    disabled: true
                  },
                  ...[
                    ...notifications.map(n => ({ 
                      ...n, 
                      type: 'notification' as const,
                      notificationType: n.type
                    })) as NotificationItem[],
                    ...announcements.map(a => ({ 
                      ...a, 
                      type: 'announcement' as const,
                      notificationType: a.type
                    })) as AnnouncementItem[]
                  ]
                    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
                    .slice(0, 10)
                    .map(item => ({
                      key: `${item.type}-${item._id}`,
                      label: (
                        <div 
                          style={{ 
                            padding: '10px 12px',
                            cursor: 'pointer',
                            display: 'flex',
                            justifyContent: 'space-between',
                            alignItems: 'flex-start',
                            gap: '12px',
                            width: '100%',
                            borderRadius: '6px',
                            margin: '2px 0',
                            backgroundColor: item.read ? '#fff' : '#f0f7ff'
                          }}
                        >
                          <div 
                            style={{ 
                              flex: 1, 
                              display: 'flex', 
                              alignItems: 'flex-start', 
                              gap: '10px' 
                            }}
                            onClick={() => {
                              handleNotificationClick(item);
                            }}
                          >
                            <div style={{ marginTop: '2px' }}>
                              {item.type === 'notification' ? (
                                <BellOutlined style={{ color: item.read ? '#8c8c8c' : '#1890ff', fontSize: '16px' }} />
                              ) : (
                                <SoundOutlined style={{ color: item.read ? '#8c8c8c' : '#52c41a', fontSize: '16px' }} />
                              )}
                            </div>
                            <div style={{ flex: 1 }}>
                              <div style={{ 
                                fontWeight: item.read ? 500 : 700, 
                                marginBottom: '2px', 
                                color: item.read ? '#595959' : '#1f1f1f',
                                display: 'flex',
                                alignItems: 'center',
                                gap: '6px'
                              }}>
                                <span>{item.title}</span>
                                {!item.read && <Badge status="processing" />}
                              </div>
                              <div style={{ fontSize: '12px', color: '#666', marginBottom: '2px' }}>
                                {item.message}
                              </div>
                              <div style={{ fontSize: '11px', color: '#999' }}>
                                {new Date(item.createdAt).toLocaleString('tr-TR')}
                              </div>
                            </div>
                          </div>
                          <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                            <Button
                              type="text"
                              danger
                              size="small"
                              icon={<DeleteOutlined />}
                              onClick={(e) => {
                                e.stopPropagation();
                                modal.confirm({
                                  title: item.type === 'notification' ? 'Bildirimi Sil' : 'Duyuruyu Sil',
                                  content: item.type === 'notification' ? 
                                    'Bu bildirimi silmek istediğinizden emin misiniz?' : 
                                    'Bu duyuruyu silmek istediğinizden emin misiniz?',
                                  okText: 'Evet',
                                  cancelText: 'Hayır',
                                  onOk: async () => {
                                    try {
                                      if (item.type === 'notification') {
                                        await notificationService.deleteNotification(item._id);
                                        setNotifications(notifications.filter(n => n._id !== item._id));
                                        if (!item.read) {
                                          setNotificationCount(prev => Math.max(0, prev - 1));
                                        }
                                        message.success('Bildirim silindi');
                                      } else {
                                        await announcementService.deleteAnnouncement(item._id);
                                        setAnnouncements(announcements.filter(a => a._id !== item._id));
                                        if (!item.read) {
                                          setAnnouncementCount(prev => Math.max(0, prev - 1));
                                        }
                                        message.success('Duyuru silindi');
                                      }
                                    } catch (error) {
                                      message.error(item.type === 'notification' ? 
                                        'Bildirim silinirken bir hata oluştu' : 
                                        'Duyuru silinirken bir hata oluştu'
                                      );
                                    }
                                  }
                                });
                              }}
                            />
                          </div>
                        </div>
                      )
                    }))
                ]
              }}
              trigger={['click']}
              dropdownRender={(menu) => (
                <div style={{ 
                  padding: '0',
                  maxHeight: '500px',
                  minWidth: '400px',
                  overflowY: 'auto',
                  backgroundColor: '#fff',
                  boxShadow: '0 3px 6px -4px rgba(0, 0, 0, 0.12), 0 6px 16px 0 rgba(0, 0, 0, 0.08), 0 9px 28px 8px rgba(0, 0, 0, 0.05)',
                  borderRadius: '8px'
                }}>
                  {notifications.length === 0 && announcements.length === 0 ? (
                    <div style={{ 
                      padding: '24px', 
                      textAlign: 'center', 
                      color: '#999' 
                    }}>
                      Henüz bildiriminiz bulunmamaktadır.
                    </div>
                  ) : menu}
                </div>
              )}
            >
              <span style={{ cursor: 'pointer', display: 'inline-flex', alignItems: 'center', padding: '6px' }}>
                <Badge count={notificationCount + announcementCount} dot>
                  <BellOutlined style={{ fontSize: '18px', color: '#262626' }} />
                </Badge>
              </span>
            </Dropdown>
          ];
        }}
        avatarProps={{
          src: "https://gw.alipayobjects.com/zos/antfincdn/efFD%24IOql2/weixintupian_20170331104822.jpg",
          size: "small",
          title: user ? `${user.firstName} ${user.lastName}` : 'Kullanıcı',
          render: (props, dom) => (
            <Dropdown
              menu={{
                items: [
                  {
                    key: 'profile',
                    icon: <UserOutlined />,
                    label: <Link to="/dashboard/profile">Profilim</Link>,
                  },  
                  {
                    type: 'divider',
                  },
                  {
                    key: 'logout',
                    icon: <LogoutOutlined />,
                    label: 'Çıkış Yap',
                    onClick: handleLogout,
                  },
                ],
              }}
            >
              <div style={{
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                cursor: 'pointer',
              }}>
                <Avatar src={props?.src} size={props?.size} style={{ backgroundColor: token.colorPrimary }}>
                  {!props?.src && (user ? user.firstName[0] : 'U')}
                </Avatar>
                {!collapsed && !isMobile && (
                  <div style={{ lineHeight: '1' }}>
                    <Text strong style={{ fontSize: '14px' }}>
                      {user ? `${user.firstName} ${user.lastName}` : 'Kullanıcı'}
                    </Text>
                  </div>
                )}
              </div>
            </Dropdown>
          ),
        }}
        menuItemRender={(item, dom) => {
          return (
            <div
              onClick={() => {
                setPathname(item.path || '/');
                navigate(item.path || '/');
              }}
            >
              {dom}
            </div>
          );
        }}
        menu={{
          request: async () => {
            try {
              const userData = await authService.checkAuth();
              const user = userData.user;
              
              return (defaultProps.route.routes || [])
                .filter(item => {
                  if (typeof item.hideInMenu === 'function') {
                    return !item.hideInMenu(user);
                  }
                  return !item.hideInMenu;
                })
                .map((item) => ({
                  ...item,
                  icon: iconMap[item.icon as string],
                  hideInMenu: false,
                })) as MenuDataItem[];
            } catch (error) {
              console.error('Menü yüklenirken hata:', error);
              return [];
            }
          },
          type: 'group',
          defaultOpenAll: false,
        }}
        menuProps={{
          selectedKeys: [defaultProps.route.routes.find(route => route.path === pathname)?.key || pathname],
          defaultOpenKeys: ['/dashboard'],
        }}
      >
        <div style={{ 
          padding: 0,
          background: '#fff',
          borderRadius: 0,
          minHeight: 'calc(100vh - 56px)',
          margin: 0,
        }}>
          <Outlet />
        </div>
      </ProLayout>
    </div>
  );
};

const DashboardSide: React.FC = () => {
  return (
    <ConfigProvider
      locale={trTR}
      theme={{
        token: {
          colorPrimary: '#1890ff',
          borderRadius: 8,
        },
      }}
    >
      <App>
        <LiveDataProvider>
          <MainContent />
        </LiveDataProvider>
      </App>
    </ConfigProvider>
  );
};

export default DashboardSide;
