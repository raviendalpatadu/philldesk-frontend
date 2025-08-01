/**
 * Pharmacist Prescription Management
 *
 * This component provides comprehensive prescription management functionality for pharmacists,
 * including prescription review, approval, rejection, dispensing, and communication with customers.
 */

import React, { useState, useEffect } from "react";
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
  DatePicker,
  Modal,
  Descriptions,
  Timeline,
  message,
  Divider,
  Tooltip,
  Form,
  List,
  Avatar,
  Drawer,
  Radio,
  Checkbox,
  Tabs,
  Alert,
  Spin,
  Image,
} from "antd";
import {
  EyeOutlined,
  EditOutlined,
  CheckCircleOutlined,
  CloseCircleOutlined,
  ClockCircleOutlined,
  SearchOutlined,
  FilterOutlined,
  FileTextOutlined,
  UserOutlined,
  PhoneOutlined,
  MailOutlined,
  MedicineBoxOutlined,
  PrinterOutlined,
  MessageOutlined,
  AlertOutlined,
  QuestionCircleOutlined,
  BellOutlined,
  TeamOutlined,
  ShoppingCartOutlined,
  WarningOutlined,
  BoxPlotOutlined,
  BarChartOutlined,
  DownloadOutlined,
} from "@ant-design/icons";
import { pharmacistService } from "../../services/pharmacistService";
import {
  fileService,
  getSecureFileUrl,
  downloadFile,
  openFileInNewWindow,
} from "../../services/fileService";
import prescriptionItemsService from "../../services/prescriptionItemsService";
import { getFileUrl } from "../../config";
import PrescriptionItemsManager from "../../components/prescription/PrescriptionItemsManager";

const { Title, Text } = Typography;
const { Option } = Select;
const { RangePicker } = DatePicker;
const { TextArea } = Input;
const { TabPane } = Tabs;

