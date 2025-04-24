import React, { useState, useEffect } from 'react';
import { Layout, Typography, Button, Result, Space, Grid } from 'antd';
import { motion } from 'framer-motion';
import { PageContainer } from '@ant-design/pro-layout';
import { ArrowLeftOutlined, HomeOutlined, AppstoreOutlined } from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';

import Cookies from 'js-cookie';

const { Title, Paragraph } = Typography;
const { useBreakpoint } = Grid;

const NotFound: React.FC = () => {
  const navigate = useNavigate();
  const [isLoggedIn, setIsLoggedIn] = useState<boolean>(false);
  const screens = useBreakpoint();

  useEffect(() => {
    const token = Cookies.get('token');
    setIsLoggedIn(!!token);
  }, []);

  // Kullanıcıyı oturum durumuna göre yönlendir
  const handleRedirect = () => {
    if (isLoggedIn) {
      navigate('/dashboard');
    } else {
      navigate('/');
    }
  };

  return (
    <Layout style={{ background: '#fff', minHeight: '100vh' }}>
      <PageContainer
        header={{
          title: null,
          breadcrumb: {},
        }}
        ghost
        style={{ 
          maxWidth: '1400px', 
          margin: '0 auto', 
          padding: screens.xs ? '0 8px' : '0 16px'
        }}
      >
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
          style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            minHeight: 'calc(100vh - 200px)',
            textAlign: 'center',
            padding: screens.xs ? '16px' : '40px',
          }}
        >
          <Result
            status="404"
            title={<span style={{ fontSize: screens.xs ? '48px' : '72px' }}>404</span>}
            subTitle={
              <Title 
                level={screens.xs ? 4 : 3} 
                style={{ 
                  fontWeight: 500, 
                  marginBottom: screens.xs ? 16 : 24,
                  fontSize: screens.xs ? '18px' : '24px'
                }}
              >
                Üzgünüz, aradığınız sayfa bulunamadı
              </Title>
            }
            extra={
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.5, duration: 0.8 }}
              >
                <Space 
                  direction="vertical" 
                  size={screens.xs ? 'middle' : 'large'}
                  style={{ width: '100%' }}
                >
                  <Paragraph 
                    style={{ 
                      fontSize: screens.xs ? '14px' : '16px',
                      maxWidth: screens.xs ? '300px' : '600px',
                      margin: screens.xs ? '0 auto 16px' : '0 auto 24px',
                      lineHeight: screens.xs ? '1.4' : '1.6'
                    }}
                  >
                    Aradığınız sayfa taşınmış, kaldırılmış veya hiç var olmamış olabilir.
                    Lütfen URL adresini kontrol edin veya önceki sayfaya dönün.
                  </Paragraph>
                  
                  <Space 
                    direction={screens.xs ? 'vertical' : 'horizontal'}
                    size={screens.xs ? 'middle' : 'large'}
                    style={{ width: screens.xs ? '100%' : 'auto' }}
                  >
                    <Button 
                      type="primary" 
                      size={screens.xs ? "large" : "large"}
                      icon={isLoggedIn ? <AppstoreOutlined /> : <HomeOutlined />} 
                      onClick={handleRedirect}
                      style={{
                        height: screens.xs ? '44px' : '48px',
                        width: screens.xs ? '100%' : 'auto',
                        padding: screens.xs ? '0 24px' : '0 24px',
                        fontSize: screens.xs ? '16px' : '16px',
                        borderRadius: screens.xs ? '8px' : '24px',
                        fontWeight: '500'
                      }}
                    >
                      {isLoggedIn ? 'Dashboard\'a Git' : 'Ana Sayfaya Git'}
                    </Button>
                    
                    <Button 
                      type="default" 
                      size={screens.xs ? "large" : "large"}
                      icon={<ArrowLeftOutlined />} 
                      onClick={() => navigate(-1)}
                      style={{
                        height: screens.xs ? '44px' : '48px',
                        width: screens.xs ? '100%' : 'auto',
                        padding: screens.xs ? '0 24px' : '0 24px',
                        fontSize: screens.xs ? '16px' : '16px',
                        borderRadius: screens.xs ? '8px' : '24px',
                        fontWeight: '500'
                      }}
                    >
                      Geri Dön
                    </Button>
                  </Space>
                </Space>
              </motion.div>
            }
          />
        </motion.div>
      </PageContainer>
    </Layout>
  );
};

export default NotFound;
