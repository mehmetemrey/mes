import React from 'react';
import {
  Card,
  Button,
  Form,
  Input,
  Select,
  Space,
  Typography,
  Grid,
  Row,
  Col,
} from 'antd';
import {
  ArrowLeftOutlined,
  PlusOutlined,
} from '@ant-design/icons';
import LoadingSpinner from '@/components/LoadingSpinner';

const { Title } = Typography;
const { useBreakpoint } = Grid;

export type AddFieldType =
  | 'text'
  | 'email'
  | 'phone'
  | 'number'
  | 'select'
  | 'password'
  | 'custom';

export interface AddField {
  name: string;
  label: string;
  type: AddFieldType;
  required?: boolean;
  options?: { label: string; value: any }[];
  placeholder?: string;
  render?: (form: any) => React.ReactNode;
  rules?: any[];
  span?: number;
  row?: number;
  col?: number;
  mode?: 'multiple' | 'tags';
  tooltip?: string;
  disabled?: boolean;
  hidden?: boolean;
  props?: Record<string, any>;
}

export interface AddPageProps {
  title: string;
  loading?: boolean;
  fields: AddField[];
  onBack?: () => void;
  backButtonText?: string;
  onSubmit: (values: any) => void;
  onCancel?: () => void;
  submitText?: string;
  cancelText?: string;
  initialValues?: any;
  layout?: {
    columns?: number;
    gap?: number;
  };
  backUrl?: string;
}

const styles: Record<string, React.CSSProperties> = {
  container: {
    padding: 0,
    margin: 0,
    minHeight: '100vh',
    backgroundColor: '#fff',
  },
  card: {
    borderRadius: 0,
    boxShadow: 'none',
    border: 'none',
    maxWidth: '100%',
    margin: 0,
    padding: 0,
  },
  header: {
    marginBottom: 24,
    marginTop: -8,
  },
  backButton: {
    display: 'flex',
    alignItems: 'center',
    gap: 8,
    padding: '8px 16px',
    height: 'auto',
    borderRadius: 8,
    marginBottom: 12,
  },
  titleRow: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: 8,
  },
  title: {
    margin: 0,
    fontSize: 24,
    fontWeight: 600,
    color: 'rgba(0, 0, 0, 0.85)',
  },
  formActions: {
    display: 'flex',
    justifyContent: 'flex-end',
    gap: 8,
    marginTop: 16,
  },
};

const organizeFields = (fields: AddField[], columns: number, rows?: number) => {
  const maxRow =
    rows ?? Math.max(...fields.map((f) => (typeof f.row === 'number' ? f.row : 0)), 0) + 1;
  const grid: AddField[][] = Array.from({ length: maxRow }, () =>
    Array(columns).fill(undefined)
  );
  fields.forEach((field) => {
    const row = typeof field.row === 'number' ? field.row : 0;
    const col = typeof field.col === 'number' ? field.col : 0;
    grid[row][col] = field;
  });
  return grid;
};

const AddPage: React.FC<AddPageProps> = ({
  title,
  loading = false,
  fields,
  onBack,
  backButtonText = 'Geri',
  onSubmit,
  onCancel,
  submitText = 'Ekle',
  cancelText = 'İptal',
  initialValues = {},
  layout = { columns: 2, gap: 16 },
  backUrl
}) => {
  const [form] = Form.useForm();
  const screens = useBreakpoint();
  const isMobile = screens.xs;

  const handleFinish = (values: any) => {
    onSubmit(values);
  };

  const handleBack = () => {
    if (onBack) onBack();
  };

  const renderField = (field: AddField) => {
    if (field.type === 'custom' && field.render) {
      return field.render(form);
    }

    switch (field.type) {
      case 'text':
        return <Input placeholder={field.placeholder} />;
      case 'email':
        return <Input type="email" placeholder={field.placeholder} />;
      case 'phone':
        return <Input type="tel" placeholder={field.placeholder} />;
      case 'number':
        return <Input type="number" placeholder={field.placeholder} />;
      case 'password':
        return <Input.Password placeholder={field.placeholder} />;
      case 'select':
        return (
          <Select
            mode={field.mode}
            options={field.options}
            style={{ width: '100%' }}
            placeholder={field.placeholder}
            {...(field.mode === 'multiple' ? { 
              allowClear: true,
              maxTagCount: 'responsive' 
            } : {})}
            {...field.props}
          />
        );
      default:
        return <Input placeholder={field.placeholder} />;
    }
  };

  const fieldGrid = organizeFields(fields, layout.columns!);

  return (
    <div style={styles.container}>
      <LoadingSpinner loading={loading} />
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
          <Title level={2} style={styles.title}>
            {title}
          </Title>
        </div>
      </div>

      <Card style={styles.card}>
        <Form
          form={form}
          layout="vertical"
          onFinish={handleFinish}
          initialValues={initialValues}
        >
          {fieldGrid.map((row, rowIndex) => (
            <Row key={rowIndex} gutter={layout.gap}>
              {row.map((field, colIndex) =>
                field ? (
                  <Col
                    key={`${rowIndex}-${colIndex}`}
                    span={
                      isMobile
                        ? 24
                        : field.span || 24 / layout.columns!
                    }
                  >
                    <Form.Item
                      label={field.label}
                      name={field.name}
                      rules={
                        field.rules ?? (field.required ? [{ required: true, message: `${field.label} zorunludur` }] : [])
                      }
                    >
                      {renderField(field)}
                    </Form.Item>
                  </Col>
                ) : null
              )}
            </Row>
          ))}

          <div style={styles.formActions}>
            {onCancel && (
              <Button onClick={onCancel}>{cancelText}</Button>
            )}
            <Button
              type="primary"
              htmlType="submit"
              icon={<PlusOutlined />}
              loading={loading}
            >
              {submitText}
            </Button>
          </div>
        </Form>
      </Card>
    </div>
  );
};

export default AddPage;
