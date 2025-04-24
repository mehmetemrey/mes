import React, { useState, useEffect } from 'react';
import { Layout, Menu, Button, Drawer } from 'antd';
import { useNavigate, useLocation, Outlet } from 'umi';
import {
  MenuOutlined,
  HomeOutlined,
  InfoCircleOutlined,
  PhoneOutlined,
  LoginOutlined,
} from '@ant-design/icons';
import PublicRoute from '@/components/PublicRoute';

const { Header, Content } = Layout;

const PublicHeader: React.FC = () => {
  const [drawerVisible, setDrawerVisible] = useState<boolean>(false);
  const [isMobile, setIsMobile] = useState<boolean>(false);

  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    const updateIsMobile = () => {
      const newIsMobile = window.innerWidth <= 768;
      setIsMobile(newIsMobile);
      
      if (!newIsMobile && drawerVisible) {
        setDrawerVisible(false);
      }
    };

    updateIsMobile();
    window.addEventListener('resize', updateIsMobile);
    return () => window.removeEventListener('resize', updateIsMobile);
  }, [drawerVisible]); 

  const current: string = location.pathname === '/' ? 'home' : location.pathname.slice(1);

  const showDrawer = (): void => setDrawerVisible(true);
  const closeDrawer = (): void => setDrawerVisible(false);

  const onClick = (e: { key: string }): void => {
    if (e.key === 'home') {
      navigate('/');
    } else {
      navigate(`/${e.key}`);
    }
    closeDrawer();
  };

  const handleLogin = (): void => {
    navigate('/login');
    closeDrawer();
  };

  const menuItems = [
    {
      label: 'Anasayfa',
      key: 'home',
      icon: <HomeOutlined />,
    },
    {
      label: 'Hakkımızda',
      key: 'about',
      icon: <InfoCircleOutlined />,
    },
    {
      label: 'İletişim',
      key: 'contact',
      icon: <PhoneOutlined />,
    },
  ];

  return (
    <PublicRoute>
      <Layout style={{ minHeight: '100vh', background: '#fff' }}>
        <Header style={{ 
          background: '#fff', 
          padding: 0, 
          position: 'sticky', 
          top: 0, 
          zIndex: 1000, 
          display: 'flex', 
          alignItems: 'center', 
          justifyContent: 'space-between',
          borderBottom: '1px solid #f0f0f0',
          boxShadow: '0 2px 8px rgba(0, 0, 0, 0.06)',
          height: isMobile ? '56px' : '64px'
        }}>
          {/* Logo - Sol Tarafta */}
          <div style={{ 
            paddingLeft: isMobile ? 16 : 24
          }}>
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 10,
                cursor: 'pointer',
              }}
              onClick={() => navigate('/')}
            >
              <div style={{
                width: 32,
                height: 32,
                borderRadius: 8,
                background: 'linear-gradient(135deg, #1890ff 0%, #096dd9 100%)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: '#fff',
                fontWeight: 800,
                fontSize: 16,
                boxShadow: '0 2px 6px rgba(24, 144, 255, 0.35)'
              }}>
                M
              </div>
              <span style={{ fontSize: isMobile ? '18px' : '20px', fontWeight: 'bold', color: '#1890ff', letterSpacing: '0.8px' }}>
                MES
              </span>
            </div>
          </div>
          
          {/* Menü - Ortada */}
          {!isMobile && (
            <div style={{ flex: 1, display: 'flex', justifyContent: 'center' }}>
              <Menu
                mode="horizontal"
                selectedKeys={[current]}
                onClick={onClick}
                items={menuItems}
                style={{
                  borderBottom: 'none',
                  flex: 1,
                  justifyContent: 'center',
                }}
              />
            </div>
          )}

          {/* Login Butonu - Sağ Tarafta */}
          <div style={{
            paddingRight: isMobile ? '12px' : '24px',
            display: 'flex',
            alignItems: 'center',
          }}>
            {!isMobile && (
              <Button 
                type="primary" 
                icon={<LoginOutlined />} 
                onClick={handleLogin}
              >
                Giriş Yap
              </Button>
            )}

            {isMobile && (
              <>
                <Button 
                  type="primary"
                  size="small"
                  icon={<LoginOutlined />} 
                  onClick={handleLogin}
                  style={{ marginRight: 8, height: 32, fontSize: 12 }}
                >
                  Giriş
                </Button>
                <Button 
                  type="text" 
                  icon={<MenuOutlined style={{ fontSize: 18 }} />} 
                  onClick={showDrawer}
                  style={{ padding: '4px 8px', height: 32 }}
                />
              </>
            )}
          </div>
        </Header>

        <Drawer
          title="Menü"
          placement="right"
          onClose={closeDrawer}
          open={drawerVisible}
          width={isMobile ? '70%' : 280}
          styles={{ body: { padding: 0 } }}
        >
          <Menu
            mode="vertical"
            selectedKeys={[current]}
            onClick={onClick}
            style={{ borderRight: 'none' }}
            items={menuItems}
          />
          
          <div style={{ padding: '16px' }}>
            <Button 
              type="primary" 
              icon={<LoginOutlined />} 
              onClick={handleLogin}
              style={{ width: '100%' }}
            >
              Giriş Yap
            </Button>
          </div>
        </Drawer>

        <Content style={{ padding: 0, margin: 0 }}>
          <Outlet />
        </Content>
      </Layout>
    </PublicRoute>
  );
};

export default PublicHeader;