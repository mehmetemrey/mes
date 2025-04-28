import React from 'react';
import { Spin } from 'antd';
import { LoadingOutlined } from '@ant-design/icons';

interface LoadingSpinnerProps {
  loading?: boolean;
}

const LoadingSpinner: React.FC<LoadingSpinnerProps> = ({ loading = true }) => {
  if (!loading) return null;

  return (
    <div
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: 'rgba(255, 255, 255, 0.8)',
        zIndex: 9999,
      }}
    >
      <Spin
        indicator={
          <LoadingOutlined
            style={{
              fontSize: 48,
              color: '#1890ff',
            }}
            spin
          />
        }
      />
    </div>
  );
};

export default LoadingSpinner; 