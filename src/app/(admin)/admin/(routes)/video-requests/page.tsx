"use client";
import Button from "@/components/admin/ui/Button";
import Breadcrumbs from "@/components/ui/Breadcrumbs";
import { baseUrl } from "@/constants/baseApi";
import { adminBreadcrumbs } from "@/constants/route-breadcrumbs";
import React, { useEffect, useState, FormEvent, ChangeEvent, FC } from "react";
import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";

interface VideoRequest {
  uid: string;
  customer_name: string;
  description: string;
  type: "video" | "audio";
  request_status: "pending" | "in_progress" | "completed" | "cancelled";
  created_at: string;
}

interface VideoRequestResponse {
  requests: VideoRequest[];
  totalPages: number;
}

const MainComponent: FC = () => {
  const [requests, setRequests] = useState<VideoRequest[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState<string>("");
  const [selectedStatus, setSelectedStatus] = useState<string>("all");
  const [startDate, setStartDate] = useState<Date | null>(null);
  const [endDate, setEndDate] = useState<Date | null>(null);
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [totalPages, setTotalPages] = useState<number>(1);

  useEffect(() => {
    fetchRequests();
  }, [currentPage, selectedStatus, startDate, endDate]);

  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.visibilityState === "visible") {
        fetchRequests();
      }
    };
    document.addEventListener("visibilitychange", handleVisibilityChange);
    return () => {
      document.removeEventListener("visibilitychange", handleVisibilityChange);
    };
  }, []);

  const fetchRequests = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem("accessToken");
      const params = new URLSearchParams();
      params.append("page", String(currentPage));
      if (searchTerm) params.append("search", searchTerm);
      if (selectedStatus && selectedStatus !== "all")
        params.append("request_status", selectedStatus);
      const response = await fetch(
        ` ${baseUrl}/gallery/admin/video-audio-edit-requests?${params.toString()}`,
        {
          method: "GET",
          headers: {
            "Content-Type": "application/json",
            ...(token ? { Authorization: `Bearer ${token}` } : {}),
          },
        }
      );
      if (!response.ok) throw new Error("依頼データの取得に失敗しました");
      const data = await response.json();

      // Apply client-side date filtering
      let filteredResults = data.results || data.requests || [];

      if (startDate || endDate) {
        filteredResults = filteredResults.filter((request: VideoRequest) => {
          const createdDate = new Date(request.created_at);
          const start = startDate ? new Date(startDate) : null;
          const end = endDate ? new Date(endDate) : null;

          // Set time to start/end of day for proper comparison
          if (start) start.setHours(0, 0, 0, 0);
          if (end) end.setHours(23, 59, 59, 999);

          const afterStart = !start || createdDate >= start;
          const beforeEnd = !end || createdDate <= end;

          return afterStart && beforeEnd;
        });
      }

      setRequests(filteredResults);
      // Recalculate total pages based on filtered results
      setTotalPages(Math.ceil(filteredResults.length / 10));
    } catch (err: any) {
      console.error(err);
      setError(err.message || "不明なエラーが発生しました");
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = (e: FormEvent) => {
    e.preventDefault();
    setCurrentPage(1);
    fetchRequests();
  };

  const clearFilters = () => {
    setSearchTerm("");
    setSelectedStatus("all");
    setStartDate(null);
    setEndDate(null);
    setCurrentPage(1);
  };

  return (
    <div className="flex min-h-screen flex-col lg:p-4 bg-white">
      <div className="mb-8">
        <Breadcrumbs
          items={[{ label: "	動画依頼", href: "/admin" }]}
          homeHref="/admin"
        />
      </div>
      <header className="border-b border-gray-200 bg-white px-4 py-4 sm:px-6">
        <h1 className="text-lg font-semibold text-gray-800 sm:text-2xl">
          アリバイ動画音声依頼管理
        </h1>
      </header>

      <main className="flex-1 px-4 py-6 sm:px-6">
        <div className="mb-6">
          <form
            onSubmit={handleSearch}
            className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-6"
          >
            <div className="flex flex-col">
              <label className="text-sm font-medium text-gray-700 mb-1">検索</label>
              <input
                type="text"
                value={searchTerm}
                onChange={(e: ChangeEvent<HTMLInputElement>) =>
                  setSearchTerm(e.target.value)
                }
                placeholder="依頼者名、依頼内容で検索..."
                className="w-full rounded-lg border border-gray-300 px-4 py-2"
              />
            </div>
            <div className="flex flex-col">
              <label className="text-sm font-medium text-gray-700 mb-1">ステータス</label>
              <select
                value={selectedStatus}
                onChange={(e: ChangeEvent<HTMLSelectElement>) =>
                  setSelectedStatus(e.target.value)
                }
                className="w-full rounded-lg border border-gray-300 px-4 py-2"
              >
                <option value="all">全てのステータス</option>
                <option value="pending">未着手</option>
                <option value="in_progress">作業中</option>
                <option value="completed">完了</option>
                <option value="cancelled">キャンセル</option>
              </select>
            </div>
            <div className="flex flex-col">
              <label className="text-sm font-medium text-gray-700 mb-1">開始日</label>
              <div className="relative">
                <DatePicker
                  selected={startDate}
                  onChange={(date: Date | null) => setStartDate(date)}
                  dateFormat="yyyy-MM-dd"
                  placeholderText="開始日を選択"
                  className="w-full rounded-lg border border-gray-300 px-4 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
                {startDate && (
                  <button
                    type="button"
                    onClick={() => setStartDate(null)}
                    className="absolute inset-y-0 right-2 flex items-center text-gray-400 hover:text-gray-600"
                    title="開始日をクリア"
                  >
                    <i className="fas fa-times-circle"></i>
                  </button>
                )}
              </div>
            </div>
            <div className="flex flex-col">
              <label className="text-sm font-medium text-gray-700 mb-1">終了日</label>
              <div className="relative">
                <DatePicker
                  selected={endDate}
                  onChange={(date: Date | null) => setEndDate(date)}
                  dateFormat="yyyy-MM-dd"
                  placeholderText="終了日を選択"
                  className="w-full rounded-lg border border-gray-300 px-4 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
                {endDate && (
                  <button
                    type="button"
                    onClick={() => setEndDate(null)}
                    className="absolute inset-y-0 right-2 flex items-center text-gray-400 hover:text-gray-600"
                    title="終了日をクリア"
                  >
                    <i className="fas fa-times-circle"></i>
                  </button>
                )}
              </div>
            </div>
            <div className="flex flex-col justify-end">
              <Button className="w-full text-center py-2" type="submit">
                <h4 className="text-center w-full">検索</h4>
              </Button>
            </div>
            <div className="flex flex-col justify-end">
              <button
                type="button"
                onClick={clearFilters}
                className="w-full text-center py-2 px-4 text-sm text-gray-600 hover:text-gray-800 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
              >
                <i className="fas fa-times mr-1"></i>
                クリア
              </button>
            </div>
          </form>
        </div>

        {error && (
          <div className="mb-4 rounded bg-red-50 p-3 text-sm text-red-500">
            {error}
          </div>
        )}

        {loading ? (
          <div className="py-12 text-center text-gray-600">読み込み中...</div>
        ) : (
          <div className="overflow-x-auto rounded-lg border border-gray-200">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-4 py-3 text-left text-sm font-semibold text-gray-500">
                    依頼ID
                  </th>
                  <th className="px-4 py-3 text-left text-sm font-semibold text-gray-500">
                    依頼者
                  </th>
                  <th className="px-4 py-3 text-left text-sm font-semibold text-gray-500">
                    種別
                  </th>
                  <th className="px-4 py-3 text-left text-sm font-semibold text-gray-500">
                    内容
                  </th>
                  <th className="px-4 py-3 text-left text-sm font-semibold text-gray-500">
                    ステータス
                  </th>
                  <th className="px-4 py-3 text-left text-sm font-semibold text-gray-500">
                    依頼日時
                  </th>
                  <th className="px-4 py-3 text-left text-sm font-semibold text-gray-500">
                    操作
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {requests.map((request) => (
                  <tr key={request.uid}>
                    <td className="px-4 py-4 text-sm text-gray-700">
                      {request.uid}
                    </td>
                    <td className="px-4 py-4 text-sm text-gray-800">
                      {request.customer_name}
                    </td>
                    <td className="px-4 py-4 text-sm text-gray-600">
                      {request.type === "video" ? "動画" : "音声"}
                    </td>
                    <td className="px-4 py-4 text-sm text-gray-600 line-clamp-2">
                      {request.description}
                    </td>
                    <td className="px-4 py-4 text-sm text-gray-700">
                      <span
                        className={`px-2 py-1 rounded-full text-xs font-medium ${
                          request.request_status === "pending"
                            ? "bg-gray-100 text-gray-700"
                            : request.request_status === "in_progress"
                            ? "bg-purple-100 text-purple-700"
                            : request.request_status === "completed"
                            ? "bg-green-100 text-green-700"
                            : "bg-red-100 text-red-700"
                        }`}
                      >
                        {request.request_status === "pending"
                          ? "未着手"
                          : request.request_status === "in_progress"
                          ? "作業中"
                          : request.request_status === "completed"
                          ? "完了"
                          : "キャンセル"}
                      </span>
                    </td>
                    <td className="px-4 py-4 text-sm text-gray-600">
                      {new Date(request.created_at).toLocaleString("ja-JP")}
                    </td>
                    <td className="px-4 py-4 text-sm">
                      <a
                        href={`/admin/video-requests/${request.uid}`}
                        className="text-[#357AFF] hover:text-[#2E69DE]"
                      >
                        <i className="fa-regular fa-eye mr-1"></i>詳細
                      </a>
                    </td>
                  </tr>
                ))}
                {requests.length === 0 && (
                  <tr>
                    <td
                      colSpan={7}
                      className="px-4 py-6 text-center text-sm text-gray-500"
                    >
                      依頼データが見つかりません
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        )}

        {totalPages > 1 && (
          <div className="mt-6 flex flex-wrap justify-center gap-2">
            {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
              <button
                key={page}
                onClick={() => setCurrentPage(page)}
                className={`rounded-lg px-4 py-2 text-sm ${
                  currentPage === page
                    ? "bg-[#357AFF] text-white"
                    : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                }`}
              >
                {page}
              </button>
            ))}
          </div>
        )}
      </main>
    </div>
  );
};

export default MainComponent;
