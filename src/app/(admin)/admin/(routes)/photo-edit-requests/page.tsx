"use client";
import React, { useEffect, useState, FormEvent, ChangeEvent } from "react";
import Button from "@/components/admin/ui/Button";
import { baseUrl } from "@/constants/baseApi";
import { getAuthHeaders } from "@/infrastructure/admin/utils/getAuthHeaders";
import Breadcrumbs from "@/components/ui/Breadcrumbs";
import BulkDownloadModal from "@/components/admin/BulkDownloadModal";

interface FileItem {
  file_type: string;
  user_request_file: string;
  file_status: string;
  admin_response_file: string;
}

interface PhotoEditRequest {
  uid: string;
  description: string;
  special_note: string;
  request_status: "pending" | "in_progress" | "completed" | "cancelled";
  request_type: string;
  desire_delivery_date: string;
  files: FileItem[];
}

interface PhotoEditResponse {
  count: number;
  next: string | null;
  previous: string | null;
  results: PhotoEditRequest[];
}

const MainComponent: React.FC = () => {
  const [requests, setRequests] = useState<PhotoEditRequest[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState<string>("");
  const [selectedStatus, setSelectedStatus] = useState<string>("all");
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [totalPages, setTotalPages] = useState<number>(1);
  const [showDownloadModal, setShowDownloadModal] = useState<boolean>(false);

  useEffect(() => {
    fetchRequests();
  }, [currentPage, selectedStatus]);

  const fetchRequests = async () => {
    try {
      setLoading(true);
      const url = new URL(`${baseUrl}/gallery/admin/photo-edit-requests`);
      url.searchParams.set("page", currentPage.toString());
      if (searchTerm) url.searchParams.set("search", searchTerm);
      if (selectedStatus !== "all")
        url.searchParams.set("status", selectedStatus);

      const response = await fetch(url.toString(), {
        method: "GET",
        headers: getAuthHeaders(),
      });

      if (!response.ok) throw new Error("依頼データの取得に失敗しました");

      const data: PhotoEditResponse = await response.json();
      setRequests(data.results || []);
      setTotalPages(Math.ceil(data.count / 10));
    } catch (err: any) {
      console.error(err);
      setError(err.message || "予期しないエラーが発生しました");
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = (e: FormEvent) => {
    e.preventDefault();
    setCurrentPage(1);
    fetchRequests();
  };

  return (
    <div className="flex min-h-screen flex-col lg:p-4 bg-white">
      <div className="mb-8">
        <Breadcrumbs
          items={[
            { label: "写真編集依頼", href: "/admin/photo-edit-requests" },
          ]}
          homeHref="/admin"
        />
      </div>

      <header className="border-b border-gray-200 bg-white px-4 py-4 sm:px-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
          <h1 className="text-lg font-semibold text-gray-800 sm:text-2xl">
            アリバイ写真加工依頼管理
          </h1>
          <Button
            onClick={() => setShowDownloadModal(true)}
            className="mt-4 sm:mt-0 bg-blue-600 hover:bg-blue-700 text-white"
          >
            <i className="fa-solid fa-download mr-2"></i>
            ダウンロードリクエスト
          </Button>
        </div>
      </header>

      <main className="flex-1 px-4 py-6 sm:px-6">
        <div className="mb-6">
          <form
            onSubmit={handleSearch}
            className="flex flex-col gap-4 sm:flex-row"
          >
            <input
              type="text"
              value={searchTerm}
              onChange={(e: ChangeEvent<HTMLInputElement>) =>
                setSearchTerm(e.target.value)
              }
              placeholder="依頼内容で検索..."
              className="w-full rounded-lg border border-gray-300 px-4 py-2"
            />
            <select
              value={selectedStatus}
              onChange={(e: ChangeEvent<HTMLSelectElement>) =>
                setSelectedStatus(e.target.value)
              }
              className="w-full sm:w-auto rounded-lg border border-gray-300 px-4 py-2"
            >
              <option value="all">全てのステータス</option>
              <option value="pending">未着手</option>
              <option value="in_progress">作業中</option>
              <option value="completed">完了</option>
              <option value="cancelled">キャンセル</option>
            </select>
            <Button className="lg:w-20 text-center" type="submit">
              <h4 className="text-center w-full">検索</h4>
            </Button>
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
                    依頼内容
                  </th>
                  <th className="px-4 py-3 text-left text-sm font-semibold text-gray-500">
                    ステータス
                  </th>
                  <th className="px-4 py-3 text-left text-sm font-semibold text-gray-500">
                    納品希望日
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
                    <td className="px-4 py-4 text-sm text-gray-700 line-clamp-2">
                      {request.description}
                    </td>
                    <td className="px-4 py-4 text-sm text-gray-700">
                      {request.request_status === "pending" && "未着手"}
                      {request.request_status === "in_progress" && "作業中"}
                      {request.request_status === "completed" && "完了"}
                      {request.request_status === "cancelled" && "キャンセル"}
                    </td>
                    <td className="px-4 py-4 text-sm text-gray-700">
                      {new Date(request.desire_delivery_date).toLocaleString(
                        "ja-JP"
                      )}
                    </td>
                    <td className="px-4 py-4 text-sm">
                      <a
                        href={`/admin/photo-edit-requests/${request.uid}`}
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
                      colSpan={5}
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

      {/* Bulk Download Modal */}
      <BulkDownloadModal
        isOpen={showDownloadModal}
        onClose={() => setShowDownloadModal(false)}
      />
    </div>
  );
};

export default MainComponent;
