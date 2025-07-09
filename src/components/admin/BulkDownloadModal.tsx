"use client";
import React, { useState, useEffect } from "react";
import Button from "@/components/admin/ui/Button";
import { baseUrl } from "@/constants/baseApi";
import { getAuthHeaders } from "@/infrastructure/admin/utils/getAuthHeaders";

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

interface BulkDownloadModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const BulkDownloadModal: React.FC<BulkDownloadModalProps> = ({
  isOpen,
  onClose,
}) => {
  const [downloadStartDate, setDownloadStartDate] = useState<string>("");
  const [downloadEndDate, setDownloadEndDate] = useState<string>("");
  const [downloadRequestType, setDownloadRequestType] = useState<string>("");
  const [downloadPreview, setDownloadPreview] =
    useState<DownloadRequestsResponse | null>(null);
  const [downloadLoading, setDownloadLoading] = useState<boolean>(false);
  const [downloadError, setDownloadError] = useState<string | null>(null);

  // Set default dates (last 30 days)
  useEffect(() => {
    const today = new Date();
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(today.getDate() - 30);

    setDownloadEndDate(today.toISOString().split("T")[0]);
    setDownloadStartDate(thirtyDaysAgo.toISOString().split("T")[0]);
  }, []);

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
      console.log("Download preview response:", data);
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
      handleClose();
    } catch (err: any) {
      console.error("Download zip error:", err);
      setDownloadError(err.message || "予期しないエラーが発生しました");
    } finally {
      setDownloadLoading(false);
    }
  };

  const handleClose = () => {
    setDownloadPreview(null);
    setDownloadError(null);
    onClose();
  };

  if (!isOpen) return null;

  return (
    <>
      {/* Modal */}
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
        <div className="bg-white rounded-lg p-6 w-full max-w-md mx-4">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-semibold text-gray-800">
              編集依頼一括ダウンロード
            </h2>
            <button
              onClick={handleClose}
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
                <h3 className="font-semibold text-gray-800 mb-2">プレビュー</h3>
                <div className="text-sm text-gray-600 space-y-1">
                  <p>総依頼数: {downloadPreview.total_requests || 0}</p>
                  <p>写真依頼: {downloadPreview.photo_requests || 0}</p>
                  <p>記念品依頼: {downloadPreview.souvenir_requests || 0}</p>
                  <p>動画依頼: {downloadPreview.video_requests || 0}</p>

                  {downloadPreview.status_breakdown && (
                    <>
                      <hr className="my-2" />
                      <p>
                        完了: {downloadPreview.status_breakdown.completed || 0}
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
    </>
  );
};

export default BulkDownloadModal;
