import React, { useState, useEffect, useRef } from 'react';
import {
  Typography, 
  Form, 
  Input, 
  Button, 
  message, 
  Card, 
  Row, 
  Col,
  Tabs,
  Avatar, 
  Divider, 
  Space, 
  Tag, 
  Descriptions, 
  Upload,
  Modal,
  Spin,
  Steps,
  Grid
} from 'antd';
import { 
  UserOutlined, 
  LockOutlined, 
  SaveOutlined, 
  UploadOutlined, 
  TeamOutlined, 
  EnvironmentOutlined, 
  EditOutlined,
  ClockCircleOutlined
} from '@ant-design/icons';
import { motion } from 'framer-motion';
import { PageContainer } from '@ant-design/pro-layout';
import { useNavigate } from 'umi';
import userService from '@/services/userService';
import authService from '@/services/authService';
import dayjs from 'dayjs';
import LoadingSpinner from '@/components/LoadingSpinner';

const { Title, Paragraph, Text } = Typography;
const { useBreakpoint } = Grid;

const Profile: React.FC = () => {
  const [form] = Form.useForm();
  const [passwordForm] = Form.useForm();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [passwordSubmitting, setPasswordSubmitting] = useState(false);
  const [user, setUser] = useState<any>(null);
  const [isMobile, setIsMobile] = useState<boolean>(false);
  const [isEditing, setIsEditing] = useState(false);
  const [messageApi, contextHolder] = message.useMessage();
  const [currentStep, setCurrentStep] = useState(0);
  const [verificationCode, setVerificationCode] = useState('');
  const [isVerifying, setIsVerifying] = useState(false);
  const [countdown, setCountdown] = useState(0);
  const [timerRef, setTimerRef] = useState<NodeJS.Timeout | null>(null);
  const verificationInputRef = useRef<any>(null);

  // Use Ant Design's responsive breakpoints
  const screens = useBreakpoint();

  // Timer cleanup function
  const clearCountdownTimer = () => {
    if (timerRef) {
      clearInterval(timerRef);
      setTimerRef(null);
    }
  };

  // Start countdown timer
  const startCountdownTimer = () => {
    clearCountdownTimer(); // Clear any existing timer
    const timer = setInterval(() => {
      setCountdown((prev) => {
        if (prev <= 1) {
          clearInterval(timer);
          setTimerRef(null);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    setTimerRef(timer);
  };

  // Cleanup timer on unmount
  useEffect(() => {
    return () => {
      clearCountdownTimer();
    };
  }, []);

  // Ekran boyutunu izle
  useEffect(() => {
    const handleResize = () => {
      setIsMobile(window.innerWidth <= 576);
    };

    handleResize();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Kullanıcı bilgilerini yükle
  useEffect(() => {
    const fetchUserProfile = async () => {
      try {
        setLoading(true);
        const response = await authService.getProfile();
        if (response.success) {
          const userData = response.data.user;
          setUser(userData);
          
          // Form alanlarını doldur
          form.setFieldsValue({
            firstName: userData.firstName,
            lastName: userData.lastName,
            email: userData.email,
            phone: userData.phone
          });
        } else {
          throw new Error(response.message || 'Kullanıcı bilgileri alınamadı');
        }
      } catch (error: any) {
        messageApi.error(error.message || 'Kullanıcı bilgileri yüklenirken bir hata oluştu');
      } finally {
        setLoading(false);
      }
    };

    fetchUserProfile();
  }, []);

  const handleProfileUpdate = async (values: any) => {
    setSubmitting(true);
    try {
      const response = await authService.updateProfile(values);
      if (response.success) {
        messageApi.success('Profil bilgileriniz güncellendi');
        setIsEditing(false);
        
        // Kullanıcı bilgilerini tekrar yükle
        const updatedResponse = await authService.getProfile();
        if (updatedResponse.success) {
          setUser(updatedResponse.data.user);
        }
      } else {
        throw new Error(response.message || 'Profil güncellenemedi');
      }
    } catch (error: any) {
      messageApi.error(error.message || 'Profil güncellenirken bir hata oluştu');
    } finally {
      setSubmitting(false);
    }
  };

  const handlePasswordChange = async (values: any) => {
    setPasswordSubmitting(true);
    try {
      // İlk adım: Mevcut şifreyi kontrol et
      if (currentStep === 0) {
        if (!values.currentPassword) {
          messageApi.error('Lütfen mevcut şifrenizi girin');
          setPasswordSubmitting(false);
          return;
        }

        if (!values.newPassword) {
          messageApi.error('Lütfen yeni şifrenizi girin');
          setPasswordSubmitting(false);
          return;
        }

        if (!values.confirmPassword) {
          messageApi.error('Lütfen yeni şifrenizi tekrar girin');
          setPasswordSubmitting(false);
          return;
        }

        if (values.newPassword !== values.confirmPassword) {
          messageApi.error('Girdiğiniz şifreler eşleşmiyor');
          setPasswordSubmitting(false);
          return;
        }

        try {
          const verifyResponse = await authService.verifyCurrentPassword(values.currentPassword);
          if (verifyResponse.success) {
            // Şifre doğruysa doğrulama kodu gönder
            const response = await authService.sendPasswordChangeCode();
            if (response.success) {
              messageApi.success('Doğrulama kodu e-posta adresinize gönderildi');
              setCurrentStep(1);
              setCountdown(60);
              startCountdownTimer();
            } else {
              throw new Error(response.message || 'Doğrulama kodu gönderilemedi');
            }
          } else {
            throw new Error(verifyResponse.message || 'Mevcut şifre yanlış');
          }
        } catch (error: any) {
          messageApi.error(error.message || 'Şifre doğrulanırken bir hata oluştu');
          setPasswordSubmitting(false);
          return;
        }
      }
      // İkinci adım: Doğrulama kodu kontrolü ve şifre değiştirme
      else if (currentStep === 1) {
        if (!verificationCode) {
          messageApi.error('Lütfen doğrulama kodunu girin');
          setPasswordSubmitting(false);
          return;
        }

        const response = await authService.verifyAndChangePassword({
          code: verificationCode,
          newPassword: passwordForm.getFieldValue('newPassword')
        });

        if (response.success) {
          messageApi.success('Şifreniz başarıyla değiştirildi');
          passwordForm.resetFields();
          setVerificationCode('');
          setCurrentStep(0);
          clearCountdownTimer();
          setCountdown(0);
        } else {
          throw new Error(response.message || 'Şifre değiştirilemedi');
        }
      }
    } catch (error: any) {
      messageApi.error(error.message || 'İşlem sırasında bir hata oluştu');
    } finally {
      setPasswordSubmitting(false);
    }
  };

  const handleResendCode = async () => {
    if (countdown > 0) return;
    
    setIsVerifying(true);
    try {
      const response = await authService.sendPasswordChangeCode();
      if (response.success) {
        messageApi.success('Yeni doğrulama kodu gönderildi');
        setCountdown(60);
        startCountdownTimer();
      } else {
        throw new Error(response.message || 'Doğrulama kodu gönderilemedi');
      }
    } catch (error: any) {
      messageApi.error(error.message || 'Doğrulama kodu gönderilirken bir hata oluştu');
    } finally {
      setIsVerifying(false);
    }
  };

  if (loading) {
    return <LoadingSpinner loading={loading} />;
  }

  const ProfileContent = () => (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      style={{ 
        width: '100%', 
        maxWidth: 1200, 
        margin: '0 auto', 
        padding: screens.xs ? '12px' : '24px' 
      }}
    >
      <Row gutter={[screens.xs ? 12 : 24, screens.xs ? 12 : 24]} style={{ width: '100%', margin: 0 }}>
        {/* Profile Avatar and Basic Info */}
        <Col xs={24} md={8}>
          <Card 
            style={{ 
              width: '100%', 
              textAlign: 'center', 
              borderRadius: screens.xs ? 8 : 12, 
              boxShadow: '0 4px 6px rgba(0,0,0,0.1)',
              marginBottom: screens.xs ? 12 : 0
            }}
            bodyStyle={{ padding: screens.xs ? '16px' : '24px' }}
          >
            <Avatar 
              size={screens.xs ? 80 : 128} 
              icon={<UserOutlined />} 
              src={user?.avatar} 
              style={{ 
                marginBottom: screens.xs ? 12 : 16, 
                border: `${screens.xs ? '2px' : '4px'} solid #f0f0f0` 
              }} 
            />
            <Title level={screens.xs ? 5 : 4} style={{ margin: 0, fontSize: screens.xs ? '16px' : '20px' }}>
              {user?.firstName} {user?.lastName}
            </Title>
            <Text type="secondary" style={{ fontSize: screens.xs ? '12px' : '14px', display: 'block', marginBottom: 8, wordBreak: 'break-word' }}>
              {user?.email}
            </Text>
            <Divider style={{ margin: screens.xs ? '12px 0' : '16px 0' }} />
            <Space direction="vertical" style={{ width: '100%' }} size={screens.xs ? 8 : 12}>
              <Tag icon={<TeamOutlined />} color="processing" style={{ fontSize: screens.xs ? '11px' : '12px', padding: screens.xs ? '2px 6px' : '4px 8px' }}>
                {user?.role?.name || 'Kullanıcı'}
              </Tag>
              <Tag icon={<EnvironmentOutlined />} color="success" style={{ fontSize: screens.xs ? '11px' : '12px', padding: screens.xs ? '2px 6px' : '4px 8px', textAlign: 'center' }}>
                {user?.department || 'Departman Atanmamış'}
              </Tag>
            </Space>
          </Card>
        </Col>

        {/* Profile Details and Edit Form */}
        <Col xs={24} md={16}>
          <Card 
            title={
              <span style={{ fontSize: screens.xs ? '16px' : '18px' }}>
                Profil Bilgileri
              </span>
            }
            extra={
              <Button 
                type={isEditing ? 'default' : 'primary'} 
                icon={<EditOutlined />} 
                onClick={() => setIsEditing(!isEditing)}
                size={screens.xs ? 'small' : 'middle'}
              >
                {screens.xs ? (isEditing ? 'İptal' : 'Düzenle') : (isEditing ? 'İptal' : 'Düzenle')}
              </Button>
            }
            style={{ 
              width: '100%',
              height: '100%',
              borderRadius: screens.xs ? 8 : 12, 
              boxShadow: '0 4px 6px rgba(0,0,0,0.1)' 
            }}
            bodyStyle={{ padding: screens.xs ? '16px' : '24px' }}
          >
            {isEditing ? (
              <Form
                form={form}
                layout="vertical"
                onFinish={handleProfileUpdate}
                initialValues={{
                  firstName: user?.firstName,
                  lastName: user?.lastName,
                  email: user?.email,
                  phone: user?.phone
                }}
              >
                <Row gutter={screens.xs ? 8 : 16}>
                  <Col xs={24} md={12}>
                    <Form.Item
                      name="firstName"
                      label="Ad"
                      rules={[{ required: true, message: 'Lütfen adınızı girin' }]}
                    >
                      <Input 
                        prefix={<UserOutlined />} 
                        size={screens.xs ? 'large' : 'middle'}
                        style={{ fontSize: screens.xs ? '16px' : '14px' }}
                      />
                    </Form.Item>
                  </Col>
                  <Col xs={24} md={12}>
                    <Form.Item
                      name="lastName"
                      label="Soyad"
                      rules={[{ required: true, message: 'Lütfen soyadınızı girin' }]}
                    >
                      <Input 
                        prefix={<UserOutlined />} 
                        size={screens.xs ? 'large' : 'middle'}
                        style={{ fontSize: screens.xs ? '16px' : '14px' }}
                      />
                    </Form.Item>
                  </Col>
                </Row>
                <Row gutter={screens.xs ? 8 : 16}>
                  <Col xs={24} md={12}>
                    <Form.Item
                      name="email"
                      label="E-posta"
                      rules={[
                        { required: true, message: 'Lütfen e-posta adresinizi girin' },
                        { type: 'email', message: 'Geçerli bir e-posta adresi girin' }
                      ]}
                    >
                      <Input 
                        prefix={<UserOutlined />} 
                        size={screens.xs ? 'large' : 'middle'}
                        style={{ fontSize: screens.xs ? '16px' : '14px' }}
                      />
                    </Form.Item>
                  </Col>
                  <Col xs={24} md={12}>
                    <Form.Item
                      name="phone"
                      label="Telefon"
                      rules={[{ required: true, message: 'Lütfen telefon numaranızı girin' }]}
                    >
                      <Input 
                        prefix={<UserOutlined />} 
                        size={screens.xs ? 'large' : 'middle'}
                        style={{ fontSize: screens.xs ? '16px' : '14px' }}
                      />
                    </Form.Item>
                  </Col>
                </Row>
                <Form.Item>
                  <Button 
                    type="primary" 
                    htmlType="submit" 
                    loading={submitting} 
                    icon={<SaveOutlined />}
                    block
                    size={screens.xs ? 'large' : 'middle'}
                    style={{ 
                      fontSize: screens.xs ? '16px' : '14px',
                      height: screens.xs ? '48px' : 'auto',
                      fontWeight: '500'
                    }}
                  >
                    Profili Güncelle
                  </Button>
                </Form.Item>
              </Form>
            ) : (
              <Descriptions 
                column={1} 
                bordered
                size={screens.xs ? 'small' : 'default'}
                labelStyle={{ 
                  fontSize: screens.xs ? '12px' : '14px',
                  fontWeight: '500',
                  width: screens.xs ? '80px' : '120px'
                }}
                contentStyle={{ 
                  fontSize: screens.xs ? '14px' : '14px',
                  wordBreak: 'break-word'
                }}
              >
                <Descriptions.Item label="Ad">{user?.firstName}</Descriptions.Item>
                <Descriptions.Item label="Soyad">{user?.lastName}</Descriptions.Item>
                <Descriptions.Item label="E-posta">{user?.email}</Descriptions.Item>
                <Descriptions.Item label="Telefon">{user?.phone || '-'}</Descriptions.Item>
              </Descriptions>
            )}
          </Card>
        </Col>
      </Row>
    </motion.div>
  );

  const PasswordChangeContent = () => (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      style={{ 
        width: '100%', 
        maxWidth: 800, 
        margin: '0 auto', 
        padding: screens.xs ? '12px' : '24px' 
      }}
    >
      <Card 
        title={
          <span style={{ fontSize: screens.xs ? '16px' : '18px' }}>
            Şifre Değişikliği
          </span>
        }
        style={{ 
          width: '100%', 
          borderRadius: screens.xs ? 8 : 12, 
          boxShadow: '0 4px 6px rgba(0,0,0,0.1)' 
        }}
        bodyStyle={{ padding: screens.xs ? '16px' : '24px' }}
      >
        <Steps 
          current={currentStep} 
          style={{ marginBottom: screens.xs ? 16 : 24 }}
          direction={screens.xs ? 'vertical' : 'horizontal'}
          size={screens.xs ? 'small' : 'default'}
        >
          <Steps.Step 
            title={screens.xs ? "Mevcut Şifre" : "Mevcut Şifre"} 
            description={screens.xs ? "Doğrulayın" : "Şifrenizi doğrulayın"} 
          />
          <Steps.Step 
            title={screens.xs ? "Doğrulama" : "Doğrulama"} 
            description={screens.xs ? "Kod onaylayın" : "Kod ile onaylayın"} 
          />
        </Steps>

        <Form
          form={passwordForm}
          layout="vertical"
          onFinish={handlePasswordChange}
        >
          {currentStep === 0 && (
            <>
              <Form.Item
                name="currentPassword"
                label="Mevcut Şifre"
                rules={[{ required: true, message: 'Lütfen mevcut şifrenizi girin' }]}
              >
                <Input.Password 
                  prefix={<LockOutlined />} 
                  size={screens.xs ? 'large' : 'middle'}
                  style={{ fontSize: screens.xs ? '16px' : '14px' }}
                />
              </Form.Item>
              <Form.Item
                name="newPassword"
                label="Yeni Şifre"
                rules={[
                  { required: true, message: 'Lütfen yeni şifrenizi girin' },
                  { min: 6, message: 'Şifre en az 6 karakter olmalıdır' }
                ]}
              >
                <Input.Password 
                  prefix={<LockOutlined />} 
                  size={screens.xs ? 'large' : 'middle'}
                  style={{ fontSize: screens.xs ? '16px' : '14px' }}
                />
              </Form.Item>
              <Form.Item
                name="confirmPassword"
                label="Yeni Şifreyi Onayla"
                dependencies={['newPassword']}
                rules={[
                  { required: true, message: 'Lütfen yeni şifrenizi tekrar girin' },
                  ({ getFieldValue }) => ({
                    validator(_, value) {
                      if (!value || getFieldValue('newPassword') === value) {
                        return Promise.resolve();
                      }
                      return Promise.reject(new Error('Girdiğiniz şifreler eşleşmiyor'));
                    },
                  }),
                ]}
              >
                <Input.Password 
                  prefix={<LockOutlined />} 
                  size={screens.xs ? 'large' : 'middle'}
                  style={{ fontSize: screens.xs ? '16px' : '14px' }}
                />
              </Form.Item>
              <Button 
                type="primary" 
                htmlType="submit" 
                loading={passwordSubmitting} 
                icon={<SaveOutlined />}
                block
                size={screens.xs ? 'large' : 'middle'}
                style={{ 
                  fontSize: screens.xs ? '16px' : '14px',
                  height: screens.xs ? '48px' : 'auto',
                  fontWeight: '500'
                }}
              >
                Devam Et
              </Button>
            </>
          )}

          {currentStep === 1 && (
            <>
              <Form.Item
                label="Doğrulama Kodu"
                extra={
                  <div style={{ 
                    display: 'flex', 
                    justifyContent: 'space-between', 
                    alignItems: screens.xs ? 'flex-start' : 'center',
                    flexDirection: screens.xs ? 'column' : 'row',
                    gap: screens.xs ? '8px' : '0'
                  }}>
                    <Text type="secondary" style={{ fontSize: screens.xs ? '12px' : '14px' }}>
                      {countdown > 0 
                        ? `${countdown} saniye içinde yeni kod isteyebilirsiniz` 
                        : 'Kod almadınız mı?'}
                    </Text>
                    <Button 
                      type="link" 
                      onClick={handleResendCode} 
                      disabled={countdown > 0}
                      loading={isVerifying}
                      size={screens.xs ? 'small' : 'middle'}
                      style={{ 
                        fontSize: screens.xs ? '12px' : '14px',
                        padding: screens.xs ? '0' : '4px 15px'
                      }}
                    >
                      Kodu Yeniden Gönder
                    </Button>
                  </div>
                }
              >
                <Input 
                  ref={verificationInputRef}
                  value={verificationCode}
                  onChange={(e) => setVerificationCode(e.target.value)}
                  placeholder="6 haneli doğrulama kodunu girin"
                  maxLength={6}
                  autoFocus
                  size={screens.xs ? 'large' : 'middle'}
                  style={{ 
                    fontSize: screens.xs ? '18px' : '14px',
                    textAlign: 'center',
                    letterSpacing: screens.xs ? '4px' : '2px'
                  }}
                />
              </Form.Item>
              <Button 
                type="primary" 
                htmlType="submit" 
                loading={passwordSubmitting} 
                icon={<SaveOutlined />}
                block
                size={screens.xs ? 'large' : 'middle'}
                style={{ 
                  fontSize: screens.xs ? '16px' : '14px',
                  height: screens.xs ? '48px' : 'auto',
                  fontWeight: '500'
                }}
              >
                Şifreyi Değiştir
              </Button>
            </>
          )}
        </Form>
      </Card>
    </motion.div>
  );

  return (
    <PageContainer>
      {contextHolder}
      <Tabs 
        defaultActiveKey="profile"
        centered={!screens.xs}
        style={{ 
          width: '100%',
          padding: screens.xs ? '0 8px' : '0'
        }}
        size={screens.xs ? 'small' : 'large'}
        tabBarStyle={{
          fontSize: screens.xs ? '14px' : '16px',
          padding: screens.xs ? '0 8px' : '0 16px'
        }}
        items={[
          {
            key: 'profile',
            label: screens.xs ? 'Profil' : 'Profil Bilgileri',
            children: <ProfileContent />
          },
          {
            key: 'password',
            label: screens.xs ? 'Şifre' : 'Şifre Değişikliği',
            children: <PasswordChangeContent />
          }
        ]}
      />
    </PageContainer>
  );
};

export default Profile;
