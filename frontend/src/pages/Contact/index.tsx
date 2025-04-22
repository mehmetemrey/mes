import React, { useState, useEffect } from 'react';
import {
  Layout,
  Typography,
  Row,
  Col,
  Card,
  Form,
  Input,
  Button,
  Divider,
  Space,
  Select,
  message,
} from 'antd';
import { motion } from 'framer-motion';
import { PageContainer } from '@ant-design/pro-layout';
import {
  MailOutlined,
  PhoneOutlined,
  EnvironmentOutlined,
  MessageOutlined,
  SendOutlined,
  UserOutlined,
  QuestionCircleOutlined,
  ClockCircleOutlined,
} from '@ant-design/icons';
import { useNavigate } from 'umi';
import { authService } from '@/services/authService';
import { contactService, ContactFormData } from '@/services/contactService';
import Cookies from 'js-cookie';

const { Title, Paragraph, Text } = Typography;
const { TextArea } = Input;
const { Option } = Select;

const Contact: React.FC = () => {
  const [form] = Form.useForm();
  const [isMobile, setIsMobile] = useState<boolean>(false);
  const [isTablet, setIsTablet] = useState<boolean>(false);
  const [submitLoading, setSubmitLoading] = useState<boolean>(false);
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

  const onFinish = async (values: ContactFormData) => {
    setSubmitLoading(true);
    
    try {
      await contactService.submitContactForm(values);
      message.success('Mesajınız başarıyla gönderildi. En kısa sürede size dönüş yapacağız.');
      form.resetFields();
    } catch (error: any) {
      message.error(error.message || 'Mesajınız gönderilirken bir hata oluştu. Lütfen tekrar deneyin.');
    } finally {
      setSubmitLoading(false);
    }
  };

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
          padding: isMobile ? '0 12px' : '0 16px' 
        }}
      >
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 1 }}
          style={{
            padding: isMobile
              ? '20px 0 15px'
              : isTablet
              ? '30px 0 20px'
              : '60px 0 40px',
            textAlign: 'center',
          }}
        >
          <Title
            level={1}
            style={{
              fontSize: isMobile ? '28px' : isTablet ? '36px' : '52px',
              fontWeight: 700,
              marginBottom: isMobile ? '16px' : '24px',
              lineHeight: isMobile ? '1.3' : '1.4'
            }}
          >
            <span style={{ color: '#1890ff' }}>İletişime</span> Geçin
          </Title>
          <Paragraph
            style={{
              fontSize: isMobile ? '14px' : isTablet ? '16px' : '18px',
              color: '#666',
              maxWidth: '1400px',
              margin: '0 auto',
              marginBottom: isMobile ? '24px' : '40px',
              padding: '0 5px'
            }}
          >
            Projeleriniz veya sorularınız için bizimle iletişime geçin. Endüstriyel çözümlerimiz hakkında bilgi almak için formu doldurun veya doğrudan arayın.
          </Paragraph>
        </motion.div>

        <Row gutter={[isMobile ? 16 : 32, isMobile ? 24 : 40]} style={{ 
          marginBottom: isMobile ? '40px' : '80px' 
        }}>
          <Col xs={24} lg={10} style={{ display: 'flex', flexDirection: 'column' }}>
            <motion.div
              initial={{ opacity: 0, x: isMobile ? 0 : -30 }}
              whileInView={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.8 }}
              viewport={{ once: true }}
              style={{ height: '100%' }}
            >
              <Card
                style={{
                  height: '100%',
                  borderRadius: isMobile ? '8px' : '12px',
                  boxShadow: '0 4px 20px rgba(0, 0, 0, 0.1)',
                  padding: isMobile ? '5px' : '10px'
                }}
                styles={{
                  body: {
                    padding: isMobile ? '15px 15px' : '20px 30px'
                  }
                }}
              >
                <Title level={3} style={{ 
                  fontSize: isMobile ? '20px' : isTablet ? '22px' : '24px' 
                }}>İletişim Bilgilerimiz</Title>
                <Divider
                  style={{
                    width: isMobile ? '60px' : '100px',
                    margin: isMobile ? '12px 0 24px' : '16px 0 32px',
                    borderTop: '2px solid #1890ff',
                  }}
                />

                <Space direction="vertical" size={isMobile ? 16 : 24} style={{ width: '100%' }}>
                  <div>
                    <Space align="start" size={isMobile ? 12 : 16}>
                      <EnvironmentOutlined
                        style={{ fontSize: isMobile ? '22px' : '28px', color: '#1890ff' }}
                      />
                      <div>
                        <Text strong style={{ display: 'block', fontSize: isMobile ? '16px' : '18px' }}>
                          Adres
                        </Text>
                        <Paragraph style={{ margin: '4px 0 0', fontSize: isMobile ? '14px' : '16px' }}>
                          Teknoloji Geliştirme Bölgesi, Sanayi Cad. No: 42/B
                          <br />
                          Organize Sanayi Bölgesi, 34000 İstanbul
                        </Paragraph>
                      </div>
                    </Space>
                  </div>

                  <div>
                    <Space align="start" size={isMobile ? 12 : 16}>
                      <PhoneOutlined
                        style={{ fontSize: isMobile ? '22px' : '28px', color: '#1890ff' }}
                      />
                      <div>
                        <Text strong style={{ display: 'block', fontSize: isMobile ? '16px' : '18px' }}>
                          Telefon
                        </Text>
                        <Paragraph style={{ margin: '4px 0 0', fontSize: isMobile ? '14px' : '16px' }}>
                          +90 (850) 555 0199
                          <br />
                          +90 (216) 555 0100
                        </Paragraph>
                      </div>
                    </Space>
                  </div>

                  <div>
                    <Space align="start" size={isMobile ? 12 : 16}>
                      <MailOutlined
                        style={{ fontSize: isMobile ? '22px' : '28px', color: '#1890ff' }}
                      />
                      <div>
                        <Text strong style={{ display: 'block', fontSize: isMobile ? '16px' : '18px' }}>
                          Email
                        </Text>
                        <Paragraph style={{ margin: '4px 0 0', fontSize: isMobile ? '14px' : '16px' }}>
                          iletisim@mes-sistemleri.com
                          <br />
                          destek@mes-sistemleri.com
                        </Paragraph>
                      </div>
                    </Space>
                  </div>

                  <div>
                    <Space align="start" size={isMobile ? 12 : 16}>
                      <ClockCircleOutlined
                        style={{ fontSize: isMobile ? '22px' : '28px', color: '#1890ff' }}
                      />
                      <div>
                        <Text strong style={{ display: 'block', fontSize: isMobile ? '16px' : '18px' }}>
                          Çalışma Saatleri
                        </Text>
                        <Paragraph style={{ margin: '4px 0 0', fontSize: isMobile ? '14px' : '16px' }}>
                          Pazartesi - Cuma: 09:00 - 18:00
                          <br />
                          Cumartesi: 09:00 - 13:00
                        </Paragraph>
                      </div>
                    </Space>
                  </div>
                </Space>
              </Card>
            </motion.div>
          </Col>

          <Col xs={24} lg={14}>
            <motion.div
              initial={{ opacity: 0, x: isMobile ? 0 : 30 }}
              whileInView={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.8 }}
              viewport={{ once: true }}
            >
              <Card
                style={{
                  borderRadius: isMobile ? '8px' : '12px',
                  boxShadow: '0 4px 20px rgba(0, 0, 0, 0.1)',
                  width: '100%',
                }}
                styles={{
                  body: {
                    padding: isMobile ? '15px 15px' : '24px'
                  }
                }}
              >
                <Title level={3} style={{ 
                  fontSize: isMobile ? '20px' : isTablet ? '22px' : '24px' 
                }}>Bize Yazın</Title>
                <Divider
                  style={{
                    width: isMobile ? '40px' : '60px',
                    margin: isMobile ? '12px 0 20px' : '16px 0 24px',
                    borderTop: '2px solid #1890ff',
                  }}
                />
                
                <Form
                  form={form}
                  name="contact"
                  onFinish={onFinish}
                  layout="vertical"
                  requiredMark={false}
                >
                  <Form.Item
                    name="name"
                    label="Adınız Soyadınız"
                    rules={[{ required: true, message: 'Lütfen adınızı ve soyadınızı girin' }]}
                  >
                    <Input
                      prefix={<UserOutlined />}
                      placeholder="Adınız Soyadınız"
                      size={isMobile ? 'middle' : 'large'}
                    />
                  </Form.Item>

                  <Form.Item
                    name="email"
                    label="E-posta Adresiniz"
                    rules={[
                      { required: true, message: 'Lütfen e-posta adresinizi girin' },
                      { type: 'email', message: 'Geçerli bir e-posta adresi girin' }
                    ]}
                  >
                    <Input
                      prefix={<MailOutlined />}
                      placeholder="ornek@email.com"
                      size={isMobile ? 'middle' : 'large'}
                    />
                  </Form.Item>

                  <Form.Item
                    name="phone"
                    label="Telefon Numaranız"
                    rules={[
                      { required: true, message: 'Lütfen telefon numaranızı girin' },
                      { pattern: /^[0-9+\s()-]{10,}$/, message: 'Geçerli bir telefon numarası girin' }
                    ]}
                  >
                    <Input
                      prefix={<PhoneOutlined />}
                      placeholder="+90 (5XX) XXX XX XX"
                      size={isMobile ? 'middle' : 'large'}
                    />
                  </Form.Item>

                  <Form.Item
                    name="subject"
                    label="Konu"
                    rules={[{ required: true, message: 'Lütfen bir konu seçin' }]}
                  >
                    <Select
                      placeholder="Konu seçin"
                      size={isMobile ? 'middle' : 'large'}
                    >
                      <Option value="genel">Genel Bilgi</Option>
                      <Option value="teklif">Teklif Talebi</Option>
                      <Option value="destek">Teknik Destek</Option>
                      <Option value="sikayet">Şikayet/Öneri</Option>
                      <Option value="diger">Diğer</Option>
                    </Select>
                  </Form.Item>

                  <Form.Item
                    name="message"
                    label="Mesajınız"
                    rules={[{ required: true, message: 'Lütfen mesajınızı girin' }]}
                  >
                    <TextArea
                      placeholder="Mesajınızı buraya yazın..."
                      autoSize={{ minRows: 4, maxRows: 8 }}
                      size={isMobile ? 'middle' : 'large'}
                    />
                  </Form.Item>

                  <Form.Item>
                    <Button
                      type="primary"
                      htmlType="submit"
                      icon={<SendOutlined />}
                      size={isMobile ? 'middle' : 'large'}
                      loading={submitLoading}
                      block
                    >
                      Gönder
                    </Button>
                  </Form.Item>
                </Form>
              </Card>
            </motion.div>
          </Col>
        </Row>

        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
          viewport={{ once: true }}
          style={{ marginBottom: isMobile ? '40px' : '80px' }}
        >
          <div style={{ 
            textAlign: 'center', 
            marginBottom: isMobile ? '20px' : '40px' 
          }}>
            <Title level={2} style={{ 
              fontSize: isMobile ? '24px' : isTablet ? '28px' : '32px'
            }}>Bizi Ziyaret Edin</Title>
            <Divider style={{ 
              width: isMobile ? '60px' : '80px', 
              margin: isMobile ? '12px auto' : '20px auto', 
              borderTop: '2px solid #1890ff' 
            }} />
          </div>
          <Card
            style={{
              borderRadius: isMobile ? '8px' : '12px',
              overflow: 'hidden',
              boxShadow: '0 4px 20px rgba(0, 0, 0, 0.1)',
            }}
            styles={{
              body: { padding: 0 }
            }}
          >
            <iframe
              src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d24082.72390214695!2d28.805822!3d41.068224!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x14caa53995f5195b%3A0xe5a3637172b0b182!2zxLBzdGFuYnVsIE9yZ2FuaXplIFNhbmF5aSBCw7ZssXRlc2k!5e0!3m2!1str!2str!4v1700000000000!5m2!1str!2str"
              width="100%"
              height={isMobile ? "300" : "500"}
              style={{ border: 0 }}
              allowFullScreen
              loading="lazy"
              referrerPolicy="no-referrer-when-downgrade"
              title="Şirket Konumumuz"
            ></iframe>
          </Card>
        </motion.div>        
      </PageContainer>
    </Layout>
  );
};

export default Contact;
