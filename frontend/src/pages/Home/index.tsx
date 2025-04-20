import React, { useState, useEffect } from 'react';
import { Layout, Typography, Row, Col, Card, Image, Button, Space, Divider } from 'antd';
import { motion } from 'framer-motion';
import { PageContainer } from '@ant-design/pro-layout';
import { PhoneOutlined, RocketOutlined, LineChartOutlined, ToolOutlined, MessageOutlined } from '@ant-design/icons';
import { StatisticCard } from '@ant-design/pro-card';
import { useNavigate } from 'umi';
import { authService } from '@/services/authService';
import Cookies from 'js-cookie';

const { Title, Paragraph } = Typography;
const { Meta } = Card;

const Home: React.FC = () => {
  const [isMobile, setIsMobile] = useState<boolean>(false);
  const [isTablet, setIsTablet] = useState<boolean>(false);
  const navigate = useNavigate();

  useEffect(() => {
    const handleResize = () => {
      setIsMobile(window.innerWidth <= 576);
      setIsTablet(window.innerWidth > 576 && window.innerWidth <= 768);
    };

    handleResize();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  useEffect(() => {
    const checkAuth = async () => {
      const token = Cookies.get('token');
      if (!token) return;

      try {
        await authService.checkAuth();
        navigate('/dashboard', { replace: true });
      } catch (error) {
        Cookies.remove('token');
        Cookies.remove('user');
      }
    };

    checkAuth();
  }, [navigate]);

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: { 
      opacity: 1,
      transition: { 
        staggerChildren: 0.3,
        delayChildren: 0.2
      }
    }
  };
  
  const itemVariants = {
    hidden: { y: 20, opacity: 0 },
    visible: { 
      y: 0, 
      opacity: 1,
      transition: { duration: 0.8 }
    }
  };

  return (
    <Layout style={{ background: '#fff' }}>
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
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 1 }}
          style={{ 
            padding: isMobile ? '20px 0 15px' : isTablet ? '30px 0 20px' : '60px 0 40px', 
            textAlign: 'center' 
          }}
        >
          <Title level={1} style={{ 
            fontSize: isMobile ? '28px' : isTablet ? '36px' : '52px', 
            fontWeight: 700, 
            marginBottom: isMobile ? '16px' : '24px',
            lineHeight: isMobile ? '1.3' : '1.4'
          }}>
            Endüstriyel Sistemler ile <span style={{ color: '#1890ff' }}>Geleceği</span> Şekillendirin
          </Title>
          <Paragraph style={{ 
            fontSize: isMobile ? '14px' : isTablet ? '16px' : '18px', 
            color: '#666', 
            maxWidth: '800px', 
            margin: '0 auto',
            marginBottom: isMobile ? '24px' : '40px',
            padding: '0 5px'
          }}>
            İnovasyon ve verimlilikle üretim süreçlerinizi dönüştürün. Endüstriyel çözümlerimizle işinizi bir adım öne taşıyın.
          </Paragraph>
        </motion.div>

        <div style={{ 
          marginBottom: isMobile ? '30px' : isTablet ? '40px' : '80px' 
        }}>
          <div style={{ 
            textAlign: 'center', 
            marginBottom: isMobile ? '20px' : isTablet ? '25px' : '40px' 
          }}>
            <Title level={2} style={{ 
              fontSize: isMobile ? '24px' : isTablet ? '28px' : '32px'
            }}>
              Hizmetlerimiz
            </Title>
            <Divider style={{ width: '60px', margin: '12px auto', borderTop: '2px solid #1890ff' }} />
          </div>
          
          <motion.div
            variants={containerVariants}
            initial="hidden"
            animate="visible"
          >
            <Row gutter={[isMobile ? 12 : isTablet ? 16 : 24, isMobile ? 12 : isTablet ? 16 : 24]} justify="center">
              {[
                {
                  title: "Otomasyon Çözümleri",
                  description: "Üretim hatlarınızı optimize edin ve daha verimli hale getirin.",
                  image: "https://images.pexels.com/photos/19233057/pexels-photo-19233057/free-photo-of-robotun-araca-parca-yerlestirmesi.jpeg",
                  icon: <RocketOutlined />
                },
                {
                  title: "Veri Analizi",
                  description: "Üretim verilerinizi analiz edin, daha doğru kararlar alın.",
                  image: "https://images.pexels.com/photos/19317897/pexels-photo-19317897/free-photo-of-h-meta-studio-nun-genis-ekrani.jpeg?auto=compress&cs=tinysrgb&w=1260&h=750&dpr=2",
                  icon: <LineChartOutlined />
                },
                {
                  title: "Bakım ve Destek",
                  description: "Kesintisiz üretim için her zaman yanınızdayız. Uzun süreli bakım ve destek.",
                  image: "https://images.pexels.com/photos/257700/pexels-photo-257700.jpeg?auto=compress&cs=tinysrgb&w=1260&h=750&dpr=2",
                  icon: <ToolOutlined />
                },
              ].map((item, index) => (
                <Col xs={24} sm={12} md={8} key={index} style={{ display: 'flex' }}>
                  <motion.div
                    variants={itemVariants}
                    whileHover={{ 
                      y: -10, 
                      transition: { duration: 0.3 }
                    }}
                    style={{ width: '100%' }}
                  >
                    <Card
                      hoverable
                      cover={
                        <div style={{ position: 'relative', height: '220px', overflow: 'hidden' }}>
                          <Image 
                            alt={item.title} 
                            src={item.image} 
                            style={{ 
                              height: '100%', 
                              width: '100%', 
                              objectFit: 'cover' 
                            }} 
                            preview={false}
                          />
                          <div style={{ 
                            position: 'absolute', 
                            top: '15px', 
                            right: '15px', 
                            backgroundColor: '#1890ff', 
                            borderRadius: '50%', 
                            width: '40px', 
                            height: '40px', 
                            display: 'flex', 
                            alignItems: 'center', 
                            justifyContent: 'center', 
                            color: 'white',
                            fontSize: '20px'
                          }}>
                            {item.icon}
                          </div>
                        </div>
                      }
                      style={{
                        borderRadius: '8px',
                        overflow: 'hidden',
                        boxShadow: '0 4px 12px rgba(0, 0, 0, 0.08)',
                        height: '100%',
                        display: 'flex',
                        flexDirection: 'column'
                      }}
                      bodyStyle={{
                        flex: '1 1 auto',
                        display: 'flex',
                        flexDirection: 'column'
                      }}
                    >
                      <Meta
                        title={<span style={{ fontSize: '18px', fontWeight: 600 }}>{item.title}</span>}
                        description={<span style={{ color: '#666' }}>{item.description}</span>}
                        style={{ flex: 1, display: 'flex', flexDirection: 'column' }}
                      />
                    </Card>
                  </motion.div>
                </Col>
              ))}
            </Row>
          </motion.div>
        </div>

        <motion.div
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          transition={{ duration: 1 }}
          viewport={{ once: true }}
          style={{ 
            marginBottom: isMobile ? '40px' : '80px', 
            background: 'linear-gradient(135deg, #f5f7fa 0%, #e4ecfb 100%)', 
            borderRadius: isMobile ? '8px' : '12px', 
            padding: isMobile ? '30px 20px' : isTablet ? '40px 30px' : '60px 40px' 
          }}
        >
          <div style={{ textAlign: 'center', marginBottom: '40px' }}>
            <Title level={2}>Neden Bizi Seçmelisiniz?</Title>
            <Divider style={{ width: '80px', margin: '24px auto', borderTop: '2px solid #1890ff' }} />
          </div>
          
          <Row gutter={[32, 32]} justify="center">
            {[
              { title: "Yüksek Verimlilik", description: "Çözümlerimiz üretim süreçlerinizi daha verimli hale getirir.", icon: <RocketOutlined /> },
              { title: "Otomasyon", description: "Otomasyon sistemlerimizle hata payını azaltın.", icon: <LineChartOutlined /> },
              { title: "Veri Analizi", description: "Verilerinizi anlamlı hale getirerek daha iyi kararlar alın.", icon: <ToolOutlined /> },
            ].map((feature, index) => (
              <Col xs={24} sm={12} md={8} key={index} style={{ display: 'flex' }}>
                <motion.div 
                  whileHover={{ scale: 1.03 }}
                  transition={{ duration: 0.3 }}
                  style={{ width: '100%' }}
                >
                  <Card
                    style={{
                      borderRadius: '8px',
                      boxShadow: '0 4px 12px rgba(0, 0, 0, 0.05)',
                      height: '100%',
                      border: 'none',
                      display: 'flex',
                      flexDirection: 'column'
                    }}
                    bodyStyle={{ 
                      flex: '1 1 auto',
                      display: 'flex',
                      flexDirection: 'column'
                    }}
                  >
                    <Space direction="vertical" size="middle" style={{ 
                      width: '100%', 
                      textAlign: 'center',
                      display: 'flex',
                      flexDirection: 'column',
                      flex: 1
                    }}>
                      <div style={{ 
                        fontSize: '36px', 
                        color: '#1890ff', 
                        marginBottom: '10px' 
                      }}>
                        {feature.icon}
                      </div>
                      <Title level={4} style={{ margin: '0 0 12px' }}>{feature.title}</Title>
                      <Paragraph style={{ margin: 0, color: '#666' }}>{feature.description}</Paragraph>
                    </Space>
                  </Card>
                </motion.div>
              </Col>
            ))}
          </Row>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 50 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
          viewport={{ once: true }}
          style={{
            marginBottom: isMobile ? '40px' : '60px',
            padding: isMobile ? '30px 20px' : isTablet ? '40px 30px' : '60px 40px',
            background: 'linear-gradient(90deg, #1890ff 0%, #096dd9 100%)',
            borderRadius: isMobile ? '8px' : '12px',
            textAlign: 'center',
            color: '#fff',
          }}
        >
          <Title level={2} style={{ 
            color: '#fff', 
            marginBottom: isMobile ? '16px' : '24px',
            fontSize: isMobile ? '24px' : isTablet ? '28px' : '32px'
          }}>Hazır mısınız?</Title>
          <Paragraph style={{ 
            fontSize: isMobile ? '14px' : isTablet ? '16px' : '18px', 
            marginBottom: isMobile ? '20px' : '32px', 
            maxWidth: '700px', 
            margin: '0 auto',
          }}>
            Üretim süreçlerinizi modernize etmek için bizimle iletişime geçin.
          </Paragraph>
          <motion.div
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.98 }}
          >
            <Button 
              type="primary" 
              size={isMobile ? "middle" : "large"} 
              icon={<MessageOutlined />} 
              onClick={() => navigate('/contact')}
              style={{
                height: isMobile ? '40px' : '48px',
                padding: isMobile ? '0 20px' : '0 32px',
                fontSize: isMobile ? '14px' : '16px',
                borderRadius: isMobile ? '20px' : '24px',
                background: '#fff',
                color: '#1890ff',
                border: 'none',
                boxShadow: '0 8px 16px rgba(24, 144, 255, 0.25)',
              }}
            >
              Bizimle İletişime Geçin
            </Button>
          </motion.div>
        </motion.div>
      </PageContainer>
    </Layout>
  );
};

export default Home;
