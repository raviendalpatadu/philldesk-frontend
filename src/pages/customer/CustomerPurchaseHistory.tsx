import React, { useState, useEffect } from 'react';
import {
  Card,
  Table,
  Tag,
  Button,
  Space,
  Typography,
  message,
  Modal,
  Descriptions,
  Row,
  Col,
  Statistic
} from 'antd';
import {
  EyeOutlined,
  DollarOutlined,
  FileTextOutlined,
  CalendarOutlined,
  CreditCardOutlined,
  ShoppingCartOutlined
} from '@ant-design/icons';
import type { ColumnsType } from 'antd/es/table';
import customerService, { Bill } from '../../services/customerService';

const { Title } = Typography;

const CustomerPurchaseHistory: React.FC = () => {
  const [bills, setBills] = useState<Bill[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedBill, setSelectedBill] = useState<Bill | null>(null);
  const [detailModalVisible, setDetailModalVisible] = useState(false);

  useEffect(() => {
    fetchPurchaseHistory();
  }, []);

  const fetchPurchaseHistory = async () => {
    try {
      setLoading(true);
      const data = await customerService.getPurchaseHistory();
      setBills(data);
    } catch (error) {
      message.error('Failed to load purchase history');
      console.error('Error:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleViewDetails = async (id: number) => {
    try {
      const bill = await customerService.getBillById(id);
      setSelectedBill(bill);
      setDetailModalVisible(true);
    } catch (error) {
      message.error('Failed to load bill details');
      console.error('Error:', error);
    }
  };

  const getPaymentStatusColor = (status: string) => {
    return customerService.getPaymentStatusColor(status);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(amount);
  };

  // Calculate summary stats
  const totalSpent = bills.reduce((sum, bill) => sum + bill.totalAmount, 0);
  const paidBills = bills.filter(bill => bill.paymentStatus === 'PAID').length;
  const pendingBills = bills.filter(bill => bill.paymentStatus === 'PENDING').length;

  const columns: ColumnsType<Bill> = [
    {
      title: 'Bill #',
      dataIndex: 'billNumber',
      key: 'billNumber',
      render: (text) => <span style={{ fontWeight: 'bold', color: '#1890ff' }}>{text}</span>
    },
    {
      title: 'Date',
      dataIndex: 'createdAt',
      key: 'createdAt',
      render: (text) => (
        <div style={{ display: 'flex', alignItems: 'center' }}>
          <CalendarOutlined style={{ marginRight: '4px', color: '#666' }} />
          {formatDate(text)}
        </div>
      )
    },
    {
      title: 'Amount',
      dataIndex: 'totalAmount',
      key: 'totalAmount',
      render: (amount) => (
        <span style={{ fontWeight: 'bold', color: '#52c41a' }}>
          {formatCurrency(amount)}
        </span>
      ),
      sorter: (a, b) => a.totalAmount - b.totalAmount
    },
    {
      title: 'Payment Status',
      dataIndex: 'paymentStatus',
      key: 'paymentStatus',
      render: (status) => (
        <Tag color={getPaymentStatusColor(status)}>
          {status.replace('_', ' ')}
        </Tag>
      ),
      filters: [
        { text: 'Paid', value: 'PAID' },
        { text: 'Pending', value: 'PENDING' },
        { text: 'Partially Paid', value: 'PARTIALLY_PAID' },
        { text: 'Cancelled', value: 'CANCELLED' }
      ],
      onFilter: (value, record) => record.paymentStatus === value
    },
    {
      title: 'Payment Method',
      dataIndex: 'paymentMethod',
      key: 'paymentMethod',
      render: (method) => method ? (
        <div style={{ display: 'flex', alignItems: 'center' }}>
          <CreditCardOutlined style={{ marginRight: '4px', color: '#666' }} />
          {method.replace('_', ' ')}
        </div>
      ) : '-'
    },
    {
      title: 'Actions',
      key: 'actions',
      render: (_, record) => (
        <Space>
          <Button
            type="link"
            size="small"
            icon={<EyeOutlined />}
            onClick={() => handleViewDetails(record.id)}
          >
            View Details
          </Button>
        </Space>
      )
    }
  ];

  return (
    <div style={{ padding: '24px' }}>
      <div style={{ marginBottom: '24px' }}>
        <Title level={2}>Purchase History</Title>
        <p style={{ color: '#666', marginBottom: 0 }}>
          View your billing and payment history
        </p>
      </div>

      {/* Summary Stats */}
      <Row gutter={[16, 16]} style={{ marginBottom: '24px' }}>
        <Col xs={24} sm={8}>
          <Card>
            <Statistic
              title="Total Spent"
              value={totalSpent}
              precision={2}
              prefix={<DollarOutlined style={{ color: '#52c41a' }} />}
              formatter={(value) => formatCurrency(Number(value))}
            />
          </Card>
        </Col>
        <Col xs={24} sm={8}>
          <Card>
            <Statistic
              title="Total Orders"
              value={bills.length}
              prefix={<ShoppingCartOutlined style={{ color: '#1890ff' }} />}
            />
          </Card>
        </Col>
        <Col xs={24} sm={8}>
          <Card>
            <Statistic
              title="Pending Payments"
              value={pendingBills}
              prefix={<FileTextOutlined style={{ color: '#fa8c16' }} />}
            />
          </Card>
        </Col>
      </Row>

      <Card>
        <Table
          columns={columns}
          dataSource={bills}
          rowKey="id"
          loading={loading}
          pagination={{
            total: bills.length,
            pageSize: 10,
            showSizeChanger: true,
            showQuickJumper: true,
            showTotal: (total, range) =>
              `${range[0]}-${range[1]} of ${total} bills`
          }}
        />
      </Card>

      {/* Bill Detail Modal */}
      <Modal
        title="Bill Details"
        open={detailModalVisible}
        onCancel={() => {
          setDetailModalVisible(false);
          setSelectedBill(null);
        }}
        footer={[
          <Button key="close" onClick={() => setDetailModalVisible(false)}>
            Close
          </Button>
        ]}
        width={800}
      >
        {selectedBill && (
          <div>
            <Descriptions bordered column={2} style={{ marginBottom: '16px' }}>
              <Descriptions.Item label="Bill Number" span={2}>
                <span style={{ fontWeight: 'bold', color: '#1890ff' }}>
                  {selectedBill.billNumber}
                </span>
              </Descriptions.Item>
              <Descriptions.Item label="Date">
                {formatDate(selectedBill.createdAt)}
              </Descriptions.Item>
              {selectedBill.paidAt && (
                <Descriptions.Item label="Paid Date">
                  {formatDate(selectedBill.paidAt)}
                </Descriptions.Item>
              )}
              <Descriptions.Item label="Subtotal">
                {formatCurrency(selectedBill.subtotal)}
              </Descriptions.Item>
              {selectedBill.discount && (
                <Descriptions.Item label="Discount">
                  {formatCurrency(selectedBill.discount)}
                </Descriptions.Item>
              )}
              {selectedBill.tax && (
                <Descriptions.Item label="Tax">
                  {formatCurrency(selectedBill.tax)}
                </Descriptions.Item>
              )}
              <Descriptions.Item label="Total Amount">
                <span style={{ fontWeight: 'bold', fontSize: '16px', color: '#52c41a' }}>
                  {formatCurrency(selectedBill.totalAmount)}
                </span>
              </Descriptions.Item>
              <Descriptions.Item label="Payment Status">
                <Tag color={getPaymentStatusColor(selectedBill.paymentStatus)}>
                  {selectedBill.paymentStatus.replace('_', ' ')}
                </Tag>
              </Descriptions.Item>
              {selectedBill.paymentMethod && (
                <Descriptions.Item label="Payment Method">
                  {selectedBill.paymentMethod.replace('_', ' ')}
                </Descriptions.Item>
              )}
              {selectedBill.prescription && (
                <Descriptions.Item label="Related Prescription" span={2}>
                  <div>
                    <div style={{ fontWeight: 'bold' }}>
                      {selectedBill.prescription.prescriptionNumber}
                    </div>
                    <div style={{ fontSize: '12px', color: '#666' }}>
                      Doctor: {selectedBill.prescription.doctorName}
                    </div>
                  </div>
                </Descriptions.Item>
              )}
              {selectedBill.notes && (
                <Descriptions.Item label="Notes" span={2}>
                  {selectedBill.notes}
                </Descriptions.Item>
              )}
            </Descriptions>
          </div>
        )}
      </Modal>
    </div>
  );
};

export default CustomerPurchaseHistory;
