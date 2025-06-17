"use client";

import { useState, useEffect } from "react";
import { Button, Input, Modal, Flex, message, Typography } from "antd";
import { PlusOutlined, CopyOutlined } from "@ant-design/icons";
import debounce from "lodash.debounce";
import clipboardCopy from "clipboard-copy";

interface GeoAbbreviation {
  _id: string;
  abbreviation: string;
  full_name: string;
  created_at: string;
  updated_at: string;
}

export default function HomePage() {
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<GeoAbbreviation[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [newAbbreviation, setNewAbbreviation] = useState("");
  const [newFullName, setNewFullName] = useState("");
  const [addAbbr, setAddAbbr] = useState("");
  // 热门词数据
  const [hotList, setHotList] = useState<GeoAbbreviation[]>([]);
  const [notFoundKeywords, setNotFoundKeywords] = useState<string[]>([]);

  // 定义一个接口来存储全称和ID
  interface FullNameData {
    full_name: string;
    _id: string;
  }

  // 获取热门词数据
  const fetchHotList = async () => {
    try {
      const response = await fetch("/api/abbreviations?type=hot"); // 添加 type 参数以区分请求类型
      const data = await response.json();
      if (data.success) {
        setHotList(data.data);
        console.log("Fetched hotList data:", data.data);
      } else {
        message.error(data.error || "未知错误");
      }
    } catch (error) {
      message.error("网络错误，无法获取热门词");
      console.error("Error fetching hot list:", error);
    }
  };

  // 合并相同 abbreviation 的释义
  const merged = Array.from(
    searchResults.reduce((acc, cur) => {
      if (!acc.has(cur.abbreviation)) {
        acc.set(cur.abbreviation, []);
      }
      acc
        .get(cur.abbreviation)!
        .push({ full_name: cur.full_name, _id: cur._id });
      return acc;
    }, new Map<string, FullNameData[]>()) // 更新Map的类型
  );

  // 复制内容并提示
  const handleCopy = (text: string, id: string) => {
    clipboardCopy(text)
      .then(() => {
        message.success({ content: `已复制: ${text}` });
        // 增加复制次数 (现在是非阻塞的)
        fetch(`/api/abbreviations/increment-copy?id=${id}`, {
          method: "PUT",
        });
        // 重新获取热门词，更新显示 (也可以考虑非阻塞)
        fetchHotList();
      })
      .catch(() => {
        message.error("复制失败，请检查浏览器权限或环境");
      });
  };

  // 防抖后的查询方法
  const debouncedSearch = debounce((query: string) => {
    handleSearch(query);
  }, 300);

  // 修改 handleSearch 支持参数
  const handleSearch = async (query: string) => {
    if (!query.trim()) {
      setSearchResults([]);
      return;
    }
    setIsLoading(true);
    try {
      const response = await fetch(
        `/api/abbreviations?q=${encodeURIComponent(query)}`
      );
      const data = await response.json();
      if (data.success) {
        setSearchResults(data.foundResults || []);
        setNotFoundKeywords(data.notFoundKeywords || []);
      } else {
        message.error(data.error || "未知错误");
      }
    } catch (error) {
      message.error("网络错误，请稍后重试");
    } finally {
      setIsLoading(false);
    }
  };

  const handleAddNew = async () => {
    if (!newAbbreviation.trim() || !newFullName.trim()) {
      message.error("请填写完整信息");
      return;
    }
    try {
      const response = await fetch("/api/abbreviations", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          abbreviation: newAbbreviation,
          fullName: newFullName,
        }),
      });
      const data = await response.json();
      if (data.success) {
        message.success(`已添加 ${newAbbreviation} -> ${newFullName}`);
        setNewAbbreviation("");
        setNewFullName("");
        setIsDialogOpen(false);
        if (
          searchQuery &&
          newAbbreviation.toUpperCase().includes(searchQuery.toUpperCase())
        ) {
          handleSearch(searchQuery);
        }
      } else {
        message.error(data.error || "未知错误");
      }
    } catch (error) {
      message.error("网络错误，请稍后重试");
    }
  };

  useEffect(() => {
    if (searchQuery) {
      debouncedSearch(searchQuery);
    } else {
      setSearchResults([]);
      setNotFoundKeywords([]);
    }
    return () => {
      debouncedSearch.cancel(); // 清理防抖函数
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchQuery]);

  // 首次加载获取热门词
  useEffect(() => {
    fetchHotList(); // 调用新的 fetchHotList 函数
  }, []);

  console.log("Current searchQuery:", searchQuery);
  console.log("HotList length:", hotList.length);

  return (
    <div style={{ minHeight: "100vh", padding: 0 }}>
      <div style={{ maxWidth: 700, margin: "0 auto", padding: "32px 8px" }}>
        <Typography.Title
          level={2}
          style={{
            textAlign: "center",
            marginBottom: 32,
            color: "#312e81",
          }}
        >
          😅能不能好好命名？（地信版）
        </Typography.Title>
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            marginBottom: 24,
          }}
        >
          <Input.TextArea
            style={{
              width: "100%",
              fontSize: 16,
              boxShadow: "0 2px 8px #a5b4fc55",
            }}
            allowClear
            placeholder="输入缩写..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            onPressEnter={(e) => {
              if (!e.shiftKey) debouncedSearch(searchQuery);
            }}
            autoSize={{ minRows: 2 }}
          />
        </div>
        {merged.length > 0 && (
          <Flex
            vertical
            gap={12}
            align="center"
            justify="space-between"
            wrap="wrap"
            className="w-full"
            style={{
              background: "rgba(255,255,255,0.97)",
              boxShadow: "0 4px 24px #a5b4fc55",
              padding: 16,
              marginBottom: 12,
            }}
          >
            {merged.map(([abbr, fullNames]) => (
              <Flex
                key={abbr}
                align="center"
                justify="space-between"
                wrap="wrap"
                className="w-full gap-12"
              >
                <span
                  style={{
                    fontSize: 18,
                    fontWeight: 700,
                    color: "#222",
                    minWidth: 60,
                    cursor: "pointer",
                  }}
                >
                  {abbr}
                </span>
                <Flex wrap="wrap" className="gap-8 flex-1">
                  {fullNames.map((nameData: FullNameData, idx: number) => (
                    <Flex key={nameData._id} align="center" gap={4}>
                      <Typography.Paragraph
                        copyable
                        onCopy={() => {
                          handleCopy(nameData.full_name, nameData._id);
                        }}
                        style={{ marginBottom: 0, fontSize: 14 }}
                      >
                        {nameData.full_name}
                      </Typography.Paragraph>
                    </Flex>
                  ))}
                </Flex>
                <Button
                  icon={<PlusOutlined />}
                  onClick={() => {
                    setAddAbbr(abbr);
                    setNewAbbreviation(abbr);
                    setIsDialogOpen(true);
                  }}
                  size="small"
                >
                  添加
                </Button>
              </Flex>
            ))}
          </Flex>
        )}
        {notFoundKeywords.length > 0 && (
          <Flex
            vertical
            gap={12}
            align="center"
            justify="space-between"
            wrap="wrap"
            className="w-full"
            style={{
              background: "rgba(255,255,255,0.97)",
              boxShadow: "0 4px 24px #a5b4fc55",
              padding: 16,
              marginBottom: 12,
            }}
          >
            {notFoundKeywords.map((keyword) => (
              <Flex
                key={keyword}
                align="center"
                justify="space-between"
                wrap="wrap"
                className="w-full gap-12"
              >
                <span
                  style={{
                    fontSize: 18,
                    fontWeight: 700,
                    color: "#222",
                    minWidth: 60,
                    cursor: "pointer",
                  }}
                >
                  {keyword}
                </span>
                <span style={{ color: "#888", fontSize: 14 }}>未找到</span>
                <Button
                  icon={<PlusOutlined />}
                  onClick={() => {
                    setAddAbbr(keyword);
                    setNewAbbreviation(keyword);
                    setIsDialogOpen(true);
                  }}
                  size="small"
                >
                  添加
                </Button>
              </Flex>
            ))}
          </Flex>
        )}

        <Modal
          open={isDialogOpen}
          title="添加新词"
          onCancel={() => setIsDialogOpen(false)}
          onOk={handleAddNew}
          okText="添加"
          cancelText="取消"
        >
          <Input
            style={{ marginBottom: 12, fontSize: 14 }}
            placeholder="简写，如：GSDJ"
            value={newAbbreviation}
            onChange={(e) => setNewAbbreviation(e.target.value)}
            onInput={() => {
              if (addAbbr) setAddAbbr("");
            }}
          />
          <Input
            style={{ fontSize: 14 }}
            placeholder="全称，如：公示地价"
            value={newFullName}
            onChange={(e) => setNewFullName(e.target.value)}
          />
        </Modal>
        {/* 热门词展示 */}
        {!searchQuery && hotList.length > 0 && (
          <>
            <Typography.Title
              level={4}
              style={{
                margin: "24px 0 12px 0",
                color: "#7c3aed",
                textShadow: "0 1px 0 #fff8",
                fontSize: 18,
              }}
            >
              🔥热门
            </Typography.Title>
            <Flex
              vertical
              gap={12}
              align="center"
              justify="space-between"
              wrap="wrap"
              className="w-full"
              style={{
                background: "rgba(255,255,255,0.97)",
                boxShadow: "0 4px 24px #a5b4fc55",
                padding: 16,
                marginBottom: 12,
              }}
            >
              {hotList.map((item) => (
                <Flex
                  key={item._id}
                  align="center"
                  justify="space-between"
                  wrap="wrap"
                  className="w-full gap-12"
                >
                  <span
                    style={{
                      fontSize: 18,
                      fontWeight: 700,
                      minWidth: 60,
                      cursor: "pointer",
                    }}
                  >
                    {item.abbreviation}
                  </span>
                  <Flex wrap="wrap" className="gap-8 flex-1">
                    <Typography.Paragraph
                      copyable
                      style={{ marginBottom: 0, fontSize: 14 }}
                    >
                      {item.full_name}
                    </Typography.Paragraph>
                  </Flex>
                </Flex>
              ))}
            </Flex>
          </>
        )}
      </div>
    </div>
  );
}
