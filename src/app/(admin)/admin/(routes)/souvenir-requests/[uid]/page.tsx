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
        <div className="grid grid-cols-1 xl:grid-cols-3 gap-8">
          {/* Left Column - Main Details */}
          <div className="xl:col-span-2 space-y-8">
            {/* Request Overview Card */}
            <div className="bg-white rounded-2xl shadow-xl border border-slate-200 overflow-hidden">
              <div className="bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-600 px-6 py-4">
                <h2 className="text-xl font-bold text-white flex items-center">
                  <i className="fa-solid fa-clipboard-list mr-3"></i>
                  依頼概要
                </h2>
              </div>
              <div className="p-6">
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-semibold text-slate-600 mb-2">
                        <i className="fa-solid fa-hashtag mr-2 text-indigo-500"></i>
                        依頼コード
                      </label>
                      <div className="bg-gradient-to-r from-indigo-50 to-purple-50 px-4 py-3 rounded-lg border border-indigo-200">
                        <p className="text-slate-900 font-mono font-bold text-lg">{request.code}</p>
                      </div>
                    </div>
                    <div>
                      <label className="block text-sm font-semibold text-slate-600 mb-2">
                        <i className="fa-solid fa-tag mr-2 text-indigo-500"></i>
                        依頼タイプ
                      </label>
                      <p className="text-slate-900 font-medium bg-slate-50 px-3 py-2 rounded-lg border">
                        {request.request_type === 'souvenir_request' ? 'お土産依頼' : request.request_type}
                      </p>
                    </div>
                    <div>
                      <label className="block text-sm font-semibold text-slate-600 mb-2">
                        <i className="fa-solid fa-calendar-days mr-2 text-indigo-500"></i>
                        希望納期
                      </label>
                      <div className="bg-gradient-to-r from-blue-50 to-indigo-50 px-4 py-3 rounded-lg border border-blue-200">
                        <p className="text-slate-900 font-semibold text-lg">
                          {new Date(request.desire_delivery_date).toLocaleDateString("ja-JP", {
                            year: 'numeric',
                            month: 'long',
                            day: 'numeric',
                            weekday: 'long'
                          })}
                        </p>
                        <p className="text-slate-600 text-sm mt-1">
                          {new Date(request.desire_delivery_date).toLocaleDateString("ja-JP", {
                            year: 'numeric',
                            month: '2-digit',
                            day: '2-digit'
                          })}
                        </p>
                      </div>
                    </div>
                  </div>
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-semibold text-slate-600 mb-2">
                        <i className="fa-solid fa-clock mr-2 text-indigo-500"></i>
                        依頼日時
                      </label>
                      <div className="bg-gradient-to-r from-emerald-50 to-teal-50 px-4 py-3 rounded-lg border border-emerald-200">
                        <p className="text-slate-900 font-semibold">
                          {new Date(request.created_at).toLocaleDateString("ja-JP", {
                            year: 'numeric',
                            month: 'long',
                            day: 'numeric',
                            weekday: 'long'
                          })}
                        </p>
                        <p className="text-slate-600 text-sm mt-1">
                          {new Date(request.created_at).toLocaleTimeString("ja-JP", {
                            hour: '2-digit',
                            minute: '2-digit',
                            second: '2-digit'
                          })}
                        </p>
                      </div>
                    </div>
                    <div>
                      <label className="block text-sm font-semibold text-slate-600 mb-2">
                        <i className="fa-solid fa-fingerprint mr-2 text-indigo-500"></i>
                        ユニークID
                      </label>
                      <p className="text-slate-900 font-mono text-sm bg-slate-50 px-3 py-2 rounded-lg border break-all">
                        {request.uid}
                      </p>
                    </div>
                  </div>
                </div>

                <div className="mt-8">
                  <label className="block text-sm font-semibold text-slate-600 mb-4">
                    <i className="fa-solid fa-align-left mr-2 text-indigo-500"></i>
                    依頼内容
                  </label>
                  <div className="bg-gradient-to-br from-slate-50 to-slate-100 rounded-xl p-6 border-l-4 border-indigo-500 shadow-inner">
                    <p className="text-slate-900 whitespace-pre-wrap leading-relaxed text-lg">
                      {request.description}
                    </p>
                  </div>
                </div>

                {request.special_note && (
                  <div className="mt-6">
                    <label className="block text-sm font-semibold text-slate-600 mb-4">
                      <i className="fa-solid fa-sticky-note mr-2 text-amber-500"></i>
                      特記事項
                    </label>
                    <div className="bg-gradient-to-br from-amber-50 to-orange-50 rounded-xl p-6 border-l-4 border-amber-500 shadow-inner">
                      <p className="text-slate-900 whitespace-pre-wrap leading-relaxed text-lg font-medium">
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
                <div className="bg-gradient-to-r from-emerald-500 via-teal-500 to-cyan-600 px-6 py-4">
                  <h2 className="text-xl font-bold text-white flex items-center">
                    <i className="fa-solid fa-images mr-3"></i>
                    依頼ファイル ({request.request_files.length}件)
                  </h2>
                </div>
                <div className="p-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
                    {request.request_files.map((file, index) => (
                      <div key={index} className="group bg-gradient-to-br from-slate-50 to-slate-100 rounded-2xl p-6 border border-slate-200 hover:shadow-2xl transition-all duration-300 hover:border-slate-300 hover:-translate-y-1">
                        <div className="aspect-square bg-gradient-to-br from-slate-100 to-slate-200 rounded-xl mb-4 flex items-center justify-center overflow-hidden shadow-inner relative">
                          {file.file_type === 'image' ? (
                            <>
                              <img
                                src={file.file}
                                alt={`File ${index + 1}`}
                                className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                              />
                              <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                            </>
                          ) : (
                            <div className="text-slate-400 flex flex-col items-center">
                              <i className={`fa-solid ${getFileIcon(file.file_type)} text-5xl mb-2`}></i>
                              <span className="text-sm font-medium uppercase tracking-wide">{file.file_type}</span>
                            </div>
                          )}
                        </div>
                        <div className="space-y-4">
                          <div className="flex items-center justify-between">
                            <h3 className="font-bold text-slate-900 text-lg">ファイル {index + 1}</h3>
                            <span className={`px-3 py-1 text-xs font-bold rounded-full shadow-md ${
                              file.file_status === 'completed' ? 'bg-gradient-to-r from-emerald-400 to-emerald-500 text-emerald-900' :
                              file.file_status === 'in_progress' ? 'bg-gradient-to-r from-blue-400 to-blue-500 text-blue-900' :
                              'bg-gradient-to-r from-yellow-400 to-yellow-500 text-yellow-900'
                            }`}>
                              <i className={`fa-solid mr-1 ${
                                file.file_status === 'completed' ? 'fa-check-circle' :
                                file.file_status === 'in_progress' ? 'fa-cog' :
                                'fa-clock'
                              }`}></i>
                              {file.file_status === 'completed' ? '完了' :
                               file.file_status === 'in_progress' ? '作業中' : '未着手'}
                            </span>
                          </div>
                          <div className="space-y-3 text-sm">
                            <div className="flex items-center justify-between bg-white/60 px-3 py-2 rounded-lg">
                              <span className="text-slate-600 font-medium">
                                <i className="fa-solid fa-file mr-2 text-slate-400"></i>
                                タイプ
                              </span>
                              <span className="text-slate-900 font-semibold capitalize">{file.file_type}</span>
                            </div>
                            <div className="flex items-center justify-between bg-white/60 px-3 py-2 rounded-lg">
                              <span className="text-slate-600 font-medium">
                                <i className="fa-solid fa-hashtag mr-2 text-slate-400"></i>
                                数量
                              </span>
                              <span className="text-slate-900 font-bold text-lg">{file.quantity}</span>
                            </div>
                          </div>
                          {file.file_type === 'image' && (
                            <a
                              href={file.file}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="inline-flex items-center justify-center w-full px-4 py-3 bg-gradient-to-r from-indigo-500 to-purple-600 text-white font-semibold rounded-lg transition-all duration-200 hover:from-indigo-600 hover:to-purple-700 hover:shadow-lg transform hover:-translate-y-0.5 group-hover:shadow-xl"
                            >
                              <i className="fa-solid fa-external-link-alt mr-2"></i>
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
            {/* Request Summary Card */}
            <div className="bg-white rounded-2xl shadow-xl border border-slate-200 overflow-hidden">
              <div className="bg-gradient-to-r from-slate-700 via-slate-800 to-slate-900 px-6 py-4">
                <h3 className="text-xl font-bold text-white flex items-center">
                  <i className="fa-solid fa-chart-line mr-3"></i>
                  依頼サマリー
                </h3>
              </div>
              <div className="p-6">
                <div className="space-y-6">
                  {/* Status Overview */}
                  <div className="bg-gradient-to-r from-slate-50 to-slate-100 rounded-xl p-4 border border-slate-200">
                    <h4 className="text-sm font-bold text-slate-800 mb-3 flex items-center">
                      <i className="fa-solid fa-tasks mr-2 text-slate-600"></i>
                      現在のステータス
                    </h4>
                    <div className="flex justify-center">
                      {getStatusBadge(request.request_status)}
                    </div>
                  </div>

                  {/* Key Metrics */}
                  <div className="grid grid-cols-2 gap-4">
                    <div className="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-xl p-4 border border-blue-200 text-center">
                      <div className="text-2xl font-black text-blue-900 mb-1">
                        {request.request_files?.length || 0}
                      </div>
                      <div className="text-sm font-semibold text-blue-700 uppercase tracking-wide">
                        ファイル数
                      </div>
                    </div>
                    <div className="bg-gradient-to-br from-emerald-50 to-green-50 rounded-xl p-4 border border-emerald-200 text-center">
                      <div className="text-2xl font-black text-emerald-900 mb-1">
                        {request.request_files?.reduce((total, file) => total + file.quantity, 0) || 0}
                      </div>
                      <div className="text-sm font-semibold text-emerald-700 uppercase tracking-wide">
                        総数量
                      </div>
                    </div>
                  </div>

                  {/* Timeline */}
                  <div className="bg-gradient-to-br from-purple-50 to-pink-50 rounded-xl p-4 border border-purple-200">
                    <h4 className="text-sm font-bold text-purple-800 mb-3 flex items-center">
                      <i className="fa-solid fa-timeline mr-2 text-purple-600"></i>
                      タイムライン
                    </h4>
                    <div className="space-y-3">
                      <div className="flex items-center space-x-3">
                        <div className="w-2 h-2 bg-purple-500 rounded-full"></div>
                        <div className="flex-1">
                          <div className="text-sm font-semibold text-purple-900">依頼作成</div>
                          <div className="text-xs text-purple-600">
                            {new Date(request.created_at).toLocaleString("ja-JP")}
                          </div>
                        </div>
                      </div>
                      {request.payment_details && (
                        <div className="flex items-center space-x-3">
                          <div className="w-2 h-2 bg-emerald-500 rounded-full"></div>
                          <div className="flex-1">
                            <div className="text-sm font-semibold text-emerald-900">支払い完了</div>
                            <div className="text-xs text-emerald-600">
                              {new Date(request.payment_details.created_at).toLocaleString("ja-JP")}
                            </div>
                          </div>
                        </div>
                      )}
                      <div className="flex items-center space-x-3">
                        <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                        <div className="flex-1">
                          <div className="text-sm font-semibold text-blue-900">希望納期</div>
                          <div className="text-xs text-blue-600">
                            {new Date(request.desire_delivery_date).toLocaleString("ja-JP")}
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Quick Stats */}
                  <div className="bg-gradient-to-r from-indigo-50 to-purple-50 rounded-xl p-4 border border-indigo-200">
                    <h4 className="text-sm font-bold text-indigo-800 mb-3 flex items-center">
                      <i className="fa-solid fa-chart-bar mr-2 text-indigo-600"></i>
                      詳細情報
                    </h4>
                    <div className="space-y-2 text-sm">
                      <div className="flex justify-between">
                        <span className="text-indigo-600">依頼タイプ:</span>
                        <span className="font-semibold text-indigo-900">
                          {request.request_type === 'souvenir_request' ? 'お土産依頼' : request.request_type}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-indigo-600">特記事項:</span>
                        <span className={`font-semibold ${
                          request.special_note ? 'text-emerald-700' : 'text-slate-500'
                        }`}>
                          {request.special_note ? 'あり' : 'なし'}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-indigo-600">支払い状況:</span>
                        <span className={`font-semibold ${
                          request.payment_details?.is_paid ? 'text-emerald-700' : 'text-red-700'
                        }`}>
                          {request.payment_details?.is_paid ? '完了' : '未払い'}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
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

                <div className="bg-gradient-to-r from-amber-50 to-orange-50 border border-amber-200 rounded-xl p-5 mb-6">
                  <div className="flex items-start">
                    <div className="bg-amber-100 rounded-full p-2 mr-4">
                      <i className="fa-solid fa-info-circle text-amber-600 text-lg"></i>
                    </div>
                    <div>
                      <h4 className="text-sm font-bold text-amber-800 mb-2">ステータス更新機能</h4>
                      <p className="text-sm text-amber-700 leading-relaxed">
                        現在、ステータス更新機能はバックエンドAPIの準備中です。近日中に実装予定です。
                      </p>
                      <p className="text-xs text-amber-600 mt-2 font-medium">
                        実装までお待ちください。
                      </p>
                    </div>
                  </div>
                </div>

                {/* Status Preview */}
                <div className="space-y-3">
                  <h4 className="text-sm font-bold text-slate-800 flex items-center">
                    <i className="fa-solid fa-eye mr-2 text-slate-600"></i>
                    利用可能なステータス
                  </h4>
                  <div className="grid grid-cols-1 gap-3">
                    {[
                      { value: 'pending', label: '未着手', desc: '作業を開始していない状態', color: 'bg-gradient-to-r from-yellow-400 to-yellow-500' },
                      { value: 'in_progress', label: '作業中', desc: '現在作業進行中の状態', color: 'bg-gradient-to-r from-blue-400 to-blue-500' },
                      { value: 'completed', label: '完了', desc: '作業が完了した状態', color: 'bg-gradient-to-r from-emerald-400 to-emerald-500' },
                      { value: 'rejected', label: '却下', desc: '依頼が却下された状態', color: 'bg-gradient-to-r from-red-400 to-red-500' }
                    ].map((status) => (
                      <div key={status.value} className="bg-slate-50 rounded-lg p-4 border border-slate-200">
                        <div className="flex items-center justify-between mb-2">
                          <span className={`inline-flex items-center rounded-full px-3 py-1 text-xs font-bold text-white shadow-md ${status.color}`}>
                            <i className={`fa-solid mr-1 ${
                              status.value === 'pending' ? 'fa-clock' :
                              status.value === 'in_progress' ? 'fa-cog' :
                              status.value === 'completed' ? 'fa-check-circle' :
                              'fa-times-circle'
                            }`}></i>
                            {status.label}
                          </span>
                          {request.request_status === status.value && (
                            <span className="text-xs font-bold text-emerald-600 bg-emerald-100 px-2 py-1 rounded-full">
                              現在
                            </span>
                          )}
                        </div>
                        <p className="text-sm text-slate-600">{status.desc}</p>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>

            {/* Payment Information Card */}
            <div className="bg-white rounded-2xl shadow-xl border border-slate-200 overflow-hidden">
              <div className="bg-gradient-to-r from-emerald-500 via-green-500 to-teal-600 px-6 py-4">
                <h3 className="text-xl font-bold text-white flex items-center">
                  <i className="fa-solid fa-credit-card mr-3"></i>
                  支払い情報
                </h3>
              </div>
              <div className="p-6">
                {request.payment_details ? (
                  <div className="space-y-6">
                    <div className="text-center mb-6">
                      {getPaymentStatusBadge(request.payment_details)}
                    </div>

                    {/* Payment Amount - Premium Display */}
                    <div className="bg-gradient-to-r from-emerald-50 via-green-50 to-teal-50 rounded-2xl p-6 border-2 border-emerald-200 shadow-inner">
                      <div className="text-center">
                        <div className="text-sm font-semibold text-emerald-700 mb-2 uppercase tracking-wide">
                          支払い金額
                        </div>
                        <div className="text-4xl font-black text-emerald-900 mb-1">
                          {formatCurrency(request.payment_details.amount, request.payment_details.currency)}
                        </div>
                        <div className="text-sm text-emerald-600 font-medium">
                          {request.payment_details.currency} {request.payment_details.amount.toLocaleString()}
                        </div>
                      </div>
                    </div>

                    {/* Payment Details Grid */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="bg-gradient-to-br from-slate-50 to-slate-100 rounded-xl p-4 border border-slate-200">
                        <div className="flex items-center mb-3">
                          <i className="fa-solid fa-user text-slate-500 mr-3 text-lg"></i>
                          <span className="text-sm font-semibold text-slate-700 uppercase tracking-wide">支払いユーザー</span>
                        </div>
                        <p className="text-slate-900 font-mono text-sm break-all bg-white px-3 py-2 rounded-lg border">
                          {request.payment_details.user}
                        </p>
                      </div>

                      <div className="bg-gradient-to-br from-slate-50 to-slate-100 rounded-xl p-4 border border-slate-200">
                        <div className="flex items-center mb-3">
                          <i className="fa-solid fa-credit-card text-slate-500 mr-3 text-lg"></i>
                          <span className="text-sm font-semibold text-slate-700 uppercase tracking-wide">支払いタイプ</span>
                        </div>
                        <p className="text-slate-900 font-semibold bg-white px-3 py-2 rounded-lg border">
                          {request.payment_details.payment_type === 'one_time' ? '一回払い' : request.payment_details.payment_type}
                        </p>
                      </div>

                      <div className="bg-gradient-to-br from-slate-50 to-slate-100 rounded-xl p-4 border border-slate-200">
                        <div className="flex items-center mb-3">
                          <i className="fa-solid fa-clock text-slate-500 mr-3 text-lg"></i>
                          <span className="text-sm font-semibold text-slate-700 uppercase tracking-wide">支払い日時</span>
                        </div>
                        <div className="bg-white px-3 py-2 rounded-lg border">
                          <p className="text-slate-900 font-semibold">
                            {new Date(request.payment_details.created_at).toLocaleDateString("ja-JP", {
                              year: 'numeric',
                              month: 'long',
                              day: 'numeric',
                              weekday: 'long'
                            })}
                          </p>
                          <p className="text-slate-600 text-sm mt-1">
                            {new Date(request.payment_details.created_at).toLocaleTimeString("ja-JP", {
                              hour: '2-digit',
                              minute: '2-digit',
                              second: '2-digit'
                            })}
                          </p>
                        </div>
                      </div>

                      <div className="bg-gradient-to-br from-slate-50 to-slate-100 rounded-xl p-4 border border-slate-200">
                        <div className="flex items-center mb-3">
                          <i className="fa-solid fa-check-circle text-slate-500 mr-3 text-lg"></i>
                          <span className="text-sm font-semibold text-slate-700 uppercase tracking-wide">支払いステータス</span>
                        </div>
                        <div className="bg-white px-3 py-2 rounded-lg border">
                          <div className="flex items-center">
                            <i className={`fa-solid mr-2 text-lg ${
                              request.payment_details.is_paid ? 'fa-check-circle text-emerald-500' : 'fa-times-circle text-red-500'
                            }`}></i>
                            <span className={`font-bold ${
                              request.payment_details.is_paid ? 'text-emerald-700' : 'text-red-700'
                            }`}>
                              {request.payment_details.is_paid ? '支払い済み' : '未払い'}
                            </span>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Payment Status Summary */}
                    <div className="bg-gradient-to-r from-slate-100 to-slate-200 rounded-xl p-4 border border-slate-300">
                      <h4 className="text-sm font-bold text-slate-800 mb-3 flex items-center">
                        <i className="fa-solid fa-info-circle mr-2 text-slate-600"></i>
                        支払いサマリー
                      </h4>
                      <div className="grid grid-cols-2 gap-4 text-sm">
                        <div className="flex justify-between">
                          <span className="text-slate-600">通貨:</span>
                          <span className="font-semibold text-slate-900">{request.payment_details.currency}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-slate-600">ステータス:</span>
                          <span className={`font-bold ${
                            request.payment_details.status === 'successful' ? 'text-emerald-700' :
                            request.payment_details.status === 'pending' ? 'text-yellow-700' :
                            request.payment_details.status === 'failed' ? 'text-red-700' :
                            'text-slate-700'
                          }`}>
                            {request.payment_details.status === 'successful' ? '成功' :
                             request.payment_details.status === 'pending' ? '処理中' :
                             request.payment_details.status === 'failed' ? '失敗' :
                             request.payment_details.status}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="text-center py-12">
                    <div className="bg-gradient-to-br from-slate-100 to-slate-200 rounded-full w-20 h-20 mx-auto mb-6 flex items-center justify-center">
                      <i className="fa-solid fa-exclamation-triangle text-3xl text-amber-500"></i>
                    </div>
                    <h3 className="text-xl font-bold text-slate-800 mb-2">支払い情報がありません</h3>
                    <p className="text-slate-600 font-medium">この依頼はまだ支払われていません</p>
                    <div className="mt-4 p-4 bg-amber-50 rounded-lg border border-amber-200">
                      <p className="text-amber-700 text-sm">
                        <i className="fa-solid fa-info-circle mr-2"></i>
                        支払いが完了すると、このセクションに詳細な支払い情報が表示されます。
                      </p>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Quick Actions Card */}
            <div className="bg-white rounded-2xl shadow-xl border border-slate-200 overflow-hidden">
              <div className="bg-gradient-to-r from-purple-500 via-pink-500 to-rose-600 px-6 py-4">
                <h3 className="text-xl font-bold text-white flex items-center">
                  <i className="fa-solid fa-bolt mr-3"></i>
                  クイックアクション
                </h3>
              </div>
              <div className="p-6">
                <div className="grid grid-cols-1 gap-4">
                  <button className="group w-full px-6 py-4 bg-gradient-to-r from-slate-50 to-slate-100 hover:from-slate-100 hover:to-slate-200 text-slate-700 font-semibold rounded-xl transition-all duration-200 border border-slate-200 hover:border-slate-300 hover:shadow-lg transform hover:-translate-y-0.5">
                    <div className="flex items-center">
                      <div className="bg-gradient-to-r from-blue-500 to-indigo-600 rounded-lg p-3 mr-4 group-hover:scale-110 transition-transform duration-200">
                        <i className="fa-solid fa-download text-white text-lg"></i>
                      </div>
                      <div className="text-left">
                        <div className="font-bold text-slate-900">ファイルをダウンロード</div>
                        <div className="text-sm text-slate-600">全ての依頼ファイルをZIPでダウンロード</div>
                      </div>
                    </div>
                  </button>

                  <button className="group w-full px-6 py-4 bg-gradient-to-r from-slate-50 to-slate-100 hover:from-slate-100 hover:to-slate-200 text-slate-700 font-semibold rounded-xl transition-all duration-200 border border-slate-200 hover:border-slate-300 hover:shadow-lg transform hover:-translate-y-0.5">
                    <div className="flex items-center">
                      <div className="bg-gradient-to-r from-green-500 to-emerald-600 rounded-lg p-3 mr-4 group-hover:scale-110 transition-transform duration-200">
                        <i className="fa-solid fa-envelope text-white text-lg"></i>
                      </div>
                      <div className="text-left">
                        <div className="font-bold text-slate-900">ユーザーに連絡</div>
                        <div className="text-sm text-slate-600">依頼者へのメール送信</div>
                      </div>
                    </div>
                  </button>

                  <button className="group w-full px-6 py-4 bg-gradient-to-r from-slate-50 to-slate-100 hover:from-slate-100 hover:to-slate-200 text-slate-700 font-semibold rounded-xl transition-all duration-200 border border-slate-200 hover:border-slate-300 hover:shadow-lg transform hover:-translate-y-0.5">
                    <div className="flex items-center">
                      <div className="bg-gradient-to-r from-purple-500 to-violet-600 rounded-lg p-3 mr-4 group-hover:scale-110 transition-transform duration-200">
                        <i className="fa-solid fa-history text-white text-lg"></i>
                      </div>
                      <div className="text-left">
                        <div className="font-bold text-slate-900">履歴を表示</div>
                        <div className="text-sm text-slate-600">ステータス変更履歴の確認</div>
                      </div>
                    </div>
                  </button>

                  <button className="group w-full px-6 py-4 bg-gradient-to-r from-slate-50 to-slate-100 hover:from-slate-100 hover:to-slate-200 text-slate-700 font-semibold rounded-xl transition-all duration-200 border border-slate-200 hover:border-slate-300 hover:shadow-lg transform hover:-translate-y-0.5">
                    <div className="flex items-center">
                      <div className="bg-gradient-to-r from-orange-500 to-red-600 rounded-lg p-3 mr-4 group-hover:scale-110 transition-transform duration-200">
                        <i className="fa-solid fa-print text-white text-lg"></i>
                      </div>
                      <div className="text-left">
                        <div className="font-bold text-slate-900">レポート出力</div>
                        <div className="text-sm text-slate-600">依頼詳細のPDFレポート</div>
                      </div>
                    </div>
                  </button>

                  <button className="group w-full px-6 py-4 bg-gradient-to-r from-slate-50 to-slate-100 hover:from-slate-100 hover:to-slate-200 text-slate-700 font-semibold rounded-xl transition-all duration-200 border border-slate-200 hover:border-slate-300 hover:shadow-lg transform hover:-translate-y-0.5">
                    <div className="flex items-center">
                      <div className="bg-gradient-to-r from-cyan-500 to-blue-600 rounded-lg p-3 mr-4 group-hover:scale-110 transition-transform duration-200">
                        <i className="fa-solid fa-share text-white text-lg"></i>
                      </div>
                      <div className="text-left">
                        <div className="font-bold text-slate-900">共有リンク</div>
                        <div className="text-sm text-slate-600">依頼詳細の共有URL生成</div>
                      </div>
                    </div>
                  </button>
                </div>

                {/* Action Summary */}
                <div className="mt-6 bg-gradient-to-r from-slate-100 to-slate-200 rounded-xl p-4 border border-slate-300">
                  <h4 className="text-sm font-bold text-slate-800 mb-2 flex items-center">
                    <i className="fa-solid fa-lightbulb mr-2 text-slate-600"></i>
                    アクションのヒント
                  </h4>
                  <p className="text-sm text-slate-600 leading-relaxed">
                    これらのアクションは、バックエンドAPIの実装完了後に有効になります。
                    現在はUIプレビューとして表示されています。
                  </p>
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
