import React, { CSSProperties, useState } from 'react';
import { Table, Card, Button, Space, Typography, Input, Select, Tooltip, Dropdown, Grid, Alert, Drawer, Modal } from 'antd';
import type { TableProps } from 'antd';
import { 
  SearchOutlined, ReloadOutlined, PlusOutlined,
  EditOutlined, DeleteOutlined, EyeOutlined, MoreOutlined, FilterOutlined
} from '@ant-design/icons';
import type { ColumnsType } from 'antd/es/table';
import { useNavigate } from 'umi';
import LoadingSpinner from '@/components/LoadingSpinner';
import { Card as AntCard } from 'antd';
import type { ColumnType } from 'antd/es/table';

const { Title } = Typography;
const { Search } = Input;
const { useBreakpoint } = Grid;

interface FilterOption {
  key: string;
  label: string;
  value: any;
}

interface ActionButton {
  key: string;
  icon: React.ReactNode;
  onClick: (record: any) => void;
  tooltip?: string;
}

interface DropdownAction {
  key: string;
  label?: string;
  icon?: React.ReactNode;
  onClick?: (record: any) => void;
  danger?: boolean;
  disabled?: boolean | ((record: any) => boolean);
  type?: 'divider' | 'item';
}

interface DataTableProps {
  title: string;
  data: any[];
  columns: ColumnsType<any>;
  loading?: boolean;
  total?: number;
  pageSize?: number;
  currentPage?: number;
  onPageChange?: (page: number, pageSize?: number) => void;
  onSearch?: (value: string) => void;
  searchPlaceholder?: string;
  actions?: {
    buttons?: ActionButton[];
    dropdown?: DropdownAction[];
  };
  onAdd?: () => void;
  addButtonText?: string;
  showAddButton?: boolean;
  rowKey?: string;
  style?: CSSProperties;
  children?: React.ReactNode;
  recordType?: string;
  onBulkDelete?: (selectedRowKeys: React.Key[]) => void;
  showBulkDeleteButton?: boolean;
  rowSelection?: {
    selectedRowKeys: React.Key[];
    onChange: (newSelectedRowKeys: React.Key[]) => void;
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
  cardBody: {
    padding: '0px',
  },
  filterSection: {
    marginBottom: '24px',
    padding: '16px',
    backgroundColor: '#fafafa',
    borderRadius: '8px',
    border: '1px solid #f0f0f0',
  },
  filtersContainer: {
    display: 'flex',
    flexWrap: 'wrap' as const,
    gap: '12px',
    flex: 1,
    alignItems: 'center',
  },
  filterItem: {
    flex: '1 1 200px',
  },
  addButton: {
    width: 'auto',
    padding: '0 16px',
    height: 40,
    fontWeight: 500,
    fontSize: 14,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    boxShadow: '0 2px 8px rgba(24,144,255,0.15)',
    whiteSpace: 'nowrap' as const,
    marginLeft: 'auto',
    borderRadius: '8px',
  },
  tableContainer: {
    overflowX: 'auto' as const,
    margin: 0,
    padding: 0,
  },
  searchInput: {
    width: '100%',
  },
  filterSelect: {
    width: '100%',
  },
  actionButton: {
    padding: '4px 8px',
  },
  title: {
    margin: 0,
    marginBottom: '24px',
    fontSize: '24px',
    fontWeight: 600,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    flexWrap: 'wrap' as const,
    gap: '12px',
  },
  mobileCard: {
    marginBottom: 16,
    borderRadius: 12,
    boxShadow: '0 2px 8px rgba(0,0,0,0.08)',
    overflow: 'hidden',
  },
  mobileCardContent: {
    padding: '12px 16px',
  },
  mobileCardRow: {
    display: 'flex',
    flexDirection: 'column' as const,
    padding: '8px 0',
    borderBottom: '1px solid #f0f0f0',
    gap: '4px',
  },
  mobileCardLabel: {
    color: '#666',
    fontSize: 14,
    fontWeight: 500,
    whiteSpace: 'nowrap' as const,
  },
  mobileCardValue: {
    color: '#262626',
    fontSize: 14,
    wordBreak: 'break-word' as const,
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
    marginTop: 16,
    paddingTop: 16,
    borderTop: '1px solid #f0f0f0',
    flexWrap: 'wrap' as const,
  },
  mobileActionButton: {
    padding: '8px 12px',
    height: 'auto',
    display: 'flex',
    alignItems: 'center',
    gap: 8,
    minWidth: 'auto',
  },
  filterButton: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    padding: '8px 16px',
    height: 'auto',
    borderRadius: '8px',
  },
  mobileFilterContent: {
    display: 'flex',
    flexDirection: 'column' as const,
    gap: '16px',
  },
  mobileFilterItem: {
    width: '100%',
  },
  mobileFilterLabel: {
    display: 'block',
    marginBottom: '8px',
    color: '#262626',
    fontWeight: 500,
  },
};

