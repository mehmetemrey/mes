import React, { useState, useEffect } from 'react';
import { Card, Progress, Button, Space, Typography, Modal, Form, Input, InputNumber, message } from 'antd';
import { PauseOutlined, PlayCircleOutlined, StopOutlined } from '@ant-design/icons';
import { jobOrderService } from '@/services/jobOrderService';
import dayjs from 'dayjs';

const { Text } = Typography;
const { TextArea } = Input;

interface InProgressProps {
  jobOrderId: string;
  onStatusChange: (status: 'Planned' | 'In Progress' | 'Completed' | 'Cancelled') => void;
}

const InProgress: React.FC<InProgressProps> = ({ jobOrderId, onStatusChange }) => {
  const [loading, setLoading] = useState(false);
  const [modalVisible, setModalVisible] = useState(false);
  const [form] = Form.useForm();
  const [messageApi, contextHolder] = message.useMessage();

  const handleStart = async () => {
    try {
      setLoading(true);
      await jobOrderService.updateJobStatus(jobOrderId, 'In Progress');
      messageApi.success('İş emri başlatıldı');
      onStatusChange('In Progress');
    } catch (error: any) {
      messageApi.error(error.message || 'İş emri başlatılırken bir hata oluştu');
    } finally {
      setLoading(false);
    }
  };

  const handlePause = () => {
    setModalVisible(true);
  };

  const handleStop = () => {
    Modal.confirm({
      title: 'İş emrini durdurmak istediğinize emin misiniz?',
      content: 'Bu işlem geri alınamaz.',
      okText: 'Evet',
      okType: 'danger',
      cancelText: 'İptal',
      onOk: async () => {
        try {
          setLoading(true);
          await jobOrderService.updateJobStatus(jobOrderId, 'Planned');
          messageApi.success('İş emri durduruldu');
          onStatusChange('Planned');
        } catch (error: any) {
          messageApi.error(error.message || 'İş emri durdurulurken bir hata oluştu');
        } finally {
          setLoading(false);
        }
      },
    });
  };

  const handlePauseSubmit = async () => {
    try {
      const values = await form.validateFields();
      setLoading(true);
      await jobOrderService.addDelay(jobOrderId, values.reason, values.duration);
      messageApi.success('İş emri duraklatıldı');
      setModalVisible(false);
      form.resetFields();
    } catch (error: any) {
      messageApi.error(error.message || 'İş emri duraklatılırken bir hata oluştu');
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      {contextHolder}
      <Card title="İş Emri Durumu" style={{ marginTop: 16 }}>
        <Space direction="vertical" style={{ width: '100%' }}>
          <Progress percent={50} status="active" />
          <Space>
            <Button
              type="primary"
              icon={<PlayCircleOutlined />}
              onClick={handleStart}
              loading={loading}
            >
              Başlat
            </Button>
            <Button
              icon={<PauseOutlined />}
              onClick={handlePause}
              loading={loading}
            >
              Duraklat
            </Button>
            <Button
              danger
              icon={<StopOutlined />}
              onClick={handleStop}
              loading={loading}
            >
              Durdur
            </Button>
          </Space>
        </Space>
      </Card>

      <Modal
        title="İş Emrini Duraklat"
        open={modalVisible}
        onOk={handlePauseSubmit}
        onCancel={() => {
          setModalVisible(false);
          form.resetFields();
        }}
        confirmLoading={loading}
      >
        <Form form={form} layout="vertical">
          <Form.Item
            name="reason"
            label="Duraklatma Nedeni"
            rules={[{ required: true, message: 'Lütfen duraklatma nedenini girin' }]}
          >
            <TextArea rows={4} placeholder="Duraklatma nedenini girin" />
          </Form.Item>
          <Form.Item
            name="duration"
            label="Duraklatma Süresi (dakika)"
            rules={[{ required: true, message: 'Lütfen duraklatma süresini girin' }]}
          >
            <InputNumber min={1} style={{ width: '100%' }} />
          </Form.Item>
        </Form>
      </Modal>
    </>
  );
};

export default InProgress; 