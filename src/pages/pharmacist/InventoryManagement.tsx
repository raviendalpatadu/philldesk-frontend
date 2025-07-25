/**
 * Pharmacist Inventory Management
 *
 * This component provides comprehensive inventory management functionality for pharmacists,
 * including stock monitoring, reorder management, and inventory analytics.
 */

import React, { useState, useEffect } from "react";
import { useLocation } from "react-router-dom";
import {
  Typography,
  Table,
  Tag,
  Button,
  Space,
  Card,
  Row,
  Col,
  Statistic,
  Input,
  Select,
  Modal,
  message,
  Tooltip,
  Spin,
  Alert,
} from "antd";
import {
  SearchOutlined,
  FilterOutlined,
  BoxPlotOutlined,
  WarningOutlined,
  AlertOutlined,
  BarChartOutlined,
  ShoppingCartOutlined,
  FileTextOutlined,
  PrinterOutlined,
  EyeOutlined,
  PlusOutlined,
} from "@ant-design/icons";
import { pharmacistService } from "../../services/pharmacistService";

const { Title, Text } = Typography;
const { Option } = Select;

const InventoryManagement: React.FC = () => {
  const location = useLocation();
  const [inventory, setInventory] = useState<any[]>([]);
  const [filteredInventory, setFilteredInventory] = useState<any[]>([]);
  const [inventoryData, setInventoryData] = useState<any>({});
  const [selectedItem, setSelectedItem] = useState<any>(null);
  const [detailsModalVisible, setDetailsModalVisible] = useState(false);
  const [reorderModalVisible, setReorderModalVisible] = useState(false);
  const [searchText, setSearchText] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [categoryFilter, setCategoryFilter] = useState("all");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Load initial data
  useEffect(() => {
    loadInventoryData();
  }, []);

  // Load inventory data from API
  const loadInventoryData = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await pharmacistService.getInventoryData();

      // Transform API data to match our component structure
      const transformedInventory = transformInventoryData(data.medicines || []);
      setInventory(transformedInventory);
      setFilteredInventory(transformedInventory);
      setInventoryData(data);
    } catch (error) {
      console.warn("API call failed, using mock data for development:", error);
      setError(
        "Failed to load inventory data from server. Using offline data."
      );     
    } finally {
      setLoading(false);
    }
  };

  // Transform inventory data to ensure consistent structure
  const transformInventoryData = (items: any[]) => {
    return items.map((item) => ({
      ...item,
      // Map API fields to component expected fields
      id:
        item.id ||
        item.medicineId ||
        `INV-${Math.random().toString(36).substr(2, 9)}`,
      currentStock: item.currentStock || item.quantity || 0,
      unitCost: item.unitCost || item.unitPrice || item.costPrice || 0,
      totalValue:
        item.totalValue ||
        (item.quantity || 0) * (item.unitPrice || item.costPrice || 0),
      minimumStock: item.minimumStock || item.reorderLevel || 0,
      maximumStock:
        item.maximumStock || (item.reorderLevel ? item.reorderLevel * 5 : 100),
      status: item.status || calculateStatus(item),
      ndc: item.id || "N/A",
      form: item.form || item.dosageForm || "Unknown",
      location: item.location || "Main Pharmacy",
      supplier: item.supplier || "Unknown Supplier",
      lastRestocked: item.lastRestocked || new Date().toISOString(),
      expiryDate:
        item.expiryDate ||
        new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString(),
      lotNumbers:
        item.lotNumbers || (item.batchNumber ? [item.batchNumber] : []),
      reorderPoint: item.reorderPoint || item.reorderLevel || 0,
      reorderQuantity:
        item.reorderQuantity ||
        (item.reorderLevel ? item.reorderLevel * 2 : 50),
    }));
  };

  // Calculate status based on stock levels if not provided
  const calculateStatus = (item: any) => {
    const stock = item.currentStock || item.quantity || 0;
    const minStock = item.minimumStock || item.reorderLevel || 0;

    if (stock === 0) return "Out of Stock";
    if (stock <= 5) return "Critical Low";
    if (stock <= minStock) return "Low Stock";
    return "In Stock";
  };

  // Handle URL parameters for filtering
  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const filter = params.get("filter");

    if (filter === "low-stock") {
      setStatusFilter("Low Stock");
    } else if (filter === "out-of-stock") {
      setStatusFilter("Out of Stock");
    } else if (filter === "critical-low") {
      setStatusFilter("Critical Low");
    }
  }, [location.search]);

  // Filter inventory based on search and filters
  const handleFilter = () => {
    let filtered = inventory;

    if (searchText) {
      filtered = filtered.filter(
        (item) =>
          item.name.toLowerCase().includes(searchText.toLowerCase()) ||
          item.category.toLowerCase().includes(searchText.toLowerCase()) ||
          item.manufacturer.toLowerCase().includes(searchText.toLowerCase())
      );
    }

    if (statusFilter !== "all") {
      filtered = filtered.filter((item) => item.status === statusFilter);
    }

    if (categoryFilter !== "all") {
      filtered = filtered.filter((item) => item.category === categoryFilter);
    }

    setFilteredInventory(filtered);
  };

  // Calculate statistics
  const stats = {
    totalItems: inventory.length,
    lowStockItems: inventory.filter(
      (item) => item.status === "Low Stock" || item.status === "Critical Low"
    ).length,
    outOfStockItems: inventory.filter((item) => item.status === "Out of Stock")
      .length,
    criticalLowItems: inventory.filter((item) => item.status === "Critical Low")
      .length,
    totalValue: inventory.reduce((total, item) => total + item.totalValue, 0),
    categoriesCount: [...new Set(inventory.map((item) => item.category))]
      .length,
  };

  // Get unique categories for filter
  const categories = [...new Set(inventory.map((item) => item.category))];

  // Table columns
  const columns = [
    {
      title: "Drug Information",
      key: "drugInfo",
      width: 250,
      render: (record: any) => (
        <Space direction="vertical" size="small">
          <Text strong>{record.name}</Text>
          <Text type="secondary">
            {record.strength} {record.form}
          </Text>
          <Text type="secondary" style={{ fontSize: "11px" }}>
            NDC: {record.ndc}
          </Text>
          <Tag color="blue" style={{ fontSize: "10px" }}>
            {record.category}
          </Tag>
        </Space>
      ),
    },
    {
      title: "Stock Status",
      key: "stock",
      width: 150,
      render: (record: any) => {
        const getStockColor = () => {
          if (record.status === "Out of Stock") return "#f5222d";
          if (record.status === "Critical Low") return "#ff4d4f";
          if (record.status === "Low Stock") return "#fa8c16";
          return "#52c41a";
        };

        const getPercentage = () => {
          return ((record.currentStock / record.maximumStock) * 100).toFixed(1);
        };

        return (
          <Space direction="vertical" size="small">
            <Text strong style={{ color: getStockColor(), fontSize: "16px" }}>
              {record.currentStock}
            </Text>
            <Text type="secondary" style={{ fontSize: "11px" }}>
              Min: {record.minimumStock} | Max: {record.maximumStock}
            </Text>
            <Text type="secondary" style={{ fontSize: "11px" }}>
              Fill: {getPercentage()}%
            </Text>
          </Space>
        );
      },
    },
    {
      title: "Status",
      key: "status",
      width: 120,
      render: (record: any) => {
        const getStatusColor = () => {
          switch (record.status) {
            case "Out of Stock":
              return "red";
            case "Critical Low":
              return "red";
            case "Low Stock":
              return "orange";
            case "In Stock":
              return "green";
            default:
              return "default";
          }
        };

        return <Tag color={getStatusColor()}>{record.status}</Tag>;
      },
    },
    {
      title: "Value & Cost",
      key: "value",
      width: 130,
      render: (record: any) => (
        <Space direction="vertical" size="small">
          <Text strong>${(record.totalValue || 0).toFixed(2)}</Text>
          <Text type="secondary" style={{ fontSize: "11px" }}>
            Unit: ${(record.unitCost || 0).toFixed(2)}
          </Text>
        </Space>
      ),
    },
    {
      title: "Location & Supplier",
      key: "location",
      width: 200,
      render: (record: any) => (
        <Space direction="vertical" size="small">
          <Text strong>{record.location}</Text>
          <Text type="secondary" style={{ fontSize: "11px" }}>
            {record.supplier}
          </Text>
          <Text type="secondary" style={{ fontSize: "11px" }}>
            {record.manufacturer}
          </Text>
        </Space>
      ),
    },
    {
      title: "Expiry & Lots",
      key: "expiry",
      width: 140,
      render: (record: any) => {
        const expiryDate = new Date(record.expiryDate);
        const today = new Date();
        const daysToExpiry = Math.ceil(
          (expiryDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24)
        );
        const isExpiringSoon = daysToExpiry <= 90 && daysToExpiry > 0;
        const isExpired = daysToExpiry <= 0;

        let textColor = "inherit";
        if (isExpired) textColor = "#f5222d";
        else if (isExpiringSoon) textColor = "#fa8c16";

        return (
          <Space direction="vertical" size="small">
            <Text
              style={{
                color: textColor,
                fontSize: "11px",
                fontWeight: isExpired || isExpiringSoon ? "bold" : "normal",
              }}
            >
              {new Date(record.expiryDate).toLocaleDateString()}
            </Text>
            {isExpiringSoon && !isExpired && (
              <Tag color="orange" style={{ fontSize: "10px" }}>
                Expiring Soon
              </Tag>
            )}
            {isExpired && (
              <Tag color="red" style={{ fontSize: "10px" }}>
                Expired
              </Tag>
            )}
            {record.lotNumbers.length > 0 && (
              <Text type="secondary" style={{ fontSize: "10px" }}>
                Lots: {record.lotNumbers.length}
              </Text>
            )}
          </Space>
        );
      },
    },
    {
      title: "Actions",
      key: "actions",
      width: 150,
      render: (record: any) => (
        <Space direction="vertical" size="small">
          <Tooltip title="View Details">
            <Button
              size="small"
              icon={<EyeOutlined />}
              onClick={() => {
                setSelectedItem(record);
                setDetailsModalVisible(true);
              }}
            />
          </Tooltip>
        </Space>
      ),
    },
  ];

  // Apply filters when dependencies change
  useEffect(() => {
    handleFilter();
  }, [searchText, statusFilter, categoryFilter]);

  return (
    <div style={{ padding: "24px" }}>
      {/* Header */}
      <div style={{ marginBottom: "24px" }}>
        <Title level={2}>
          <BoxPlotOutlined style={{ marginRight: "8px" }} />
          Inventory Management
        </Title>
        <Text type="secondary">
          Monitor stock levels, manage reorders, and track inventory across all
          categories
        </Text>
      </div>

      {/* Error Alert */}
      {error && (
        <Alert
          message="Connection Issue"
          description={error}
          type="warning"
          showIcon
          closable
          onClose={() => setError(null)}
          style={{ marginBottom: "16px" }}
          action={
            <Button size="small" type="primary" onClick={loadInventoryData}>
              Retry
            </Button>
          }
        />
      )}

      {/* Statistics Cards */}
      <Row gutter={[16, 16]} style={{ marginBottom: "24px" }}>
        <Col xs={24} sm={12} md={4}>
          <Card>
            <Statistic
              title="Total Items"
              value={stats.totalItems}
              prefix={<BoxPlotOutlined style={{ color: "#1890ff" }} />}
              valueStyle={{ color: "#1890ff" }}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} md={4}>
          <Card>
            <Statistic
              title="Low Stock"
              value={stats.lowStockItems}
              prefix={<WarningOutlined style={{ color: "#fa8c16" }} />}
              valueStyle={{ color: "#fa8c16" }}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} md={4}>
          <Card>
            <Statistic
              title="Out of Stock"
              value={stats.outOfStockItems}
              prefix={<AlertOutlined style={{ color: "#f5222d" }} />}
              valueStyle={{ color: "#f5222d" }}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} md={4}>
          <Card>
            <Statistic
              title="Critical Low"
              value={stats.criticalLowItems}
              prefix={<AlertOutlined style={{ color: "#ff4d4f" }} />}
              valueStyle={{ color: "#ff4d4f" }}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} md={4}>
          <Card>
            <Statistic
              title="Categories"
              value={stats.categoriesCount}
              prefix={<FileTextOutlined style={{ color: "#722ed1" }} />}
              valueStyle={{ color: "#722ed1" }}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} md={4}>
          <Card>
            <Statistic
              title="Total Value"
              value={`$${stats.totalValue.toFixed(2)}`}
              prefix={<BarChartOutlined style={{ color: "#52c41a" }} />}
              valueStyle={{ color: "#52c41a" }}
            />
          </Card>
        </Col>
      </Row>

      {/* Filters */}
      <Card style={{ marginBottom: "24px" }}>
        <Row gutter={[16, 16]} align="middle">
          <Col xs={24} sm={12} md={6}>
            <Input
              placeholder="Search inventory by name, NDC, category..."
              prefix={<SearchOutlined />}
              value={searchText}
              onChange={(e) => setSearchText(e.target.value)}
              allowClear
            />
          </Col>
          <Col xs={24} sm={12} md={4}>
            <Select
              placeholder="Status"
              value={statusFilter}
              onChange={setStatusFilter}
              style={{ width: "100%" }}
            >
              <Option value="all">All Status</Option>
              <Option value="In Stock">In Stock</Option>
              <Option value="Low Stock">Low Stock</Option>
              <Option value="Critical Low">Critical Low</Option>
              <Option value="Out of Stock">Out of Stock</Option>
            </Select>
          </Col>
          <Col xs={24} sm={12} md={4}>
            <Select
              placeholder="Category"
              value={categoryFilter}
              onChange={setCategoryFilter}
              style={{ width: "100%" }}
            >
              <Option value="all">All Categories</Option>
              {categories.map((category) => (
                <Option key={category} value={category}>
                  {category}
                </Option>
              ))}
            </Select>
          </Col>
          <Col xs={24} sm={12} md={4}>
            <Button
              icon={<FilterOutlined />}
              onClick={() => {
                setSearchText("");
                setStatusFilter("all");
                setCategoryFilter("all");
              }}
              style={{ width: "100%" }}
            >
              Clear Filters
            </Button>
          </Col>
        </Row>
      </Card>

      {/* Inventory Table */}
      <Card>
        <Spin spinning={loading}>
          <Table
            columns={columns}
            dataSource={filteredInventory}
            rowKey="id"
            pagination={{
              pageSize: 15,
              showSizeChanger: true,
              showTotal: (total, range) =>
                `${range[0]}-${range[1]} of ${total} items`,
            }}
            scroll={{ x: 1200 }}
            size="middle"
            rowClassName={(record) => {
              if (record.status === "Out of Stock") return "out-of-stock-row";
              if (record.status === "Critical Low") return "critical-low-row";
              if (record.status === "Low Stock") return "low-stock-row";
              return "";
            }}
            locale={{
              emptyText: loading
                ? "Loading inventory..."
                : "No inventory items found",
            }}
          />
        </Spin>
      </Card>

      {/* Item Details Modal */}
      <Modal
        title={
          <Space>
            <BoxPlotOutlined />
            Inventory Details - {selectedItem?.name}
          </Space>
        }
        open={detailsModalVisible}
        onCancel={() => setDetailsModalVisible(false)}
        width={800}
        footer={[
          <Button key="close" onClick={() => setDetailsModalVisible(false)}>
            Close
          </Button>,
          <Button
            key="reorder"
            type="primary"
            onClick={() => {
              setDetailsModalVisible(false);
              setReorderModalVisible(true);
            }}
            disabled={selectedItem?.status === "In Stock"}
          >
            Create Reorder
          </Button>,
        ]}
      >
        {selectedItem && (
          <div>
            <Row gutter={[16, 16]}>
              <Col span={12}>
                <Card title="Drug Information" size="small">
                  <p>
                    <strong>Name:</strong> {selectedItem.name}
                  </p>
                  <p>
                    <strong>Strength:</strong> {selectedItem.strength}
                  </p>
                  <p>
                    <strong>Form:</strong> {selectedItem.form}
                  </p>
                  <p>
                    <strong>NDC:</strong> {selectedItem.ndc}
                  </p>
                  <p>
                    <strong>Category:</strong> {selectedItem.category}
                  </p>
                  <p>
                    <strong>Manufacturer:</strong> {selectedItem.manufacturer}
                  </p>
                </Card>
              </Col>
              <Col span={12}>
                <Card title="Stock Information" size="small">
                  <p>
                    <strong>Current Stock:</strong> {selectedItem.currentStock}
                  </p>
                  <p>
                    <strong>Minimum Stock:</strong> {selectedItem.minimumStock}
                  </p>
                  <p>
                    <strong>Maximum Stock:</strong> {selectedItem.maximumStock}
                  </p>
                  <p>
                    <strong>Reorder Point:</strong> {selectedItem.reorderPoint}
                  </p>
                  <p>
                    <strong>Reorder Quantity:</strong>{" "}
                    {selectedItem.reorderQuantity}
                  </p>
                  <p>
                    <strong>Status:</strong>{" "}
                    <Tag
                      color={(() => {
                        if (selectedItem.status === "Out of Stock")
                          return "red";
                        if (selectedItem.status === "Critical Low")
                          return "red";
                        if (selectedItem.status === "Low Stock")
                          return "orange";
                        return "green";
                      })()}
                    >
                      {selectedItem.status}
                    </Tag>
                  </p>
                </Card>
              </Col>
              <Col span={12}>
                <Card title="Financial Information" size="small">
                  <p>
                    <strong>Unit Cost:</strong> $
                    {(selectedItem.unitCost || 0).toFixed(2)}
                  </p>
                  <p>
                    <strong>Total Value:</strong> $
                    {(selectedItem.totalValue || 0).toFixed(2)}
                  </p>
                </Card>
              </Col>
              <Col span={12}>
                <Card title="Storage & Supply" size="small">
                  <p>
                    <strong>Location:</strong> {selectedItem.location}
                  </p>
                  <p>
                    <strong>Supplier:</strong> {selectedItem.supplier}
                  </p>
                  <p>
                    <strong>Last Restocked:</strong>{" "}
                    {new Date(selectedItem.lastRestocked).toLocaleDateString()}
                  </p>
                  <p>
                    <strong>Expiry Date:</strong>{" "}
                    {new Date(selectedItem.expiryDate).toLocaleDateString()}
                  </p>
                </Card>
              </Col>
              <Col span={24}>
                <Card title="Lot Numbers" size="small">
                  {selectedItem.lotNumbers.length > 0 ? (
                    <Space wrap>
                      {selectedItem.lotNumbers.map((lot: string) => (
                        <Tag key={lot}>{lot}</Tag>
                      ))}
                    </Space>
                  ) : (
                    <Text type="secondary">No lot numbers available</Text>
                  )}
                </Card>
              </Col>
            </Row>
          </div>
        )}
      </Modal>

      {/* Reorder Modal */}
      <Modal
        title={
          <Space>
            <ShoppingCartOutlined />
            Create Reorder - {selectedItem?.name}
          </Space>
        }
        open={reorderModalVisible}
        onCancel={() => setReorderModalVisible(false)}
        onOk={() => {
          message.success(`Reorder created for ${selectedItem?.name}`);
          setReorderModalVisible(false);
        }}
        okText="Create Reorder"
      >
        {selectedItem && (
          <div>
            <p>
              <strong>Current Stock:</strong> {selectedItem.currentStock}
            </p>
            <p>
              <strong>Minimum Required:</strong> {selectedItem.minimumStock}
            </p>
            <p>
              <strong>Recommended Order:</strong> {selectedItem.reorderQuantity}
            </p>
            <p>
              <strong>Supplier:</strong> {selectedItem.supplier}
            </p>
            <p>
              <strong>Estimated Cost:</strong> $
              {(selectedItem.reorderQuantity * selectedItem.unitCost).toFixed(
                2
              )}
            </p>
          </div>
        )}
      </Modal>

      <style>{`
        .out-of-stock-row {
          background-color: #fff2f0 !important;
          border-left: 4px solid #f5222d;
        }
        .critical-low-row {
          background-color: #fff1f0 !important;
          border-left: 4px solid #ff4d4f;
        }
        .low-stock-row {
          background-color: #fff7e6 !important;
          border-left: 4px solid #fa8c16;
        }
      `}</style>
    </div>
  );
};

export default InventoryManagement;
