"use client";

import { useState, useEffect } from "react";
import {
  Button,
  Input,
  Modal,
  Table,
  Space,
  Tag,
  message,
  Typography,
  Popconfirm,
  Pagination,
} from "antd";
import {
  EditOutlined,
  DeleteOutlined,
  PlusOutlined,
  ArrowLeftOutlined,
  SettingOutlined,
  SearchOutlined,
} from "@ant-design/icons";
import Link from "next/link";

interface GeoAbbreviation {
  _id: string;
  abbreviation: string;
  full_name: string;
  created_at: string;
  updated_at: string;
}

export default function AdminPage() {
  const [data, setData] = useState<GeoAbbreviation[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<GeoAbbreviation | null>(null);
  const [newAbbreviation, setNewAbbreviation] = useState("");
  const [newFullName, setNewFullName] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [totalItems, setTotalItems] = useState(0);

  // 密码保护相关
  const [showContent, setShowContent] = useState(false);
  const [password, setPassword] = useState("");
  const [passwordError, setPasswordError] = useState("");
  const ADMIN_PASSWORD = process.env.NEXT_PUBLIC_ADMIN_PASSWORD || "";

  const fetchData = async () => {
    setIsLoading(true);
    try {
      const params = new URLSearchParams({
        page: currentPage.toString(),
        pageSize: pageSize.toString(),
      });
      if (searchQuery) {
        params.append("adminSearch", searchQuery);
      }
      const response = await fetch(`/api/abbreviations?${params.toString()}`);
      const result = await response.json();

      if (result.success) {
        setData(result.data);
        setTotalItems(result.total);
      } else {
        message.error(result.error || "未知错误");
      }
    } catch (error) {
      message.error("网络错误，请稍后重试");
    } finally {
      setIsLoading(false);
    }
  };

  const handleAdd = async () => {
    if (!newAbbreviation.trim() || !newFullName.trim()) {
      message.error("请填写完整信息");
      return;
    }

    try {
      const response = await fetch("/api/abbreviations", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          abbreviation: newAbbreviation,
          fullName: newFullName,
        }),
      });

      const result = await response.json();

      if (result.success) {
        message.success(`已添加 ${newAbbreviation} -> ${newFullName}`);
        setNewAbbreviation("");
        setNewFullName("");
        setIsAddModalOpen(false);
        fetchData();
      } else {
        message.error(result.error || "未知错误");
      }
    } catch (error) {
      message.error("网络错误，请稍后重试");
    }
  };

  const handleEdit = async () => {
    if (
      !editingItem ||
      !editingItem.abbreviation.trim() ||
      !editingItem.full_name.trim()
    ) {
      message.error("请填写完整信息");
      return;
    }

    try {
      const response = await fetch("/api/abbreviations", {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          id: editingItem._id,
          abbreviation: editingItem.abbreviation,
          fullName: editingItem.full_name,
        }),
      });

      const result = await response.json();

      if (result.success) {
        message.success(
          `已更新 ${editingItem.abbreviation} -> ${editingItem.full_name}`
        );
        setEditingItem(null);
        setIsEditModalOpen(false);
        fetchData();
      } else {
        message.error(result.error || "未知错误");
      }
    } catch (error) {
      message.error("网络错误，请稍后重试");
    }
  };

  const handleDelete = async (id: string, abbreviation: string) => {
    try {
      console.log("Attempting to delete ID:", id);
      const response = await fetch(`/api/abbreviations?id=${id}`, {
        method: "DELETE",
      });

      const result = await response.json();
      console.log("Delete response from server:", result);

      if (result.success) {
        message.success(`已删除: ${abbreviation}`);
        fetchData();
      } else {
        message.error(result.error || "未知错误");
      }
    } catch (error) {
      console.error("Delete fetch error:", error);
      message.error("网络错误，请稍后重试");
    }
  };

  const openEditModal = (item: GeoAbbreviation) => {
    setEditingItem({ ...item });
    setIsEditModalOpen(true);
  };

  useEffect(() => {
    if (showContent) fetchData();
  }, [showContent, currentPage, pageSize, searchQuery]);

  if (!showContent) {
    return (
      <div
        style={{
          minHeight: "100vh",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        <div
          style={{
            background: "#fff",
            padding: 32,
            borderRadius: 8,
            boxShadow: "0 2px 8px rgba(0,0,0,0.1)",
            maxWidth: 360,
            width: "100%",
          }}
        >
          <Typography.Title
            level={3}
            style={{ textAlign: "center", marginBottom: 24 }}
          >
            请输入管理员密码
          </Typography.Title>
          <Input
            type="password"
            placeholder="密码"
            value={password}
            onChange={(e) => {
              setPassword(e.target.value);
              setPasswordError("");
            }}
            onPressEnter={(e) => {
              if (password === ADMIN_PASSWORD) {
                setShowContent(true);
              } else {
                setPasswordError("密码错误");
              }
            }}
            style={{ marginBottom: 16 }}
          />
          <Button
            type="primary"
            block
            onClick={() => {
              if (password === ADMIN_PASSWORD) {
                setShowContent(true);
              } else {
                setPasswordError("密码错误");
              }
            }}
          >
            进入
          </Button>
          {passwordError && (
            <div
              style={{
                color: "red",
                fontSize: 12,
                marginTop: 8,
                textAlign: "center",
              }}
            >
              {passwordError}
            </div>
          )}
        </div>
      </div>
    );
  }

  const columns = [
    {
      title: "简写",
      dataIndex: "abbreviation",
      key: "abbreviation",
      sorter: (a: GeoAbbreviation, b: GeoAbbreviation) =>
        a.abbreviation.localeCompare(b.abbreviation),
      render: (text: string) => <Tag color="blue">{text}</Tag>,
    },
    {
      title: "全称",
      dataIndex: "full_name",
      key: "full_name",
      sorter: (a: GeoAbbreviation, b: GeoAbbreviation) =>
        a.full_name.localeCompare(b.full_name),
    },
    {
      title: "添加时间",
      dataIndex: "created_at",
      key: "created_at",
      sorter: (a: GeoAbbreviation, b: GeoAbbreviation) =>
        new Date(a.created_at).getTime() - new Date(b.created_at).getTime(),
      render: (text: string) => new Date(text).toLocaleString(),
    },
    {
      title: "操作",
      key: "action",
      render: (_: any, record: GeoAbbreviation) => (
        <Space size="middle">
          <Button
            icon={<EditOutlined />}
            onClick={() => openEditModal(record)}
            size="small"
          >
            编辑
          </Button>
          <Popconfirm
            title="确定删除?"
            onConfirm={() => handleDelete(record._id, record.abbreviation)}
            okText="是"
            cancelText="否"
          >
            <Button icon={<DeleteOutlined />} danger size="small">
              删除
            </Button>
          </Popconfirm>
        </Space>
      ),
    },
  ];

  return (
    <div style={{ padding: "20px", maxWidth: "1200px", margin: "0 auto" }}>
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          marginBottom: "20px",
        }}
      >
        <Link href="/">
          <Button type="default" icon={<ArrowLeftOutlined />}>
            返回首页
          </Button>
        </Link>
        <Typography.Title level={2} style={{ margin: 0, fontSize: "24px" }}>
          管理后台
        </Typography.Title>
        <Button
          type="primary"
          icon={<PlusOutlined />}
          onClick={() => setIsAddModalOpen(true)}
        >
          添加
        </Button>
      </div>

      <div style={{ marginBottom: "20px" }}>
        <Input.Search
          placeholder="搜索简写或全称"
          allowClear
          enterButton={<SearchOutlined />}
          size="large"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          onSearch={(value) => {
            // When user clicks search button or presses enter
            setSearchQuery(value);
            setCurrentPage(1); // Reset to first page on new search
          }}
        />
      </div>

      <Table
        size="small"
        columns={columns}
        dataSource={data} // Use `data` directly, as filtering is now backend-handled
        loading={isLoading}
        rowKey="_id"
        pagination={false} // Disable Ant Design's built-in pagination
        bordered
        style={{ marginBottom: "20px" }}
      />

      <div style={{ textAlign: "right" }}>
        <Pagination
          current={currentPage}
          pageSize={pageSize}
          total={totalItems}
          onChange={(page, pageSize) => {
            setCurrentPage(page);
            setPageSize(pageSize);
          }}
          showSizeChanger
          pageSizeOptions={["10", "50", "100", "500"]}
          showQuickJumper
          showTotal={(total, range) =>
            `显示 ${range[0]}-${range[1]} 条，共 ${total} 条`
          }
        />
      </div>

      <Modal
        title="添加新的地理词简写"
        open={isAddModalOpen}
        onOk={handleAdd}
        onCancel={() => {
          setIsAddModalOpen(false);
          setNewAbbreviation("");
          setNewFullName("");
        }}
        okText="添加"
        cancelText="取消"
      >
        <Input
          placeholder="简写"
          value={newAbbreviation}
          onChange={(e) => setNewAbbreviation(e.target.value)}
          style={{ marginBottom: 16 }}
        />
        <Input
          placeholder="全称"
          value={newFullName}
          onChange={(e) => setNewFullName(e.target.value)}
        />
      </Modal>

      <Modal
        title="编辑地理词简写"
        open={isEditModalOpen}
        onOk={handleEdit}
        onCancel={() => {
          setIsEditModalOpen(false);
          setEditingItem(null);
        }}
        okText="更新"
        cancelText="取消"
      >
        <Input
          placeholder="简写"
          value={editingItem?.abbreviation || ""}
          onChange={(e) =>
            setEditingItem((prev) =>
              prev ? { ...prev, abbreviation: e.target.value } : null
            )
          }
          style={{ marginBottom: 16 }}
        />
        <Input
          placeholder="全称"
          value={editingItem?.full_name || ""}
          onChange={(e) =>
            setEditingItem((prev) =>
              prev ? { ...prev, full_name: e.target.value } : null
            )
          }
        />
      </Modal>
    </div>
  );
}
