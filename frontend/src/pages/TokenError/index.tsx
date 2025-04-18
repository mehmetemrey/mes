import React, { useState, useEffect } from 'react';
import { Layout, Typography, Button, Result, Space } from 'antd';
import { motion } from 'framer-motion';
import { PageContainer } from '@ant-design/pro-layout';
import { ArrowLeftOutlined, HomeOutlined, LockOutlined } from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';

const { Title, Paragraph } = Typography;

const TokenError: React.FC = () => {
  const navigate = useNavigate();
  const [isMobile, setIsMobile] = useState<boolean>(false);
  const [isTablet, setIsTablet] = useState<boolean>(false);

  // Ekran boyutunu izle
  useEffect(() => {
    const handleResize = () => {
      setIsMobile(window.innerWidth <= 576);
      setIsTablet(window.innerWidth > 576 && window.innerWidth <= 768);
    };

    handleResize();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

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
          padding: isMobile ? '0 12px' : '0 16px' 
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
            padding: isMobile ? '20px' : '40px',
          }}
        >
          <Result
            status="error"
            title="Geçersiz veya Süresi Dolmuş Bağlantı"
            subTitle={
              <Title level={3} style={{ fontWeight: 500, marginBottom: 24 }}>
                Bu bağlantı artık geçerli değil
              </Title>
            }
            icon={<LockOutlined style={{ color: '#ff4d4f' }} />}
            extra={
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.5, duration: 0.8 }}
              >
                <Space direction="vertical" size="large">
                  <Paragraph 
                    style={{ 
                      fontSize: isMobile ? '14px' : '16px',
                      maxWidth: '600px',
                      margin: '0 auto 24px'
                    }}
                  >
                    Bu bağlantı daha önce kullanılmış veya süresi dolmuş olabilir.
                    Lütfen yeni bir bağlantı talep edin veya giriş sayfasına dönün.
                  </Paragraph>
                  
                  <Space>
                    <Button 
                      type="primary" 
                      size={isMobile ? "middle" : "large"}
                      icon={<HomeOutlined />} 
                      onClick={() => navigate('/login')}
                      style={{
                        height: isMobile ? '40px' : '48px',
                        padding: isMobile ? '0 16px' : '0 24px',
                        fontSize: isMobile ? '14px' : '16px',
                        borderRadius: '24px',
                      }}
                    >
                      Giriş Sayfasına Dön
                    </Button>
                    
                    <Button 
                      type="default" 
                      size={isMobile ? "middle" : "large"}
                      icon={<ArrowLeftOutlined />} 
                      onClick={() => navigate(-1)}
                      style={{
                        height: isMobile ? '40px' : '48px',
                        padding: isMobile ? '0 16px' : '0 24px',
                        fontSize: isMobile ? '14px' : '16px',
                        borderRadius: '24px',
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

export default TokenError; 