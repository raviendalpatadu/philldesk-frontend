/**
 * Customer Bills and Payment Management Component
 *
 * This component allows customers to view their bills, select payment types,
 * and process online payments for their prescriptions.
 */

import React, { useState, useEffect } from "react";
import {
  Typography,
  Card,
  Table,
  Tag,
  Space,
  Button,
  Row,
  Col,
  Statistic,
  Modal,
  Form,
  Radio,
  Input,
  message,
  Descriptions,
  Divider,
  Select,
  Alert,
  Empty,
} from "antd";
import {
  DollarOutlined,
  CreditCardOutlined,
  CheckCircleOutlined,
  ClockCircleOutlined,
  ExclamationCircleOutlined,
  EyeOutlined,
  PayCircleOutlined,
  WalletOutlined,
  FileTextOutlined,
} from "@ant-design/icons";
import type { ColumnsType } from "antd/es/table";
import customerService, {
  Bill,
  PaymentData,
} from "../../services/customerService";
import { json } from "react-router-dom";

const { Title, Text } = Typography;
const { Option } = Select;

// ============================================================================
// Customer Bills Component
// ============================================================================

const CustomerBills: React.FC = () => {
  const [bills, setBills] = useState<Bill[]>([]);
  const [filteredBills, setFilteredBills] = useState<Bill[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedBill, setSelectedBill] = useState<Bill | null>(null);
  const [paymentModalVisible, setPaymentModalVisible] = useState(false);
  const [paymentTypeModalVisible, setPaymentTypeModalVisible] = useState(false);
  const [billDetailsModalVisible, setBillDetailsModalVisible] = useState(false);
  const [processingPayment, setProcessingPayment] = useState(false);
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [paymentTypeFilter, setPaymentTypeFilter] = useState<string>("all");
  const [form] = Form.useForm();

  useEffect(() => {
    fetchBills();
  }, []);

  const fetchBills = async () => {
    try {
      setLoading(true);
      console.log("Fetching bills from backend...");

      const data = await customerService.getMyBills();
      console.log("Bills data received:", data);

      setBills(data || []);
      setFilteredBills(data || []);

      if (data && data.length > 0) {
        message.success(`Loaded ${data.length} bills from backend`);
      } else {
        console.log("No bills found");
      }
    } catch (error) {
      console.error("Failed to load bills:", error);
      message.error("Failed to load bills from backend");
      setBills([]);
      setFilteredBills([]);
    } finally {
      setLoading(false);
    }
  };

  // Calculate statistics
  const stats = {
    total: bills.length,
    pending: bills.filter((b) => b.paymentStatus === "PENDING").length,
    paid: bills.filter((b) => b.paymentStatus === "PAID").length,
    totalAmount: bills.reduce((sum, bill) => sum + bill.totalAmount, 0),
    pendingAmount: bills
      .filter((b) => b.paymentStatus === "PENDING")
      .reduce((sum, bill) => sum + bill.totalAmount, 0),
  };

  // Filter bills based on status and payment type
  useEffect(() => {
    let filtered = bills;

    if (statusFilter !== "all") {
      filtered = filtered.filter((bill) => bill.paymentStatus === statusFilter);
    }

    if (paymentTypeFilter !== "all") {
      filtered = filtered.filter(
        (bill) => bill.paymentType === paymentTypeFilter
      );
    }

    setFilteredBills(filtered);
  }, [bills, statusFilter, paymentTypeFilter]);

  const handleViewDetails = async (bill: Bill) => {
    setSelectedBill(bill);
    setBillDetailsModalVisible(true);
  };

  const handleSetPaymentType = (bill: Bill) => {
    setSelectedBill(bill);
    setPaymentTypeModalVisible(true);
  };

  const handlePayOnline = (bill: Bill) => {
    setSelectedBill(bill);
    setPaymentModalVisible(true);
    form.resetFields();
  };

  const updatePaymentType = async (values: any) => {
    if (!selectedBill) return;

    try {
      console.log("Updating payment type:", values.paymentType);

      await customerService.updatePaymentType(
        selectedBill.id,
        values.paymentType
      );
      message.success("Payment type updated successfully");

      setPaymentTypeModalVisible(false);
      await fetchBills();
    } catch (error) {
      message.error("Failed to update payment type");
      console.error("Error:", error);
    }
  };

  const processPayment = async (values: any) => {
    if (!selectedBill) return;

    try {
      setProcessingPayment(true);
      console.log("Processing payment:", values);

      const paymentData: PaymentData = {
        paymentMethod: values.paymentMethod,
        cardNumber: values.cardNumber,
        cvv: values.cvv,
        expiryDate: values.expiryDate,
        cardHolderName: values.cardHolderName,
      };

      const result = await customerService.payOnline(
        selectedBill.id,
        paymentData
      );
      message.success(
        `Payment processed successfully! Transaction ID: ${result.transactionId}`
      );

      setPaymentModalVisible(false);
      form.resetFields();
      await fetchBills();
    } catch (error) {
      message.error("Payment processing failed. Please try again.");
      console.error("Error:", error);
    } finally {
      setProcessingPayment(false);
    }
  };

  // Get payment status display
  const getPaymentStatusDisplay = (status: string) => {
    switch (status) {
      case "PENDING":
        return { color: "orange", icon: <ClockCircleOutlined /> };
      case "PAID":
        return { color: "green", icon: <CheckCircleOutlined /> };
      case "PARTIALLY_PAID":
        return { color: "blue", icon: <ExclamationCircleOutlined /> };
      case "CANCELLED":
        return { color: "red", icon: <ExclamationCircleOutlined /> };
      default:
        return { color: "default", icon: <ExclamationCircleOutlined /> };
    }
  };

  // Get payment type display
  const getPaymentTypeDisplay = (type?: string) => {
    switch (type) {
      case "ONLINE":
        return {
          color: "blue",
          text: "Online Payment",
          icon: <CreditCardOutlined />,
        };
      case "PAY_ON_PICKUP":
        return {
          color: "green",
          text: "Pay on Pickup",
          icon: <WalletOutlined />,
        };
      default:
        return {
          color: "default",
          text: "Not Set",
          icon: <ExclamationCircleOutlined />,
        };
    }
  };

  // Get prescription status display for pickup tracking
  const getPrescriptionStatusDisplay = (prescription?: any) => {
    if (!prescription) return null;
    
    switch (prescription.status) {
      case "PENDING":
        return <Tag color="orange">Under Review</Tag>;
      case "APPROVED":
        return <Tag color="blue">Approved - Preparing</Tag>;
      case "READY_FOR_PICKUP":
        return <Tag color="green" icon={<ClockCircleOutlined />}>Ready for Pickup</Tag>;
      case "DISPENSED":
        return <Tag color="purple">Dispensed</Tag>;
      case "COMPLETED":
        return <Tag color="green">Completed</Tag>;
      default:
        return <Tag>{prescription.status}</Tag>;
    }
  };

  // Table columns configuration
  const columns: ColumnsType<Bill> = [
    {
      title: "Bill Number",
      dataIndex: "billNumber",
      key: "billNumber",
      render: (billNumber: string) => <Text strong>{billNumber}</Text>,
    },
    {
      title: "Items",
      key: "itemCount",
      render: (record: Bill) => (
        <Tag color="blue">
          {record.billItems ? record.billItems.length : 0} item
          {record.billItems && record.billItems.length !== 1 ? "s" : ""}
        </Tag>
      ),
      width: 80,
      align: "center",
    },
    {
      title: "Amount",
      dataIndex: "totalAmount",
      key: "totalAmount",
      render: (amount: number) => (
        <Text strong style={{ color: "#1890ff" }}>
          Rs. {amount.toFixed(2)}
        </Text>
      ),
      sorter: (a, b) => a.totalAmount - b.totalAmount,
    },
    {
      title: "Payment Status",
      dataIndex: "paymentStatus",
      key: "paymentStatus",
      render: (status: string) => {
        const { color, icon } = getPaymentStatusDisplay(status);
        return (
          <Tag icon={icon} color={color}>
            {status.replace("_", " ")}
          </Tag>
        );
      },
    },
    {
      title: "Payment Type",
      dataIndex: "paymentType",
      key: "paymentType",
      render: (type: string) => {
        const { color, text, icon } = getPaymentTypeDisplay(type);
        return (
          <Tag icon={icon} color={color}>
            {text}
          </Tag>
        );
      },
    },
    {
      title: "Order Status",
      key: "prescriptionStatus",
      render: (record: Bill) => getPrescriptionStatusDisplay(record.prescription),
    },
    {
      title: "Created Date",
      dataIndex: "createdAt",
      key: "createdAt",
      render: (date: string) => new Date(date).toLocaleDateString(),
      sorter: (a, b) =>
        new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime(),
    },
    {
      title: "Actions",
      key: "actions",
      render: (_: any, record: Bill) => (
        <Space size="small">
          <Button
            type="text"
            icon={<EyeOutlined />}
            onClick={() => handleViewDetails(record)}
            size="small"
            title="View detailed bill with prescription items"
          >
            Details
          </Button>

          {record.paymentStatus === "PENDING" && (
            <Button
              type="text"
              icon={<PayCircleOutlined />}
              onClick={() => handleSetPaymentType(record)}
              size="small"
              title="Choose payment method"
            >
              Set Payment
            </Button>
          )}

          {record.paymentStatus === "PENDING" &&
            record.paymentType === "ONLINE" && (
              <Button
                type="primary"
                size="small"
                icon={<CreditCardOutlined />}
                onClick={() => handlePayOnline(record)}
                title="Pay now with credit/debit card"
              >
                Pay Now
              </Button>
            )}
        </Space>
      ),
    },
  ];

  return (
    <div style={{ padding: "24px" }}>
      {/* Page Header */}
      <div style={{ marginBottom: "24px" }}>
        <Title level={2}>
          <DollarOutlined style={{ marginRight: "8px" }} />
          Bills & Payments
        </Title>
        <Text type="secondary">
          Manage your prescription bills and process payments.
        </Text>
      </div>

      {/* Statistics Cards */}
      <Row gutter={[16, 16]} style={{ marginBottom: "24px" }}>
        <Col xs={12} sm={6}>
          <Card>
            <Statistic
              title="Total Bills"
              value={stats.total}
              prefix={<FileTextOutlined />}
              valueStyle={{ color: "#1890ff" }}
            />
          </Card>
        </Col>
        <Col xs={12} sm={6}>
          <Card>
            <Statistic
              title="Pending Bills"
              value={stats.pending}
              prefix={<ClockCircleOutlined />}
              valueStyle={{ color: "#fa8c16" }}
            />
          </Card>
        </Col>
        <Col xs={12} sm={6}>
          <Card>
            <Statistic
              title="Paid Bills"
              value={stats.paid}
              prefix={<CheckCircleOutlined />}
              valueStyle={{ color: "#52c41a" }}
            />
          </Card>
        </Col>
        <Col xs={12} sm={6}>
          <Card>
            <Statistic
              title="Pending Amount"
              value={`Rs. ${stats.pendingAmount.toFixed(2)}`}
              prefix={<DollarOutlined />}
              valueStyle={{ color: "#f5222d" }}
            />
          </Card>
        </Col>
      </Row>

      {/* Filters */}
      <Card style={{ marginBottom: "16px" }}>
        <Row gutter={[16, 16]} align="middle">
          <Col xs={24} sm={12} md={8}>
            <Select
              placeholder="Filter by payment status"
              value={statusFilter}
              onChange={setStatusFilter}
              style={{ width: "100%" }}
            >
              <Option value="all">All Status</Option>
              <Option value="PENDING">Pending</Option>
              <Option value="PAID">Paid</Option>
              <Option value="PARTIALLY_PAID">Partially Paid</Option>
              <Option value="CANCELLED">Cancelled</Option>
            </Select>
          </Col>
          <Col xs={24} sm={12} md={8}>
            <Select
              placeholder="Filter by payment type"
              value={paymentTypeFilter}
              onChange={setPaymentTypeFilter}
              style={{ width: "100%" }}
            >
              <Option value="all">All Payment Types</Option>
              <Option value="ONLINE">Online Payment</Option>
              <Option value="PAY_ON_PICKUP">Pay on Pickup</Option>
            </Select>
          </Col>
        </Row>
      </Card>

      {/* Bills Table */}
      <Card>
        <Table
          columns={columns}
          dataSource={filteredBills}
          rowKey="id"
          loading={loading}
          pagination={{
            pageSize: 10,
            showSizeChanger: true,
            showQuickJumper: true,
            showTotal: (total, range) =>
              `${range[0]}-${range[1]} of ${total} bills`,
          }}
          locale={{
            emptyText: (
              <Empty
                image={Empty.PRESENTED_IMAGE_SIMPLE}
                description="No bills found"
              />
            ),
          }}
        />
      </Card>

      {/* Bill Details Modal */}
      <Modal
        title="Bill Details"
        open={billDetailsModalVisible}
        onCancel={() => setBillDetailsModalVisible(false)}
        footer={[
          <Button key="close" onClick={() => setBillDetailsModalVisible(false)}>
            Close
          </Button>,
          selectedBill?.paymentStatus === "PENDING" && (
            <Button
              key="setPaymentType"
              type="default"
              onClick={() => handleSetPaymentType(selectedBill)}
            >
              Set Payment Type
            </Button>
          ),
          selectedBill?.paymentStatus === "PENDING" && selectedBill?.paymentType === "ONLINE" && (
            <Button
              key="payNow"
              type="primary"
              icon={<CreditCardOutlined />}
              onClick={() => {
                setBillDetailsModalVisible(false);
                handlePayOnline(selectedBill);
              }}
            >
              Pay Now Rs. {selectedBill.totalAmount.toFixed(2)}
            </Button>
          ),
        ]}
        width={900}
      >
        {selectedBill && (
          <div>
            {/* Bill Header Information */}
            <Descriptions column={2} bordered style={{ marginBottom: "20px" }}>
              <Descriptions.Item label="Bill Number" span={2}>
                <Text strong>{selectedBill.billNumber}</Text>
              </Descriptions.Item>
              {selectedBill.prescriptionNumber && (
                <Descriptions.Item label="Prescription Number" span={2}>
                  <Text>{selectedBill.prescriptionNumber}</Text>
                </Descriptions.Item>
              )}
              <Descriptions.Item label="Payment Status" span={2}>
                <Tag
                  icon={
                    getPaymentStatusDisplay(selectedBill.paymentStatus).icon
                  }
                  color={
                    getPaymentStatusDisplay(selectedBill.paymentStatus).color
                  }
                >
                  {selectedBill.paymentStatus.replace("_", " ")}
                </Tag>
              </Descriptions.Item>
              <Descriptions.Item label="Payment Type" span={2}>
                <Tag
                  icon={getPaymentTypeDisplay(selectedBill.paymentType).icon}
                  color={getPaymentTypeDisplay(selectedBill.paymentType).color}
                >
                  {getPaymentTypeDisplay(selectedBill.paymentType).text}
                </Tag>
              </Descriptions.Item>
              {selectedBill.prescription && (
                <Descriptions.Item label="Order Status" span={2}>
                  {getPrescriptionStatusDisplay(selectedBill.prescription)}
                  {selectedBill.prescription.status === "READY_FOR_PICKUP" && 
                   selectedBill.paymentType === "PAY_ON_PICKUP" && (
                    <div style={{ marginTop: "8px" }}>
                      <Alert
                        message="Ready for Pickup"
                        description="Your prescription is ready! Please visit the pharmacy to collect your medication and complete payment."
                        type="success"
                        showIcon
                        banner
                      />
                    </div>
                  )}
                </Descriptions.Item>
              )}
              {selectedBill.paymentMethod && (
                <Descriptions.Item label="Payment Method" span={2}>
                  {selectedBill.paymentMethod}
                </Descriptions.Item>
              )}
              <Descriptions.Item label="Created">
                {new Date(selectedBill.createdAt).toLocaleString()}
              </Descriptions.Item>
              {selectedBill.paidAt && (
                <Descriptions.Item label="Paid At">
                  {new Date(selectedBill.paidAt).toLocaleString()}
                </Descriptions.Item>
              )}
              {selectedBill.notes && (
                <Descriptions.Item label="Notes" span={2}>
                  {selectedBill.notes}
                </Descriptions.Item>
              )}
            </Descriptions>

            {/* Bill Items Section */}
            {selectedBill.billItems && selectedBill.billItems.length > 0 && (
              <div style={{ marginBottom: "20px" }}>
                <Title level={4} style={{ marginBottom: "16px" }}>
                  <FileTextOutlined /> Prescribed Medications
                </Title>
                <Table
                  dataSource={selectedBill.billItems}
                  pagination={false}
                  size="small"
                  rowKey="id"
                  bordered
                  columns={[
                    {
                      title: "Medication",
                      dataIndex: "medicationName",
                      key: "medicineName",
                      render: (text: string, record: any) => (
                        <Space direction="vertical" size={2} style={{ width: '100%' }}>
                          <Text strong style={{ fontSize: '14px', color: '#262626' }}>
                            {text} | {record.strength}
                          </Text>
                          <Space size={0} wrap>
                            {record.manufacturer && (
                              <Tag color="blue" style={{ marginRight: '8px' }}>
                                {record.manufacturer}
                              </Tag>
                            )}
                            {record.batchNumber && (
                              <Tag color="orange">
                                Batch: {record.batchNumber}
                              </Tag>
                            )}
                          </Space>
                          {record.description && (
                            <Text type="secondary" style={{ fontSize: '12px', lineHeight: '1.2' }}>
                              {record.description}
                            </Text>
                          )}
                        </Space>
                      ),
                    },
                    {
                      title: "Quantity",
                      dataIndex: "quantity",
                      key: "quantity",
                      align: "center",
                      width: 100,
                    },
                    {
                      title: "Unit Price",
                      dataIndex: "unitPrice",
                      key: "unitPrice",
                      align: "right",
                      width: 120,
                      render: (price: number) => `Rs. ${price.toFixed(2)}`,
                    },
                    {
                      title: "Total",
                      dataIndex: "totalPrice",
                      key: "totalPrice",
                      align: "right",
                      width: 120,
                      render: (total: number) => (
                        <Text strong style={{ color: "#1890ff" }}>
                          Rs. {total.toFixed(2)}
                        </Text>
                      ),
                    },
                    {
                      title: "Instructions",
                      dataIndex: "instructions",
                      key: "instructions",
                      render: (instructions: string) =>
                        instructions ? (
                          <Text type="secondary" style={{ fontSize: "12px" }}>
                            {instructions}
                          </Text>
                        ) : (
                          "-"
                        ),
                    },
                  ]}
                />
              </div>
            )}

            {/* Bill Summary */}
            <Divider />
            <div
              style={{
                backgroundColor: "#f5f5f5",
                padding: "16px",
                borderRadius: "8px",
              }}
            >
              <Title level={4} style={{ marginBottom: "16px" }}>
                Bill Summary
              </Title>
              <Row gutter={[16, 8]}>
                <Col span={12}>
                  <Text>Subtotal:</Text>
                </Col>
                <Col span={12} style={{ textAlign: "right" }}>
                  <Text>Rs. {selectedBill.subtotal.toFixed(2)}</Text>
                </Col>

                <Col span={12}>
                  <Text>Discount:</Text>
                </Col>
                <Col span={12} style={{ textAlign: "right" }}>
                  <Text>- Rs. {(selectedBill.discount || 0).toFixed(2)}</Text>
                </Col>

                <Col span={12}>
                  <Text>Tax (10%):</Text>
                </Col>
                <Col span={12} style={{ textAlign: "right" }}>
                  <Text>Rs. {(selectedBill.tax || 0).toFixed(2)}</Text>
                </Col>

                <Col span={24}>
                  <Divider style={{ margin: "12px 0" }} />
                </Col>

                <Col span={12}>
                  <Text strong style={{ fontSize: "16px" }}>
                    Total Amount:
                  </Text>
                </Col>
                <Col span={12} style={{ textAlign: "right" }}>
                  <Text strong style={{ color: "#1890ff", fontSize: "18px" }}>
                    Rs. {selectedBill.totalAmount.toFixed(2)}
                  </Text>
                </Col>
              </Row>
            </div>
          </div>
        )}
      </Modal>

      {/* Payment Type Selection Modal */}
      <Modal
        title="Select Payment Type"
        open={paymentTypeModalVisible}
        onCancel={() => setPaymentTypeModalVisible(false)}
        footer={null}
        width={500}
      >
        <Form
          layout="vertical"
          onFinish={updatePaymentType}
          initialValues={{
            paymentType: selectedBill?.paymentType || "PAY_ON_PICKUP",
          }}
        >
          <Form.Item
            name="paymentType"
            label="Choose how you want to pay"
            rules={[
              { required: true, message: "Please select a payment type" },
            ]}
          >
            <Radio.Group style={{ width: "100%" }}>
              <Space direction="vertical" style={{ width: "100%" }}>
                <Radio value="PAY_ON_PICKUP" style={{ width: "100%" }}>
                  <Card
                    size="small"
                    style={{
                      margin: "8px 0",
                      border: "1px solid #d9d9d9",
                      cursor: "pointer",
                    }}
                  >
                    <Space>
                      <WalletOutlined
                        style={{ fontSize: "20px", color: "#52c41a" }}
                      />
                      <div>
                        <Text strong>Pay on Pickup</Text>
                        <br />
                        <Text type="secondary" style={{ fontSize: "12px" }}>
                          Pay when collecting your medicine at the pharmacy
                        </Text>
                      </div>
                    </Space>
                  </Card>
                </Radio>
                <Radio value="ONLINE" style={{ width: "100%" }}>
                  <Card
                    size="small"
                    style={{
                      margin: "8px 0",
                      border: "1px solid #d9d9d9",
                      cursor: "pointer",
                    }}
                  >
                    <Space>
                      <CreditCardOutlined
                        style={{ fontSize: "20px", color: "#1890ff" }}
                      />
                      <div>
                        <Text strong>Online Payment</Text>
                        <br />
                        <Text type="secondary" style={{ fontSize: "12px" }}>
                          Pay now using your credit/debit card
                        </Text>
                      </div>
                    </Space>
                  </Card>
                </Radio>
              </Space>
            </Radio.Group>
          </Form.Item>

          <Form.Item style={{ marginBottom: 0, textAlign: "right" }}>
            <Space>
              <Button onClick={() => setPaymentTypeModalVisible(false)}>
                Cancel
              </Button>
              <Button type="primary" htmlType="submit">
                Update Payment Type
              </Button>
            </Space>
          </Form.Item>
        </Form>
      </Modal>

      {/* Online Payment Modal */}
      <Modal
        title="Online Payment"
        open={paymentModalVisible}
        onCancel={() => setPaymentModalVisible(false)}
        footer={null}
        width={600}
      >
        {selectedBill && (
          <>
            <Alert
              message={`Bill Amount: Rs. ${selectedBill.totalAmount.toFixed(
                2
              )}`}
              type="info"
              showIcon
              style={{ marginBottom: "16px" }}
            />

            <Form
              form={form}
              layout="vertical"
              onFinish={processPayment}
              initialValues={{ paymentMethod: "CARD" }}
            >
              <Form.Item
                name="paymentMethod"
                label="Payment Method"
                rules={[{ required: true }]}
              >
                <Select>
                  <Option value="CARD">Credit/Debit Card</Option>
                  <Option value="BANK_TRANSFER">Bank Transfer</Option>
                </Select>
              </Form.Item>

              <Row gutter={16}>
                <Col span={24}>
                  <Form.Item
                    name="cardHolderName"
                    label="Card Holder Name"
                    rules={[
                      {
                        required: true,
                        message: "Please enter card holder name",
                      },
                    ]}
                  >
                    <Input placeholder="John Doe" />
                  </Form.Item>
                </Col>
              </Row>

              <Row gutter={16}>
                <Col span={16}>
                  <Form.Item
                    name="cardNumber"
                    label="Card Number"
                    rules={[
                      { required: true, message: "Please enter card number" },
                      { len: 16, message: "Card number must be 16 digits" },
                    ]}
                  >
                    <Input
                      placeholder="1234 5678 9012 3456"
                      maxLength={16}
                      onChange={(e) => {
                        const value = e.target.value.replace(/\D/g, "");
                        form.setFieldValue("cardNumber", value);
                      }}
                    />
                  </Form.Item>
                </Col>
                <Col span={8}>
                  <Form.Item
                    name="cvv"
                    label="CVV"
                    rules={[
                      { required: true, message: "Please enter CVV" },
                      { len: 3, message: "CVV must be 3 digits" },
                    ]}
                  >
                    <Input
                      placeholder="123"
                      maxLength={3}
                      onChange={(e) => {
                        const value = e.target.value.replace(/\D/g, "");
                        form.setFieldValue("cvv", value);
                      }}
                    />
                  </Form.Item>
                </Col>
              </Row>

              <Row gutter={16}>
                <Col span={12}>
                  <Form.Item
                    name="expiryDate"
                    label="Expiry Date (MM/YY)"
                    rules={[
                      { required: true, message: "Please enter expiry date" },
                    ]}
                  >
                    <Input
                      placeholder="12/25"
                      maxLength={5}
                      onChange={(e) => {
                        let value = e.target.value.replace(/\D/g, "");
                        if (value.length >= 2) {
                          value = value.slice(0, 2) + "/" + value.slice(2, 4);
                        }
                        form.setFieldValue("expiryDate", value);
                      }}
                    />
                  </Form.Item>
                </Col>
              </Row>

              <Divider />

              <Alert
                message="Secure Payment"
                description="Your payment information is encrypted and secure."
                type="success"
                showIcon
                style={{ marginBottom: "16px" }}
              />

              <Form.Item style={{ marginBottom: 0, textAlign: "right" }}>
                <Space>
                  <Button onClick={() => setPaymentModalVisible(false)}>
                    Cancel
                  </Button>
                  <Button
                    type="primary"
                    htmlType="submit"
                    loading={processingPayment}
                    icon={<CreditCardOutlined />}
                  >
                    {processingPayment
                      ? "Processing..."
                      : `Pay Rs. ${selectedBill.totalAmount.toFixed(2)}`}
                  </Button>
                </Space>
              </Form.Item>
            </Form>
          </>
        )}
      </Modal>
    </div>
  );
};

export default CustomerBills;
