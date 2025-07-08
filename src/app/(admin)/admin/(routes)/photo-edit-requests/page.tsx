"use client";
import React, { useEffect, useState, FormEvent, ChangeEvent } from "react";
import Button from "@/components/admin/ui/Button";
import { baseUrl } from "@/constants/baseApi";
import { getAuthHeaders } from "@/infrastructure/admin/utils/getAuthHeaders";
import Breadcrumbs from "@/components/ui/Breadcrumbs";
import { adminBreadcrumbs } from "@/constants/route-breadcrumbs";

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

interface DownloadRequestsResponse {
  photo_requests: number;
  souvenir_requests: number;
  video_requests: number;
  total_requests: number;
  status_breakdown?: {
    completed: number;
    in_progress: number;
    not_started: number;
    cancelled: number;
  };
}

const MainComponent: React.FC = () => {
  const [requests, setRequests] = useState<PhotoEditRequest[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState<string>("");
  const [selectedStatus, setSelectedStatus] = useState<string>("all");
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [totalPages, setTotalPages] = useState<number>(1);

  // Download functionality states
  const [showDownloadModal, setShowDownloadModal] = useState<boolean>(false);
  const [downloadStartDate, setDownloadStartDate] = useState<string>("");
  const [downloadEndDate, setDownloadEndDate] = useState<string>("");
  const [downloadRequestType, setDownloadRequestType] = useState<string>("");
  const [downloadPreview, setDownloadPreview] =
    useState<DownloadRequestsResponse | null>(null);
  const [downloadLoading, setDownloadLoading] = useState<boolean>(false);
  const [downloadError, setDownloadError] = useState<string | null>(null);

  useEffect(() => {
    fetchRequests();
  }, [currentPage, selectedStatus]);

  // Set default dates (last 30 days)
  useEffect(() => {
    const today = new Date();
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(today.getDate() - 30);

    setDownloadEndDate(today.toISOString().split("T")[0]);
    setDownloadStartDate(thirtyDaysAgo.toISOString().split("T")[0]);
  }, []);

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

  const handleStatusChange = async (requestId: string, newStatus: string) => {
    try {
      const response = await fetch(
        `${baseUrl}/gallery/admin/photo-edit-requests`,
        {
          method: "POST",
          headers: getAuthHeaders(),
          body: JSON.stringify({ uid: requestId, status: newStatus }),
        }
      );

      if (!response.ok) throw new Error("ステータスの更新に失敗しました");
      fetchRequests();
    } catch (err: any) {
      console.error(err);
      setError(err.message || "予期しないエラーが発生しました");
    }
  };

  // Download functionality
  const handleDownloadPreview = async () => {
    if (!downloadStartDate || !downloadEndDate) {
      setDownloadError("開始日と終了日を選択してください");
      return;
    }

    try {
      setDownloadLoading(true);
      setDownloadError(null);

      const url = new URL(`${baseUrl}/gallery/admin/download-requests`);
      url.searchParams.set("start_date", downloadStartDate);
      url.searchParams.set("end_date", downloadEndDate);
      if (downloadRequestType) {
        url.searchParams.set("request_type", downloadRequestType);
      }

      const response = await fetch(url.toString(), {
        method: "GET",
        headers: getAuthHeaders(),
      });

      if (!response.ok) {
        throw new Error("プレビューデータの取得に失敗しました");
      }

      const data: DownloadRequestsResponse = await response.json();
      console.log("Download preview response:", data); // Debug log
      setDownloadPreview(data);
    } catch (err: any) {
      console.error("Download preview error:", err);
      setDownloadError(err.message || "予期しないエラーが発生しました");
    } finally {
      setDownloadLoading(false);
    }
  };

  const handleDownloadZip = async () => {
    if (!downloadStartDate || !downloadEndDate) {
      setDownloadError("開始日と終了日を選択してください");
      return;
    }

    try {
      setDownloadLoading(true);
      setDownloadError(null);

      const url = new URL(`${baseUrl}/gallery/admin/download`);
      url.searchParams.set("start_date", downloadStartDate);
      url.searchParams.set("end_date", downloadEndDate);
      if (downloadRequestType) {
        url.searchParams.set("request_type", downloadRequestType);
      }

      const response = await fetch(url.toString(), {
        method: "GET",
        headers: getAuthHeaders(),
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error("Download error response:", errorText);
        throw new Error("ダウンロードに失敗しました");
      }

      // Check if the response is actually a file
      const contentType = response.headers.get("Content-Type");
      if (contentType && contentType.includes("application/json")) {
        // If it's JSON, there might be an error message
        const errorData = await response.json();
        throw new Error(errorData.message || "ダウンロードに失敗しました");
      }

      // Handle file download
      const blob = await response.blob();
      const downloadUrl = window.URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = downloadUrl;

      // Get filename from response headers if available
      const disposition = response.headers.get("Content-Disposition");
      let filename = `edit_requests_${downloadStartDate}_to_${downloadEndDate}.zip`;

      if (disposition && disposition.includes("filename=")) {
        const filenameMatch = disposition.match(/filename="?([^"]*)"?/);
        if (filenameMatch) {
          filename = filenameMatch[1];
        }
      }

      link.download = filename;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(downloadUrl);

      // Close modal after successful download
      setShowDownloadModal(false);
      setDownloadPreview(null);
    } catch (err: any) {
      console.error("Download zip error:", err);
      setDownloadError(err.message || "予期しないエラーが発生しました");
    } finally {
      setDownloadLoading(false);
    }
  };

  const resetDownloadModal = () => {
    setShowDownloadModal(false);
    setDownloadPreview(null);
    setDownloadError(null);
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
            className="mt-4 sm:mt-0 bg-green-600 hover:bg-green-700 text-white"
          >
            <i className="fa-solid fa-download mr-2"></i>
            一括ダウンロード
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
                      <select
                        value={request.request_status}
                        onChange={(e) =>
                          handleStatusChange(request.uid, e.target.value)
                        }
                        className="rounded border border-gray-300 px-2 py-1 text-sm"
                      >
                        <option value="pending">未着手</option>
                        <option value="in_progress">作業中</option>
                        <option value="completed">完了</option>
                        <option value="cancelled">キャンセル</option>
                      </select>
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

      {/* Download Modal */}
      {showDownloadModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md mx-4">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-semibold text-gray-800">
                編集依頼一括ダウンロード
              </h2>
              <button
                onClick={resetDownloadModal}
                className="text-gray-500 hover:text-gray-700"
              >
                <i className="fa-solid fa-times"></i>
              </button>
            </div>

            {downloadError && (
              <div className="mb-4 rounded bg-red-50 p-3 text-sm text-red-500">
                {downloadError}
              </div>
            )}

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  開始日 <span className="text-red-500">*</span>
                </label>
                <input
                  type="date"
                  value={downloadStartDate}
                  onChange={(e) => setDownloadStartDate(e.target.value)}
                  className="w-full rounded border border-gray-300 px-3 py-2"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  終了日 <span className="text-red-500">*</span>
                </label>
                <input
                  type="date"
                  value={downloadEndDate}
                  onChange={(e) => setDownloadEndDate(e.target.value)}
                  className="w-full rounded border border-gray-300 px-3 py-2"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  依頼タイプ
                </label>
                <select
                  value={downloadRequestType}
                  onChange={(e) => setDownloadRequestType(e.target.value)}
                  className="w-full rounded border border-gray-300 px-3 py-2"
                >
                  <option value="">全てのタイプ</option>
                  <option value="photo_request">写真依頼</option>
                  <option value="souvenir_request">記念品依頼</option>
                  <option value="video_request">動画依頼</option>
                </select>
              </div>

              {downloadPreview && (
                <div className="mt-4 p-4 bg-gray-50 rounded">
                  <h3 className="font-semibold text-gray-800 mb-2">
                    プレビュー
                  </h3>
                  <div className="text-sm text-gray-600 space-y-1">
                    <p>総依頼数: {downloadPreview.total_requests || 0}</p>
                    <p>写真依頼: {downloadPreview.photo_requests || 0}</p>
                    <p>記念品依頼: {downloadPreview.souvenir_requests || 0}</p>
                    <p>動画依頼: {downloadPreview.video_requests || 0}</p>

                    {downloadPreview.status_breakdown && (
                      <>
                        <hr className="my-2" />
                        <p>
                          完了:{" "}
                          {downloadPreview.status_breakdown.completed || 0}
                        </p>
                        <p>
                          作業中:{" "}
                          {downloadPreview.status_breakdown.in_progress || 0}
                        </p>
                        <p>
                          未着手:{" "}
                          {downloadPreview.status_breakdown.not_started || 0}
                        </p>
                        <p>
                          キャンセル:{" "}
                          {downloadPreview.status_breakdown.cancelled || 0}
                        </p>
                      </>
                    )}
                  </div>
                </div>
              )}

              <div className="flex space-x-3 pt-4">
                <Button
                  onClick={handleDownloadPreview}
                  disabled={downloadLoading}
                  className="flex-1 bg-blue-600 hover:bg-blue-700 text-white"
                >
                  {downloadLoading ? (
                    <i className="fa-solid fa-spinner fa-spin mr-2"></i>
                  ) : (
                    <i className="fa-solid fa-eye mr-2"></i>
                  )}
                  プレビュー
                </Button>

                <Button
                  onClick={handleDownloadZip}
                  disabled={downloadLoading || !downloadPreview}
                  className="flex-1 bg-green-600 hover:bg-green-700 text-white disabled:bg-gray-400"
                >
                  {downloadLoading ? (
                    <i className="fa-solid fa-spinner fa-spin mr-2"></i>
                  ) : (
                    <i className="fa-solid fa-download mr-2"></i>
                  )}
                  ダウンロード
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Download Loading Overlay */}
      {downloadLoading && (
        <div className="fixed inset-0 bg-black bg-opacity-70 flex items-center justify-center z-[60]">
          <div className="bg-white rounded-lg p-8 flex flex-col items-center max-w-sm mx-4">
            <div className="mb-4">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600"></div>
            </div>
            <div className="text-center">
              <h3 className="text-lg font-semibold text-gray-800 mb-2">
                ダウンロード中...
              </h3>
              <p className="text-sm text-gray-600">ファイルを準備しています</p>
              <div className="mt-4 w-full bg-gray-200 rounded-full h-2">
                <div className="bg-green-600 h-2 rounded-full animate-pulse w-3/4"></div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default MainComponent;
