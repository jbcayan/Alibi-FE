"use client";
import React, { useEffect, useState } from "react";
import {
  ArrowLeft,
  Calendar,
  FileText,
  Camera,
  Clock,
  AlertCircle,
  CheckCircle,
  Loader2,
  Download,
  Eye,
  Upload,
  X,
} from "lucide-react";
import Link from "next/link";
import { baseUrl } from "@/constants/baseApi";
import { getAuthHeaders } from "@/infrastructure/admin/utils/getAuthHeaders";
import { useParams } from "next/navigation";
import Breadcrumbs from "@/components/ui/Breadcrumbs";
import Button from "@/components/admin/ui/Button";

interface FileItem {
  file_type: string;
  user_request_file: string;
  file_status: string;
  admin_response_file: string;
}

interface PhotoEditRequestDetail {
  uid: string;
  description: string;
  special_note: string;
  request_status: string;
  request_type: string;
  desire_delivery_date: string;
  files: FileItem[];
}

const STATUS_OPTIONS = [
  { value: "pending", label: "未着手", color: "bg-gray-100 text-gray-700" },
  { value: "in_progress", label: "作業中", color: "bg-blue-100 text-blue-700" },
  { value: "completed", label: "完了", color: "bg-green-100 text-green-700" },
  { value: "cancelled", label: "キャンセル", color: "bg-red-100 text-red-700" },
];

