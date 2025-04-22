import React, { useState, useEffect } from 'react';
import {
  Layout,
  Typography,
  Row,
  Col,
  Card,
  Divider,
  Space,
  Button,
  Statistic,
} from 'antd';
import { motion } from 'framer-motion';
import { PageContainer } from '@ant-design/pro-layout';
import {
  GlobalOutlined,
  AimOutlined,
  BulbOutlined,
  SafetyOutlined,
  RocketOutlined,
  MessageOutlined,
  CheckCircleOutlined,
  SettingOutlined,
  BarChartOutlined,
  CloudOutlined,
  ToolOutlined,
  RiseOutlined,
  ThunderboltOutlined,
} from '@ant-design/icons';
import { useNavigate } from 'umi';

const { Title, Paragraph, Text } = Typography;

const About: React.FC = () => {
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

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.3,
        delayChildren: 0.2,
      },
    },
  };

  const itemVariants = {
    hidden: { y: 20, opacity: 0 },
    visible: {
      y: 0,
      opacity: 1,
      transition: { duration: 0.8 },
    },
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
          padding: isMobile ? '0 8px' : isTablet ? '0 12px' : '0 16px' 
        }}
      >
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 1 }}
          style={{
            padding: isMobile
              ? '12px 0 10px'
              : isTablet
              ? '20px 0 15px'
              : '60px 0 40px',
            textAlign: 'center',
          }}
        >
          <Title
            level={1}
            style={{
              fontSize: isMobile ? '24px' : isTablet ? '32px' : '52px',
              fontWeight: 700,
              marginBottom: isMobile ? '10px' : isTablet ? '16px' : '24px',
              lineHeight: isMobile ? '1.2' : '1.4'
            }}
          >
            Profesyonel{' '}
            <span style={{ color: '#1890ff' }}>Çözümler</span>
            {!isMobile && ' Sunuyoruz'}
          </Title>
          <Paragraph
            style={{
              fontSize: isMobile ? '13px' : isTablet ? '15px' : '18px',
              color: '#666',
              maxWidth: '800px',
              margin: '0 auto',
              marginBottom: isMobile ? '16px' : isTablet ? '24px' : '40px',
              padding: '0 5px'
            }}
          >
            Endüstriyel süreçlerinizi optimize etmek ve verimliliği artırmak için kapsamlı çözümler.
          </Paragraph>
        </motion.div>

        <Row gutter={[isMobile ? 8 : isTablet ? 12 : 24, isMobile ? 16 : isTablet ? 20 : 48]} style={{ 
          marginBottom: isMobile ? '24px' : isTablet ? '30px' : '60px' 
        }}>
          <Col
            xs={24}
            md={12}
            style={{ display: 'flex', alignItems: 'center' }}
          >
            <motion.div
              initial={{ opacity: 0, x: isMobile ? 0 : -30 }}
              whileInView={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.8 }}
              viewport={{ once: true }}
              style={{ width: '100%' }}
            >
              <div
                style={{
                  borderRadius: isMobile ? '6px' : isTablet ? '8px' : '12px',
                  overflow: 'hidden',
                  boxShadow: isMobile ? '0 2px 10px rgba(0, 0, 0, 0.08)' : '0 4px 20px rgba(0, 0, 0, 0.1)',
                }}
              >
                <img
                  src="https://as2.ftcdn.net/v2/jpg/04/22/04/81/1000_F_422048161_otMI8Z31NrwH7OBnkHeftdqImummrJUW.jpg"
                  alt="Robot kolu"
                  style={{
                    width: '100%',
                    height: isMobile ? '180px' : isTablet ? '220px' : '300px',
                    objectFit: 'cover',
                    display: 'block',
                  }}
                />
              </div>
            </motion.div>
          </Col>
          <Col xs={24} md={12}>
            <motion.div
              initial={{ opacity: 0, x: isMobile ? 0 : 30 }}
              whileInView={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.8 }}
              viewport={{ once: true }}
            >
              <Title level={3} style={{ 
                fontSize: isMobile ? '18px' : isTablet ? '20px' : '24px',
                marginTop: isMobile ? '12px' : isTablet ? '0' : '0',
                marginBottom: isMobile ? '8px' : '12px'
              }}>Uzman Çözümler</Title>
              <Divider
                style={{
                  width: isMobile ? '30px' : isTablet ? '40px' : '60px',
                  margin: isMobile ? '8px 0 12px' : isTablet ? '10px 0 16px' : '16px 0 24px',
                  borderTop: '2px solid #1890ff',
                }}
              />
              <Paragraph
                style={{
                  fontSize: isMobile ? '13px' : isTablet ? '14px' : '16px',
                  marginBottom: isMobile ? '10px' : isTablet ? '14px' : '20px',
                  color: '#666',
                  lineHeight: isMobile ? '1.5' : '1.8',
                }}
              >
                Endüstriyel otomasyon ve süreç kontrolü alanında uzmanlaşmış
                ekibimizle işletmenizin verimliliğini artıracak çözümler
                sunuyoruz. En son teknolojileri kullanarak rekabet avantajı sağlıyoruz.
              </Paragraph>
              <Paragraph
                style={{ 
                  fontSize: isMobile ? '13px' : isTablet ? '14px' : '16px', 
                  color: '#666', 
                  lineHeight: isMobile ? '1.5' : '1.8',
                  marginBottom: isMobile ? '12px' : '16px'
                }}
              >
                Modern endüstrinin zorluklarını anlıyor ve her müşterinin
                benzersiz ihtiyaçlarına göre özelleştirilmiş sistemler tasarlıyoruz.
              </Paragraph>
              <Space 
                direction="vertical" 
                size={isMobile ? 6 : 8} 
                style={{ marginTop: isMobile ? '12px' : '24px' }}
              >
                {[
                  'Özelleştirilmiş endüstriyel çözümler',
                  'Yüksek verimlilik ve performans',
                  'İleri teknoloji entegrasyonu',
                  'Kapsamlı teknik destek',
                ].map((item, index) => (
                  <div
                    key={index}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: isMobile ? '6px' : '10px',
                    }}
                  >
                    <CheckCircleOutlined style={{ color: '#1890ff', fontSize: isMobile ? '14px' : '16px' }} />
                    <Text style={{ fontSize: isMobile ? '13px' : '14px' }}>{item}</Text>
                  </div>
                ))}
              </Space>
            </motion.div>
          </Col>
        </Row>

        <motion.div
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          transition={{ duration: 1 }}
          viewport={{ once: true }}
          style={{
            marginBottom: isMobile ? '24px' : isTablet ? '40px' : '80px',
            background: 'linear-gradient(135deg, #f5f7fa 0%, #e4ecfb 100%)',
            borderRadius: isMobile ? '6px' : isTablet ? '8px' : '12px',
            padding: isMobile ? '16px 12px' : isTablet ? '24px 20px' : '60px 40px',
          }}
        >
          <Row gutter={[isMobile ? 8 : isTablet ? 16 : 32, isMobile ? 8 : isTablet ? 16 : 32]} justify="center">
            <Col xs={24} md={12}>
              <Card
                style={{
                  height: '100%',
                  borderRadius: isMobile ? '6px' : '8px',
                  boxShadow: isMobile ? '0 2px 8px rgba(0, 0, 0, 0.05)' : '0 4px 12px rgba(0, 0, 0, 0.05)',
                  border: 'none',
                }}
                bodyStyle={{ 
                  padding: isMobile ? '12px 16px' : isTablet ? '16px 20px' : '24px'
                }}
                title={
                  <div
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: isMobile ? '8px' : '12px',
                      fontSize: isMobile ? '15px' : '16px',
                    }}
                  >
                    <AimOutlined
                      style={{ color: '#1890ff', fontSize: isMobile ? '18px' : '24px' }}
                    />
                    <span style={{ fontWeight: 600 }}>Misyonumuz</span>
                  </div>
                }
              >
                <Paragraph
                  style={{ 
                    fontSize: isMobile ? '13px' : isTablet ? '14px' : '16px', 
                    color: '#666', 
                    lineHeight: isMobile ? '1.5' : '1.8',
                    margin: 0,
                  }}
                >
                  Endüstriyel süreçleri dönüştürerek müşterilerimizin
                  verimliliğini ve rekabet gücünü artırmak. Sürdürülebilir ve
                  yenilikçi çözümler sunmak için çalışıyoruz.
                </Paragraph>
              </Card>
            </Col>
            <Col xs={24} md={12}>
              <Card
                style={{
                  height: '100%',
                  borderRadius: isMobile ? '6px' : '8px',
                  boxShadow: isMobile ? '0 2px 8px rgba(0, 0, 0, 0.05)' : '0 4px 12px rgba(0, 0, 0, 0.05)',
                  border: 'none',
                }}
                bodyStyle={{ 
                  padding: isMobile ? '12px 16px' : isTablet ? '16px 20px' : '24px'
                }}
                title={
                  <div
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: isMobile ? '8px' : '12px',
                      fontSize: isMobile ? '15px' : '16px',
                    }}
                  >
                    <GlobalOutlined
                      style={{ color: '#1890ff', fontSize: isMobile ? '18px' : '24px' }}
                    />
                    <span style={{ fontWeight: 600 }}>Vizyonumuz</span>
                  </div>
                }
              >
                <Paragraph
                  style={{ 
                    fontSize: isMobile ? '13px' : isTablet ? '14px' : '16px', 
                    color: '#666', 
                    lineHeight: isMobile ? '1.5' : '1.8',
                    margin: 0,
                  }}
                >
                  Endüstriyel otomasyon alanında küresel bir lider olmak ve tüm
                  dünyada endüstriyel dönüşüme öncülük etmek. Daha verimli ve sürdürülebilir
                  bir endüstriyel gelecek yaratmayı hedefliyoruz.
                </Paragraph>
              </Card>
            </Col>
          </Row>
        </motion.div>

        <div style={{ marginBottom: isMobile ? '24px' : isTablet ? '40px' : '80px' }}>
          <div style={{ 
            textAlign: 'center', 
            marginBottom: isMobile ? '16px' : isTablet ? '24px' : '40px' 
          }}>
            <Title level={2} style={{ 
              fontSize: isMobile ? '20px' : isTablet ? '24px' : '32px',
              marginBottom: isMobile ? '8px' : '12px'
            }}>Hizmetlerimiz</Title>
            <Divider
              style={{
                width: isMobile ? '40px' : isTablet ? '60px' : '80px',
                margin: isMobile ? '8px auto 12px' : isTablet ? '10px auto 16px' : '20px auto',
                borderTop: '2px solid #1890ff',
              }}
            />
            <Paragraph
              style={{
                maxWidth: '700px',
                margin: '0 auto',
                color: '#666',
                fontSize: isMobile ? '13px' : isTablet ? '14px' : '16px',
                padding: '0 4px'
              }}
            >
              İşletmenizin ihtiyaçlarına göre özelleştirilmiş endüstriyel çözümler sunuyoruz.
            </Paragraph>
          </div>

          <motion.div
            variants={containerVariants}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
          >
            <Row gutter={[isMobile ? 8 : isTablet ? 16 : 24, isMobile ? 8 : isTablet ? 16 : 24]} justify="center">
              {[
                {
                  title: 'Endüstriyel Otomasyon',
                  description:
                    'Üretim hatlarınızı modernize ederek verimlilik ve kalite artışı sağlıyoruz.',
                  icon: (
                    <SettingOutlined
                      style={{ fontSize: isMobile ? '28px' : '36px', color: '#1890ff' }}
                    />
                  ),
                },
                {
                  title: 'Süreç Optimizasyonu',
                  description:
                    'Mevcut süreçlerinizi analiz ederek iyileştirme fırsatlarını belirliyor ve uyguluyoruz.',
                  icon: (
                    <BarChartOutlined
                      style={{ fontSize: isMobile ? '28px' : '36px', color: '#1890ff' }}
                    />
                  ),
                },
                {
                  title: 'Endüstri 4.0 Çözümleri',
                  description:
                    'IoT ve yapay zeka teknolojileri ile akıllı fabrika dönüşümünüzü gerçekleştiriyoruz.',
                  icon: (
                    <CloudOutlined
                      style={{ fontSize: isMobile ? '28px' : '36px', color: '#1890ff' }}
                    />
                  ),
                },
                {
                  title: 'Bakım ve Destek',
                  description:
                    'Sistemlerinizin sürekli çalışabilirliğini sağlamak için bakım ve destek hizmetleri sunuyoruz.',
                  icon: (
                    <ToolOutlined
                      style={{ fontSize: isMobile ? '28px' : '36px', color: '#1890ff' }}
                    />
                  ),
                },
              ].map((service, index) => (
                <Col
                  xs={12}
                  sm={12}
                  lg={6}
                  key={index}
                  style={{ display: 'flex' }}
                >
                  <motion.div variants={itemVariants} style={{ width: '100%' }}>
                    <Card
                      hoverable
                      style={{
                        height: '100%',
                        borderRadius: isMobile ? '6px' : '8px',
                        textAlign: 'center',
                        padding: isMobile ? '8px' : isTablet ? '12px' : '16px',
                        boxShadow: isMobile ? '0 2px 8px rgba(0, 0, 0, 0.05)' : '0 4px 12px rgba(0, 0, 0, 0.08)',
                      }}
                      bodyStyle={{
                        padding: isMobile ? '8px' : isTablet ? '12px' : '16px',
                      }}
                    >
                      <div style={{ marginBottom: isMobile ? '8px' : '16px' }}>{service.icon}</div>
                      <Title level={4} style={{ 
                        marginBottom: isMobile ? '6px' : '12px',
                        fontSize: isMobile ? '14px' : isTablet ? '16px' : '18px',
                      }}>
                        {service.title}
                      </Title>
                      <Paragraph style={{ 
                        color: '#666', 
                        fontSize: isMobile ? '12px' : '14px',
                        margin: 0,
                        lineHeight: isMobile ? '1.4' : '1.6',
                      }}>
                        {service.description}
                      </Paragraph>
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
          transition={{ duration: 0.8 }}
          viewport={{ once: true }}
          style={{ marginBottom: isMobile ? '24px' : isTablet ? '40px' : '80px' }}
        >
          <div style={{ 
            textAlign: 'center', 
            marginBottom: isMobile ? '16px' : isTablet ? '24px' : '40px' 
          }}>
            <Title level={2} style={{ 
              fontSize: isMobile ? '20px' : isTablet ? '24px' : '32px',
              marginBottom: isMobile ? '8px' : '12px'
            }}>Stratejik Hedeflerimiz</Title>
            <Divider
              style={{
                width: isMobile ? '40px' : isTablet ? '60px' : '80px',
                margin: isMobile ? '8px auto 12px' : isTablet ? '10px auto 16px' : '20px auto',
                borderTop: '2px solid #1890ff',
              }}
            />
            <Paragraph
              style={{
                maxWidth: '700px',
                margin: '0 auto',
                color: '#666',
                fontSize: isMobile ? '13px' : isTablet ? '14px' : '16px',
                padding: '0 4px'
              }}
            >
              Gelecek vizyonumuzu şekillendiren temel hedeflerimiz
            </Paragraph>
          </div>

          <Row gutter={[isMobile ? 8 : isTablet ? 16 : 24, isMobile ? 8 : isTablet ? 16 : 24]}>
            {[
              {
                title: 'Sürdürülebilir Büyüme',
                description: 'Önümüzdeki 5 yıl içinde faaliyet gösterdiğimiz sektörlerde pazar payımızı %30 artırmayı hedefliyoruz.',
                icon: <RiseOutlined style={{ color: '#1890ff', fontSize: isMobile ? '18px' : '24px' }} />
              },
              {
                title: 'İnovasyon Liderliği',
                description: 'Ar-Ge yatırımlarımızı her yıl %20 artırarak endüstriyel otomasyon alanında yenilikçi çözümler geliştiriyoruz.',
                icon: <BulbOutlined style={{ color: '#1890ff', fontSize: isMobile ? '18px' : '24px' }} />
              },
              {
                title: 'Operasyonel Mükemmellik',
                description: 'Tüm süreçlerimizde dijital dönüşümü tamamlayarak verimlilik artışı sağlamayı hedefliyoruz.',
                icon: <SafetyOutlined style={{ color: '#1890ff', fontSize: isMobile ? '18px' : '24px' }} />
              }
            ].map((item, index) => (
              <Col xs={24} md={8} key={index}>
                <Card
                  style={{
                    height: '100%',
                    borderRadius: isMobile ? '6px' : '8px',
                    boxShadow: isMobile ? '0 2px 8px rgba(0, 0, 0, 0.05)' : '0 4px 12px rgba(0, 0, 0, 0.05)',
                  }}
                  bodyStyle={{ 
                    padding: isMobile ? '12px 16px' : isTablet ? '16px' : '24px'
                  }}
                  title={
                    <div
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: isMobile ? '8px' : '12px',
                        fontSize: isMobile ? '14px' : '16px',
                      }}
                    >
                      {item.icon}
                      <span style={{ fontWeight: 600, fontSize: isMobile ? '14px' : '16px' }}>{item.title}</span>
                    </div>
                  }
                >
                  <Paragraph
                    style={{ 
                      fontSize: isMobile ? '13px' : isTablet ? '14px' : '16px', 
                      color: '#666', 
                      lineHeight: isMobile ? '1.5' : '1.8',
                      margin: 0
                    }}
                  >
                    {item.description}
                  </Paragraph>
                </Card>
              </Col>
            ))}
          </Row>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
          viewport={{ once: true }}
          style={{
            marginBottom: isMobile ? '30px' : isTablet ? '40px' : '60px',
            padding: isMobile ? '20px 16px' : isTablet ? '30px 24px' : '60px 40px',
            background: 'linear-gradient(90deg, #1890ff 0%, #096dd9 100%)',
            borderRadius: isMobile ? '6px' : isTablet ? '8px' : '12px',
            textAlign: 'center',
            color: '#fff',
          }}
        >
          <Title level={2} style={{ 
            color: '#fff', 
            marginBottom: isMobile ? '12px' : isTablet ? '16px' : '24px',
            fontSize: isMobile ? '18px' : isTablet ? '22px' : '32px'
          }}>
            İşletmeniz İçin Özel Çözümler
          </Title>
          <Paragraph
            style={{
              fontSize: isMobile ? '13px' : isTablet ? '14px' : '18px',
              marginBottom: isMobile ? '16px' : isTablet ? '20px' : '32px',
              maxWidth: '700px',
              margin: '0 auto',
              padding: '0',
              lineHeight: isMobile ? '1.4' : '1.6'
            }}
          >
            İhtiyaçlarınıza uygun endüstriyel çözümlerimizi keşfedin!
          </Paragraph>
          <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.98 }}>
            <Button
              type="primary"
              size={isMobile ? "middle" : "large"}
              icon={<MessageOutlined />}
              onClick={() => navigate('/contact')}
              style={{
                height: isMobile ? '36px' : isTablet ? '40px' : '48px',
                padding: isMobile ? '0 16px' : isTablet ? '0 24px' : '0 32px',
                fontSize: isMobile ? '13px' : isTablet ? '14px' : '16px',
                borderRadius: isMobile ? '18px' : isTablet ? '20px' : '24px',
                background: '#fff',
                color: '#1890ff',
                border: 'none',
                boxShadow: '0 6px 12px rgba(24, 144, 255, 0.25)',
              }}
            >
              Ücretsiz Danışmanlık Alın
            </Button>
          </motion.div>
        </motion.div>

        <Card style={{ marginBottom: '30px', borderRadius: '12px', boxShadow: '0 4px 16px rgba(0, 0, 0, 0.06)' }}>
          <Row gutter={[24, 24]} align="middle">
            <Col xs={24} md={12}>
              <Title level={3}>MES Akıllı Üretim Teknolojileri</Title>
              <Paragraph style={{ fontSize: '15px', color: '#555', lineHeight: '1.8' }}>
                MES Akıllı Üretim ve Otomasyon Teknolojileri, endüstriyel tesislerin dijital dönüşüm süreçlerini yönetmek, IoT tabanlı telemetri entegrasyonu sağlamak ve üretim yürütme sistemlerini (Manufacturing Execution Systems) tek bir merkezi platformda birleştirmek amacıyla geliştirilmiştir.
              </Paragraph>
              <Paragraph style={{ fontSize: '15px', color: '#555', lineHeight: '1.8' }}>
                Platformumuz; hat verimliliği takibi, dinamik kapasite dengeleme, kestirimci anomali tespiti ve gerçek zamanlı iş emri yönetimi yetenekleriyle üretim sahasından yönetici paneline kadar kesintisiz ve şeffaf bir bilgi akışı sağlar.
              </Paragraph>
            </Col>
            <Col xs={24} md={12}>
              <img 
                src="https://images.unsplash.com/photo-1581091226033-d5c48150dbaa?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=2340&q=80" 
                alt="Akıllı Üretim Tesisi" 
                style={{ width: '100%', height: '260px', objectFit: 'cover', borderRadius: '8px' }} 
              />
            </Col>
          </Row>
        </Card>
      </PageContainer>
    </Layout>
  );
};

export default About;
