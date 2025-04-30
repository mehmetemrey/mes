import React, { CSSProperties } from 'react';
import { Card, Button, Space, Typography, Grid, Descriptions, Divider, Skeleton, Tag, Tooltip, Modal, message, Row, Col, Tabs } from 'antd';
import { 
  ArrowLeftOutlined, 
  EditOutlined, 
  DeleteOutlined,
  PhoneOutlined,
  MailOutlined,
  CopyOutlined,
  CheckOutlined,
  GlobalOutlined,
  EnvironmentOutlined,
  ClockCircleOutlined,
  UserOutlined,
  TeamOutlined,
  SafetyOutlined,
  LinkOutlined
} from '@ant-design/icons';
import { useNavigate } from 'umi';
import LoadingSpinner from '@/components/LoadingSpinner';

const { Title, Text, Paragraph } = Typography;
const { useBreakpoint } = Grid;

export interface DetailField {
  label: string;
  value: React.ReactNode;
  type?: 'text' | 'phone' | 'email' | 'url' | 'date' | 'status' | 'role' | 'permission' | 'copy';
  tooltip?: string;
  span?: number;
  copyValue?: string;
  row?: number;
  col?: number;
}

interface DetailPageProps {
  title: string;
  loading?: boolean;
  fields: DetailField[];
  actions?: {
    onEdit?: () => void;
    onDelete?: () => void;
    customActions?: React.ReactNode;
  };
  onBack?: () => void;
  backButtonText?: string;
  style?: CSSProperties;
  children?: React.ReactNode;
  layout?: {
    rows?: number;
    columns?: number;
    gap?: number;
  };
  tabs?: {
    items: {
      key: string;
      label: string;
      children: React.ReactNode;
    }[];
    activeKey?: string;
    onChange?: (key: string) => void;
  };
  backUrl?: string;
}

const styles: Record<string, CSSProperties> = {
  container: {
    padding: '0px',
    minHeight: '100vh',
    backgroundColor: '#fff',
    margin: 0,
  },
  card: {
    borderRadius: 0,
    boxShadow: 'none',
    border: 'none',
  },
  header: {
    marginBottom: '24px',
    marginTop: '-8px',
  },
  backButton: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    padding: '8px 16px',
    height: 'auto',
    borderRadius: '8px',
    marginBottom: '12px',
    fontSize: 16,
  },
  titleRow: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: '8px',
  },
  title: {
    margin: 0,
    fontSize: '28px',
    fontWeight: 600,
    color: 'rgba(0, 0, 0, 0.85)',
  },
  actionButton: {
    padding: '8px 16px',
    height: 'auto',
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    borderRadius: '8px',
    fontSize: 16,
  },
  mobileCard: {
    marginBottom: 12,
    borderRadius: 8,
    boxShadow: '0 2px 8px rgba(0,0,0,0.08)',
    overflow: 'hidden',
  },
  mobileCardContent: {
    padding: '8px',
  },
  mobileCardRow: {
    display: 'flex',
    flexDirection: 'column',
    padding: '8px 0',
    borderBottom: '1px solid #f0f0f0',
    gap: '4px',
  },
  mobileCardLabel: {
    color: '#333',
    fontSize: 16,
    fontWeight: 600,
    marginBottom: 4,
    opacity: 0.85,
  },
  mobileCardValue: {
    color: '#262626',
    fontSize: 16,
    wordBreak: 'break-word',
    overflow: 'hidden',
    textOverflow: 'ellipsis',
    display: '-webkit-box',
    WebkitLineClamp: 3,
    WebkitBoxOrient: 'vertical',
  },
  mobileCardActions: {
    display: 'flex',
    justifyContent: 'flex-end',
    gap: 8,
    marginTop: 12,
    paddingTop: 12,
    borderTop: '1px solid #f0f0f0',
    flexWrap: 'wrap',
  },
  interactiveValue: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    cursor: 'pointer',
    padding: '4px 8px',
    borderRadius: '4px',
    transition: 'all 0.3s',
  },
  copyButton: {
    padding: '4px 8px',
    height: 'auto',
    display: 'flex',
    alignItems: 'center',
    gap: '4px',
    fontSize: '16px',
  },
  statusTag: {
    padding: '4px 8px',
    borderRadius: '4px',
    fontSize: '16px',
    fontWeight: 500,
  },
  roleTag: {
    padding: '4px 8px',
    borderRadius: '4px',
    fontSize: '16px',
    fontWeight: 500,
    backgroundColor: '#e6f7ff',
    color: '#1890ff',
    border: '1px solid #91d5ff',
  },
  permissionTag: {
    padding: '4px 8px',
    borderRadius: '4px',
    fontSize: '16px',
    fontWeight: 500,
    backgroundColor: '#f6ffed',
    color: '#52c41a',
    border: '1px solid #b7eb8f',
  },
  mobileContainer: {
    padding: '4px',
  },
  tabSection: {
    marginBottom: '24px',
    backgroundColor: '#fff',
    padding: '16px',
    borderRadius: '8px',
    boxShadow: '0 1px 2px rgba(0, 0, 0, 0.03)',
  },
  desktopDetailLabel: {
    color: '#333',
    fontSize: 16,
    fontWeight: 600,
    marginBottom: 6,
    opacity: 0.85,
  }
};