const PhotoEditRequestDetailPage = () => {
  const [data, setData] = useState<PhotoEditRequestDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [statusUpdating, setStatusUpdating] = useState(false);
  const [statusError, setStatusError] = useState<string | null>(null);
  const [statusSuccess, setStatusSuccess] = useState<string | null>(null);
  const [showCompletionModal, setShowCompletionModal] = useState(false);
  const [completedFiles, setCompletedFiles] = useState<{ [key: number]: File | null }>({});
  const [completedPreviews, setCompletedPreviews] = useState<{ [key: number]: string }>({});
  const [imageErrors, setImageErrors] = useState<{ [key: string]: boolean }>({});
  const [imageUrls, setImageUrls] = useState<{ [key: string]: string }>({});
  const params = useParams();
  const uid = params?.uid
    ? typeof params.uid === "string"
      ? params.uid
      : Array.isArray(params.uid)
      ? params.uid[0]
      : ""
    : "";

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      setError(null);
      try {
        const response = await fetch(
          `${baseUrl}/gallery/admin/photo-edit-requests/${uid}`,
          {
            method: "GET",
            headers: getAuthHeaders(),
          }
        );
        if (!response.ok) {
          throw new Error("依頼詳細の取得に失敗しました");
        }
        const data: PhotoEditRequestDetail = await response.json();
        setData(data);
      } catch (err: any) {
        setError(err.message || "予期しないエラーが発生しました");
      } finally {
        setLoading(false);
      }
    };
    if (uid) fetchData();
  }, [uid]);

  const handleStatusChange = async (
    e: React.ChangeEvent<HTMLSelectElement>
  ) => {
    const newStatus = e.target.value;

    if (newStatus === "completed") {
      setShowCompletionModal(true);
      // Reset the select to current value
      e.target.value = data?.request_status || "pending";
      return;
    }

    // For other status changes, proceed normally
    await updateStatus(newStatus);
  };

  const updateStatus = async (newStatus: string, files?: { [key: number]: File | null }) => {
    setStatusUpdating(true);
    setStatusError(null);
    setStatusSuccess(null);
    try {
      const headers: Record<string, string> = { ...getAuthHeaders() };
      const csrfToken =
        typeof window !== "undefined"
          ? localStorage.getItem("csrftoken")
          : null;
      if (csrfToken) headers["X-CSRFTOKEN"] = csrfToken;

      let body: string | FormData;
      if (files) {
        // For completion with multiple file uploads
        const formData = new FormData();
        formData.append("request_status", newStatus);

        // Add completed files
        Object.entries(files).forEach(([index, file]) => {
          if (file) {
            formData.append(`admin_response_files`, file);
          }
        });

        // Log FormData contents for debugging
        console.log("FormData contents:");
        for (let [key, value] of formData.entries()) {
          if (value instanceof File) {
            console.log(`${key}: File(${value.name}, ${value.size} bytes, ${value.type})`);
          } else {
            console.log(`${key}: ${value}`);
          }
        }

        body = formData;
        // Remove content-type header for FormData
        delete headers["Content-Type"];
      } else {
        // For regular status updates
        headers["Content-Type"] = "application/json";
        body = JSON.stringify({ request_status: newStatus });
      }

      console.log("Making API request to:", `${baseUrl}/gallery/admin/photo-edit-requests/${uid}/update-status`);
      console.log("Request method: PATCH");
      console.log("Request headers:", headers);

      const response = await fetch(
        `${baseUrl}/gallery/admin/photo-edit-requests/${uid}/update-status`,
        {
          method: "PATCH",
          headers,
          body,
        }
      );
      if (!response.ok) {
        // Log response details for debugging
        console.error("Response status:", response.status);
        console.error("Response statusText:", response.statusText);
        console.error("Response headers:", Object.fromEntries(response.headers.entries()));

        // Try to get error details from response
        let errorMessage = "ステータスの更新に失敗しました";
        try {
          const responseText = await response.text();
          console.error("Raw response text:", responseText);

          if (responseText.trim()) {
            const errorData = JSON.parse(responseText);
            console.error("API Error Response:", errorData);
            errorMessage = errorData.detail || errorData.message || errorData.error || errorMessage;
          } else {
            console.error("Empty response body");
            errorMessage = `HTTP ${response.status}: ${response.statusText}`;
          }
        } catch (e) {
          console.error("Failed to parse error response:", e);
          errorMessage = `HTTP ${response.status}: ${response.statusText}`;
        }
        throw new Error(errorMessage);
      }
      setData((prev) => (prev ? { ...prev, request_status: newStatus } : prev));
      setStatusSuccess("ステータスが更新されました");
    } catch (err: any) {
      setStatusError(err.message || "予期しないエラーが発生しました");
    } finally {
      setStatusUpdating(false);
      setTimeout(() => setStatusSuccess(null), 3000);
    }
  };

  const getStatusBadge = (status: string) => {
    const statusOption = STATUS_OPTIONS.find((opt) => opt.value === status);
    return statusOption ? statusOption : STATUS_OPTIONS[0];
  };

  const handleImageError = (imageKey: string) => {
    setImageErrors(prev => ({ ...prev, [imageKey]: true }));
  };

  const handleCompletedFileChange = (index: number, e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      // Clean up previous preview URL for this index
      if (completedPreviews[index]) {
        URL.revokeObjectURL(completedPreviews[index]);
      }

      setCompletedFiles(prev => ({ ...prev, [index]: file }));

      // Create new preview URL
      const url = URL.createObjectURL(file);
      setCompletedPreviews(prev => ({ ...prev, [index]: url }));
    }
  };

  const handleCompleteRequest = async () => {
    // Check if at least one file is uploaded
    const hasFiles = Object.values(completedFiles).some(file => file !== null);
    if (!hasFiles) {
      setStatusError("少なくとも1つの完了ファイルをアップロードしてください");
      return;
    }

    await updateStatus("completed", completedFiles);
    setShowCompletionModal(false);
    setCompletedFiles({});
    Object.values(completedPreviews).forEach(url => {
      if (url) URL.revokeObjectURL(url);
    });
    setCompletedPreviews({});
  };

  const handleDownloadFile = (fileUrl: string, fileName: string, fileType: string) => {
    // Determine file extension based on file type
    let extension = '';
    switch (fileType.toLowerCase()) {
      case 'jpg':
      case 'jpeg':
      case 'png':
      case 'gif':
        extension = '.jpg'; // Default to jpg for images
        break;
      default:
        extension = '.jpg'; // Default to jpg for images
    }

    const fullFileName = `${fileName}${extension}`;
    const downloadUrl = `/api/download-file?url=${encodeURIComponent(fileUrl)}&name=${encodeURIComponent(fullFileName)}`;
    window.open(downloadUrl, '_blank');
  };

  const closeCompletionModal = () => {
    setShowCompletionModal(false);
    setCompletedFiles({});
    Object.values(completedPreviews).forEach(url => {
      if (url) URL.revokeObjectURL(url);
    });
    setCompletedPreviews({});
  };

  // Cleanup preview URL on unmount
  useEffect(() => {
    return () => {
      Object.values(completedPreviews).forEach(url => {
        if (url) URL.revokeObjectURL(url);
      });
    };
  }, [completedPreviews]);

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50 flex items-center justify-center">
        <div className="flex flex-col items-center space-y-4">
          <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
          <p className="text-gray-600 font-medium">読み込み中...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50 flex items-center justify-center">
        <div className="bg-red-50 border border-red-200 rounded-lg p-6 max-w-md">
          <AlertCircle className="w-6 h-6 text-red-500 mb-2" />
          <p className="text-red-700 font-medium">{error}</p>
        </div>
      </div>
    );
  }

  if (!data) return null;

  const statusBadge = getStatusBadge(data.request_status);

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-pink-50 to-indigo-100 py-8 px-4">
      <div className="mb-8">
        <Breadcrumbs
          items={[
            { label: "写真編集依頼", href: "/admin/photo-edit-requests" },
            { label: "写真編集依頼の詳細", href: "/admin/photo-edit-requests" },
          ]}
          homeHref="/admin"
        />
      </div>
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <Link href={"/admin/photo-edit-requests"}>
            <button className="flex items-center cursor-pointer space-x-2 text-gray-600 hover:text-gray-800 transition-all duration-300 mb-4 group hover:scale-105">
              <ArrowLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform duration-300" />
              <span className="font-medium">一覧に戻る</span>
            </button>
          </Link>

          <div className="bg-white/80 backdrop-blur-xl rounded-2xl shadow-xl border border-white/20 p-6 mb-6">
            <div className="flex items-center justify-between">
              <div>
                <div className="flex items-center space-x-3 mb-2">
                  <div className="p-3 bg-gradient-to-r from-purple-500 to-pink-500 rounded-xl shadow-lg">
                    <Camera className="w-6 h-6 text-white" />
                  </div>
                  <div>
                    <h1 className="text-3xl font-bold bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent">
                      写真加工依頼詳細
                    </h1>
                    <p className="text-gray-600 flex items-center space-x-2 mt-1">
                      <span className="text-sm bg-gray-100 px-2 py-1 rounded-full">依頼ID: {data.uid}</span>
                    </p>
                  </div>
                </div>
              </div>
              <div className={`px-6 py-3 rounded-full font-semibold text-sm shadow-lg backdrop-blur-sm border border-white/20 ${statusBadge.color} hover:scale-105 transition-transform duration-300`}>
                {statusBadge.label}
              </div>
            </div>
          </div>
        </div>

        <div className="grid lg:grid-cols-3 gap-8">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-6">
            {/* Request Details Card */}
            <div className="bg-white/80 backdrop-blur-xl rounded-2xl shadow-xl border border-white/20 p-8 hover:shadow-2xl transition-all duration-500">
              <h2 className="text-2xl font-bold text-gray-900 mb-6 flex items-center space-x-3">
                <div className="p-2 bg-gradient-to-r from-purple-500 to-pink-500 rounded-lg shadow-lg">
                  <Camera className="w-6 h-6 text-white" />
                </div>
                <span className="bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent">依頼内容</span>
              </h2>

              <div className="space-y-6">
                <div className="group">
                  <label className="block text-sm font-semibold text-gray-700 mb-3 flex items-center space-x-2">
                    <div className="w-2 h-2 bg-purple-500 rounded-full"></div>
                    <span>依頼タイプ</span>
                  </label>
                  <div className="bg-gradient-to-r from-purple-50 to-pink-50 border border-purple-200/50 rounded-xl p-4 shadow-inner group-hover:shadow-lg transition-all duration-300">
                    <span className="text-purple-800 font-semibold text-lg">
                      {data.request_type}
                    </span>
                  </div>
                </div>

                <div className="group">
                  <label className="block text-sm font-semibold text-gray-700 mb-3 flex items-center space-x-2">
                    <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                    <span>詳細説明</span>
                  </label>
                  <div className="bg-gradient-to-r from-gray-50 to-blue-50 border border-gray-200/50 rounded-xl p-5 shadow-inner group-hover:shadow-lg transition-all duration-300">
                    <p className="text-gray-800 leading-relaxed text-base">
                      {data.description}
                    </p>
                  </div>
                </div>

                {data.special_note && (
                  <div className="group">
                    <label className="block text-sm font-semibold text-gray-700 mb-3 flex items-center space-x-2">
                      <div className="w-2 h-2 bg-amber-500 rounded-full"></div>
                      <span>特記事項</span>
                    </label>
                    <div className="bg-gradient-to-r from-amber-50 to-orange-50 border border-amber-200/50 rounded-xl p-5 flex items-start space-x-4 shadow-inner group-hover:shadow-lg transition-all duration-300">
                      <AlertCircle className="w-6 h-6 text-amber-600 mt-0.5 flex-shrink-0" />
                      <p className="text-amber-800 leading-relaxed">{data.special_note}</p>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Request Files Card */}
            <div className="bg-white/80 backdrop-blur-xl rounded-2xl shadow-xl border border-white/20 p-8 hover:shadow-2xl transition-all duration-500">
              <h2 className="text-2xl font-bold text-gray-900 mb-6 flex items-center space-x-3">
                <div className="p-2 bg-gradient-to-r from-purple-500 to-pink-500 rounded-lg shadow-lg">
                  <Eye className="w-6 h-6 text-white" />
                </div>
                <span className="bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent">依頼ファイル</span>
              </h2>

              {data.files && data.files.length > 0 ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                  {data.files.map((file, index) => (
                    <div
                      key={index}
                      className="group border border-gray-200/50 rounded-xl p-5 bg-gradient-to-br from-gray-50 to-white shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-105"
                    >
                      <div className="aspect-square overflow-hidden rounded-xl bg-gradient-to-br from-white to-gray-50 mb-4 flex items-center justify-center shadow-inner border border-gray-100">
                        {imageErrors[`request-${index}`] ? (
                          <div className="flex items-center justify-center h-full text-gray-400">
                            <Camera className="w-8 h-8" />
                          </div>
                        ) : (
                          <img
                            src={imageUrls[`request-${index}`] || file.user_request_file}
                            alt={`依頼ファイル ${index + 1}`}
                            className="max-h-full max-w-full object-contain"
                            onError={() => {
                              console.log("Image failed to load:", file.user_request_file, "Trying with baseUrl:", `${baseUrl}${file.user_request_file}`);
                              // Try with baseUrl prefix
                              const img = new Image();
                              img.onload = () => {
                                console.log("Image loaded with baseUrl");
                                setImageUrls(prev => ({ ...prev, [`request-${index}`]: `${baseUrl}${file.user_request_file}` }));
                              };
                              img.onerror = () => {
                                console.log("Image failed with baseUrl too");
                                handleImageError(`request-${index}`);
                              };
                              img.src = `${baseUrl}${file.user_request_file}`;
                            }}
                          />
                        )}
                      </div>
                      <div className="space-y-3">
                        <div className="flex items-center justify-between">
                          <p className="text-sm font-semibold text-gray-700">
                            ファイルタイプ: {file.file_type}
                          </p>
                          <button
                            onClick={() => handleDownloadFile(file.user_request_file, `request-file-${index + 1}`, file.file_type)}
                            className="flex items-center space-x-2 bg-gradient-to-r from-purple-500 to-pink-500 text-white px-3 py-2 rounded-lg shadow-md hover:shadow-lg transition-all duration-300 hover:scale-105 text-sm font-medium"
                            title="依頼ファイルをダウンロード"
                          >
                            <Download className="w-4 h-4" />
                            <span>DL</span>
                          </button>
                        </div>
                        <div className="flex items-center space-x-2 bg-gray-100 rounded-lg px-3 py-2">
                          <span className="text-sm font-medium text-gray-600">ステータス:</span>
                          <span className="text-sm font-medium text-gray-800">
                            {file.file_status === "完了" ? "完了" : file.file_status === "処理中" ? "処理中" : "未処理"}
                          </span>
                        </div>
                        {file.admin_response_file && (
                          <div className="mt-4 pt-4 border-t border-gray-200">
                            <div className="flex items-center justify-between mb-3">
                              <p className="text-sm font-bold text-gray-800 flex items-center space-x-2">
                                <CheckCircle className="w-4 h-4 text-green-600" />
                                <span>完了ファイル</span>
                              </p>
                              <button
                                onClick={() => handleDownloadFile(file.admin_response_file, `completed-file-${index + 1}`, file.file_type)}
                                className="flex items-center space-x-2 bg-gradient-to-r from-green-500 to-emerald-500 text-white px-3 py-2 rounded-lg shadow-md hover:shadow-lg transition-all duration-300 hover:scale-105 text-sm font-medium"
                                title="完了ファイルをダウンロード"
                              >
                                <Download className="w-4 h-4" />
                                <span>DL</span>
                              </button>
                            </div>
                            <div className="aspect-square overflow-hidden rounded-xl bg-gradient-to-br from-green-50 to-white flex items-center justify-center shadow-inner border border-green-200">
                              {imageErrors[`response-${index}`] ? (
                                <div className="flex items-center justify-center h-full text-gray-400">
                                  <Camera className="w-8 h-8" />
                                </div>
                              ) : (
                                <img
                                  src={imageUrls[`response-${index}`] || (file.admin_response_file.startsWith('http') ? file.admin_response_file : `${baseUrl}${file.admin_response_file}`)}
                                  alt={`完了ファイル ${index + 1}`}
                                  className="max-h-full max-w-full object-contain"
                                  onError={() => {
                                    console.log("Response image failed to load:", file.admin_response_file);
                                    handleImageError(`response-${index}`);
                                  }}
                                />
                              )}
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-12 text-gray-500">
                  <div className="p-4 bg-gradient-to-r from-gray-100 to-gray-200 rounded-full w-20 h-20 mx-auto mb-4 flex items-center justify-center">
                    <Camera className="w-10 h-10 text-gray-400" />
                  </div>
                  <p className="text-lg font-medium">依頼ファイルが見つかりません</p>
                </div>
              )}
            </div>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Status Management Card */}
            <div className="bg-white/80 backdrop-blur-xl rounded-2xl shadow-xl border border-white/20 p-6 hover:shadow-2xl transition-all duration-500">
              <h3 className="text-xl font-bold text-gray-900 mb-6 flex items-center space-x-3">
                <div className="p-2 bg-gradient-to-r from-blue-500 to-purple-500 rounded-lg shadow-lg">
                  <Clock className="w-5 h-5 text-white" />
                </div>
                <span className="bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">ステータス管理</span>
              </h3>

              <div className="space-y-5">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-3 flex items-center space-x-2">
                    <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                    <span>現在のステータス</span>
                  </label>
                  <select
                    value={data.request_status}
                    onChange={handleStatusChange}
                    disabled={statusUpdating}
                    className="w-full rounded-xl border border-gray-200 px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:bg-gray-100 disabled:cursor-not-allowed shadow-inner bg-gradient-to-r from-white to-gray-50 hover:shadow-md transition-all duration-300"
                  >
                    {STATUS_OPTIONS.map((opt) => (
                      <option key={opt.value} value={opt.value}>
                        {opt.label}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Status Messages */}
                {statusUpdating && (
                  <div className="flex items-center space-x-3 text-blue-600 bg-blue-50 border border-blue-200 rounded-xl p-4 shadow-inner">
                    <Loader2 className="w-5 h-5 animate-spin" />
                    <span className="font-medium">更新中...</span>
                  </div>
                )}

                {statusSuccess && (
                  <div className="flex items-center space-x-3 text-green-600 bg-green-50 border border-green-200 rounded-xl p-4 shadow-inner">
                    <CheckCircle className="w-5 h-5" />
                    <span className="font-medium">{statusSuccess}</span>
                  </div>
                )}

                {statusError && (
                  <div className="flex items-center space-x-3 text-red-600 bg-red-50 border border-red-200 rounded-xl p-4 shadow-inner">
                    <AlertCircle className="w-5 h-5" />
                    <span className="font-medium">{statusError}</span>
                  </div>
                )}
              </div>
            </div>

            {/* Delivery Info Card */}
            <div className="bg-white/80 backdrop-blur-xl rounded-2xl shadow-xl border border-white/20 p-6 hover:shadow-2xl transition-all duration-500">
              <h3 className="text-xl font-bold text-gray-900 mb-6 flex items-center space-x-3">
                <div className="p-2 bg-gradient-to-r from-green-500 to-teal-500 rounded-lg shadow-lg">
                  <Calendar className="w-5 h-5 text-white" />
                </div>
                <span className="bg-gradient-to-r from-green-600 to-teal-600 bg-clip-text text-transparent">納品情報</span>
              </h3>

              <div className="space-y-4">
                <div className="bg-gradient-to-r from-green-50 to-teal-50 rounded-xl p-4 border border-green-200/50">
                  <div className="text-sm font-semibold text-gray-700 mb-2 flex items-center space-x-2">
                    <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                    <span>納品希望日</span>
                  </div>
                  <p className="text-gray-900 font-bold text-lg">
                    {new Date(data.desire_delivery_date).toLocaleString(
                      "ja-JP",
                      {
                        year: "numeric",
                        month: "long",
                        day: "numeric",
                        hour: "2-digit",
                        minute: "2-digit",
                      }
                    )}
                  </p>
                </div>

                <div className="pt-4 border-t border-gray-200">
                  <div className="bg-gradient-to-r from-orange-50 to-red-50 rounded-xl p-4 border border-orange-200/50">
                    <p className="text-sm font-semibold text-gray-700 mb-1">残り時間</p>
                    <p className="text-2xl font-bold text-orange-600">
                      {Math.ceil(
                        (new Date(data.desire_delivery_date).getTime() -
                          Date.now()) /
                          (1000 * 60 * 60 * 24)
                      )} 日
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Completion Modal */}
        {showCompletionModal && (
          <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-in fade-in duration-300">
            <div className="bg-gradient-to-br from-white via-purple-50/90 to-pink-50/90 rounded-3xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto border border-white/20 animate-in zoom-in-95 duration-500">
              <div className="p-8 border-b border-gradient-to-r from-purple-200/50 to-pink-200/50 bg-gradient-to-r from-purple-50/50 to-pink-50/50">
                <div className="flex items-center justify-between">
                  <h3 className="text-2xl font-bold text-gray-900 flex items-center space-x-3">
                    <div className="p-3 bg-gradient-to-r from-green-500 to-emerald-500 rounded-2xl shadow-xl animate-pulse">
                      <CheckCircle className="w-6 h-6 text-white" />
                    </div>
                    <span className="bg-gradient-to-r from-green-600 to-emerald-600 bg-clip-text text-transparent">依頼完了</span>
                  </h3>
                  <button
                    onClick={() => setShowCompletionModal(false)}
                    className="p-2 hover:bg-red-50 rounded-xl transition-all duration-300 hover:scale-110 group"
                  >
                    <X className="w-6 h-6 text-gray-400 group-hover:text-red-500 transition-colors" />
                  </button>
                </div>
                <p className="text-gray-600 mt-3 leading-relaxed">
                  完了したファイルをアップロードして、依頼を完了としてマークします。
                </p>
              </div>

              <div className="p-8">
                <div className="space-y-6">
                  {data.files?.map((file, index) => (
                    <div key={index} className="bg-gradient-to-br from-white/80 to-gray-50/80 rounded-2xl border border-white/50 p-6 shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-[1.02] backdrop-blur-sm">
                      <div className="flex items-center justify-between mb-4">
                        <div className="flex items-center space-x-4">
                          <div className="p-3 bg-gradient-to-r from-purple-100 to-pink-100 rounded-xl shadow-md">
                            <Camera className="w-6 h-6 text-purple-600" />
                          </div>
                          <div>
                            <p className="font-semibold text-gray-900 text-lg">
                              ファイル {index + 1}
                            </p>
                            <p className="text-sm text-gray-600">
                              タイプ: {file.file_type}
                            </p>
                          </div>
                        </div>
                        <div className={`px-4 py-2 rounded-full text-sm font-semibold shadow-md ${
                          file.file_status === "完了"
                            ? "bg-gradient-to-r from-green-100 to-emerald-100 text-green-800 border border-green-200"
                            : "bg-gradient-to-r from-yellow-100 to-orange-100 text-yellow-800 border border-yellow-200"
                        }`}>
                          {file.file_status === "完了" ? "完了" : "処理中"}
                        </div>
                      </div>

                      <div className="space-y-3">
                        <label className="block text-sm font-semibold text-gray-700 mb-2">
                          完了ファイルのアップロード
                        </label>
                        <input
                          type="file"
                          accept="image/*"
                          onChange={(e) => handleCompletedFileChange(index, e)}
                          className="w-full text-sm text-gray-500 file:mr-4 file:py-3 file:px-6 file:rounded-2xl file:border-0 file:text-sm file:font-semibold file:bg-gradient-to-r file:from-purple-50 file:to-pink-50 file:text-purple-700 hover:file:from-purple-100 hover:file:to-pink-100 file:shadow-md file:transition-all file:duration-300 hover:file:scale-105"
                        />
                        {completedPreviews[index] && (
                          <div className="flex items-center space-x-2 p-3 bg-gradient-to-r from-green-50 to-emerald-50 rounded-xl border border-green-200/50">
                            <CheckCircle className="w-5 h-5 text-green-600" />
                            <p className="text-sm text-green-700 font-medium">
                              ファイルが選択されました
                            </p>
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>

                <div className="flex space-x-4 mt-8">
                  <Button
                    onClick={() => setShowCompletionModal(false)}
                    variant="secondary"
                    className="flex-1 py-3 px-6 rounded-2xl border-2 border-gray-200 hover:border-gray-300 hover:bg-gray-50 transition-all duration-300 hover:scale-105 font-semibold shadow-md"
                  >
                    キャンセル
                  </Button>
                  <Button
                    onClick={handleCompleteRequest}
                    disabled={statusUpdating || !Object.values(completedFiles).some(file => file)}
                    className="flex-1 py-3 px-6 rounded-2xl bg-gradient-to-r from-green-500 to-emerald-500 hover:from-green-600 hover:to-emerald-600 text-white font-semibold shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100"
                  >
                    {statusUpdating ? (
                      <div className="flex items-center space-x-3">
                        <Loader2 className="w-5 h-5 animate-spin" />
                        <span>完了中...</span>
                      </div>
                    ) : (
                      <div className="flex items-center space-x-3">
                        <CheckCircle className="w-5 h-5" />
                        <span>完了としてマーク</span>
                      </div>
                    )}
                  </Button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default PhotoEditRequestDetailPage;