const DataTable: React.FC<DataTableProps> = ({
  title,
  data,
  columns,
  loading = false,
  total = 0,
  pageSize = 10,
  currentPage = 1,
  onPageChange,
  onSearch,
  searchPlaceholder = 'Ara...',
  actions,
  onAdd,
  addButtonText = 'Yeni Ekle',
  showAddButton = true,
  rowKey = '_id',
  style = {},
  children,
  recordType = 'Kayıt',
  onBulkDelete,
  showBulkDeleteButton = true,
  rowSelection,
}) => {
  const navigate = useNavigate();
  const screens = useBreakpoint();
  const [isFilterDrawerVisible, setIsFilterDrawerVisible] = React.useState(false);
  
  // Manage selected rows state
  const [internalSelectedRowKeys, setInternalSelectedRowKeys] = useState<React.Key[]>([]);
  
  // Determine which selected row keys to use
  const selectedRowKeys = rowSelection?.selectedRowKeys ?? internalSelectedRowKeys;

  // Handle row selection change
  const handleRowSelectionChange = (newSelectedRowKeys: React.Key[]) => {
    if (rowSelection?.onChange) {
      // If external onChange is provided, use it
      rowSelection.onChange(newSelectedRowKeys);
    } else {
      // Otherwise, use internal state
      setInternalSelectedRowKeys(newSelectedRowKeys);
    }
  };

  // Responsive sütun ayarları
  const getResponsiveColumns = () => {
    return columns.map(col => {
      const column = { ...col };
      
      // Mobil için sütun genişlikleri
      if (screens.xs) {
        if (column.width) {
          column.width = Math.min(Number(column.width), 120);
        }
        column.ellipsis = true;
      }
      
      // Tablet için sütun genişlikleri
      if (screens.sm && !screens.md) {
        if (column.width) {
          column.width = Math.min(Number(column.width), 150);
        }
      }

      return column;
    });
  };

  const actionColumn: ColumnsType<any> = actions ? [{
    title: 'İşlemler',
    key: 'actions',
    fixed: 'right' as const,
    width: screens.xs ? 80 : screens.sm ? 100 : 120,
    render: (_, record) => (
      <Space size="small" style={{ justifyContent: 'flex-end', width: '100%' }}>
        {actions.buttons?.map((button) => (
          <Tooltip key={button.key} title={button.tooltip}>
            <Button
              type="text"
              icon={button.icon}
              onClick={() => button.onClick(record)}
              style={styles.actionButton}
            />
          </Tooltip>
        ))}
        {actions.dropdown && actions.dropdown.length > 0 && (
          <Dropdown
            menu={{
              items: actions.dropdown.map(action => {
                if (action.type === 'divider') {
                  return { type: 'divider', key: action.key };
                }
                return {
                  key: action.key,
                  label: action.label,
                  icon: action.icon,
                  danger: action.danger,
                  disabled: typeof action.disabled === 'function' 
                    ? action.disabled(record)
                    : action.disabled,
                  onClick: () => action.onClick?.(record),
                };
              })
            }}
            placement="bottomRight"
          >
            <Button type="text" icon={<MoreOutlined />} />
          </Dropdown>
        )}
      </Space>
    ),
  }] : [];

  const allColumns = [...getResponsiveColumns(), ...actionColumn];

  // Mobilde kart görünümü
  const isMobile = screens.xs;

  // Helper to render cell value safely for mobile card
  function renderCellValue(value: any, column: ColumnType<any>): React.ReactNode {
    // If column has a render function, use it
    if (column.render) {
      const rendered = column.render(value, {}, 0);
      // Handle RenderedCell type
      if (typeof rendered === 'object' && rendered !== null && 'props' in rendered) {
        return rendered.props.children;
      }
      // Convert to string for other types
      return String(rendered);
    }

    // Handle null/undefined
    if (value == null) return '-';

    // Handle arrays
    if (Array.isArray(value)) {
      return value.map(item => {
        if (typeof item === 'object' && item !== null) {
          return item.name || item.label || item.title || item.description || JSON.stringify(item);
        }
        return String(item);
      }).join(', ');
    }

    // Handle objects
    if (typeof value === 'object') {
      // Try to get a meaningful string representation
      if ('name' in value) return value.name;
      if ('label' in value) return value.label;
      if ('title' in value) return value.title;
      if ('description' in value) return value.description;
      if ('value' in value) return value.value;
      if ('text' in value) return value.text;
      if ('code' in value) return value.code;
      if ('id' in value) return value.id;
      return JSON.stringify(value);
    }

    // Handle other types
    return String(value);
  }

  // Type guard for ColumnType with string/number title and dataIndex, and no children
  function isColumnTypeWithSimpleTitleAndDataIndex(col: any): col is ColumnType<any> {
    return (
      !!col &&
      !col.children &&
      'dataIndex' in col &&
      (typeof col.dataIndex === 'string' || typeof col.dataIndex === 'number') &&
      'title' in col &&
      (typeof col.title === 'string' || typeof col.title === 'number')
    );
  }

  // Get visible columns for mobile view
  const getMobileColumns = () => {
    return columns.filter(col => {
      // Skip hidden columns
      if (col.hidden) return false;
      
      // Include columns with dataIndex
      if (isColumnTypeWithSimpleTitleAndDataIndex(col)) return true;
      
      // Include columns with render function
      if (col.render) return true;
      
      return false;
    }) as ColumnType<any>[];
  };

  return (
    <div style={{ ...styles.container, ...style }}>
      <LoadingSpinner loading={loading} />
      <div>
        <div style={styles.title}>
          <Title level={2} style={{ margin: 0 }}>{title}</Title>
          <Space>
            {/* Bulk delete button */}
            {showBulkDeleteButton && selectedRowKeys.length > 0 && onBulkDelete && (
              <Button 
                danger 
                icon={<DeleteOutlined />} 
                onClick={() => {
                  Modal.confirm({
                    title: `Seçili ${selectedRowKeys.length} ${recordType} silinecek. Emin misiniz?`,
                    content: 'Bu işlem geri alınamaz.',
                    okText: 'Evet, Sil',
                    okButtonProps: { danger: true },
                    cancelText: 'İptal',
                    onOk() {
                      onBulkDelete(selectedRowKeys);
                      handleRowSelectionChange([]);
                    },
                  });
                }}
              >
                Sil ({selectedRowKeys.length})
              </Button>
            )}
            {showAddButton && onAdd && (
              <Button
                type="primary"
                icon={<PlusOutlined />}
                onClick={onAdd}
                style={styles.addButton}
              >
                {screens.xs ? 'Ekle' : addButtonText}
              </Button>
            )}
          </Space>
        </div>
        <Card 
          style={styles.card} 
          styles={{ body: styles.cardBody }}
        >
          {children && (
            <div style={styles.filterSection}>
              {screens.xs ? (
                <>
                  <Button
                    icon={<FilterOutlined />}
                    onClick={() => setIsFilterDrawerVisible(true)}
                    style={styles.filterButton}
                    block
                  >
                    Filtrele
                  </Button>
                  <Drawer
                    title="Filtreler"
                    placement="right"
                    onClose={() => setIsFilterDrawerVisible(false)}
                    open={isFilterDrawerVisible}
                    width={300}
                    styles={{
                      body: {
                        padding: '16px',
                      },
                      header: {
                        padding: '16px',
                        borderBottom: '1px solid #f0f0f0',
                      }
                    }}
                  >
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                      {children}
                    </div>
                  </Drawer>
                </>
              ) : (
                <div style={styles.filtersContainer}>
                  {React.Children.map(children, (child) => {
                    if (React.isValidElement(child)) {
                      return (
                        <div style={styles.filterItem}>
                          {child}
                        </div>
                      );
                    }
                    return child;
                  })}
                </div>
              )}
            </div>
          )}
          <div style={styles.tableContainer}>
            {isMobile ? (
              Array.isArray(columns) && getMobileColumns().length > 0 ? (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                  {data.map((record, idx) => (
                    <AntCard 
                      key={record[rowKey] || idx} 
                      size="small" 
                      variant="outlined"
                      style={styles.mobileCard}
                      styles={{ body: styles.mobileCardContent }}
                    >
                      {getMobileColumns().map((col) => {
                        if (!isColumnTypeWithSimpleTitleAndDataIndex(col)) return null;
                        const dataIndex = col.dataIndex;
                        if (!(typeof col.title === 'string' || typeof col.title === 'number')) return null;
                        
                        return (
                          <div key={String(dataIndex)} style={styles.mobileCardRow}>
                            <span style={styles.mobileCardLabel}>{col.title}</span>
                            <span style={styles.mobileCardValue}>
                              {renderCellValue(record[dataIndex], col)}
                            </span>
                          </div>
                        );
                      })}
                      {/* Actions */}
                      {actions && (actions.buttons?.length || actions.dropdown?.length) ? (
                        <div style={styles.mobileCardActions}>
                          {actions.buttons?.map((button) => (
                            <Tooltip key={button.key} title={button.tooltip}>
                              <Button
                                type="text"
                                icon={button.icon}
                                onClick={() => button.onClick(record)}
                                style={styles.mobileActionButton}
                              >
                                {screens.xs ? '' : button.tooltip}
                              </Button>
                            </Tooltip>
                          ))}
                          {actions.dropdown && actions.dropdown.length > 0 && (
                            <Dropdown
                              menu={{
                                items: actions.dropdown.map(action => {
                                  if (action.type === 'divider') {
                                    return { type: 'divider', key: action.key };
                                  }
                                  return {
                                    key: action.key,
                                    label: action.label,
                                    icon: action.icon,
                                    danger: action.danger,
                                    disabled: typeof action.disabled === 'function' 
                                      ? action.disabled(record)
                                      : action.disabled,
                                    onClick: () => action.onClick?.(record),
                                  };
                                })
                              }}
                              placement="bottomRight"
                            >
                              <Button 
                                type="text" 
                                icon={<MoreOutlined />}
                                style={styles.mobileActionButton}
                              >
                                {screens.xs ? '' : 'Diğer'}
                              </Button>
                            </Dropdown>
                          )}
                        </div>
                      ) : null}
                    </AntCard>
                  ))}
                </div>
              ) : (
                <Alert type="error" message="Mobil görünüm için uygun sütun bulunamadı." showIcon />
              )
            ) : (
              <Table
                columns={allColumns}
                dataSource={data}
                loading={loading}
                rowKey={rowKey}
                scroll={{ x: 'max-content' }}
                rowSelection={{
                  selectedRowKeys,
                  onChange: handleRowSelectionChange,
                }}
                pagination={{
                  current: currentPage,
                  pageSize: pageSize,
                  total: total,
                  showSizeChanger: !screens.xs,
                  showQuickJumper: !screens.xs,
                  showTotal: (total) => `Toplam ${total} ${recordType}`,
                  pageSizeOptions: ['10', '20', '50', '100'],
                  onChange: onPageChange,
                  responsive: true,
                  locale: {
                    items_per_page: 'Sayfa Başına',
                    jump_to: 'Git',
                    jump_to_confirm: 'Onayla',
                    page: 'Sayfa',
                    prev_page: 'Önceki Sayfa',
                    next_page: 'Sonraki Sayfa',
                    prev_5: 'Önceki 5 Sayfa',
                    next_5: 'Sonraki 5 Sayfa',
                    prev_3: 'Önceki 3 Sayfa',
                    next_3: 'Sonraki 3 Sayfa',
                  }
                }}
              />
            )}
          </div>
        </Card>
      </div>
    </div>
  );
};

export default DataTable; 