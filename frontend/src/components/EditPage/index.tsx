import React, { CSSProperties, useEffect, useState } from 'react';
import { 
  Button, 
  Space, 
  Typography, 
  Grid, 
  Form, 
  Input, 
  Select, 
  DatePicker, 
  Switch,
  InputNumber,
  Upload,
  Radio,
  Checkbox,
  Tooltip,
  App,
  Row,
  Col,
  Card,
  Tabs
} from 'antd';
import { 
  ArrowLeftOutlined, 
  SaveOutlined, 
  DeleteOutlined,
  UploadOutlined,
  PlusOutlined,
  MinusCircleOutlined,
  EditOutlined
} from '@ant-design/icons';
import { useNavigate } from 'umi';
import LoadingSpinner from '@/components/LoadingSpinner';
import { Rule } from 'antd/es/form';

const { Title, Text } = Typography;
const { useBreakpoint } = Grid;
const { TextArea } = Input;

export type FieldType = 
  | 'text' 
  | 'password' 
  | 'email' 
  | 'phone' 
  | 'number' 
  | 'select' 
  | 'multiselect' 
  | 'date' 
  | 'datetime' 
  | 'switch' 
  | 'radio' 
  | 'checkbox' 
  | 'textarea' 
  | 'upload' 
  | 'dynamic'
  | 'custom';

export interface EditField {
  name: string;
  label: string;
  type: FieldType;
  rules?: Rule[];
  placeholder?: string;
  tooltip?: string;
  options?: { label: string; value: any }[];
  defaultValue?: any;
  disabled?: boolean;
  hidden?: boolean;
  span?: number;
  row?: number;
  col?: number;
  props?: Record<string, any>;
  render?: (props?: any) => React.ReactNode;
}

