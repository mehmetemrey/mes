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
  message,
  Alert,
  Space,
  Steps,
  Flex,
} from 'antd';
import { motion } from 'framer-motion';
import { PageContainer } from '@ant-design/pro-layout';
import { MailOutlined, SafetyOutlined, LockOutlined } from '@ant-design/icons';
import { useNavigate } from 'umi';
import { authService } from '@/services/authService';
import LoadingSpinner from '@/components/LoadingSpinner';
import type { GetProps } from 'antd';

const { Title, Paragraph } = Typography;
type OTPProps = GetProps<typeof Input.OTP>;

const ForgotPassword: React.FC = () => {
  const [form] = Form.useForm();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isMobile, setIsMobile] = useState<boolean>(false);
  const [isTablet, setIsTablet] = useState<boolean>(false);
  const [messageApi, contextHolder] = message.useMessage();
  const [currentStep, setCurrentStep] = useState(0);
  const [verificationCode, setVerificationCode] = useState('');
  const [countdown, setCountdown] = useState(0);
  const [isCodeVerified, setIsCodeVerified] = useState(false);
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

  const handleSubmit = async (values: any) => {
    setLoading(true);
    setError(null);

    try {
      if (currentStep === 0) {
        const response = await authService.forgotPassword(values.email);
        if (response.success) {
          messageApi.success(
            'Şifre sıfırlama kodu e-posta adresinize gönderildi',
          );
          setCurrentStep(1);
          setCountdown(60);
          const timer = setInterval(() => {
            setCountdown((prev) => {
              if (prev <= 1) {
                clearInterval(timer);
                return 0;
              }
              return prev - 1;
            });
          }, 1000);
        }
      } else if (currentStep === 1) {
        // İkinci adım: Kodu doğrula
        if (!verificationCode) {
          messageApi.error('Lütfen doğrulama kodunu girin');
          setLoading(false);
          return;
        }

        // Kodu doğrula
        try {
          const response = await authService.verifyResetCode({
            email: form.getFieldValue('email'),
            code: verificationCode,
          });

          if (response.success) {
            messageApi.success('Doğrulama kodu onaylandı');
            setIsCodeVerified(true);
            setCurrentStep(2);
          }
        } catch (error: any) {
          setError(error.message);
          setLoading(false);
          return;
        }
      } else if (currentStep === 2) {
        // Üçüncü adım: Şifreyi güncelle
        if (values.newPassword !== values.confirmPassword) {
          messageApi.error('Girdiğiniz şifreler eşleşmiyor');
          setLoading(false);
          return;
        }

        const response = await authService.resetPassword({
          email: form.getFieldValue('email'),
          code: verificationCode,
          newPassword: values.newPassword,
        });

        if (response.success) {
          messageApi.success('Şifreniz başarıyla sıfırlandı');
          setTimeout(() => {
            navigate('/login');
          }, 1500);
        }
      }
    } catch (error: any) {
      setError(error.message || 'Bir hata oluştu');
    } finally {
      setLoading(false);
    }
  };

  const handleResendCode = async () => {
    if (countdown > 0) return;

    setLoading(true);
    try {
      const response = await authService.forgotPassword(
        form.getFieldValue('email'),
      );
      if (response.success) {
        messageApi.success('Yeni doğrulama kodu gönderildi');
        setCountdown(60);
        const timer = setInterval(() => {
          setCountdown((prev) => {
            if (prev <= 1) {
              clearInterval(timer);
              return 0;
            }
            return prev - 1;
          });
        }, 1000);
      }
    } catch (error: any) {
      setError(error.message || 'Doğrulama kodu gönderilirken bir hata oluştu');
    } finally {
      setLoading(false);
    }
  };

  const handleOTPChange: OTPProps['onChange'] = (text) => {
    setVerificationCode(text);
  };

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
        style={{ 
          maxWidth: '1400px', 
          margin: '0 auto', 
          padding: isMobile ? '0 4px' : '0 16px' 
        }}
      >
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 1 }}
          style={{
            padding: isMobile
              ? '12px 0 8px'
              : isTablet
                ? '40px 0 30px'
                : '60px 0 40px',
            textAlign: 'center',
          }}
        >
          <Title
            level={2}
            style={{
              fontSize: isMobile ? '22px' : isTablet ? '32px' : '40px',
              fontWeight: 700,
              marginBottom: isMobile ? '8px' : '24px',
            }}
          >
            <span style={{ color: '#1890ff' }}>Şifremi</span> Unuttum
          </Title>
          <Paragraph
            style={{
              fontSize: isMobile ? '13px' : isTablet ? '15px' : '16px',
              color: '#666',
              maxWidth: '800px',
              margin: '0 auto 20px',
              padding: isMobile ? '0 4px' : '0 15px',
            }}
          >
            E-posta adresinize gönderilen doğrulama kodu ile şifrenizi
            sıfırlayabilirsiniz.
          </Paragraph>
        </motion.div>

        <Row justify="center" style={{ marginBottom: isMobile ? '20px' : '80px' }}>
          <Col
            xs={24}
            sm={24}
            md={24}
            lg={24}
            xl={24}
            xxl={24}
            style={{
              padding: isMobile ? '0 4px' : '0 24px',
            }}
          >
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8 }}
              style={{ width: '100%' }}
            >
              <Card
                style={{
                  borderRadius: '12px',
                  boxShadow: '0 4px 20px rgba(0, 0, 0, 0.1)',
                  width: '100%',
                  maxWidth: '800px',
                  margin: '0 auto',
                  padding: isMobile ? '12px' : '24px',
                }}
              >
                <Steps
                  current={currentStep}
                  items={[
                    {
                      title: 'E-posta',
                      description: 'E-posta adresinizi girin',
                    },
                    {
                      title: 'Doğrulama',
                      description: 'Kodu onaylayın',
                    },
                    {
                      title: 'Şifre',
                      description: 'Yeni şifrenizi belirleyin',
                    },
                  ]}
                  style={{
                    marginBottom: isMobile ? '12px' : '24px',
                  }}
                  size={isMobile ? 'small' : 'default'}
                />

                <Form
                  form={form}
                  onFinish={handleSubmit}
                  layout="vertical"
                  requiredMark={false}
                  size={isMobile ? 'middle' : 'large'}
                >
                  {currentStep === 0 && (
                    <Form.Item
                      name="email"
                      label={
                        <div style={{ fontSize: isMobile ? '13px' : '16px' }}>
                          E-posta Adresi
                        </div>
                      }
                      rules={[
                        {
                          required: true,
                          message: 'Lütfen e-posta adresinizi girin',
                        },
                        {
                          type: 'email',
                          message: 'Geçerli bir e-posta adresi girin',
                        },
                      ]}
                      style={{ marginBottom: isMobile ? '12px' : '24px' }}
                    >
                      <Input
                        prefix={<MailOutlined />}
                        placeholder="ornek@email.com"
                        size={isMobile ? 'middle' : 'large'}
                      />
                    </Form.Item>
                  )}

                  {currentStep === 1 && (
                    <>
                      <Form.Item
                        label={
                          <div style={{ 
                            textAlign: 'center', 
                            fontSize: isMobile ? '13px' : '16px', 
                            fontWeight: 500 
                          }}>
                            Doğrulama Kodu
                          </div>
                        }
                        required
                        tooltip="E-posta adresinize gönderilen 6 haneli kodu girin"
                        style={{ textAlign: 'center', marginBottom: isMobile ? '12px' : '24px' }}
                      >
                        <Flex vertical gap="small" align="center" justify="center" style={{ width: '100%' }}>
                          <Input.OTP
                            length={6}
                            onChange={handleOTPChange}
                            formatter={(str) => str.toUpperCase()}
                            variant="filled"
                            style={{ 
                              width: '100%', 
                              maxWidth: isMobile ? '260px' : isTablet ? '400px' : '600px',
                              display: 'flex',
                              justifyContent: 'center',
                              gap: isMobile ? '4px' : '12px',
                              fontSize: isMobile ? '15px' : '20px'
                            }}
                            size={isMobile ? 'middle' : 'large'}
                          />
                          <Button
                            type="link"
                            onClick={handleResendCode}
                            disabled={countdown > 0}
                            style={{ 
                              marginTop: isMobile ? '4px' : '12px', 
                              fontSize: isMobile ? '12px' : '14px',
                              padding: isMobile ? '4px 8px' : '8px 16px'
                            }}
                          >
                            {countdown > 0
                              ? `${countdown} saniye sonra tekrar deneyin`
                              : 'Kodu tekrar gönder'}
                          </Button>
                        </Flex>
                      </Form.Item>
                    </>
                  )}

                  {currentStep === 2 && (
                    <>
                      <Form.Item
                        name="newPassword"
                        label={
                          <div style={{ fontSize: isMobile ? '13px' : '16px' }}>
                            Yeni Şifre
                          </div>
                        }
                        rules={[
                          {
                            required: true,
                            message: 'Lütfen yeni şifrenizi girin',
                          },
                          {
                            min: 6,
                            message: 'Şifre en az 6 karakter olmalıdır',
                          },
                        ]}
                        style={{ marginBottom: isMobile ? '12px' : '24px' }}
                      >
                        <Input.Password
                          prefix={<LockOutlined />}
                          placeholder="Yeni şifrenizi girin"
                          size={isMobile ? 'middle' : 'large'}
                        />
                      </Form.Item>

                      <Form.Item
                        name="confirmPassword"
                        label={
                          <div style={{ fontSize: isMobile ? '13px' : '16px' }}>
                            Şifre Tekrar
                          </div>
                        }
                        dependencies={['newPassword']}
                        rules={[
                          {
                            required: true,
                            message: 'Lütfen şifrenizi tekrar girin',
                          },
                          ({ getFieldValue }) => ({
                            validator(_, value) {
                              if (
                                !value ||
                                getFieldValue('newPassword') === value
                              ) {
                                return Promise.resolve();
                              }
                              return Promise.reject(
                                new Error('Girdiğiniz şifreler eşleşmiyor'),
                              );
                            },
                          }),
                        ]}
                        style={{ marginBottom: isMobile ? '12px' : '24px' }}
                      >
                        <Input.Password
                          prefix={<LockOutlined />}
                          placeholder="Şifrenizi tekrar girin"
                          size={isMobile ? 'middle' : 'large'}
                        />
                      </Form.Item>
                    </>
                  )}

                  {error && (
                    <Alert
                      message="Hata"
                      description={error}
                      type="error"
                      showIcon
                      style={{ 
                        marginBottom: isMobile ? '12px' : '24px',
                        fontSize: isMobile ? '12px' : '14px',
                        padding: isMobile ? '8px' : '12px'
                      }}
                    />
                  )}

                  <Form.Item style={{ marginBottom: 0 }}>
                    <Button
                      type="primary"
                      htmlType="submit"
                      size={isMobile ? 'middle' : 'large'}
                      block
                      loading={loading}
                      style={{
                        height: isMobile ? '36px' : '48px',
                        fontSize: isMobile ? '13px' : '16px'
                      }}
                    >
                      {currentStep === 0
                        ? 'Doğrulama Kodu Gönder'
                        : currentStep === 1
                        ? 'Kodu Doğrula'
                        : 'Şifreyi Sıfırla'}
                    </Button>
                  </Form.Item>
                </Form>
              </Card>
            </motion.div>
          </Col>
        </Row>
      </PageContainer>
    </Layout>
  );
};

export default ForgotPassword;