const PrescriptionManagement: React.FC = () => {
  // State management
  const [prescriptions, setPrescriptions] = useState<any[]>([]);
  const [filteredPrescriptions, setFilteredPrescriptions] = useState<any[]>([]);
  const [selectedPrescription, setSelectedPrescription] = useState<any>(null);
  const [dashboardStats, setDashboardStats] = useState<any>({});
  const [inventoryData, setInventoryData] = useState<any>({});
  const [loading, setLoading] = useState(false);

  // Modal and drawer states
  const [reviewModalVisible, setReviewModalVisible] = useState(false);
  const [detailsDrawerVisible, setDetailsDrawerVisible] = useState(false);
  const [communicationModalVisible, setCommunicationModalVisible] =
    useState(false);
  const [pendingApprovalModalVisible, setPendingApprovalModalVisible] =
    useState(false);
  const [approvedTodayModalVisible, setApprovedTodayModalVisible] =
    useState(false);
  const [inventoryModalVisible, setInventoryModalVisible] = useState(false);

  // File URL management for secure authentication
  const [secureFileUrl, setSecureFileUrl] = useState<string>("");
  const [fileLoading, setFileLoading] = useState(false);

  // Filter states
  const [searchText, setSearchText] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [priorityFilter, setPriorityFilter] = useState("all");
  const [dateRange, setDateRange] = useState<any[]>([]);

  const [form] = Form.useForm();

  // Utility function to normalize prescription data structure
  const normalizePrescription = (prescription: any) => {
    // Helper function to map backend status to frontend display status
    const mapStatus = (status: string): string => {
      if (!status) return "Unknown";
      const upperStatus = status.toUpperCase();
      switch (upperStatus) {
        case "PENDING":
          return "Pending Review";
        case "APPROVED":
          return "Under Review";
        case "DISPENSED":
          return "Ready for Pickup";
        case "REJECTED":
          return "Requires Clarification";
        case "COMPLETED":
          return "Completed";
        case "READY_FOR_PICKUP":
          return "Ready for Pickup";
        default:
          // Handle legacy frontend statuses
          if (
            status === "Pending Review" ||
            status === "Under Review" ||
            status === "Ready for Pickup" ||
            status === "Requires Clarification" ||
            status === "Completed"
          ) {
            return status;
          }
          return status;
      }
    };

    return {
      ...prescription,
      prescriptionId:
        prescription.prescriptionNumber ||
        prescription.prescriptionId ||
        prescription.id,
      patientName: prescription.customer
        ? `${prescription.customer.firstName} ${prescription.customer.lastName}`
        : prescription.patientName,
      submittedDate: prescription.createdAt || prescription.submittedDate,
      prescriptionItems: prescription.prescriptionItems || [],
      status: mapStatus(prescription.status),
      totalAmount:
        prescription.totalAmount ||
        prescription.prescriptionItems?.reduce(
          (sum: number, item: any) => sum + (item.totalPrice || 0),
          0
        ) ||
        0,
    };
  };

  // Load initial data
  useEffect(() => {
    loadDashboardData();
    loadPrescriptions();
    loadInventoryData();
  }, []);

  // Cleanup blob URLs on component unmount
  useEffect(() => {
    return () => {
      if (secureFileUrl) {
        URL.revokeObjectURL(secureFileUrl);
      }
      fileService.clearCache();
    };
  }, []);

  const loadDashboardData = async () => {
    try {
      setLoading(true);
      console.log("Loading dashboard stats from backend...");

      const stats = await pharmacistService.getDashboardStats();
      console.log("Dashboard stats loaded:", stats);

      setDashboardStats(stats);
    } catch (error) {
      console.error("Failed to load dashboard stats:", error);
      message.warning("Dashboard stats unavailable - using calculated values");
      // Calculate stats from prescriptions data if available
      const calculatedStats = {
        totalPrescriptions: prescriptions.length,
        pendingReview: prescriptions.filter(
          (p) => p.status === "Pending Review"
        ).length,
        approved: prescriptions.filter((p) => p.status === "Approved").length,
        dispensed: prescriptions.filter((p) => p.status === "Dispensed").length,
        rejected: prescriptions.filter((p) => p.status === "Rejected").length,
      };
      setDashboardStats(calculatedStats);
    } finally {
      setLoading(false);
    }
  };

  const loadPrescriptions = async () => {
    try {
      setLoading(true);
      console.log("Loading prescriptions from backend...");

      const response = await pharmacistService.getAllPrescriptions({
        page: 0,
        size: 100,
        sortBy: "createdAt",
        sortDir: "desc",
      });

      console.log("Backend response:", response);

      // Handle paginated response format
      const prescriptionData = response.content || response;

      if (prescriptionData && prescriptionData.length > 0) {
        console.log(
          `Successfully loaded ${prescriptionData.length} prescriptions from backend`
        );
        setPrescriptions(prescriptionData);
        setFilteredPrescriptions(prescriptionData);
   
      } else {
        console.log("No prescriptions found in backend, using demo data");
        message.info("No prescriptions found - showing demo data");
      }
    } catch (error) {
      console.error("Failed to load prescriptions from backend:", error);
    
      message.warning("Backend unavailable - using demo data for development");
    } finally {
      setLoading(false);
    }
  };

  const loadInventoryData = async () => {
    try {
      const inventory = await pharmacistService.getInventoryData();
      setInventoryData(inventory);
    } catch (error) {
      console.warn("API call failed, using mock data for development:", error);
      // Fall back to mock data for development
    }
  };

  // Filter prescriptions based on search and filters
  const handleFilter = async () => {
    if (searchText && searchText.length > 2) {
      // Use API search for better performance
      try {
        const searchResults = await pharmacistService.searchPrescriptions(
          searchText
        );
        let filtered = searchResults;

        if (statusFilter !== "all") {
          filtered = filtered.filter((prescription) => {
            const status = prescription.status?.toUpperCase();
            const normalizedStatus = normalizePrescription(prescription).status;
            return (
              normalizedStatus === statusFilter ||
              (statusFilter === "Pending Review" && status === "PENDING") ||
              (statusFilter === "Under Review" && status === "APPROVED") ||
              (statusFilter === "Ready for Pickup" && status === "DISPENSED") ||
              (statusFilter === "Requires Clarification" &&
                status === "REJECTED") ||
              (statusFilter === "Completed" && status === "COMPLETED")
            );
          });
        }

        if (priorityFilter !== "all") {
          filtered = filtered.filter(
            (prescription) =>
              prescription.priority?.toLowerCase() ===
              priorityFilter.toLowerCase()
          );
        }

        if (dateRange && dateRange.length === 2) {
          filtered = filtered.filter((prescription) => {
            const prescriptionDate = new Date(
              prescription.submittedDate || prescription.createdAt
            );
            return (
              prescriptionDate >= dateRange[0].toDate() &&
              prescriptionDate <= dateRange[1].toDate()
            );
          });
        }

        setFilteredPrescriptions(filtered);
      } catch (error) {
        console.warn("Search API failed, using local filter:", error);
        handleLocalFilter();
      }
    } else {
      handleLocalFilter();
    }
  };

  const handleLocalFilter = () => {
    let filtered = prescriptions;

    if (searchText) {
      filtered = filtered.filter(
        (prescription) =>
          prescription.prescriptionNumber
            ?.toLowerCase()
            .includes(searchText.toLowerCase()) ||
          prescription.prescriptionId
            ?.toLowerCase()
            .includes(searchText.toLowerCase()) ||
          prescription.customer?.firstName
            ?.toLowerCase()
            .includes(searchText.toLowerCase()) ||
          prescription.customer?.lastName
            ?.toLowerCase()
            .includes(searchText.toLowerCase()) ||
          prescription.doctorName
            ?.toLowerCase()
            .includes(searchText.toLowerCase()) ||
          prescription.prescriptionItems?.some(
            (item: { medicine: { name: string } }) =>
              item.medicine?.name
                ?.toLowerCase()
                .includes(searchText.toLowerCase())
          )
      );
    }

    if (statusFilter !== "all") {
      filtered = filtered.filter((prescription) => {
        const status = prescription.status?.toUpperCase();
        const normalizedStatus = normalizePrescription(prescription).status;
        return (
          normalizedStatus === statusFilter ||
          (statusFilter === "Pending Review" && status === "PENDING") ||
          (statusFilter === "Under Review" && status === "APPROVED") ||
          (statusFilter === "Ready for Pickup" && status === "DISPENSED") ||
          (statusFilter === "Requires Clarification" &&
            status === "REJECTED") ||
          (statusFilter === "Completed" && status === "COMPLETED")
        );
      });
    }

    if (priorityFilter !== "all") {
      filtered = filtered.filter(
        (prescription) =>
          prescription.priority?.toLowerCase() === priorityFilter.toLowerCase()
      );
    }

    if (dateRange && dateRange.length === 2) {
      filtered = filtered.filter((prescription) => {
        const prescriptionDate = new Date(
          prescription.submittedDate || prescription.createdAt
        );
        return (
          prescriptionDate >= dateRange[0].toDate() &&
          prescriptionDate <= dateRange[1].toDate()
        );
      });
    }

    setFilteredPrescriptions(filtered);
  };

  // Get status display
  const getStatusDisplay = (status: string, priority: string) => {
    const statusConfigs = {
      "Pending Review": { color: "orange", icon: <ClockCircleOutlined /> },
      "Under Review": { color: "blue", icon: <EyeOutlined /> },
      Approved: { color: "green", icon: <CheckCircleOutlined /> },
      "Ready for Pickup": { color: "cyan", icon: <BellOutlined /> },
      Dispensed: { color: "green", icon: <CheckCircleOutlined /> },
      "Requires Clarification": {
        color: "red",
        icon: <QuestionCircleOutlined />,
      },
      Rejected: { color: "red", icon: <CloseCircleOutlined /> },
    };

    const priorityConfigs = {
      Emergency: { color: "red" },
      Urgent: { color: "orange" },
      Normal: { color: "blue" },
    };

    const statusConfig = statusConfigs[
      status as keyof typeof statusConfigs
    ] || { color: "default", icon: <ClockCircleOutlined /> };
    const priorityConfig = priorityConfigs[
      priority as keyof typeof priorityConfigs
    ] || { color: "default" };

    return (
      <Space direction="vertical" size="small">
        <Tag color={statusConfig.color} icon={statusConfig.icon}>
          {status}
        </Tag>
        <Tag color={priorityConfig.color}>{priority}</Tag>
      </Space>
    );
  };

  // Get priority color
  const getPriorityColor = (priority: string): string => {
    if (priority === "Emergency") return "red";
    if (priority === "Urgent") return "orange";
    return "blue";
  };

  // Handle prescription actions
  const handleReview = async (prescription: any) => {
    console.log("=== REVIEW MODAL DEBUG ===");
    console.log("Opening review for prescription:", prescription);
    console.log(
      "Prescription Items Length:",
      (prescription.prescriptionItems || []).length
    );

    try {
      // Load fresh prescription data with items if ID is available
      if (prescription.id) {
        try {
          console.log("Loading prescription items for ID:", prescription.id);
          const prescriptionItems =
            await prescriptionItemsService.getPrescriptionItems(
              prescription.id
            );
          console.log("Loaded prescription items:", prescriptionItems);

          // Update the prescription object with the loaded items
          const updatedPrescription = {
            ...prescription,
            prescriptionItems: prescriptionItems || [],
          };

          setSelectedPrescription(updatedPrescription);
          console.log("Updated prescription with items:", updatedPrescription);
        } catch (itemsError) {
          console.warn("Failed to load prescription items:", itemsError);
          // Proceed with original prescription data
          setSelectedPrescription(prescription);
        }
      } else {
        setSelectedPrescription(prescription);
      }

      setReviewModalVisible(true);
    } catch (error) {
      console.error("Error opening review modal:", error);
      message.error("Failed to open prescription review");
    }
  };

  const handleViewDetails = async (prescription: any) => {
    console.log("=== VIEW DETAILS DEBUG ===");
    console.log("Selected prescription:", prescription);
    console.log(
      "Prescription structure:",
      JSON.stringify(prescription, null, 2)
    );

    if (!prescription) {
      message.error("No prescription data available");
      return;
    }

    try {
      // Use the prescription data that already includes items from the main API call
      setSelectedPrescription(prescription);

      // Load secure file URL if fileUrl exists
      if (prescription.fileUrl) {
        setFileLoading(true);
        try {
          const secureUrl = await getSecureFileUrl(prescription.fileUrl);
          setSecureFileUrl(secureUrl);
        } catch (error) {
          console.warn(
            "Failed to load secure file URL, using fallback:",
            error
          );
          setSecureFileUrl(fileService.getFallbackUrl(prescription.fileUrl));
        } finally {
          setFileLoading(false);
        }
      } else {
        setSecureFileUrl("");
      }

      setDetailsDrawerVisible(true);
    } catch (error) {
      console.error("Error opening prescription details:", error);
      message.error("Failed to open prescription details");
    }
  };

  const handleCommunication = (prescription: any) => {
    setSelectedPrescription(prescription);
    setCommunicationModalVisible(true);
  };

  const handleApprove = async (values: any) => {
    try {
      setLoading(true);
      const reviewData = {
        decision: (values.decision || "approve") as
          | "approve"
          | "approve_hold"
          | "clarification"
          | "reject",
        notes: values.pharmacistNotes,
        estimatedReady: values.estimatedReady?.format("YYYY-MM-DD HH:mm:ss"),
      };

      const response = await pharmacistService.reviewPrescription(
        selectedPrescription.id,
        reviewData
      );

      // Enhanced message based on backend response
      if (response.billId) {
        message.success(
          `Prescription ${
            selectedPrescription.prescriptionNumber ||
            selectedPrescription.prescriptionId
          } approved successfully! Bill #${
            response.billNumber
          } has been created for the customer.`
        );
      } else if (response.existingBillId) {
        message.success(
          `Prescription ${
            selectedPrescription.prescriptionNumber ||
            selectedPrescription.prescriptionId
          } approved successfully! Bill already exists for this prescription.`
        );
      } else if (response.warning) {
        message.warning(
          `Prescription ${
            selectedPrescription.prescriptionNumber ||
            selectedPrescription.prescriptionId
          } approved, but ${response.warning}`
        );
      } else {
        message.success(
          `Prescription ${
            selectedPrescription.prescriptionNumber ||
            selectedPrescription.prescriptionId
          } reviewed successfully!`
        );
      }

      setReviewModalVisible(false);
      form.resetFields();

      // Reload data
      await loadPrescriptions();
      await loadDashboardData();
    } catch (error) {
      console.error("Failed to review prescription:", error);
      message.error("Failed to review prescription. Please try again.");
    } finally {
      setLoading(false);
      detailsDrawerVisible && setDetailsDrawerVisible(false); // Close details drawer if open
    }
  };

  const handleReject = async () => {
    try {
      setLoading(true);
      const reviewData = {
        decision: "reject" as const,
        notes: form.getFieldValue("pharmacistNotes") || "Prescription rejected",
      };

      await pharmacistService.reviewPrescription(
        selectedPrescription.id,
        reviewData
      );
      message.warning(
        `Prescription ${
          selectedPrescription.prescriptionNumber ||
          selectedPrescription.prescriptionId
        } rejected`
      );

      setReviewModalVisible(false);
      form.resetFields();

      // Reload data
      await loadPrescriptions();
      await loadDashboardData();
    } catch (error) {
      console.error("Failed to reject prescription:", error);
      message.error("Failed to reject prescription. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleMarkReady = async (prescriptionId: string) => {
    try {
      setLoading(true);
      await pharmacistService.markReadyForPickup(prescriptionId);
      message.success("Prescription marked as ready for pickup");

      // Reload data
      await loadPrescriptions();
      await loadDashboardData();
    } catch (error) {
      console.error("Failed to mark prescription as ready:", error);
      message.error("Failed to mark prescription as ready. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleComplete = async (prescriptionId: string) => {
    try {
      setLoading(true);
      await pharmacistService.completePrescription(prescriptionId);
      message.success("Prescription completed successfully");

      // Reload data
      await loadPrescriptions();
      await loadDashboardData();
    } catch (error) {
      console.error("Failed to complete prescription:", error);
      message.error("Failed to complete prescription. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  // Calculate statistics - use real data if available, fallback to calculated
  const stats = {
    total: dashboardStats.total || prescriptions.length,
    pending:
      dashboardStats.pending ||
      prescriptions.filter((p) => {
        const status = p.status?.toUpperCase();
        return status === "PENDING" || p.status === "Pending Review";
      }).length,
    underReview:
      dashboardStats.underReview ||
      prescriptions.filter((p) => {
        const status = p.status?.toUpperCase();
        return status === "APPROVED" || p.status === "Under Review";
      }).length,
    readyForPickup:
      dashboardStats.readyForPickup ||
      prescriptions.filter((p) => {
        const status = p.status?.toUpperCase();
        return status === "DISPENSED" || p.status === "Ready for Pickup";
      }).length,
    requiresClarification: prescriptions.filter((p) => {
      const status = p.status?.toUpperCase();
      return status === "REJECTED" || p.status === "Requires Clarification";
    }).length,
    emergency:
      dashboardStats.emergency ||
      prescriptions.filter((p) => p.priority === "Emergency").length,
    approvedToday:
      dashboardStats.approvedToday ||
      prescriptions.filter((p) => {
        const today = new Date();
        const submittedDate = new Date(p.submittedDate || p.createdAt);
        return (
          (p.status === "Approved" || p.status === "APPROVED") &&
          submittedDate.toDateString() === today.toDateString()
        );
      }).length,
    pendingApproval:
      dashboardStats.pendingApproval ||
      prescriptions.filter(
        (p) =>
          p.status === "Pending Review" ||
          p.status === "Under Review" ||
          p.status === "PENDING"
      ).length,
    // Inventory statistics
    totalInventoryItems:
      dashboardStats.totalInventoryItems ||
      inventoryData.medicines?.length ||
      0,
    lowStockItems:
      dashboardStats.lowStockItems || inventoryData.lowStock?.length || 0,
    outOfStockItems:
      dashboardStats.outOfStockItems || inventoryData.outOfStock?.length || 0,
    criticalLowItems:
      dashboardStats.criticalLowItems || inventoryData.criticalLow?.length || 0,
    totalInventoryValue: dashboardStats.totalInventoryValue || 0,
  };

  // Get prescriptions for specific views
  const getPendingApprovalPrescriptions = () => {
    return prescriptions
      .filter(
        (p) => p.status === "Pending Review" || p.status === "Under Review"
      )
      .sort((a, b) => {
        // Sort by priority (Emergency first) then by submission date
        if (a.priority === "Emergency" && b.priority !== "Emergency") return -1;
        if (b.priority === "Emergency" && a.priority !== "Emergency") return 1;
        if (a.priority === "Urgent" && b.priority === "Normal") return -1;
        if (b.priority === "Urgent" && a.priority === "Normal") return 1;
        return (
          new Date(a.submittedDate).getTime() -
          new Date(b.submittedDate).getTime()
        );
      });
  };

  const getApprovedTodayPrescriptions = () => {
    const today = new Date();
    return prescriptions
      .filter((p) => {
        const submittedDate = new Date(p.submittedDate);
        return (
          p.status === "Approved" &&
          submittedDate.toDateString() === today.toDateString()
        );
      })
      .sort(
        (a, b) =>
          new Date(b.submittedDate).getTime() -
          new Date(a.submittedDate).getTime()
      );
  };

  // Table columns
  const columns = [
    {
      title: "Prescription Info",
      key: "prescriptionInfo",
      width: 220,
      render: (record: any) => {
        const normalized = normalizePrescription(record);
        return (
          <Space direction="vertical" size="small">
            <Text strong>{normalized.prescriptionId}</Text>
            <Text type="secondary" style={{ fontSize: "12px" }}>
              Submitted: {new Date(normalized.submittedDate).toLocaleString()}
            </Text>
            <Text type="secondary" style={{ fontSize: "12px" }}>
              {normalized.prescriptionItems.length} prescription item(s)
            </Text>
            {(record.customerInputs?.emergencyRequest ||
              record.notes?.toLowerCase().includes("emergency")) && (
              <Tag color="red" style={{ fontSize: "10px" }}>
                Emergency
              </Tag>
            )}
            {(record.customerInputs?.patientNotes || record.notes) && (
              <Tooltip
                title={record.customerInputs?.patientNotes || record.notes}
              >
                <Tag color="blue" style={{ fontSize: "10px" }}>
                  Has Notes
                </Tag>
              </Tooltip>
            )}
          </Space>
        );
      },
    },
    {
      title: "Patient",
      key: "patient",
      width: 180,
      render: (record: any) => {
        const normalized = normalizePrescription(record);
        return (
          <Space direction="vertical" size="small">
            <Text strong>{normalized.patientName}</Text>
            <Text type="secondary" style={{ fontSize: "12px" }}>
              ID: {record.customer?.id || record.patientId}
            </Text>
          </Space>
        );
      },
    },
    {
      title: "Doctor",
      key: "doctorName",
      width: 180,
      render: (record: any) => (
        <Space direction="vertical" size="small">
          <Text strong>{record.doctorName}</Text>
          <Text type="secondary" style={{ fontSize: "12px" }}>
            {record.doctorSpecialty || "General Practice"}
          </Text>
          {record.customerInputs?.doctorNameProvided &&
            record.customerInputs.doctorNameProvided !== record.doctorName && (
              <Tooltip
                title={`Customer provided: ${record.customerInputs.doctorNameProvided}`}
              >
                <Tag color="orange" style={{ fontSize: "10px" }}>
                  Name Diff
                </Tag>
              </Tooltip>
            )}
        </Space>
      ),
    },
    {
      title: "Prescription Items",
      key: "prescriptionItems",
      width: 220,
      render: (record: any) => {
        const normalized = normalizePrescription(record);
        const prescriptionItems = normalized.prescriptionItems;

        if (!prescriptionItems || prescriptionItems.length === 0) {
          return (
            <Text type="secondary" style={{ fontSize: "12px" }}>
              No items added
            </Text>
          );
        }

        return (
          <div>
            {prescriptionItems.slice(0, 2).map((item: any, index: number) => (
              <div
                key={`${item.medicine?.name || item.id}-${index}`}
                style={{ fontSize: "12px", marginBottom: "2px" }}
              >
                <Text strong>{item.medicine?.name || "Unknown Medicine"}</Text>{" "}
                {item.medicine?.strength || ""}
                <br />
                <Text type="secondary">Qty: {item.quantity}</Text>
                {item.instructions && (
                  <Text
                    type="secondary"
                    style={{ fontSize: "10px", display: "block" }}
                  >
                    {item.instructions.length > 20
                      ? `${item.instructions.substring(0, 20)}...`
                      : item.instructions}
                  </Text>
                )}
              </div>
            ))}
            {prescriptionItems.length > 2 && (
              <Text type="secondary" style={{ fontSize: "11px" }}>
                +{prescriptionItems.length - 2} more
              </Text>
            )}
            {record.totalAmount && (
              <div
                style={{
                  marginTop: "4px",
                  paddingTop: "4px",
                  borderTop: "1px solid #f0f0f0",
                }}
              >
                <Text strong style={{ fontSize: "11px", color: "#1890ff" }}>
                  Total: ${record.totalAmount.toFixed(2)}
                </Text>
              </div>
            )}
          </div>
        );
      },
    },
    {
      title: "Status & Priority",
      key: "status",
      width: 140,
      render: (record: any) => getStatusDisplay(record.status, record.priority),
    },
    {
      title: "Actions",
      key: "actions",
      width: 250,
      render: (_: any, record: any) => {
        const normalized = normalizePrescription(record);
        // Check both normalized frontend status and raw backend status for action buttons
        const rawStatus = record.status?.toUpperCase();
        const canReview =
          rawStatus === "PENDING" || normalized.status === "Pending Review";
        const canMarkReady =
          rawStatus === "APPROVED" || normalized.status === "Under Review";
        const canComplete =
          rawStatus === "DISPENSED" || normalized.status === "Ready for Pickup";

        return (
          <Space size="small" direction="vertical">
            <Space size="small" wrap>
              <Tooltip title="View Details">
                <Button
                  type="primary"
                  ghost
                  icon={<EyeOutlined />}
                  onClick={() => {
                    console.log("View Details button clicked for:", record);
                    handleViewDetails(record);
                  }}
                  size="small"
                  style={{
                    borderColor: "#1890ff",
                    color: "#1890ff",
                    backgroundColor: "#f0f8ff",
                    minWidth: "80px",
                  }}
                >
                  Details
                </Button>
              </Tooltip>

              {canReview && (
                <Tooltip title="Review">
                  <Button
                    type="text"
                    icon={<EditOutlined />}
                    onClick={() => handleReview(record)}
                    size="small"
                  />
                </Tooltip>
              )}

              {canMarkReady && (
                <Tooltip title="Mark Ready">
                  <Button
                    type="text"
                    icon={<CheckCircleOutlined />}
                    onClick={() => handleMarkReady(record.id)}
                    size="small"
                    style={{ color: "green" }}
                  />
                </Tooltip>
              )}

              {canComplete && (
                <Tooltip title="Complete">
                  <Button
                    type="text"
                    icon={<CheckCircleOutlined />}
                    onClick={() => handleComplete(record.id)}
                    size="small"
                    style={{ color: "blue" }}
                  />
                </Tooltip>
              )}

              <Tooltip title="Contact Patient">
                <Button
                  type="text"
                  icon={<MessageOutlined />}
                  onClick={() => handleCommunication(record)}
                  size="small"
                />
              </Tooltip>

              <Tooltip title="Print">
                <Button
                  type="text"
                  icon={<PrinterOutlined />}
                  onClick={() => message.success("Prescription printed!")}
                  size="small"
                />
              </Tooltip>
            </Space>
          </Space>
        );
      },
    },
  ];

  // Apply filters when dependencies change
  useEffect(() => {
    handleFilter();
  }, [searchText, statusFilter, priorityFilter, dateRange]);

  return (
    <div style={{ padding: "24px" }}>
      {/* Header */}
      <div style={{ marginBottom: "24px" }}>
        <Title level={2}>
          <MedicineBoxOutlined style={{ marginRight: "8px" }} />
          Prescription Management
        </Title>
        <Text type="secondary">
          Review, approve, and manage patient prescriptions
        </Text>
      </div>

      {/* Statistics Cards */}
      <Row gutter={[16, 16]} style={{ marginBottom: "24px" }}>
        <Col xs={24} sm={12} md={4}>
          <Card>
            <Statistic
              title="Pending Review"
              value={stats.pending}
              prefix={<ClockCircleOutlined style={{ color: "#fa8c16" }} />}
              valueStyle={{ color: "#fa8c16" }}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} md={4}>
          <Card>
            <Statistic
              title="Approved Today"
              value={stats.approvedToday}
              prefix={<CheckCircleOutlined style={{ color: "#52c41a" }} />}
              valueStyle={{ color: "#52c41a" }}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} md={4}>
          <Card>
            <Statistic
              title="Under Review"
              value={stats.underReview}
              prefix={<EyeOutlined style={{ color: "#1890ff" }} />}
              valueStyle={{ color: "#1890ff" }}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} md={4}>
          <Card>
            <Statistic
              title="Ready for Pickup"
              value={stats.readyForPickup}
              prefix={<BellOutlined style={{ color: "#52c41a" }} />}
              valueStyle={{ color: "#52c41a" }}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} md={4}>
          <Card>
            <Statistic
              title="Need Clarification"
              value={stats.requiresClarification}
              prefix={<QuestionCircleOutlined style={{ color: "#f5222d" }} />}
              valueStyle={{ color: "#f5222d" }}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} md={4}>
          <Card>
            <Statistic
              title="Emergency"
              value={stats.emergency}
              prefix={<AlertOutlined style={{ color: "#ff4d4f" }} />}
              valueStyle={{ color: "#ff4d4f" }}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} md={4}>
          <Card>
            <Statistic
              title="Total Today"
              value={stats.total}
              prefix={<FileTextOutlined style={{ color: "#722ed1" }} />}
              valueStyle={{ color: "#722ed1" }}
            />
          </Card>
        </Col>
      </Row>

      {/* Filters */}
      <Card style={{ marginBottom: "24px" }}>
        <Row gutter={[16, 16]} align="middle">
          <Col xs={24} sm={12} md={6}>
            <Input
              placeholder="Search prescriptions, patients, doctors..."
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
              <Option value="Pending Review">Pending Review</Option>
              <Option value="Under Review">Under Review</Option>
              <Option value="Ready for Pickup">Ready for Pickup</Option>
              <Option value="Requires Clarification">
                Needs Clarification
              </Option>
            </Select>
          </Col>
          <Col xs={24} sm={12} md={4}>
            <Select
              placeholder="Priority"
              value={priorityFilter}
              onChange={setPriorityFilter}
              style={{ width: "100%" }}
            >
              <Option value="all">All Priority</Option>
              <Option value="Emergency">Emergency</Option>
              <Option value="Urgent">Urgent</Option>
              <Option value="Normal">Normal</Option>
            </Select>
          </Col>
          <Col xs={24} sm={12} md={6}>
            <RangePicker
              style={{ width: "100%" }}
              placeholder={["Start Date", "End Date"]}
              onChange={(dates) =>
                setDateRange(dates ? [dates[0], dates[1]] : [])
              }
            />
          </Col>
          <Col xs={24} sm={12} md={4}>
            <Button
              icon={<FilterOutlined />}
              onClick={() => {
                setSearchText("");
                setStatusFilter("all");
                setPriorityFilter("all");
                setDateRange([]);
                setFilteredPrescriptions(prescriptions);
              }}
              style={{ width: "100%" }}
            >
              Clear Filters
            </Button>
          </Col>
        </Row>
      </Card>

      {/* Prescriptions Table */}
      <Card>
        <Spin spinning={loading}>
          <Table
            columns={columns}
            dataSource={filteredPrescriptions}
            pagination={{
              pageSize: 10,
              showSizeChanger: true,
              showTotal: (total, range) =>
                `${range[0]}-${range[1]} of ${total} prescriptions`,
            }}
            scroll={{ x: 1200 }}
            size="middle"
            rowKey={(record) =>
              record.id || record.prescriptionId || record.key
            }
            rowClassName={(record) => {
              if (
                record.priority === "Emergency" ||
                record.notes?.toLowerCase().includes("emergency")
              )
                return "emergency-row";
              if (
                record.priority === "Urgent" ||
                record.notes?.toLowerCase().includes("urgent")
              )
                return "urgent-row";
              return "";
            }}
            locale={{
              emptyText: loading
                ? "Loading prescriptions..."
                : "No prescriptions found",
            }}
          />
        </Spin>
      </Card>

      {/* Prescription Details Drawer */}
      <Drawer
        title={
          <Space>
            <FileTextOutlined />
            Prescription Details -{" "}
            {selectedPrescription?.prescriptionNumber ||
              selectedPrescription?.prescriptionId}
          </Space>
        }
        width={800}
        open={detailsDrawerVisible}
        onClose={() => {
          setDetailsDrawerVisible(false);
          if (secureFileUrl) {
            // Clean up the blob URL when closing the drawer
            URL.revokeObjectURL(secureFileUrl);
          }
          setSecureFileUrl("");
          setFileLoading(false);
        }}
        extra={
          <Space>
            <Button onClick={() => message.success("Prescription printed!")}>
              <PrinterOutlined /> Print
            </Button>
            <Button
              type="primary"
              onClick={() => handleReview(selectedPrescription)}
              disabled={
                !["Pending Review", "Under Review", "PENDING"].includes(
                  selectedPrescription?.status
                )
              }
            >
              Review
            </Button>
          </Space>
        }
      >
        {selectedPrescription && (
          <div>
            {/* Basic Prescription Information */}
            <Card title="Prescription Details" style={{ marginBottom: "16px" }}>
              <Descriptions column={2} size="small" bordered>
                <Descriptions.Item label="Prescription Number">
                  <Text strong>{selectedPrescription.prescriptionNumber}</Text>
                </Descriptions.Item>
                <Descriptions.Item label="Status">
                  {getStatusDisplay(
                    selectedPrescription.status,
                    selectedPrescription.priority
                  )}
                </Descriptions.Item>
                <Descriptions.Item label="Priority">
                  <Tag color={getPriorityColor(selectedPrescription.priority)}>
                    {selectedPrescription.priority}
                  </Tag>
                </Descriptions.Item>
                <Descriptions.Item label="Submitted Date">
                  {new Date(
                    selectedPrescription.submittedDate ||
                      selectedPrescription.createdAt
                  ).toLocaleString()}
                </Descriptions.Item>
                <Descriptions.Item label="Last Updated">
                  {new Date(selectedPrescription.updatedAt).toLocaleString()}
                </Descriptions.Item>
                <Descriptions.Item label="Prescription Date">
                  {new Date(
                    selectedPrescription.prescriptionDate
                  ).toLocaleDateString()}
                </Descriptions.Item>
              </Descriptions>
            </Card>

            {/* Customer Information */}
            <Card title="Customer Information" style={{ marginBottom: "16px" }}>
              <Descriptions column={2} size="small" bordered>
                <Descriptions.Item label="Customer Name">
                  <Text strong>
                    {selectedPrescription.customerName ||
                      selectedPrescription.patientName}
                  </Text>
                </Descriptions.Item>
                <Descriptions.Item label="Customer ID">
                  {selectedPrescription.customerId}
                </Descriptions.Item>
                <Descriptions.Item label="Contact Info" span={2}>
                  <Text type="secondary">
                    Contact information not available in current data
                  </Text>
                </Descriptions.Item>
              </Descriptions>
            </Card>

            {/* Doctor Information */}
            <Card
              title="Prescriber Information"
              style={{ marginBottom: "16px" }}
            >
              <Descriptions column={2} size="small" bordered>
                <Descriptions.Item label="Doctor Name">
                  <Text strong>{selectedPrescription.doctorName}</Text>
                </Descriptions.Item>
                <Descriptions.Item label="Doctor License">
                  {selectedPrescription.doctorLicense || "Not provided"}
                </Descriptions.Item>
                <Descriptions.Item label="Specialty" span={2}>
                  <Text type="secondary">General Practice</Text>
                </Descriptions.Item>
              </Descriptions>
            </Card>

            {/* Prescription Files - Enhanced Live Preview */}
            <Card
              title="Uploaded Prescription"
              style={{ marginBottom: "16px" }}
            >
              {selectedPrescription.fileUrl ? (
                <div>
                  {/* File Preview Section */}
                  <div style={{ marginBottom: "16px" }}>
                    <Text
                      strong
                      style={{
                        fontSize: "16px",
                        display: "block",
                        marginBottom: "12px",
                      }}
                    >
                      Live Preview
                    </Text>

                    <div
                      style={{
                        border: "2px solid #d9d9d9",
                        borderRadius: "8px",
                        overflow: "hidden",
                        background: "#fafafa",
                        minHeight: "500px",
                      }}
                    >
                      {fileLoading ? (
                        // Loading state
                        <div
                          style={{
                            height: "500px",
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                            flexDirection: "column",
                          }}
                        >
                          <Spin size="large" />
                          <Text style={{ marginTop: "16px" }}>
                            Loading prescription file...
                          </Text>
                        </div>
                      ) : selectedPrescription.fileType
                          ?.toLowerCase()
                          .includes("jpg") ? (
                        // Image Preview
                        <div style={{ textAlign: "center", padding: "16px" }}>
                          {secureFileUrl ? (
                            <Image
                              src={secureFileUrl}
                              alt="Prescription"
                              style={{
                                maxWidth: "100%",
                                maxHeight: "500px",
                                borderRadius: "4px",
                                objectFit: "contain",
                              }}
                              placeholder={
                                <div
                                  style={{
                                    height: "200px",
                                    display: "flex",
                                    alignItems: "center",
                                    justifyContent: "center",
                                  }}
                                >
                                  <Spin size="large" />
                                </div>
                              }
                              fallback="data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAMIAAADDCAYAAADQvc6UAAABRWlDQ1BJQ0MgUHJvZmlsZQAAKJFjYGASSSwoyGFhYGDIzSspCnJ3UoiIjFJgf8LAwSDCIMogwMCcmFxc4BgQ4ANUwgCjUcG3awyMIPqyLsis7PPOq3QdDFcvjV3jOD1boQVTPQrgSkktTgbSf4A4LbmgqISBgTEFyFYuLykAsTuAbJEioKOA7DkgdjqEvQHEToKwj4DVhAQ5A9k3gGyB5IxEoBmML4BsnSQk8XQkNtReEOBxcfXxUQg1Mjc0dyHgXNJBSWpFCYh2zi+oLMpMzyhRcASGUqqCZ16yno6CkYGRAQMDKMwhqj/fAIcloxgHQqxAjIHBEugw5sUIsSQpBobtQPdLciLEVJYzMPBHMDBsayhILEqEO4DxG0txmrERhM29nYGBddr//5/DGRjYNRkY/l7////39v///y4Dmn+LgeHANwDrkl1AuO+pmgAAADhlWElmTU0AKgAAAAgAAYdpAAQAAAABAAAAGgAAAAAAAqACAAQAAAABAAAAwqADAAQAAAABAAAAwwAAAAD9b/HnAAAHlklEQVR4Ae3dP3Ik1RnG8W8tgOHBNkLYOocLFyuXC5dLJOgSCXqEi1dJgEuXSwdLl4krAi5ehMuF2qUSdG2rWzP9+dOru+fd973zP+3O7C1Jvd9+77fE9/5++fJlWZal2+3+cDgc7rxeR8fHx8vlcm+NjY8++ujaK/O3v/1t+c1vfrN4//33F999913yb7FgOBwOGRijlF4+u9evX18cp7//9a9/fWrr1KlTi49//OP3n/zud787Pz///OJnP/vZ0o8wtiOdOXNmed5i1WzYnT59ehlL+vpUDubnP//5Wt+///3/H89N/Nlnn5387NmzJ58///z5x99+++1P+h1LLxY+//LLL5fxvP/NX3/18889sHlwGV8n+Tpd6s+dO3fj7HM4HA5vMczOsYHlwVgsH15EV8n/wv/f//3fmy4+/vjju9PgcDjsXr9+/fPz585d7HR//PL69evfxtgMzW+++eby86kOYZ+C4XAY1Nzs7BxLUd++fbu89955+vVN8tz7j7/++svYb3BdQGYuMjCnwcI+BcPh8Ffd3t5efnwxlvgYfwaNJJMfBFGvCYO1wX10BpWfnYXD4fCSO8yFxe75y5cvP757dO/eyHgM+8Xjx4+Xjsybb1O7vXv37oN7JLxhLMzOJJi+ePHixe8ePnx4T3zJv4UMmBnLdJj9IY0HkM0zTr2Kl/wvt27duvHs2bPnY7K4e+fOnVud/dMeL/MbdGcGEqBxcMJjrQ9r7b0rKSoHNB6iNlMm6wILyyb+QkM0BH6Qiofoj3W9XD5XF8cZ+QwaMpNz6J/0Hu6+e3t7e3c43L375MmTZ9dOGf8w79+//9Pd3d03u93u5vX4L+K5jy/hMx4mf9XQAAAAASUVORK5CYII="
                            />
                          ) : (
                            <div
                              style={{
                                height: "400px",
                                display: "flex",
                                alignItems: "center",
                                justifyContent: "center",
                                flexDirection: "column",
                                background: "#f8f9fa",
                                borderRadius: "4px",
                                border: "2px dashed #d9d9d9",
                              }}
                            >
                              <FileTextOutlined
                                style={{
                                  fontSize: "48px",
                                  color: "#bfbfbf",
                                  marginBottom: "16px",
                                }}
                              />
                              <Text
                                type="secondary"
                                style={{
                                  fontSize: "16px",
                                  marginBottom: "8px",
                                }}
                              >
                                Unable to load image preview
                              </Text>
                              <Text
                                type="secondary"
                                style={{
                                  fontSize: "14px",
                                  marginBottom: "16px",
                                }}
                              >
                                The image file may be corrupted or access is
                                restricted
                              </Text>
                              <Space>
                                <Button
                                  type="primary"
                                  icon={<EyeOutlined />}
                                  onClick={async () => {
                                    try {
                                      await openFileInNewWindow(
                                        selectedPrescription.fileUrl
                                      );
                                    } catch (error) {
                                      console.error(
                                        "Failed to open file:",
                                        error
                                      );
                                      message.error(
                                        "Failed to open file in new window"
                                      );
                                    }
                                  }}
                                >
                                  Try Opening in New Tab
                                </Button>
                                <Button
                                  icon={<DownloadOutlined />}
                                  onClick={async () => {
                                    try {
                                      await downloadFile(
                                        selectedPrescription.fileUrl,
                                        selectedPrescription.fileName ||
                                          "prescription"
                                      );
                                    } catch (error) {
                                      console.error("Download failed:", error);
                                      message.error("Failed to download file");
                                    }
                                  }}
                                >
                                  Download
                                </Button>
                              </Space>
                            </div>
                          )}
                        </div>
                      ) : selectedPrescription.fileType
                          ?.toLowerCase()
                          .includes("pdf") ? (
                        // PDF Preview
                        <div style={{ width: "100%", height: "500px" }}>
                          <iframe
                            src={`${
                              secureFileUrl ||
                              getFileUrl(selectedPrescription.fileUrl)
                            }#toolbar=1&navpanes=1&scrollbar=1&page=1&view=FitH`}
                            width="100%"
                            height="100%"
                            style={{ border: "none" }}
                            title="Prescription PDF Preview"
                          />
                        </div>
                      ) : (
                        // Generic File Preview
                        <div
                          style={{
                            height: "400px",
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                            flexDirection: "column",
                            background: "#f8f9fa",
                            borderRadius: "4px",
                          }}
                        >
                          <FileTextOutlined
                            style={{
                              fontSize: "64px",
                              color: "#1890ff",
                              marginBottom: "16px",
                            }}
                          />
                          <Text
                            strong
                            style={{ fontSize: "18px", marginBottom: "8px" }}
                          >
                            {selectedPrescription.fileName ||
                              "Prescription File"}
                          </Text>
                          <Text
                            type="secondary"
                            style={{ fontSize: "14px", marginBottom: "16px" }}
                          >
                            File Type:{" "}
                            {selectedPrescription.fileType?.toUpperCase() ||
                              "Unknown"}
                          </Text>
                          <Space>
                            <Button
                              type="primary"
                              icon={<EyeOutlined />}
                              onClick={async () => {
                                try {
                                  await openFileInNewWindow(
                                    selectedPrescription.fileUrl
                                  );
                                } catch (error) {
                                  console.error("Failed to open file:", error);
                                  message.error(
                                    "Failed to open file in new window"
                                  );
                                }
                              }}
                            >
                              Open in New Tab
                            </Button>
                            <Button
                              icon={<DownloadOutlined />}
                              onClick={async () => {
                                try {
                                  await downloadFile(
                                    selectedPrescription.fileUrl,
                                    selectedPrescription.fileName ||
                                      "prescription"
                                  );
                                } catch (error) {
                                  console.error("Download failed:", error);
                                  message.error("Failed to download file");
                                }
                              }}
                            >
                              Download
                            </Button>
                          </Space>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* File Information and Actions */}
                  <Row gutter={16}>
                    <Col span={16}>
                      <Card size="small" title="File Information">
                        <Descriptions column={2} size="small">
                          <Descriptions.Item label="File Name">
                            <Text strong>
                              {selectedPrescription.fileName || "Unknown"}
                            </Text>
                          </Descriptions.Item>
                          <Descriptions.Item label="File Type">
                            <Tag color="blue">
                              {selectedPrescription.fileType?.toUpperCase() ||
                                "Unknown"}
                            </Tag>
                          </Descriptions.Item>
                          <Descriptions.Item label="Upload Date">
                            {new Date(
                              selectedPrescription.createdAt ||
                                selectedPrescription.submittedDate
                            ).toLocaleString()}
                          </Descriptions.Item>
                          <Descriptions.Item label="File Size">
                            <Text type="secondary">Not available</Text>
                          </Descriptions.Item>
                        </Descriptions>
                      </Card>
                    </Col>
                    <Col span={8}>
                      <Card size="small" title="Actions">
                        <Space direction="vertical" style={{ width: "100%" }}>
                          <Button
                            type="primary"
                            icon={<EyeOutlined />}
                            onClick={async () => {
                              try {
                                await openFileInNewWindow(
                                  selectedPrescription.fileUrl
                                );
                              } catch (error) {
                                console.error("Failed to open file:", error);
                                message.error(
                                  "Failed to open file in new window"
                                );
                              }
                            }}
                            block
                          >
                            View Full Screen
                          </Button>
                          <Button
                            icon={<DownloadOutlined />}
                            onClick={async () => {
                              try {
                                await downloadFile(
                                  selectedPrescription.fileUrl,
                                  selectedPrescription.fileName ||
                                    "prescription"
                                );
                              } catch (error) {
                                console.error("Download failed:", error);
                                message.error("Failed to download file");
                              }
                            }}
                            block
                          >
                            Download File
                          </Button>
                          <Button
                            icon={<PrinterOutlined />}
                            onClick={async () => {
                              try {
                                const printWindow = await openFileInNewWindow(
                                  selectedPrescription.fileUrl
                                );
                                if (printWindow) {
                                  printWindow.onload = () => {
                                    printWindow.print();
                                  };
                                }
                              } catch (error) {
                                console.error("Print failed:", error);
                                message.error("Failed to print file");
                              }
                            }}
                            block
                          >
                            Print
                          </Button>
                        </Space>
                      </Card>
                    </Col>
                  </Row>
                </div>
              ) : (
                <Alert
                  message="No prescription file uploaded"
                  description="No file was uploaded with this prescription. Please request the patient to resubmit with a clear prescription image or PDF."
                  type="warning"
                  showIcon
                  action={
                    <Button
                      size="small"
                      onClick={() => handleCommunication(selectedPrescription)}
                    >
                      Contact Patient
                    </Button>
                  }
                />
              )}
            </Card>

            {/* Customer Notes */}
            {selectedPrescription.notes && (
              <Card title="Customer Notes" style={{ marginBottom: "16px" }}>
                <Alert
                  message="Patient Notes"
                  description={
                    <div
                      style={{
                        background: "#f9f9f9",
                        padding: "12px",
                        borderRadius: "6px",
                        marginTop: "8px",
                      }}
                    >
                      {selectedPrescription.notes}
                    </div>
                  }
                  type="info"
                  showIcon
                />
              </Card>
            )}

            {/* Prescription Items Management */}
            <PrescriptionItemsManager
              prescriptionId={selectedPrescription.id}
              initialItems={selectedPrescription.prescriptionItems || []}
              prescriptionStatus={selectedPrescription.status}
              onItemsChange={(items, total) => {
                console.log(
                  "Items updated in manager:",
                  items.length,
                  "Total:",
                  total
                );

                // Update the current prescription's items locally
                setSelectedPrescription((prev: any) => ({
                  ...prev,
                  prescriptionItems: items,
                  totalAmount: total,
                }));

                // Update the prescription in the main list without full reload
                setPrescriptions((prevPrescriptions) =>
                  prevPrescriptions.map((p) =>
                    p.id === selectedPrescription.id
                      ? {
                          ...p,
                          prescriptionItems: items,
                          totalAmount: total,
                        }
                      : p
                  )
                );

                // Update filtered prescriptions as well
                setFilteredPrescriptions((prevFiltered) =>
                  prevFiltered.map((p) =>
                    p.id === selectedPrescription.id
                      ? {
                          ...p,
                          prescriptionItems: items,
                          totalAmount: total,
                        }
                      : p
                  )
                );
              }}
              editable={true}
              showHeader={true}
            />

            {/* Pharmacist Information */}
            {selectedPrescription.pharmacistName && (
              <Card
                title="Assigned Pharmacist"
                style={{ marginBottom: "16px" }}
              >
                <Descriptions column={2} size="small" bordered>
                  <Descriptions.Item label="Pharmacist">
                    {selectedPrescription.pharmacistName}
                  </Descriptions.Item>
                  <Descriptions.Item label="Pharmacist ID">
                    {selectedPrescription.pharmacistId}
                  </Descriptions.Item>
                </Descriptions>
              </Card>
            )}

            {/* Rejection Reason */}
            {selectedPrescription.rejectionReason && (
              <Card title="Rejection Details" style={{ marginBottom: "16px" }}>
                <Alert
                  message="Prescription Rejected"
                  description={selectedPrescription.rejectionReason}
                  type="error"
                  showIcon
                />
              </Card>
            )}

            {/* System Information */}
            <Card title="System Information" style={{ marginBottom: "16px" }}>
              <Descriptions column={2} size="small" bordered>
                <Descriptions.Item label="Emergency Request">
                  {selectedPrescription.customerInputs?.emergencyRequest ||
                  selectedPrescription.notes
                    ?.toLowerCase()
                    .includes("emergency") ? (
                    <Tag color="red">Emergency</Tag>
                  ) : (
                    <Tag color="blue">Regular</Tag>
                  )}
                </Descriptions.Item>
                <Descriptions.Item label="Approved At">
                  {selectedPrescription.approvedAt
                    ? new Date(selectedPrescription.approvedAt).toLocaleString()
                    : "Not yet approved"}
                </Descriptions.Item>
                <Descriptions.Item label="Created At">
                  {new Date(selectedPrescription.createdAt).toLocaleString()}
                </Descriptions.Item>
                <Descriptions.Item label="Updated At">
                  {new Date(selectedPrescription.updatedAt).toLocaleString()}
                </Descriptions.Item>
              </Descriptions>
            </Card>

            {/* Debug Information */}
            {/* {import.meta.env.DEV && (
              <Card title="Debug Information" style={{ marginBottom: "16px" }}>
                <Text code style={{ fontSize: "12px" }}>
                  <pre>{JSON.stringify(selectedPrescription, null, 2)}</pre>
                </Text>
              </Card>
            )} */}
          </div>
        )}
      </Drawer>

      {/* Review Modal */}
      <Modal
        title={
          <Space>
            <EditOutlined />
            Review Prescription - {selectedPrescription?.prescriptionId}
          </Space>
        }
        open={reviewModalVisible}
        onCancel={() => {
          setReviewModalVisible(false);
          form.resetFields();
        }}
        width={900}
        footer={null}
      >
        {selectedPrescription && (
          <div>
            {/* Customer Alert for Emergency or Important Notes */}
            {(selectedPrescription.customerInputs?.emergencyRequest ||
              selectedPrescription.customerInputs?.patientNotes
                ?.toLowerCase()
                .includes("emergency") ||
              selectedPrescription.customerInputs?.patientNotes
                ?.toLowerCase()
                .includes("urgent")) && (
              <Alert
                message="Customer Emergency Request"
                description={
                  <div>
                    <Text strong>
                      Customer marked this as emergency/urgent.
                    </Text>
                    <br />
                    <Text>
                      Patient Notes: "
                      {selectedPrescription.customerInputs?.patientNotes}"
                    </Text>
                  </div>
                }
                type="warning"
                showIcon
                style={{ marginBottom: "16px" }}
              />
            )}

            {selectedPrescription.customerInputs?.additionalInstructions && (
              <Alert
                message="Customer Instructions"
                description={
                  selectedPrescription.customerInputs.additionalInstructions
                }
                type="info"
                showIcon
                style={{ marginBottom: "16px" }}
              />
            )}

            <Form form={form} layout="vertical" onFinish={handleApprove}>
              <Tabs defaultActiveKey="customer">
                <TabPane tab="Customer Submission" key="customer">
                  <Card
                    title="Customer-Provided Information"
                    style={{ marginBottom: "16px" }}
                  >
                    <Descriptions column={1} size="small" bordered>
                      <Descriptions.Item label="Submission Type">
                        {selectedPrescription.customerInputs
                          ?.emergencyRequest ? (
                          <Space>
                            <Tag color="red">Emergency Request</Tag>
                            <Text type="danger">
                              Requires immediate attention
                            </Text>
                          </Space>
                        ) : (
                          <Tag color="blue">Regular Submission</Tag>
                        )}
                      </Descriptions.Item>
                      <Descriptions.Item label="Doctor Name (Customer Input)">
                        <Text strong>
                          {
                            selectedPrescription.customerInputs
                              ?.doctorNameProvided
                          }
                        </Text>
                      </Descriptions.Item>
                      <Descriptions.Item label="Prescription Date (Customer Input)">
                        {selectedPrescription.customerInputs
                          ?.prescriptionDateProvided
                          ? new Date(
                              selectedPrescription.customerInputs.prescriptionDateProvided
                            ).toLocaleDateString()
                          : "Not provided"}
                      </Descriptions.Item>
                      <Descriptions.Item label="Patient Notes">
                        <div
                          style={{
                            background: "#f5f5f5",
                            padding: "12px",
                            borderRadius: "6px",
                            border: "1px solid #d9d9d9",
                            minHeight: "60px",
                          }}
                        >
                          <Text>
                            {selectedPrescription.customerInputs
                              ?.patientNotes || "No notes provided"}
                          </Text>
                        </div>
                      </Descriptions.Item>
                      <Descriptions.Item label="Additional Instructions">
                        <div
                          style={{
                            background: "#f0f8ff",
                            padding: "12px",
                            borderRadius: "6px",
                            border: "1px solid #91d5ff",
                            minHeight: "60px",
                          }}
                        >
                          <Text>
                            {selectedPrescription.customerInputs
                              ?.additionalInstructions ||
                              "No additional instructions"}
                          </Text>
                        </div>
                      </Descriptions.Item>
                      <Descriptions.Item label="Uploaded Files">
                        <Space direction="vertical" style={{ width: "100%" }}>
                          {(selectedPrescription.prescriptionFiles || []).map(
                            (file: any) => (
                              <div
                                key={file.url || file.name}
                                style={{
                                  background: "#fafafa",
                                  padding: "8px",
                                  borderRadius: "4px",
                                  border: "1px solid #f0f0f0",
                                }}
                              >
                                <Space>
                                  <FileTextOutlined />
                                  <Text strong>{file.name}</Text>
                                  <Tag>{file.type}</Tag>
                                  <Text
                                    type="secondary"
                                    style={{ fontSize: "12px" }}
                                  >
                                    Uploaded:{" "}
                                    {new Date(file.uploadDate).toLocaleString()}
                                  </Text>
                                </Space>
                              </div>
                            )
                          )}
                          {(!selectedPrescription.prescriptionFiles ||
                            selectedPrescription.prescriptionFiles.length ===
                              0) && (
                            <div
                              style={{
                                background: "#f9f9f9",
                                padding: "12px",
                                borderRadius: "4px",
                                border: "1px dashed #d9d9d9",
                                textAlign: "center",
                              }}
                            >
                              <Text type="secondary">No files uploaded</Text>
                            </div>
                          )}
                        </Space>
                      </Descriptions.Item>
                    </Descriptions>
                  </Card>
                </TabPane>

                <TabPane tab="Review & Verification" key="review">
                  <Row gutter={16}>
                    <Col span={12}>
                      <Card title="Patient Safety Check" size="small">
                        <Form.Item
                          name="allergiesChecked"
                          valuePropName="checked"
                        >
                          <Checkbox>Allergies verified</Checkbox>
                        </Form.Item>
                        <Form.Item
                          name="interactionsChecked"
                          valuePropName="checked"
                        >
                          <Checkbox>Drug interactions checked</Checkbox>
                        </Form.Item>
                        <Form.Item
                          name="contraindicationsChecked"
                          valuePropName="checked"
                        >
                          <Checkbox>Contraindications reviewed</Checkbox>
                        </Form.Item>
                        <Form.Item
                          name="dosageVerified"
                          valuePropName="checked"
                        >
                          <Checkbox>Dosage verified</Checkbox>
                        </Form.Item>
                      </Card>
                    </Col>
                  </Row>

                  <Form.Item label="Pharmacist Notes" name="pharmacistNotes">
                    <TextArea
                      rows={4}
                      placeholder="Enter any notes about this prescription review..."
                    />
                  </Form.Item>

                  <Form.Item
                    label="Action Required"
                    name="action"
                    rules={[{ required: true }]}
                  >
                    <Radio.Group>
                      
                      <Radio value="approve_hold">
                        Approve & Hold for Pickup
                      </Radio>
                      
                      <Radio value="reject">Reject Prescription</Radio>
                    </Radio.Group>
                  </Form.Item>

                  <Form.Item label="Estimated Ready Time" name="estimatedReady">
                    <DatePicker showTime style={{ width: "100%" }} />
                  </Form.Item>
                </TabPane>

                <TabPane tab="Drug Information" key="druginfo">
                  {/* Show status if no items found */}
                  {(selectedPrescription.prescriptionItems || []).length ===
                    0 && (
                    <Alert
                      message="No Prescription Items Found"
                      description="No prescription items are associated with this prescription. Items may need to be added or loaded separately."
                      type="warning"
                      showIcon
                      style={{ marginBottom: "16px" }}
                    />
                  )}

                  {/* Alternative view using PrescriptionItemsManager */}
                  {selectedPrescription.id && (
                    <PrescriptionItemsManager
                      prescriptionId={selectedPrescription.id}
                      editable={false}
                      showHeader={false}
                      prescriptionStatus={selectedPrescription.status}
                    />
                  )}
                </TabPane>

                <TabPane tab="Communication" key="communication">
                  <Timeline>
                    <Timeline.Item color="blue">
                      <Text strong>Prescription Received</Text>
                      <br />
                      <Text type="secondary">
                        {new Date(
                          selectedPrescription.submittedDate
                        ).toLocaleString()}
                      </Text>
                    </Timeline.Item>
                    <Timeline.Item color="orange">
                      <Text strong>Under Review</Text>
                      <br />
                      <Text type="secondary">
                        Currently being reviewed by pharmacist
                      </Text>
                    </Timeline.Item>
                  </Timeline>

                  <Divider />

                  <Form.Item
                    label="Send Message to Patient"
                    name="patientMessage"
                  >
                    <TextArea
                      rows={3}
                      placeholder="Optional message to send to patient..."
                    />
                  </Form.Item>

                  <Form.Item label="Contact Doctor" name="doctorContact">
                    <TextArea
                      rows={3}
                      placeholder="Questions or clarifications needed from prescriber..."
                    />
                  </Form.Item>
                </TabPane>
              </Tabs>

              <Divider />

              <Row justify="end" gutter={8}>
                <Col>
                  <Button onClick={() => setReviewModalVisible(false)}>
                    Cancel
                  </Button>
                </Col>
                <Col>
                  <Button onClick={() => handleReject()}>Reject</Button>
                </Col>
                <Col>
                  <Button type="primary" htmlType="submit">
                    Approve & Process
                  </Button>
                </Col>
              </Row>
            </Form>
          </div>
        )}
      </Modal>

      {/* Communication Modal */}
      <Modal
        title={
          <Space>
            <MessageOutlined />
            Communication - {selectedPrescription?.prescriptionId}
          </Space>
        }
        open={communicationModalVisible}
        onCancel={() => setCommunicationModalVisible(false)}
        footer={[
          <Button
            key="close"
            onClick={() => setCommunicationModalVisible(false)}
          >
            Close
          </Button>,
        ]}
      >
        {selectedPrescription && (
          <Tabs defaultActiveKey="patient">
            <TabPane tab="Contact Patient" key="patient">
              <Space direction="vertical" style={{ width: "100%" }}>
                <Card size="small">
                  <Space>
                    <UserOutlined />
                    <div>
                      <Text strong>{selectedPrescription.patientName}</Text>
                      <br />
                      <Text type="secondary">{selectedPrescription.phone}</Text>
                      <br />
                      <Text type="secondary">{selectedPrescription.email}</Text>
                    </div>
                  </Space>
                </Card>

                <Button type="primary" icon={<PhoneOutlined />} block>
                  Call Patient
                </Button>

                <Button icon={<MailOutlined />} block>
                  Send Email
                </Button>

                <TextArea rows={4} placeholder="Message to patient..." />

                <Button type="primary" block>
                  Send SMS
                </Button>
              </Space>
            </TabPane>

            <TabPane tab="Contact Doctor" key="doctor">
              <Space direction="vertical" style={{ width: "100%" }}>
                <Card size="small">
                  <Space>
                    <TeamOutlined />
                    <div>
                      <Text strong>{selectedPrescription.doctorName}</Text>
                      <br />
                      <Text type="secondary">
                        {selectedPrescription.doctorSpecialty}
                      </Text>
                      <br />
                      <Text type="secondary">
                        {selectedPrescription.doctorPhone}
                      </Text>
                    </div>
                  </Space>
                </Card>

                <Button type="primary" icon={<PhoneOutlined />} block>
                  Call Doctor
                </Button>

                <Button icon={<MailOutlined />} block>
                  Send Email
                </Button>

                <TextArea
                  rows={4}
                  placeholder="Questions or clarifications needed..."
                />

                <Button type="primary" block>
                  Send Message
                </Button>
              </Space>
            </TabPane>
          </Tabs>
        )}
      </Modal>

      {/* Pending Approval Modal */}
      <Modal
        title={
          <Space>
            <ClockCircleOutlined style={{ color: "#fa8c16" }} />
            Pending Approval ({stats.pendingApproval} prescriptions)
          </Space>
        }
        open={pendingApprovalModalVisible}
        onCancel={() => setPendingApprovalModalVisible(false)}
        width={1200}
        footer={[
          <Button
            key="close"
            onClick={() => setPendingApprovalModalVisible(false)}
          >
            Close
          </Button>,
        ]}
      >
        <div style={{ maxHeight: "600px", overflowY: "auto" }}>
          {getPendingApprovalPrescriptions().length > 0 ? (
            <List
              dataSource={getPendingApprovalPrescriptions()}
              renderItem={(prescription: any) => {
                const getBackgroundColor = () => {
                  if (prescription.priority === "Emergency") return "#fff2f0";
                  if (prescription.priority === "Urgent") return "#fff7e6";
                  return "#ffffff";
                };

                const getBorderColor = () => {
                  if (prescription.priority === "Emergency")
                    return "2px solid #ff4d4f";
                  if (prescription.priority === "Urgent")
                    return "2px solid #fa8c16";
                  return "1px solid #f0f0f0";
                };

                const getAvatarColor = () => {
                  if (prescription.priority === "Emergency") return "#ff4d4f";
                  if (prescription.priority === "Urgent") return "#fa8c16";
                  return "#1890ff";
                };

                const getAvatarIcon = () => {
                  if (prescription.priority === "Emergency")
                    return <AlertOutlined />;
                  if (prescription.priority === "Urgent")
                    return <ClockCircleOutlined />;
                  return <FileTextOutlined />;
                };

                const getTagColor = () => {
                  if (prescription.priority === "Emergency") return "red";
                  if (prescription.priority === "Urgent") return "orange";
                  return "blue";
                };

                return (
                  <List.Item
                    style={{
                      background: getBackgroundColor(),
                      marginBottom: "8px",
                      padding: "16px",
                      borderRadius: "6px",
                      border: getBorderColor(),
                    }}
                    actions={[
                      <Button
                        key="review"
                        type="primary"
                        icon={<EditOutlined />}
                        onClick={() => {
                          handleReview(prescription);
                          setPendingApprovalModalVisible(false);
                        }}
                      >
                        Review Now
                      </Button>,
                      <Button
                        key="details"
                        icon={<EyeOutlined />}
                        onClick={() => {
                          handleViewDetails(prescription);
                          setPendingApprovalModalVisible(false);
                        }}
                      >
                        View Details
                      </Button>,
                    ]}
                  >
                    <List.Item.Meta
                      avatar={
                        <Avatar style={{ backgroundColor: getAvatarColor() }}>
                          {getAvatarIcon()}
                        </Avatar>
                      }
                      title={
                        <Space direction="vertical" size="small">
                          <Space>
                            <Text strong style={{ fontSize: "16px" }}>
                              {prescription.prescriptionId}
                            </Text>
                            <Tag color={getTagColor()}>
                              {prescription.priority}
                            </Tag>
                            <Tag
                              color={
                                prescription.status === "Pending Review"
                                  ? "orange"
                                  : "blue"
                              }
                            >
                              {prescription.status}
                            </Tag>
                            {prescription.customerInputs?.emergencyRequest && (
                              <Tag color="red">Customer Emergency</Tag>
                            )}
                          </Space>
                        </Space>
                      }
                      description={
                        <div>
                          <Row gutter={[16, 8]}>
                            <Col span={12}>
                              <Text strong>Doctor: </Text>
                              <Text>{prescription.doctorName}</Text>
                              <br />
                              <Text strong>Specialty: </Text>
                              <Text type="secondary">
                                {prescription.doctorSpecialty}
                              </Text>
                              <br />
                              <Text strong>Submitted: </Text>
                              <Text type="secondary">
                                {new Date(
                                  prescription.submittedDate
                                ).toLocaleString()}
                              </Text>
                            </Col>
                            <Col span={12}>
                              <Text strong>Prescription Items: </Text>
                              <Text>
                                {(prescription.prescriptionItems || []).length}{" "}
                                item(s)
                              </Text>
                              <br />
                              {(prescription.prescriptionItems || [])
                                .slice(0, 2)
                                .map((item: any, index: number) => (
                                  <div
                                    key={`${
                                      item.medicine?.name || item.id
                                    }-${index}`}
                                    style={{ fontSize: "12px" }}
                                  >
                                    • {item.medicine?.name || "Unknown"}{" "}
                                    {item.medicine?.strength || ""} (Qty:{" "}
                                    {item.quantity})
                                  </div>
                                ))}
                              {(prescription.prescriptionItems || []).length >
                                2 && (
                                <Text
                                  type="secondary"
                                  style={{ fontSize: "12px" }}
                                >
                                  +{prescription.prescriptionItems.length - 2}{" "}
                                  more items
                                </Text>
                              )}
                            </Col>
                          </Row>
                          {prescription.customerInputs?.patientNotes && (
                            <div
                              style={{
                                marginTop: "8px",
                                padding: "8px",
                                background: "#f5f5f5",
                                borderRadius: "4px",
                                borderLeft: "3px solid #1890ff",
                              }}
                            >
                              <Text strong style={{ fontSize: "12px" }}>
                                Patient Notes:{" "}
                              </Text>
                              <Text style={{ fontSize: "12px" }}>
                                {prescription.customerInputs.patientNotes}
                              </Text>
                            </div>
                          )}
                          {prescription.customerInputs
                            ?.additionalInstructions && (
                            <div
                              style={{
                                marginTop: "4px",
                                padding: "8px",
                                background: "#f0f8ff",
                                borderRadius: "4px",
                                borderLeft: "3px solid #52c41a",
                              }}
                            >
                              <Text strong style={{ fontSize: "12px" }}>
                                Instructions:{" "}
                              </Text>
                              <Text style={{ fontSize: "12px" }}>
                                {
                                  prescription.customerInputs
                                    .additionalInstructions
                                }
                              </Text>
                            </div>
                          )}
                        </div>
                      }
                    />
                  </List.Item>
                );
              }}
            />
          ) : (
            <div style={{ textAlign: "center", padding: "40px" }}>
              <CheckCircleOutlined
                style={{
                  fontSize: "48px",
                  color: "#52c41a",
                  marginBottom: "16px",
                }}
              />
              <Title level={4}>No Pending Approvals</Title>
              <Text type="secondary">
                All prescriptions have been reviewed!
              </Text>
            </div>
          )}
        </div>
      </Modal>

      {/* Approved Today Modal */}
      <Modal
        title={
          <Space>
            <CheckCircleOutlined style={{ color: "#52c41a" }} />
            Approved Today ({stats.approvedToday} prescriptions)
          </Space>
        }
        open={approvedTodayModalVisible}
        onCancel={() => setApprovedTodayModalVisible(false)}
        width={1200}
        footer={[
          <Button
            key="close"
            onClick={() => setApprovedTodayModalVisible(false)}
          >
            Close
          </Button>,
        ]}
      >
        <div style={{ maxHeight: "600px", overflowY: "auto" }}>
          {getApprovedTodayPrescriptions().length > 0 ? (
            <List
              dataSource={getApprovedTodayPrescriptions()}
              renderItem={(prescription: any) => (
                <List.Item
                  key={prescription.prescriptionId}
                  style={{
                    border: "1px solid #d9f7be",
                    borderRadius: "8px",
                    marginBottom: "12px",
                    padding: "16px",
                    backgroundColor: "#f6ffed",
                  }}
                  actions={[
                    <Button key="dispense" type="primary" size="small">
                      Mark as Dispensed
                    </Button>,
                    <Button key="details" size="small">
                      View Details
                    </Button>,
                    <Button key="print" size="small" icon={<PrinterOutlined />}>
                      Print Label
                    </Button>,
                  ]}
                >
                  <List.Item.Meta
                    avatar={
                      <Space direction="vertical" align="center">
                        <Avatar
                          style={{ backgroundColor: "#52c41a", color: "white" }}
                        >
                          {prescription.patientName.charAt(0)}
                        </Avatar>
                        <Tag color="green">APPROVED</Tag>
                      </Space>
                    }
                    title={
                      <Space>
                        <Text
                          strong
                          style={{ fontSize: "14px", color: "#1890ff" }}
                        >
                          {prescription.patientName}
                        </Text>
                      </Space>
                    }
                    description={
                      <div>
                        <Row gutter={[16, 8]}>
                          <Col span={12}>
                            <Text strong>Doctor: </Text>
                            <Text>{prescription.doctorName}</Text>
                            <br />
                            <Text strong>Specialty: </Text>
                            <Text type="secondary">
                              {prescription.doctorSpecialty}
                            </Text>
                            <br />
                            <Text strong>Approved: </Text>
                            <Text type="secondary">
                              {new Date(
                                prescription.submittedDate
                              ).toLocaleString()}
                            </Text>
                          </Col>
                          <Col span={12}>
                            <Text strong>Prescription Items: </Text>
                            <Text>
                              {(prescription.prescriptionItems || []).length}{" "}
                              item(s)
                            </Text>
                            <br />
                            {(prescription.prescriptionItems || [])
                              .slice(0, 2)
                              .map((item: any, index: number) => (
                                <div
                                  key={`${
                                    item.medicine?.name || item.id
                                  }-${index}`}
                                  style={{ fontSize: "12px" }}
                                >
                                  • {item.medicine?.name || "Unknown"}{" "}
                                  {item.medicine?.strength || ""} (Qty:{" "}
                                  {item.quantity})
                                </div>
                              ))}
                            {(prescription.prescriptionItems || []).length >
                              2 && (
                              <Text
                                type="secondary"
                                style={{ fontSize: "12px" }}
                              >
                                +
                                {(prescription.prescriptionItems || []).length -
                                  2}{" "}
                                more items
                              </Text>
                            )}
                          </Col>
                        </Row>
                        {prescription.customerInputs?.patientNotes && (
                          <div
                            style={{
                              marginTop: "8px",
                              padding: "8px",
                              background: "#f5f5f5",
                              borderRadius: "4px",
                              borderLeft: "3px solid #1890ff",
                            }}
                          >
                            <Text strong style={{ fontSize: "12px" }}>
                              Patient Notes:{" "}
                            </Text>
                            <Text style={{ fontSize: "12px" }}>
                              {prescription.customerInputs.patientNotes}
                            </Text>
                          </div>
                        )}
                        {prescription.customerInputs
                          ?.additionalInstructions && (
                          <div
                            style={{
                              marginTop: "4px",
                              padding: "8px",
                              background: "#f0f8ff",
                              borderRadius: "4px",
                              borderLeft: "3px solid #52c41a",
                            }}
                          >
                            <Text strong style={{ fontSize: "12px" }}>
                              Instructions:{" "}
                            </Text>
                            <Text style={{ fontSize: "12px" }}>
                              {
                                prescription.customerInputs
                                  .additionalInstructions
                              }
                            </Text>
                          </div>
                        )}
                      </div>
                    }
                  />
                </List.Item>
              )}
            />
          ) : (
            <div style={{ textAlign: "center", padding: "40px" }}>
              <ClockCircleOutlined
                style={{
                  fontSize: "48px",
                  color: "#fa8c16",
                  marginBottom: "16px",
                }}
              />
              <Title level={4}>No Approvals Today</Title>
              <Text type="secondary">
                No prescriptions have been approved today yet.
              </Text>
            </div>
          )}
        </div>
      </Modal>

      {/* Inventory Management Modal */}
      <Modal
        title={
          <Space>
            <BoxPlotOutlined style={{ color: "#1890ff" }} />
            Inventory Management ({stats.totalInventoryItems} items)
          </Space>
        }
        open={inventoryModalVisible}
        onCancel={() => setInventoryModalVisible(false)}
        width={1400}
        footer={[
          <Button key="close" onClick={() => setInventoryModalVisible(false)}>
            Close
          </Button>,
        ]}
      >
        <div style={{ maxHeight: "700px", overflowY: "auto" }}>
          {/* Inventory Summary Cards */}
          <Row gutter={[16, 16]} style={{ marginBottom: "24px" }}>
            <Col span={6}>
              <Card size="small">
                <Statistic
                  title="Total Items"
                  value={stats.totalInventoryItems}
                  prefix={<BoxPlotOutlined />}
                  valueStyle={{ fontSize: "18px" }}
                />
              </Card>
            </Col>
            <Col span={6}>
              <Card size="small">
                <Statistic
                  title="Low Stock"
                  value={stats.lowStockItems}
                  prefix={<WarningOutlined />}
                  valueStyle={{ fontSize: "18px", color: "#fa8c16" }}
                />
              </Card>
            </Col>
            <Col span={6}>
              <Card size="small">
                <Statistic
                  title="Out of Stock"
                  value={stats.outOfStockItems}
                  prefix={<AlertOutlined />}
                  valueStyle={{ fontSize: "18px", color: "#f5222d" }}
                />
              </Card>
            </Col>
            <Col span={6}>
              <Card size="small">
                <Statistic
                  title="Total Value"
                  value={`$${(stats.totalInventoryValue || 0).toFixed(2)}`}
                  prefix={<BarChartOutlined />}
                  valueStyle={{ fontSize: "18px", color: "#52c41a" }}
                />
              </Card>
            </Col>
          </Row>

          {/* Inventory Table */}
          <Table
            dataSource={inventoryData.medicines || []}
            rowKey="id"
            size="small"
            pagination={{ pageSize: 10 }}
            scroll={{ x: 1200 }}
            columns={[
              {
                title: "Drug Info",
                key: "drugInfo",
                width: 200,
                render: (record: any) => (
                  <Space direction="vertical" size="small">
                    <Text strong>{record.name}</Text>
                    <Text type="secondary">
                      {record.strength} {record.form}
                    </Text>
                    <Text type="secondary" style={{ fontSize: "11px" }}>
                      NDC: {record.ndc}
                    </Text>
                  </Space>
                ),
              },
              {
                title: "Stock Level",
                key: "stock",
                width: 120,
                render: (record: any) => {
                  const currentStock =
                    record.currentStock || record.quantity || 0;
                  const minimumStock =
                    record.minimumStock || record.reorderLevel || 0;
                  const maximumStock =
                    record.maximumStock || minimumStock * 5 || 100;

                  const getStockColor = () => {
                    if (currentStock === 0) return "#f5222d";
                    if (currentStock <= 5) return "#ff4d4f";
                    if (currentStock <= minimumStock) return "#fa8c16";
                    return "#52c41a";
                  };

                  return (
                    <Space direction="vertical" size="small">
                      <Text strong style={{ color: getStockColor() }}>
                        {currentStock}
                      </Text>
                      <Text type="secondary" style={{ fontSize: "11px" }}>
                        Min: {minimumStock}
                      </Text>
                      <Text type="secondary" style={{ fontSize: "11px" }}>
                        Max: {maximumStock}
                      </Text>
                    </Space>
                  );
                },
              },
              {
                title: "Status",
                key: "status",
                width: 100,
                render: (record: any) => {
                  const currentStock =
                    record.currentStock || record.quantity || 0;
                  const minimumStock =
                    record.minimumStock || record.reorderLevel || 0;

                  const getStatus = () => {
                    if (currentStock === 0) return "Out of Stock";
                    if (currentStock <= 5) return "Critical Low";
                    if (currentStock <= minimumStock) return "Low Stock";
                    return "In Stock";
                  };

                  const getStatusColor = () => {
                    const status = getStatus();
                    switch (status) {
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

                  return <Tag color={getStatusColor()}>{getStatus()}</Tag>;
                },
              },
              {
                title: "Value",
                key: "value",
                width: 100,
                render: (record: any) => {
                  const totalValue =
                    record.totalValue ||
                    record.quantity * record.unitPrice ||
                    0;
                  const unitCost =
                    record.unitCost ||
                    record.unitPrice ||
                    record.costPrice ||
                    0;

                  return (
                    <Space direction="vertical" size="small">
                      <Text strong>${totalValue.toFixed(2)}</Text>
                      <Text type="secondary" style={{ fontSize: "11px" }}>
                        Unit: ${unitCost.toFixed(2)}
                      </Text>
                    </Space>
                  );
                },
              },
              {
                title: "Location & Details",
                key: "details",
                width: 180,
                render: (record: any) => (
                  <Space direction="vertical" size="small">
                    <Text strong>{record.location || "Main Pharmacy"}</Text>
                    <Text type="secondary" style={{ fontSize: "11px" }}>
                      {record.manufacturer || "Unknown Manufacturer"}
                    </Text>
                    <Text type="secondary" style={{ fontSize: "11px" }}>
                      Category: {record.category || "General"}
                    </Text>
                  </Space>
                ),
              },
              {
                title: "Expiry & Lot",
                key: "expiry",
                width: 120,
                render: (record: any) => {
                  const expiryDate = record.expiryDate
                    ? new Date(record.expiryDate)
                    : null;
                  if (!expiryDate) {
                    return (
                      <Space direction="vertical" size="small">
                        <Text type="secondary" style={{ fontSize: "11px" }}>
                          No expiry date
                        </Text>
                        <Text type="secondary" style={{ fontSize: "10px" }}>
                          Lot: {record.batchNumber || "N/A"}
                        </Text>
                      </Space>
                    );
                  }

                  const today = new Date();
                  const daysToExpiry = Math.ceil(
                    (expiryDate.getTime() - today.getTime()) /
                      (1000 * 60 * 60 * 24)
                  );
                  const isExpiringSoon = daysToExpiry <= 90 && daysToExpiry > 0;
                  const isExpired = daysToExpiry <= 0;

                  let textColor = "inherit";
                  if (isExpired) textColor = "#f5222d";
                  else if (isExpiringSoon) textColor = "#fa8c16";

                  const lotNumbers =
                    record.lotNumbers || [record.batchNumber] || [];

                  return (
                    <Space direction="vertical" size="small">
                      <Text
                        style={{
                          color: textColor,
                          fontSize: "11px",
                        }}
                      >
                        {expiryDate.toLocaleDateString()}
                      </Text>
                      {lotNumbers.length > 0 && lotNumbers[0] && (
                        <Text type="secondary" style={{ fontSize: "10px" }}>
                          Lot: {lotNumbers[0]}
                          {lotNumbers.length > 1 &&
                            ` +${lotNumbers.length - 1}`}
                        </Text>
                      )}
                    </Space>
                  );
                },
              },
              {
                title: "Actions",
                key: "actions",
                width: 120,
                render: (record: any) => (
                  <Space direction="vertical" size="small">
                    <Button
                      size="small"
                      type="primary"
                      disabled={record.status === "In Stock"}
                    >
                      Reorder
                    </Button>
                    <Button
                      size="small"
                      onClick={() => {
                        message.info(`Viewing details for ${record.name}`);
                      }}
                    >
                      Details
                    </Button>
                  </Space>
                ),
              },
            ]}
            rowClassName={(record: any) => {
              const currentStock = record.currentStock || record.quantity || 0;
              if (currentStock === 0) return "emergency-row";
              if (currentStock <= 5) return "urgent-row";
              return "";
            }}
          />

          {/* Quick Actions */}
          <Card title="Quick Actions" style={{ marginTop: "16px" }}>
            <Row gutter={[16, 16]}>
              <Col span={6}>
                <Button
                  type="primary"
                  block
                  icon={<ShoppingCartOutlined />}
                  onClick={() => message.success("Reorder form opened")}
                >
                  Create Reorder
                </Button>
              </Col>
              <Col span={6}>
                <Button
                  block
                  icon={<WarningOutlined />}
                  onClick={() => message.info("Showing low stock report")}
                >
                  Low Stock Report
                </Button>
              </Col>
              <Col span={6}>
                <Button
                  block
                  icon={<FileTextOutlined />}
                  onClick={() => message.success("Inventory report generated")}
                >
                  Generate Report
                </Button>
              </Col>
              <Col span={6}>
                <Button
                  block
                  icon={<PrinterOutlined />}
                  onClick={() => message.success("Inventory list printed")}
                >
                  Print Inventory
                </Button>
              </Col>
            </Row>
          </Card>
        </div>
      </Modal>

      <style>{`
        .emergency-row {
          background-color: #fff2f0 !important;
          border-left: 4px solid #ff4d4f;
        }
        .urgent-row {
          background-color: #fff7e6 !important;
          border-left: 4px solid #fa8c16;
        }
      `}</style>
    </div>
  );
};

export default PrescriptionManagement;
