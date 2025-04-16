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
  Checkbox,
  Divider,
  message,
  Alert,
} from 'antd';
import { motion } from 'framer-motion';
import { PageContainer } from '@ant-design/pro-layout';
import {
  UserOutlined,
  LockOutlined,
  LoginOutlined,
  SafetyOutlined,
} from '@ant-design/icons';
import { Link, useNavigate } from 'umi';
import { authService } from '@/services/authService';
import styles from './index.less';
import Cookies from 'js-cookie';

const { Title, Paragraph, Text } = Typography;

const Login: React.FC = () => {
  
  const [form] = Form.useForm();
  const [isMobile, setIsMobile] = useState<boolean>(false);
  const [isTablet, setIsTablet] = useState<boolean>(false);
  const [loginLoading, setLoginLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [messageApi, contextHolder] = message.useMessage();
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

  const onFinish = async (values: any) => {
    setLoginLoading(true);
    setError(null);
    
    try {
      const response = await authService.login({
        email: values.email,
        password: values.password
      });
      
      messageApi.success(response.message || 'Giriş başarılı!');
      
      const cookieOpts: Cookies.CookieAttributes = {
        expires: 7,
        sameSite: 'strict' as const,
        ...(window.location.protocol === 'https:' ? { secure: true } : {})
      };
      
      Cookies.set('token', response.data.token, cookieOpts);
      Cookies.set('user', JSON.stringify(response.data.user), cookieOpts);
      
      setTimeout(() => {
        navigate('/dashboard', { replace: true });
      }, 100);
    } catch (error: any) {
      setError(error.message);
    } finally {
      setLoginLoading(false);
    }
  };

  return (
    <>
      {contextHolder}
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
                fontSize: isMobile ? '32px' : isTablet ? '40px' : '52px',
                fontWeight: 700,
                marginBottom: '24px',
              }}
            >
              <span style={{ color: '#1890ff' }}>Giriş</span> Yapın
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
              Hesabınıza giriş yaparak endüstriyel çözümlere erişin ve projelerinizi yönetin.
            </Paragraph>
          </motion.div>

          <Row justify="center" style={{ marginBottom: '80px' }}>
            <Col xs={24} sm={20} md={16} lg={12} xl={10}>
              <motion.div
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.8 }}
              >
                <Card
                  style={{
                    borderRadius: '12px',
                    boxShadow: '0 4px 20px rgba(0, 0, 0, 0.1)',
                  }}
                >
                  <Title level={3} style={{ textAlign: 'center' }}>Kullanıcı Girişi</Title>
                  <Divider
                    style={{
                      width: '60px',
                      margin: '16px auto 24px',
                      borderTop: '2px solid #1890ff',
                    }}
                  />
                  
                  {error && (
                    <Alert
                      message="Error"
                      description={error}
                      type="error"
                      showIcon
                      className={styles.alert}
                    />
                  )}
                  
                  <Form
                    form={form}
                    name="login"
                    layout="vertical"
                    onFinish={onFinish}
                    onFinishFailed={() => {
                      messageApi.error('Lütfen form alanlarını doğru şekilde doldurun.');
                    }}
                    initialValues={{ remember: true }}
                    autoComplete="off"
                  >
                    <Form.Item
                      name="email"
                      rules={[
                        { required: true, message: 'Lütfen e-posta adresinizi girin' },
                        { type: 'email', message: 'Geçerli bir e-posta adresi girin' }
                      ]}
                    >
                      <Input 
                        prefix={<UserOutlined style={{ color: 'rgba(0,0,0,.25)' }} />} 
                        placeholder="E-posta" 
                        size="large" 
                      />
                    </Form.Item>

                    <Form.Item
                      name="password"
                      rules={[{ required: true, message: 'Lütfen şifrenizi girin' }]}
                    >
                      <Input.Password
                        prefix={<LockOutlined style={{ color: 'rgba(0,0,0,.25)' }} />}
                        placeholder="Şifre"
                        size="large"
                      />
                    </Form.Item>

                    <Form.Item>
                      <Row justify="space-between">
                        <Col>
                          <Form.Item name="remember" valuePropName="checked" noStyle>
                            <Checkbox>Beni hatırla</Checkbox>
                          </Form.Item>
                        </Col>
                        <Col>
                          <Link to="/forgot-password">Şifremi unuttum</Link>
                        </Col>
                      </Row>
                    </Form.Item>

                    <Form.Item>
                      <Button
                        type="primary"
                        htmlType="submit"
                        size="large"
                        block
                        icon={<LoginOutlined />}
                        loading={loginLoading}
                      >
                        Giriş Yap
                      </Button>
                    </Form.Item>
                    <Divider style={{ margin: '24px 0' }} />
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
              <Col xs={24} sm={12} md={8}>
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
                      Gelişmiş güvenlik protokolleriyle verileriniz her zaman korunur.
                    </Paragraph>
                  </Card>
                </motion.div>
              </Col>
              <Col xs={24} sm={12} md={8}>
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
                    <LoginOutlined style={{ fontSize: '36px', color: '#1890ff', marginBottom: '16px' }} />
                    <Title level={4}>Kolay Giriş</Title>
                    <Paragraph style={{ color: '#666' }}>
                      Tek tıklamayla hızlı ve kolay giriş yaparak zaman kazanın.
                    </Paragraph>
                  </Card>
                </motion.div>
              </Col>
            </Row>
          </motion.div>
        </PageContainer>
      </Layout>
    </>
  );
};

export default Login;