const DetailPage: React.FC<DetailPageProps> = ({
  title,
  loading = false,
  fields,
  actions,
  onBack,
  backButtonText = 'Geri',
  style = {},
  children,
  layout = {
    rows: 3,
    columns: 3,
    gap: 16
  },
  tabs,
  backUrl
}) => {
  const navigate = useNavigate();
  const screens = useBreakpoint();
  const [messageApi, contextHolder] = message.useMessage();

  const handleBack = () => {
    if (onBack) {
      onBack();
    } else if (backUrl) {
      navigate(backUrl);
    } else {
      navigate(-1);
    }
  };

  const handleCopy = (text: string) => {
    navigator.clipboard.writeText(text);
    messageApi.success('Kopyalandı!');
  };

  const handlePhoneClick = (phone: string) => {
    window.location.href = `tel:${phone}`;
  };

  const handleEmailClick = (email: string) => {
    window.location.href = `mailto:${email}`;
  };

  const handleUrlClick = (url: string) => {
    window.open(url, '_blank');
  };

  // Organize fields into rows and columns
  const organizeFields = () => {
    const { rows = 3, columns = 3 } = layout;
    const organizedFields: DetailField[][] = Array(rows).fill(null).map(() => []);
    
    fields.forEach((field) => {
      const row = field.row || 0;
      const col = field.col || 0;
      
      if (!organizedFields[row]) {
        organizedFields[row] = [];
      }
      
      organizedFields[row][col] = field;
    });

    return organizedFields;
  };

  const renderField = (field: DetailField) => {
    const content = (
      <div style={{ marginBottom: layout.gap }}>
        <Text 
          type="secondary" 
          style={{ 
            ...styles.desktopDetailLabel, 
            display: 'block', 
            marginBottom: 4,
            fontSize: 16
          }}
        >
          {field.label}
        </Text>
        <div style={{ fontSize: 16 }}>
          {field.value}
        </div>
      </div>
    );

    return field.tooltip ? (
      <Tooltip title={field.tooltip} key={field.label}>
        {content}
      </Tooltip>
    ) : content;
  };

  const renderDesktopView = () => (
    <div style={{ ...styles.container, ...style }}>
      {contextHolder}
      <Card style={styles.card} variant="outlined">
        <div style={styles.header}>
          <Button
            type="text"
            icon={<ArrowLeftOutlined />}
            onClick={handleBack}
            style={{
              ...styles.backButton,
              fontSize: 16
            }}
          >
            {backButtonText}
          </Button>
          {tabs && (
            <div style={styles.tabSection}>
              <Tabs
                activeKey={tabs.activeKey}
                items={tabs.items}
                onChange={tabs.onChange}
                size="large"
              />
            </div>
          )}
          <div style={styles.titleRow}>
            <Title 
              level={4} 
              style={{
                ...styles.title,
                fontSize: '28px'
              }}
            >
              {title}
            </Title>
            {(actions?.onEdit || actions?.onDelete || actions?.customActions) && (
              <Space>
                {actions.onEdit && (
                  <Button
                    type="primary"
                    icon={<EditOutlined />}
                    onClick={actions.onEdit}
                    style={{
                      ...styles.actionButton,
                      fontSize: 16
                    }}
                  >
                    Düzenle
                  </Button>
                )}
                {actions.onDelete && (
                  <Button
                    danger
                    icon={<DeleteOutlined />}
                    onClick={actions.onDelete}
                    style={{
                      ...styles.actionButton,
                      fontSize: 16
                    }}
                  >
                    Sil
                  </Button>
                )}
                {actions.customActions}
              </Space>
            )}
          </div>
        </div>

        {loading ? (
          <LoadingSpinner />
        ) : (
          <>
            {organizeFields().map((row, rowIndex) => (
              <Row key={rowIndex} gutter={layout.gap}>
                {row.map((field, colIndex) => (
                  <Col 
                    key={`${rowIndex}-${colIndex}`} 
                    span={field.span || 24 / layout.columns!}
                  >
                    {field && renderField(field)}
                  </Col>
                ))}
              </Row>
            ))}
            {children}
          </>
        )}
      </Card>
    </div>
  );

  const renderMobileView = () => {
    if (loading) {
      return <LoadingSpinner />;
    }

    return (
      <div style={styles.mobileContainer}>
        <div style={styles.header}>
          <Button
            icon={<ArrowLeftOutlined />}
            onClick={handleBack}
            style={{
              ...styles.backButton,
              fontSize: 16
            }}
          >
            {backButtonText}
          </Button>
          <div style={styles.titleRow}>
            <Title 
              level={2} 
              style={{
                ...styles.title,
                fontSize: '28px'
              }}
            >
              {title}
            </Title>
          </div>
        </div>

        {fields.map((field, index) => (
          <Card
            key={index}
            style={styles.mobileCard}
            title={
              <div style={{ 
                ...styles.mobileCardLabel, 
                fontSize: 16
              }}>
                {field.label}
              </div>
            }
            variant="outlined"
          >
            <div style={{
              ...styles.mobileCardContent,
              fontSize: 16
            }}>
              {field.value}
            </div>
          </Card>
        ))}

        {actions && (
          <div style={styles.mobileCardActions}>
            <Space>
              {actions.onEdit && (
                <Button
                  type="primary"
                  icon={<EditOutlined />}
                  onClick={actions.onEdit}
                  style={{ fontSize: 16 }}
                >
                  Düzenle
                </Button>
              )}
              {actions.onDelete && (
                <Button
                  danger
                  icon={<DeleteOutlined />}
                  onClick={actions.onDelete}
                  style={{ fontSize: 16 }}
                >
                  Sil
                </Button>
              )}
            </Space>
          </div>
        )}
      </div>
    );
  };

  return screens.xs ? renderMobileView() : renderDesktopView();
};

export default DetailPage; 