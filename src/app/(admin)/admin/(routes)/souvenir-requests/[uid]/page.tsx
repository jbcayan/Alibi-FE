"use client";
import React, { useEffect, useState, ChangeEvent, FC } from "react";
import { useRouter, useParams } from "next/navigation";
import Breadcrumbs from "@/components/ui/Breadcrumbs";
import { baseUrl } from "@/constants/baseApi";

// Interfaces
interface SouvenirRequestDetail {
  uid: string;
  code: string;
  description: string;
  special_note: string;
  request_status: string;
  request_type: string;
  desire_delivery_date: string;
  created_at: string;
  request_files: Array<{
    file: string;
    file_type: string;
    file_status: string;
    quantity: number;
  }>;
  payment_details: {
    user: string;
    payment_type: string;
    amount: number;
    currency: string;
    status: string;
    created_at: string;
    is_paid: boolean;
  } | null;
}

const RequestDetailsPage: FC = () => {
  const router = useRouter();
  const params = useParams();
  const uid = params && typeof params.uid === "string" ? params.uid : "";
  const [request, setRequest] = useState<SouvenirRequestDetail | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (uid) fetchRequestDetails();
  }, [uid]);

  const fetchRequestDetails = async () => {
    try {
      setLoading(true);
      const accessToken =
        typeof window !== "undefined"
          ? localStorage.getItem("accessToken")
          : null;

      // Fetch all souvenir requests and find the one with matching UID
      const response = await fetch(
        `${baseUrl}/gallery/admin/souvenir-requests?limit=1000`, // Get a large number to ensure we find the request
        {
          method: "GET",
          headers: {
            "Content-Type": "application/json",
            ...(accessToken ? { Authorization: `Bearer ${accessToken}` } : {}),
          },
        }
      );

      if (!response.ok) {
        throw new Error("依頼データの取得に失敗しました");
      }

      const data = await response.json();
      const requests = data.results || data.data || data;

      // Find the request with matching UID
      const matchingRequest = Array.isArray(requests)
        ? requests.find((req: any) => req.uid === uid)
        : null;

      if (!matchingRequest) {
        throw new Error("指定された依頼が見つかりません");
      }

      setRequest(matchingRequest);
    } catch (error) {
      setError("依頼詳細の取得に失敗しました");
    } finally {
      setLoading(false);
    }
  };

  const getStatusBadge = (status: string) => {
    const statusConfig = {
      pending: {
        label: "未着手",
        color: "bg-gradient-to-r from-yellow-400 to-yellow-500 text-yellow-900",
        icon: "fa-clock"
      },
      in_progress: {
        label: "作業中",
        color: "bg-gradient-to-r from-blue-400 to-blue-500 text-blue-900",
        icon: "fa-cog"
      },
      completed: {
        label: "完了",
        color: "bg-gradient-to-r from-green-400 to-green-500 text-green-900",
        icon: "fa-check-circle"
      },
      rejected: {
        label: "却下",
        color: "bg-gradient-to-r from-red-400 to-red-500 text-red-900",
        icon: "fa-times-circle"
      },
    };

    const config = statusConfig[status as keyof typeof statusConfig] || {
      label: status,
      color: "bg-gradient-to-r from-gray-400 to-gray-500 text-gray-900",
      icon: "fa-question-circle"
    };

    return (
      <span className={`inline-flex items-center rounded-full px-4 py-2 text-sm font-bold shadow-lg ${config.color}`}>
        <i className={`fa-solid ${config.icon} mr-2`}></i>
        {config.label}
      </span>
    );
  };

  const getPaymentStatusBadge = (paymentDetails: SouvenirRequestDetail['payment_details']) => {
    if (!paymentDetails) {
      return (
        <span className="inline-flex items-center rounded-full px-4 py-2 text-sm font-bold bg-gradient-to-r from-gray-400 to-gray-500 text-gray-900 shadow-lg">
          <i className="fa-solid fa-times-circle mr-2"></i>
          未払い
        </span>
      );
    }

    const { status, is_paid } = paymentDetails;
    const statusConfig = {
      pending: {
        label: "処理中",
        color: "bg-gradient-to-r from-yellow-400 to-yellow-500 text-yellow-900",
        icon: "fa-clock"
      },
      successful: {
        label: "支払済",
        color: "bg-gradient-to-r from-emerald-400 to-emerald-500 text-emerald-900",
        icon: "fa-check-circle"
      },
      failed: {
        label: "失敗",
        color: "bg-gradient-to-r from-red-400 to-red-500 text-red-900",
        icon: "fa-times-circle"
      },
      cancelled: {
        label: "キャンセル",
        color: "bg-gradient-to-r from-gray-400 to-gray-500 text-gray-900",
        icon: "fa-ban"
      },
    };

    const config = statusConfig[status as keyof typeof statusConfig] || {
      label: status,
      color: "bg-gradient-to-r from-gray-400 to-gray-500 text-gray-900",
      icon: "fa-question-circle"
    };

    return (
      <span className={`inline-flex items-center rounded-full px-4 py-2 text-sm font-bold shadow-lg ${config.color}`}>
        <i className={`fa-solid ${config.icon} mr-2`}></i>
        {config.label}
      </span>
    );
  };

  const formatCurrency = (amount: number, currency: string) => {
    if (currency === 'JPY') {
      return `¥${amount.toLocaleString()}`;
    }
    return `${currency} ${amount.toLocaleString()}`;
  };

  const getFileIcon = (fileType: string) => {
    const iconMap = {
      image: "fa-image",
      video: "fa-video",
      audio: "fa-music",
      pdf: "fa-file-pdf",
      docx: "fa-file-word",
      pptx: "fa-file-powerpoint",
      xlsx: "fa-file-excel",
      other: "fa-file"
    };
    return iconMap[fileType as keyof typeof iconMap] || "fa-file";
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100">
        <div className="max-w-7xl mx-auto px-4 py-8">
          <div className="animate-pulse">
            <div className="h-8 bg-slate-200 rounded-lg w-1/3 mb-8"></div>
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
              <div className="lg:col-span-2 space-y-6">
                <div className="h-64 bg-slate-200 rounded-xl"></div>
                <div className="h-48 bg-slate-200 rounded-xl"></div>
              </div>
              <div className="space-y-6">
                <div className="h-32 bg-slate-200 rounded-xl"></div>
                <div className="h-48 bg-slate-200 rounded-xl"></div>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (error || !request) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100">
        <div className="max-w-7xl mx-auto px-4 py-8">
          <div className="mb-8">
            <button
              onClick={() => router.back()}
              className="inline-flex items-center px-4 py-2 text-sm font-medium text-slate-600 hover:text-slate-800 hover:bg-slate-100 rounded-lg transition-colors"
            >
              <i className="fa-solid fa-arrow-left mr-2"></i>
              戻る
            </button>
          </div>
          <div className="bg-red-50 border border-red-200 rounded-xl p-8 text-center">
            <i className="fa-solid fa-exclamation-triangle text-4xl text-red-500 mb-4"></i>
            <h2 className="text-xl font-semibold text-red-800 mb-2">エラーが発生しました</h2>
            <p className="text-red-600">{error || "依頼が見つかりません"}</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-slate-100">
      <div className="max-w-7xl mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <button
                onClick={() => router.back()}
                className="inline-flex items-center px-4 py-2 text-sm font-medium text-slate-600 hover:text-slate-800 hover:bg-slate-100 rounded-lg transition-all duration-200 hover:shadow-md"
              >
                <i className="fa-solid fa-arrow-left mr-2"></i>
                戻る
              </button>
              <div>
                <h1 className="text-3xl font-bold text-slate-900">お土産依頼詳細</h1>
                <p className="text-slate-600 mt-1">依頼ID: {request.code}</p>
              </div>
            </div>
            <div className="flex items-center space-x-3">
              {getStatusBadge(request.request_status)}
            </div>
          </div>
        </div>

        {/* Main Content */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Left Column - Main Details */}
          <div className="lg:col-span-2 space-y-8">
            {/* Request Overview Card */}
            <div className="bg-white rounded-2xl shadow-xl border border-slate-200 overflow-hidden">
              <div className="bg-gradient-to-r from-indigo-500 to-purple-600 px-6 py-4">
                <h2 className="text-xl font-bold text-white flex items-center">
                  <i className="fa-solid fa-clipboard-list mr-3"></i>
                  依頼概要
                </h2>
              </div>
              <div className="p-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-semibold text-slate-600 mb-2">
                        <i className="fa-solid fa-tag mr-2 text-indigo-500"></i>
                        依頼タイプ
                      </label>
                      <p className="text-slate-900 font-medium bg-slate-50 px-3 py-2 rounded-lg">
                        {request.request_type === 'souvenir_request' ? 'お土産依頼' : request.request_type}
                      </p>
                    </div>
                    <div>
                      <label className="block text-sm font-semibold text-slate-600 mb-2">
                        <i className="fa-solid fa-calendar-days mr-2 text-indigo-500"></i>
                        希望納期
                      </label>
                      <p className="text-slate-900 font-medium bg-slate-50 px-3 py-2 rounded-lg">
                        {new Date(request.desire_delivery_date).toLocaleDateString("ja-JP", {
                          year: 'numeric',
                          month: 'long',
                          day: 'numeric',
                          weekday: 'long'
                        })}
                      </p>
                    </div>
                  </div>
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-semibold text-slate-600 mb-2">
                        <i className="fa-solid fa-clock mr-2 text-indigo-500"></i>
                        依頼日時
                      </label>
                      <p className="text-slate-900 font-medium bg-slate-50 px-3 py-2 rounded-lg">
                        {new Date(request.created_at).toLocaleString("ja-JP")}
                      </p>
                    </div>
                    <div>
                      <label className="block text-sm font-semibold text-slate-600 mb-2">
                        <i className="fa-solid fa-hashtag mr-2 text-indigo-500"></i>
                        依頼コード
                      </label>
                      <p className="text-slate-900 font-medium bg-slate-50 px-3 py-2 rounded-lg font-mono">
                        {request.code}
                      </p>
                    </div>
                  </div>
                </div>

                <div className="mt-6">
                  <label className="block text-sm font-semibold text-slate-600 mb-3">
                    <i className="fa-solid fa-align-left mr-2 text-indigo-500"></i>
                    依頼内容
                  </label>
                  <div className="bg-slate-50 rounded-lg p-4 border-l-4 border-indigo-500">
                    <p className="text-slate-900 whitespace-pre-wrap leading-relaxed">
                      {request.description}
                    </p>
                  </div>
                </div>

                {request.special_note && (
                  <div className="mt-6">
                    <label className="block text-sm font-semibold text-slate-600 mb-3">
                      <i className="fa-solid fa-sticky-note mr-2 text-amber-500"></i>
                      特記事項
                    </label>
                    <div className="bg-amber-50 rounded-lg p-4 border-l-4 border-amber-500">
                      <p className="text-slate-900 whitespace-pre-wrap leading-relaxed">
                        {request.special_note}
                      </p>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Request Files Card */}
            {request.request_files && request.request_files.length > 0 && (
              <div className="bg-white rounded-2xl shadow-xl border border-slate-200 overflow-hidden">
                <div className="bg-gradient-to-r from-emerald-500 to-teal-600 px-6 py-4">
                  <h2 className="text-xl font-bold text-white flex items-center">
                    <i className="fa-solid fa-images mr-3"></i>
                    依頼ファイル ({request.request_files.length}件)
                  </h2>
                </div>
                <div className="p-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {request.request_files.map((file, index) => (
                      <div key={index} className="group bg-slate-50 rounded-xl p-4 border border-slate-200 hover:shadow-lg transition-all duration-300 hover:border-slate-300">
                        <div className="aspect-square bg-gradient-to-br from-slate-100 to-slate-200 rounded-lg mb-4 flex items-center justify-center overflow-hidden">
                          {file.file_type === 'image' ? (
                            <img
                              src={file.file}
                              alt={`File ${index + 1}`}
                              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                            />
                          ) : (
                            <div className="text-slate-400">
                              <i className={`fa-solid ${getFileIcon(file.file_type)} text-4xl`}></i>
                            </div>
                          )}
                        </div>
                        <div className="space-y-2">
                          <div className="flex items-center justify-between">
                            <p className="font-semibold text-slate-900">ファイル {index + 1}</p>
                            <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                              file.file_status === 'completed' ? 'bg-emerald-100 text-emerald-800' :
                              file.file_status === 'in_progress' ? 'bg-blue-100 text-blue-800' :
                              'bg-yellow-100 text-yellow-800'
                            }`}>
                              {file.file_status === 'completed' ? '完了' :
                               file.file_status === 'in_progress' ? '作業中' : '未着手'}
                            </span>
                          </div>
                          <div className="text-sm text-slate-600 space-y-1">
                            <p className="flex items-center">
                              <i className="fa-solid fa-file mr-2 text-slate-400"></i>
                              {file.file_type}
                            </p>
                            <p className="flex items-center">
                              <i className="fa-solid fa-hashtag mr-2 text-slate-400"></i>
                              数量: {file.quantity}
                            </p>
                          </div>
                          {file.file_type === 'image' && (
                            <a
                              href={file.file}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="inline-flex items-center text-sm text-indigo-600 hover:text-indigo-800 font-medium mt-2 group-hover:underline"
                            >
                              <i className="fa-solid fa-external-link-alt mr-1"></i>
                              画像を表示
                            </a>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Right Column - Status & Actions */}
          <div className="space-y-8">
            {/* Status Management Card */}
            <div className="bg-white rounded-2xl shadow-xl border border-slate-200 overflow-hidden">
              <div className="bg-gradient-to-r from-slate-700 to-slate-800 px-6 py-4">
                <h3 className="text-xl font-bold text-white flex items-center">
                  <i className="fa-solid fa-tasks mr-3"></i>
                  ステータス管理
                </h3>
              </div>
              <div className="p-6">
                <div className="mb-6">
                  <label className="block text-sm font-semibold text-slate-600 mb-3">
                    現在のステータス
                  </label>
                  <div className="flex justify-center">
                    {getStatusBadge(request.request_status)}
                  </div>
                </div>

                <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
                  <div className="flex items-start">
                    <i className="fa-solid fa-info-circle text-amber-500 mt-0.5 mr-3"></i>
                    <div>
                      <h4 className="text-sm font-semibold text-amber-800 mb-1">ステータス更新機能</h4>
                      <p className="text-sm text-amber-700">
                        現在、ステータス更新機能はバックエンドAPIの準備中です。近日中に実装予定です。
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Payment Information Card */}
            <div className="bg-white rounded-2xl shadow-xl border border-slate-200 overflow-hidden">
              <div className="bg-gradient-to-r from-emerald-500 to-green-600 px-6 py-4">
                <h3 className="text-xl font-bold text-white flex items-center">
                  <i className="fa-solid fa-credit-card mr-3"></i>
                  支払い情報
                </h3>
              </div>
              <div className="p-6">
                {request.payment_details ? (
                  <div className="space-y-4">
                    <div className="text-center mb-4">
                      {getPaymentStatusBadge(request.payment_details)}
                    </div>

                    <div className="bg-slate-50 rounded-lg p-4 space-y-3">
                      <div className="flex justify-between items-center">
                        <span className="text-sm font-medium text-slate-600">金額</span>
                        <span className="text-lg font-bold text-slate-900">
                          {formatCurrency(request.payment_details.amount, request.payment_details.currency)}
                        </span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-sm font-medium text-slate-600">支払いタイプ</span>
                        <span className="text-sm text-slate-900">
                          {request.payment_details.payment_type === 'one_time' ? '一回払い' : request.payment_details.payment_type}
                        </span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-sm font-medium text-slate-600">支払い日時</span>
                        <span className="text-sm text-slate-900">
                          {new Date(request.payment_details.created_at).toLocaleString("ja-JP")}
                        </span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-sm font-medium text-slate-600">ユーザー</span>
                        <span className="text-sm text-slate-900 font-mono">
                          {request.payment_details.user}
                        </span>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="text-center py-8">
                    <i className="fa-solid fa-exclamation-triangle text-3xl text-amber-500 mb-3"></i>
                    <p className="text-slate-600 font-medium">支払い情報がありません</p>
                    <p className="text-sm text-slate-500 mt-1">この依頼はまだ支払われていません</p>
                  </div>
                )}
              </div>
            </div>

            {/* Quick Actions Card */}
            <div className="bg-white rounded-2xl shadow-xl border border-slate-200 overflow-hidden">
              <div className="bg-gradient-to-r from-purple-500 to-pink-600 px-6 py-4">
                <h3 className="text-xl font-bold text-white flex items-center">
                  <i className="fa-solid fa-bolt mr-3"></i>
                  クイックアクション
                </h3>
              </div>
              <div className="p-6">
                <div className="space-y-3">
                  <button className="w-full px-4 py-3 bg-slate-100 hover:bg-slate-200 text-slate-700 font-medium rounded-lg transition-colors flex items-center justify-center">
                    <i className="fa-solid fa-download mr-2"></i>
                    ファイルをダウンロード
                  </button>
                  <button className="w-full px-4 py-3 bg-slate-100 hover:bg-slate-200 text-slate-700 font-medium rounded-lg transition-colors flex items-center justify-center">
                    <i className="fa-solid fa-envelope mr-2"></i>
                    ユーザーに連絡
                  </button>
                  <button className="w-full px-4 py-3 bg-slate-100 hover:bg-slate-200 text-slate-700 font-medium rounded-lg transition-colors flex items-center justify-center">
                    <i className="fa-solid fa-history mr-2"></i>
                    履歴を表示
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default RequestDetailsPage;
