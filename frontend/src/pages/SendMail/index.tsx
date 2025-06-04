import React, { useState, useEffect } from 'react';
import {
  ProCard,
  ProForm,
  ProFormText,
  ProFormTextArea,
  ProFormSelect,
  ProFormUploadButton
} from '@ant-design/pro-components';
import { message, Space, Button, Typography, Row, Col, Card, Tag, Table, Input, Spin, Upload, Radio } from 'antd';
import type { ColumnsType } from 'antd/es/table';
import { MailOutlined, UserOutlined, TeamOutlined, FilterOutlined, SearchOutlined, UploadOutlined } from '@ant-design/icons';
import mailService from '@/services/mailService';
import userService from '@/services/userService';
import departmentService from '@/services/departmentService';
import { useNavigate } from 'umi';
import { PageContainer } from '@ant-design/pro-layout';
import LoadingSpinner from '@/components/LoadingSpinner';

const { Title } = Typography;
const { Search } = Input;

interface User {
  _id: string;
  name: string;
  email: string;
  role: string;
  department: string;
}

interface Role {
  _id: string;
  description: string;
}

const SendMail: React.FC = () => {
  const [form] = ProForm.useForm();
  const [loading, setLoading] = useState(false);
  const [dataLoading, setDataLoading] = useState(true);
  const [users, setUsers] = useState<User[]>([]);
  const [departments, setDepartments] = useState<any[]>([]);
  const [roles, setRoles] = useState<Role[]>([]);
  const [selectedUsers, setSelectedUsers] = useState<string[]>([]);
  const [selectedRoles, setSelectedRoles] = useState<string[]>([]);
  const [selectedDepartments, setSelectedDepartments] = useState<string[]>([]);
  const [recipientType, setRecipientType] = useState<'users' | 'all' | 'roles' | 'departments'>('users');
  const [searchText, setSearchText] = useState('');
  const navigate = useNavigate();

  // Fetch initial data
  useEffect(() => {
    const fetchData = async () => {
      try {
        setDataLoading(true);
        const [usersData, departmentsData] = await Promise.all([
          userService.getUsers(),
          departmentService.getDepartments()
        ]);

        // Kullanıcı verilerini düzenle
        
        const formattedUsers = usersData.map((user: any) => {
          
          return {
            _id: user._id,
            name: `${user.firstName} ${user.lastName}`,
            email: user.email,
            role: user.roles?.[0]?.description || '',
            department: user.department?.name || 'Departman Atanmamış'
          };
        });


        // Benzersiz rolleri çıkar
        const uniqueRoles = Array.from(
          new Map(
            usersData
              .map((user: any) => user.roles?.[0])
              .filter(Boolean)
              .map((role: any) => [role._id, role])
          ).values()
        ).map((role: any) => ({
          _id: role._id,
          description: role.description
        }));


        setUsers(formattedUsers);
        setDepartments(departmentsData || []);
        setRoles(uniqueRoles);
      } catch (error) {
        console.error('Veri yükleme hatası:', error);
        message.error('Veriler yüklenirken bir hata oluştu');
      } finally {
        setDataLoading(false);
      }
    };

    fetchData();
  }, []);

  const handleSubmit = async (values: any) => {
    try {
      setLoading(true);

      // Validate recipient selection
      if (recipientType === 'users' && selectedUsers.length === 0) {
        message.error('Lütfen en az bir kullanıcı seçin');
        return;
      } else if (recipientType === 'roles' && selectedRoles.length === 0) {
        message.error('Lütfen en az bir rol seçin');
        return;
      } else if (recipientType === 'departments' && selectedDepartments.length === 0) {
        message.error('Lütfen en az bir departman seçin');
        return;
      }

      // Prepare mail data
      const mailData = {
        subject: values.subject,
        content: values.content,
        attachments: values.attachments || []
      };

      let response;
      switch (recipientType) {
        case 'users':
          response = await mailService.sendMailToUsers({
            userIds: selectedUsers,
            ...mailData
          });
          break;
        case 'all':
          response = await mailService.sendMailToAll(mailData);
          break;
        case 'roles':
          response = await mailService.sendMailToRoles({
            roles: selectedRoles,
            ...mailData
          });
          break;
        case 'departments':
          response = await mailService.sendMailToDepartments({
            departments: selectedDepartments,
            ...mailData
          });
          break;
      }

      if (response.success) {
        message.success('Mail başarıyla gönderildi');
        form.resetFields();
        setSelectedUsers([]);
        setSelectedRoles([]);
        setSelectedDepartments([]);
      } else {
        message.error('Mail gönderilirken bir hata oluştu');
      }
    } catch (error: any) {
      console.error('Mail gönderme hatası:', error);
      message.error(error.message || 'Mail gönderilirken bir hata oluştu');
    } finally {
      setLoading(false);
    }
  };

  const columns: ColumnsType<User> = [
    {
      title: 'Ad Soyad',
      dataIndex: 'name',
      key: 'name',
      sorter: (a: User, b: User) => a.name.localeCompare(b.name),
    },
    {
      title: 'E-posta',
      dataIndex: 'email',
      key: 'email',
    },
    {
      title: 'Rol',
      dataIndex: 'role',
      key: 'role',
      filters: roles.map(role => ({ text: role.description, value: role._id })),
      onFilter: (value: boolean | React.Key, record: User) => {
        const role = roles.find(r => r._id === value);
        return record.role === role?.description;
      },
    },
    {
      title: 'Departman',
      dataIndex: 'department',
      key: 'department',
      filters: departments.map(dept => ({ text: dept.name, value: dept.name })),
      onFilter: (value: boolean | React.Key, record: User) => record.department === String(value),
    },
  ];

  const filteredUsers = users.filter(user => 
    user?.name?.toLowerCase().includes(searchText.toLowerCase()) ||
    user?.email?.toLowerCase().includes(searchText.toLowerCase())
  );

  const rowSelection = {
    selectedRowKeys: selectedUsers,
    onChange: (selectedRowKeys: React.Key[]) => {
      setSelectedUsers(selectedRowKeys as string[]);
    },
  };

  const handleRoleChange = (value: string[]) => {
    setSelectedRoles(value);
  };

  const handleDepartmentChange = (value: string[]) => {
    setSelectedDepartments(value);
  };

  const renderRecipientFields = () => {
    if (dataLoading) {
      return (
        <div style={{ textAlign: 'center', padding: '50px' }}>
          <Spin size="large" />
          <div style={{ marginTop: '16px' }}>Veriler yükleniyor...</div>
        </div>
      );
    }

    switch (recipientType) {
      case 'users':
        return (
          <div style={{ marginBottom: '24px' }}>
            <Search
              placeholder="Kullanıcı ara..."
              allowClear
              enterButton={<SearchOutlined />}
              size="large"
              onChange={(e) => setSearchText(e.target.value)}
              style={{ marginBottom: '16px' }}
            />
            <Table
              rowSelection={rowSelection}
              columns={columns}
              dataSource={filteredUsers}
              rowKey="_id"
              pagination={false}
              scroll={{ y: 'calc(100vh - 400px)' }}
              loading={dataLoading}
            />
            <div style={{ marginTop: '16px' }}>
              <Tag color="blue">Seçili Kullanıcı: {selectedUsers.length}</Tag>
            </div>
          </div>
        );
      case 'roles':
        return (
          <ProFormSelect
            name="roles"
            label="Roller"
            mode="multiple"
            options={roles.map(role => ({
              label: role.description,
              value: role._id,
              key: role._id
            }))}
            fieldProps={{
              onChange: handleRoleChange
            }}
            rules={[{ required: true, message: 'Lütfen en az bir rol seçin' }]}
          />
        );
      case 'departments':
        return (
          <ProFormSelect
            name="departments"
            label="Departmanlar"
            mode="multiple"
            options={departments.map(dept => ({
              label: dept.name,
              value: dept._id
            }))}
            fieldProps={{
              onChange: handleDepartmentChange
            }}
            rules={[{ required: true, message: 'Lütfen en az bir departman seçin' }]}
          />
        );
      default:
        return null;
    }
  };

  if (dataLoading) {
    return <LoadingSpinner />;
  }

  return (
    <PageContainer
      header={{
        title: false,
        breadcrumb: { items: [] }
      }}
    >
      <ProCard>
        <Title level={3} style={{ marginBottom: '24px' }}>
          <MailOutlined /> Mail Gönder
        </Title>

        <ProForm
          form={form}
          onFinish={handleSubmit}
          submitter={{
            searchConfig: {
              submitText: 'Gönder',
              resetText: 'Temizle'
            },
            submitButtonProps: {
              loading: loading
            }
          }}
        >
          <Space style={{ marginBottom: '24px' }}>
            <Radio.Group
              value={recipientType}
              onChange={(e) => setRecipientType(e.target.value)}
              buttonStyle="solid"
            >
              <Radio.Button value="users">Kullanıcılar</Radio.Button>
              <Radio.Button value="all">Tüm Kullanıcılar</Radio.Button>
              <Radio.Button value="roles">Rollere Göre</Radio.Button>
              <Radio.Button value="departments">Departmanlara Göre</Radio.Button>
            </Radio.Group>
          </Space>

          {renderRecipientFields()}

          <ProFormText
            name="subject"
            label="Konu"
            rules={[{ required: true, message: 'Lütfen konu giriniz' }]}
          />

          <ProFormTextArea
            name="content"
            label="İçerik"
            rules={[{ required: true, message: 'Lütfen içerik giriniz' }]}
            fieldProps={{
              rows: 6
            }}
          />

          <ProFormUploadButton
            name="attachments"
            label="Dosya Ekle"
            max={5}
            fieldProps={{
              name: 'file',
              multiple: true,
              accept: '.pdf,.doc,.docx,.xls,.xlsx,.txt,.jpg,.jpeg,.png',
              listType: 'text',
              showUploadList: true,
              beforeUpload: () => false,
              onChange: (info) => {
                if (info.file.status !== 'uploading') {
                }
                if (info.file.status === 'done') {
                  message.success(`${info.file.name} dosyası başarıyla yüklendi`);
                } else if (info.file.status === 'error') {
                  message.error(`${info.file.name} dosyası yüklenemedi`);
                }
              }
            }}
            extra="PDF, Word, Excel, metin ve resim dosyaları yükleyebilirsiniz"
            title="Dosya Seç"
          >
            <Button icon={<UploadOutlined />}>Dosya Seç</Button>
          </ProFormUploadButton>
        </ProForm>
      </ProCard>
    </PageContainer>
  );
};

export default SendMail; 