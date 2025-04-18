import React, { useState, useEffect } from 'react';
import {
  Layout,
  Typography, 
  Form, 
  Input, 
  Button, 
  message,
  Card,
  Row,
  Col,
  Divider,
  Alert,
  Space
} from 'antd';
import { motion } from 'framer-motion';
import { PageContainer } from '@ant-design/pro-layout';
import { 
  LockOutlined, 
  SafetyOutlined,
  CheckCircleOutlined 
} from '@ant-design/icons';
import { useParams, useNavigate } from 'umi';
import { authService } from '@/services/authService';
import Cookies from 'js-cookie';
import LoadingSpinner from '@/components/LoadingSpinner';

const { Title, Paragraph } = Typography;

const SetPassword: React.FC = () => {
  const [form] = Form.useForm();
  const navigate = useNavigate();
  const { token } = useParams<{ token: string }>();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isMobile, setIsMobile] = useState<boolean>(false);
  const [isTablet, setIsTablet] = useState<boolean>(false);
  const [messageApi, contextHolder] = message.useMessage();

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
    if (!token) {
      setError('Geçersiz veya eksik şifre sıfırlama token\'ı.');
    }
  }, [token]);

  const onFinish = async (values: { password: string; confirmPassword: string }) => {
    if (values.password !== values.confirmPassword) {
      messageApi.error('Şifreler eşleşmiyor');
      return;
    }

    try {
      setLoading(true);
      const response = await authService.setupPassword(token!, values.password);
      messageApi.success('Şifreniz başarıyla oluşturuldu');

      // Token ve user cookie kayıt ayarları
      const cookieOpts: Cookies.CookieAttributes = {
        expires: 7,
        sameSite: 'strict' as const,
        ...(window.location.protocol === 'https:' ? { secure: true } : {})
      };

      // Token'ı cookie'ye kaydet
      Cookies.set('token', response.token, cookieOpts);
      
      // Kullanıcı bilgilerini cookie'ye kaydet
      if (response.user) {
        Cookies.set('user', JSON.stringify(response.user), cookieOpts);
      }

      // Ana sayfaya yönlendir
      setTimeout(() => {
        navigate('/dashboard', { replace: true });
      }, 1000);
    } catch (error: any) {
      messageApi.error(error.response?.data?.message || 'Şifre oluşturulurken bir hata oluştu');
    } finally {
      setLoading(false);
    }
  };

  if (!token) {
    return (
      <Layout style={{ background: '#fff', minHeight: '100vh' }}>
        <PageContainer
          header={{
            title: null,
            breadcrumb: {},
          }}
          ghost
          style={{ maxWidth: '1400px', margin: '0 auto', padding: '0 16px' }}
        >
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 1 }}
            style={{
              padding: isMobile
                ? '30px 0 20px'
                : isTablet
                ? '40px 0 30px'
                : '60px 0 40px',
              textAlign: 'center',
            }}
          >
            <Title
              level={2}
              style={{
                fontSize: isMobile ? '28px' : isTablet ? '36px' : '48px',
                fontWeight: 700,
                marginBottom: '24px',
              }}
            >
              <span style={{ color: '#ff4d4f' }}>Geçersiz</span> Bağlantı
            </Title>
            <Paragraph
              style={{
                fontSize: isMobile ? '16px' : isTablet ? '17px' : '18px',
                color: '#666',
                maxWidth: '600px',
                margin: '0 auto 30px',
              }}
            >
              Şifre oluşturma bağlantısı geçersiz veya süresi dolmuş.
            </Paragraph>
            <Button 
              type="primary" 
              size={isMobile ? "middle" : "large"}
              onClick={() => navigate('/login')}
              style={{
                height: isMobile ? '40px' : '48px',
                padding: '0 32px',
                fontSize: isMobile ? '14px' : '16px',
                borderRadius: '24px',
              }}
            >
              Giriş Sayfasına Dön
            </Button>
          </motion.div>
        </PageContainer>
      </Layout>
    );
  }

  return (
    <Layout style={{ background: '#fff', minHeight: '100vh' }}>
      {contextHolder}
      <LoadingSpinner loading={loading} />
      <PageContainer
        header={{
          title: null,
          breadcrumb: {},
        }}
        ghost
        style={{ maxWidth: '1400px', margin: '0 auto', padding: '0 16px' }}
      >
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 1 }}
          style={{
            padding: isMobile
              ? '30px 0 20px'
              : isTablet
              ? '40px 0 30px'
              : '60px 0 40px',
            textAlign: 'center',
          }}
        >
          <Title
            level={2}
            style={{
              fontSize: isMobile ? '32px' : isTablet ? '40px' : '52px',
              fontWeight: 700,
              marginBottom: '24px',
            }}
          >
            <span style={{ color: '#1890ff' }}>Şifre</span> Oluştur
          </Title>
          <Paragraph
            style={{
              fontSize: isMobile ? '16px' : isTablet ? '17px' : '18px',
              color: '#666',
              maxWidth: '800px',
              margin: '0 auto 40px',
              padding: '0 15px',
            }}
          >
            Hesabınıza erişim için yeni bir şifre oluşturun.
          </Paragraph>
        </motion.div>

        <Row justify="center" style={{ marginBottom: '80px' }}>
        <Col 
            xs={24} 
            sm={24} 
            md={24} 
            lg={24} 
            xl={24}
            xxl={24}
            style={{
              padding: isMobile ? '0 16px' : '0 24px',
              maxWidth: '1400px'
            }}
          >
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8 }}
            >
              <Card
                style={{
                  borderRadius: '12px',
                  boxShadow: '0 4px 20px rgba(0, 0, 0, 0.1)',
                  width: '100%'
                }}
              >
                <Title level={3} style={{ textAlign: 'center' }}>
                  Güvenli Şifre Oluştur
                </Title>
                <Divider
                  style={{
                    width: '60px',
                    margin: '16px auto 24px',
                    borderTop: '2px solid #1890ff',
                  }}
                />

                {error && (
                  <Alert
                    message="Hata"
                    description={error}
                    type="error"
                    showIcon
                    style={{ marginBottom: '24px' }}
                  />
                )}

                <Form
                  form={form}
                  layout="vertical"
                  onFinish={onFinish}
                  requiredMark={false}
                >
                  <Form.Item
                    name="password"
                    label="Şifre"
                    rules={[
                      { required: true, message: 'Lütfen bir şifre girin' }
                    ]}
                  >
                    <Input.Password
                      prefix={<LockOutlined style={{ color: 'rgba(0,0,0,.25)' }} />}
                      placeholder="Şifre"
                      size="large"
                    />
                  </Form.Item>

                  <Form.Item
                    name="confirmPassword"
                    label="Şifreyi Onaylayın"
                    dependencies={['password']}
                    rules={[
                      { required: true, message: 'Lütfen şifrenizi onaylayın' },
                      ({ getFieldValue }) => ({
                        validator(_, value) {
                          if (!value || getFieldValue('password') === value) {
                            return Promise.resolve();
                          }
                          return Promise.reject(new Error('Girdiğiniz şifreler eşleşmiyor!'));
                        },
                      }),
                    ]}
                  >
                    <Input.Password
                      prefix={<LockOutlined style={{ color: 'rgba(0,0,0,.25)' }} />}
                      placeholder="Şifreyi Tekrar Girin"
                      size="large"
                    />
                  </Form.Item>

                  <Form.Item style={{ marginTop: '24px' }}>
                    <Button
                      type="primary"
                      htmlType="submit"
                      size="large"
                      block
                      icon={<CheckCircleOutlined />}
                      loading={loading}
                    >
                      Şifremi Oluştur ve Giriş Yap
                    </Button>
                  </Form.Item>
                </Form>
              </Card>
            </motion.div>
          </Col>
        </Row>

        <motion.div
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          transition={{ duration: 0.8 }}
          viewport={{ once: true }}
          style={{ marginBottom: '60px' }}
        >
          <Row gutter={[24, 24]} justify="center">
            <Col xs={24} sm={12}>
              <motion.div
                whileHover={{ y: -5 }}
                style={{ height: '100%' }}
              >
                <Card
                  style={{
                    height: '100%',
                    textAlign: 'center',
                    borderRadius: '8px',
                    boxShadow: '0 4px 12px rgba(0, 0, 0, 0.05)',
                  }}
                >
                  <SafetyOutlined style={{ fontSize: '36px', color: '#1890ff', marginBottom: '16px' }} />
                  <Title level={4}>Güvenli Erişim</Title>
                  <Paragraph style={{ color: '#666' }}>
                    Şifrenizi oluşturduktan sonra hesabınıza güvenli bir şekilde erişebilirsiniz.
                  </Paragraph>
                </Card>
              </motion.div>
            </Col>
          </Row>
        </motion.div>
      </PageContainer>
    </Layout>
  );
};

export default SetPassword;