interface EditPageProps {
  title: string;
  loading?: boolean;
  fields: EditField[];
  initialValues?: Record<string, any>;
  onSubmit: (values: any) => Promise<void>;
  onDelete?: () => void;
  backButtonText?: string;
  submitButtonText?: string;
  deleteButtonText?: string;
  backUrl?: string;
  style?: CSSProperties;
  layout?: {
    rows?: number;
    columns?: number;
    gap?: number;
  };
  actions?: {
    onEdit?: () => void;
    onDelete?: () => void;
    customActions?: React.ReactNode;
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
    fontSize: '24px',
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
  },
  formItem: {
    marginBottom: '12px',
  },
  dynamicFormItem: {
    marginBottom: '8px',
  },
  uploadButton: {
    marginTop: '8px',
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
  formContainer: {
    maxWidth: '1200px',
    margin: '0 auto',
    padding: '0px',
  },
  formActions: {
    display: 'flex',
    justifyContent: 'flex-end',
    marginTop: '16px',
    gap: '8px',
  },
  tabSection: {
    marginBottom: '24px',
    backgroundColor: '#fff',
    padding: '16px',
    borderRadius: '8px',
    boxShadow: '0 1px 2px rgba(0, 0, 0, 0.03)',
  }
};

const EditPage: React.FC<EditPageProps> = ({
  title,
  loading = false,
  fields,
  initialValues,
  onSubmit,
  onDelete,
  backButtonText = 'Geri',
  submitButtonText = 'Kaydet',
  deleteButtonText = 'Sil',
  backUrl,
  style = {},
  layout = {
    rows: 3,
    columns: 2,
    gap: 16
  },
  actions,
  tabs
}) => {
  const navigate = useNavigate();
  const screens = useBreakpoint();
  const [form] = Form.useForm();
  const { message } = App.useApp();
  const [submitStatus, setSubmitStatus] = useState<{ success?: boolean; error?: string }>({});

  const handleBack = () => {
    if (backUrl) {
      navigate(backUrl);
    } else {
      navigate(-1);
    }
  };

  useEffect(() => {
    if (submitStatus.success) {
    } else if (submitStatus.error) {
      message.error(submitStatus.error);
    }
  }, [submitStatus, message]);

  const handleSubmit = async (values: any) => {
    try {
      await onSubmit(values);
      setSubmitStatus({ success: true });
    } catch (error: any) {
      setSubmitStatus({ error: error.message || 'Kaydetme sırasında bir hata oluştu' });
    }
  };

  const renderField = (field: EditField) => {
    if (field.type === 'custom' && field.render) {
      return (
        <Form.Item
          key={field.name}
          name={field.name}
          rules={field.rules}
          tooltip={field.tooltip}
          style={styles.formItem}
        >
          {field.render({})}
        </Form.Item>
      );
    }

    const commonProps = {
      placeholder: field.placeholder,
      disabled: field.disabled,
      ...field.props
    };

    switch (field.type) {
      case 'text':
        return <Input {...commonProps} />;
      
      case 'password':
        return <Input.Password {...commonProps} />;
      
      case 'email':
        return <Input type="email" {...commonProps} />;
      
      case 'phone':
        return <Input type="tel" {...commonProps} />;
      
      case 'number':
        return <InputNumber style={{ width: '100%' }} {...commonProps} />;
      
      case 'select':
        return (
          <Select
            options={field.options}
            style={{ width: '100%' }}
            {...commonProps}
          />
        );
      
      case 'multiselect':
        return (
          <Select
            mode="multiple"
            options={field.options}
            style={{ width: '100%' }}
            {...commonProps}
          />
        );
      
      case 'date':
        return <DatePicker style={{ width: '100%' }} {...commonProps} />;
      
      case 'datetime':
        return <DatePicker showTime style={{ width: '100%' }} {...commonProps} />;
      
      case 'switch':
        return <Switch {...commonProps} />;
      
      case 'radio':
        return (
          <Radio.Group {...commonProps}>
            <Space direction="vertical">
              {field.options?.map(option => (
                <Radio key={option.value} value={option.value}>
                  {option.label}
                </Radio>
              ))}
            </Space>
          </Radio.Group>
        );
      
      case 'checkbox':
        return (
          <Checkbox.Group {...commonProps}>
            <Space direction="vertical">
              {field.options?.map(option => (
                <Checkbox key={option.value} value={option.value}>
                  {option.label}
                </Checkbox>
              ))}
            </Space>
          </Checkbox.Group>
        );
      
      case 'textarea':
        return <TextArea rows={4} {...commonProps} />;
      
      case 'upload':
        return (
          <Upload {...commonProps}>
            <Button icon={<UploadOutlined />}>Dosya Seç</Button>
          </Upload>
        );
      
      case 'dynamic':
        return (
          <Form.List name={field.name}>
            {(fields, { add, remove }) => (
              <>
                {fields.map(({ key, name, ...restField }) => (
                  <Space key={key} style={{ display: 'flex', marginBottom: 8 }} align="baseline">
                    <Form.Item
                      {...restField}
                      name={[name, 'value']}
                      rules={[{ required: true, message: 'Bu alan zorunludur' }]}
                    >
                      <Input placeholder={field.placeholder} />
                    </Form.Item>
                    <MinusCircleOutlined onClick={() => remove(name)} />
                  </Space>
                ))}
                <Form.Item>
                  <Button type="dashed" onClick={() => add()} block icon={<PlusOutlined />}>
                    Ekle
                  </Button>
                </Form.Item>
              </>
            )}
          </Form.List>
        );
      
      default:
        return <Input {...commonProps} />;
    }
  };

  const organizeFields = () => {
    const { rows = 3, columns = 2 } = layout;
    const organizedFields: EditField[][] = Array(rows).fill(null).map(() => []);
    
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

  const renderForm = () => {
    const isMobile = screens.xs;

    return (
      <Form
        form={form}
        layout="vertical"
        initialValues={initialValues}
        onFinish={handleSubmit}
      >
        {organizeFields().map((row, rowIndex) => (
          <Row key={rowIndex} gutter={layout.gap}>
            {row.map((field, colIndex) => (
              field && !field.hidden && (
                <Col 
                  key={`${rowIndex}-${colIndex}`} 
                  span={isMobile ? 24 : (field.span || 24 / layout.columns!)}
                >
                  <Form.Item
                    name={field.name}
                    label={
                      field.tooltip ? (
                        <Tooltip title={field.tooltip}>
                          {field.label}
                        </Tooltip>
                      ) : field.label
                    }
                    rules={field.rules}
                    style={styles.formItem}
                  >
                    {renderField(field)}
                  </Form.Item>
                </Col>
              )
            ))}
          </Row>
        ))}
        <div style={styles.formActions}>
          {onDelete && (
            <Button
              danger
              icon={<DeleteOutlined />}
              onClick={onDelete}
              style={styles.actionButton}
            >
              {deleteButtonText}
            </Button>
          )}
          <Button
            type="primary"
            icon={<SaveOutlined />}
            onClick={() => form.submit()}
            loading={loading}
          >
            {submitButtonText}
          </Button>
        </div>
      </Form>
    );
  };

  const renderDesktopView = () => (
    <div style={{ ...styles.container, ...style }}>
      <LoadingSpinner loading={loading} />
      <div>
        <div style={styles.header}>
          <Button
            type="text"
            icon={<ArrowLeftOutlined />}
            onClick={handleBack}
            style={styles.backButton}
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
            <Title level={2} style={styles.title}>{title}</Title>
            {actions && (
              <Space>
                {actions.onEdit && (
                  <Button
                    type="primary"
                    icon={<EditOutlined />}
                    onClick={actions.onEdit}
                    style={styles.actionButton}
                  >
                    Düzenle
                  </Button>
                )}
                {actions.onDelete && (
                  <Button
                    danger
                    icon={<DeleteOutlined />}
                    onClick={actions.onDelete}
                    style={styles.actionButton}
                  >
                    Sil
                  </Button>
                )}
                {actions.customActions}
              </Space>
            )}
          </div>
        </div>

        {loading ? <LoadingSpinner /> : renderForm()}
      </div>
    </div>
  );

  const renderMobileView = () => (
    <div style={{ padding: '4px' }}>
      <div style={styles.header}>
        <Button
          type="text"
          icon={<ArrowLeftOutlined />}
          onClick={handleBack}
          style={styles.backButton}
        >
          {backButtonText}
        </Button>
        <div style={styles.titleRow}>
          <Title level={4} style={styles.title}>{title}</Title>
        </div>
      </div>

      <Card style={styles.mobileCard}>
        <div style={styles.mobileCardContent}>
          {loading ? <LoadingSpinner /> : renderForm()}
        </div>
      </Card>
    </div>
  );

  return screens.xs ? renderMobileView() : renderDesktopView();
};

export default EditPage; 