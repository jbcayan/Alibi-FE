"use client";
import Button from "@/components/admin/ui/Button";
import React, { useEffect, useState, FormEvent, ChangeEvent, FC } from "react";
import Link from "next/link";
import Breadcrumbs from "@/components/ui/Breadcrumbs";
import { baseUrl } from "@/constants/baseApi";

// Interfaces
interface SouvenirRequest {
  uid: string;
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

const MainComponent: FC = () => {
  const [requests, setRequests] = useState<SouvenirRequest[]>([]);
  const [searchRequests, setSearchRequests] = useState<SouvenirRequest[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState<string>("");
  const [selectedStatus, setSelectedStatus] = useState<string>("all");
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [totalPages, setTotalPages] = useState<number>(1);
  const [totalCount, setTotalCount] = useState<number>(0);

  useEffect(() => {
    fetchRequests();
  }, [currentPage, selectedStatus]);

  const fetchRequests = async () => {
    try {
      setLoading(true);
      setError(null);

      const accessToken =
        typeof window !== "undefined"
          ? localStorage.getItem("accessToken")
          : null;

      const params = new URLSearchParams();
      if (searchTerm.trim()) params.append("search", searchTerm.trim());
      if (selectedStatus && selectedStatus !== "all")
        params.append("status", selectedStatus);
      params.append("page", currentPage.toString());
      params.append("limit", "12");

      const url = `${baseUrl}/gallery/admin/souvenir-requests?${params.toString()}`;

      const response = await fetch(url, {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
          ...(accessToken ? { Authorization: `Bearer ${accessToken}` } : {}),
        },
      });

      if (!response.ok) {
        throw new Error(`依頼データの取得に失敗しました (${response.status})`);
      }

      const data = await response.json();
      setRequests(data.results || data.data || data);
      setTotalCount(
        data.count || data.total || (Array.isArray(data) ? data.length : 0)
      );
      setTotalPages(
        data.totalPages || Math.ceil((data.count || data.total || 0) / 12)
      );
    } catch (error: any) {
      console.error("Fetch error:", error);
      setError(error.message || "依頼データの取得に失敗しました");
      setRequests([]);
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setCurrentPage(1);
    fetchRequests();
  };

  const getStatusConfig = (status: string) => {
    const configs = {
      pending: {
        label: "未着手",
        color: "from-amber-400 to-orange-500",
        bgColor: "bg-amber-50",
        textColor: "text-amber-700",
        icon: "fa-clock",
        description: "処理待ち"
      },
      in_progress: {
        label: "作業中",
        color: "from-blue-400 to-indigo-500",
        bgColor: "bg-blue-50",
        textColor: "text-blue-700",
        icon: "fa-cog",
        description: "進行中"
      },
      completed: {
        label: "完了",
        color: "from-emerald-400 to-green-500",
        bgColor: "bg-emerald-50",
        textColor: "text-emerald-700",
        icon: "fa-check-circle",
        description: "完了済み"
      },
      cancelled: {
        label: "キャンセル",
        color: "from-red-400 to-rose-500",
        bgColor: "bg-red-50",
        textColor: "text-red-700",
        icon: "fa-times-circle",
        description: "キャンセル"
      },
    };
    return configs[status as keyof typeof configs] || {
      label: status,
      color: "from-gray-400 to-gray-500",
      bgColor: "bg-gray-50",
      textColor: "text-gray-700",
      icon: "fa-question-circle",
      description: "不明"
    };
  };

  const getPaymentStatusConfig = (paymentDetails: SouvenirRequest['payment_details']) => {
    if (!paymentDetails) {
      return {
        label: "未払い",
        color: "from-gray-400 to-gray-500",
        bgColor: "bg-gray-50",
        textColor: "text-gray-700",
        icon: "fa-exclamation-triangle"
      };
    }

    const { status, is_paid } = paymentDetails;
    const configs = {
      pending: {
        label: "処理中",
        color: "from-amber-400 to-orange-500",
        bgColor: "bg-amber-50",
        textColor: "text-amber-700",
        icon: "fa-clock"
      },
      successful: {
        label: "支払済",
        color: "from-emerald-400 to-green-500",
        bgColor: "bg-emerald-50",
        textColor: "text-emerald-700",
        icon: "fa-check-circle"
      },
      failed: {
        label: "失敗",
        color: "from-red-400 to-rose-500",
        bgColor: "bg-red-50",
        textColor: "text-red-700",
        icon: "fa-times-circle"
      },
      cancelled: {
        label: "キャンセル",
        color: "from-gray-400 to-gray-500",
        bgColor: "bg-gray-50",
        textColor: "text-gray-700",
        icon: "fa-ban"
      },
    };
    return configs[status as keyof typeof configs] || {
      label: status,
      color: "from-gray-400 to-gray-500",
      bgColor: "bg-gray-50",
      textColor: "text-gray-700",
      icon: "fa-question-circle"
    };
  };

  const formatCurrency = (amount: number, currency: string) => {
    if (currency === 'JPY') {
      return `¥${amount.toLocaleString()}`;
    }
    return `${currency} ${amount.toLocaleString()}`;
  };

  const clearFilters = () => {
    setSearchTerm("");
    setSelectedStatus("all");
    setCurrentPage(1);
  };

  const getPaymentStats = () => {
    const stats = {
      total: requests.length,
      paid: requests.filter(r => r.payment_details?.is_paid === true).length,
      pending: requests.filter(r => r.payment_details?.status === 'pending').length,
      failed: requests.filter(r => r.payment_details?.status === 'failed').length,
      unpaid: requests.filter(r => !r.payment_details || r.payment_details.is_paid === false).length,
    };
    return stats;
  };

  const paymentStats = getPaymentStats();

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50">
      {/* Premium Header */}
      <div className="bg-white shadow-lg border-b border-slate-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="py-6">
            <Breadcrumbs
              items={[{ label: "お土産依頼", href: "/admin/souvenir-requests" }]}
              homeHref="/admin"
            />
            <div className="mt-4 flex flex-col lg:flex-row lg:items-center lg:justify-between">
              <div className="flex items-center space-x-4">
                <div className="flex-shrink-0">
                  <div className="w-12 h-12 bg-gradient-to-r from-blue-500 to-indigo-600 rounded-xl flex items-center justify-center shadow-lg">
                    <i className="fas fa-gift text-white text-xl"></i>
                  </div>
                </div>
                <div>
                  <h1 className="text-2xl font-bold text-gray-900 sm:text-3xl">
                    アリバイお土産依頼管理
                  </h1>
                  <p className="mt-1 text-sm text-gray-600">
                    お客様からの特別なお土産依頼を効率的に管理
                  </p>
                </div>
              </div>
              <div className="mt-4 lg:mt-0 flex items-center space-x-4">
                <div className="bg-gradient-to-r from-blue-50 to-indigo-50 px-4 py-2 rounded-lg border border-blue-200">
                  <div className="text-sm text-blue-700 font-medium">
                    総依頼数
                  </div>
                  <div className="text-2xl font-bold text-blue-900">
                    {totalCount.toLocaleString()}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Stats Cards */}
        <div className="grid grid-cols-2 lg:grid-cols-5 gap-4 mb-8">
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4 hover:shadow-md transition-shadow">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">総数</p>
                <p className="text-2xl font-bold text-gray-900">{paymentStats.total}</p>
              </div>
              <div className="w-10 h-10 bg-gray-100 rounded-lg flex items-center justify-center">
                <i className="fas fa-list text-gray-600"></i>
              </div>
            </div>
          </div>
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4 hover:shadow-md transition-shadow">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-emerald-600">支払済</p>
                <p className="text-2xl font-bold text-emerald-700">{paymentStats.paid}</p>
              </div>
              <div className="w-10 h-10 bg-emerald-100 rounded-lg flex items-center justify-center">
                <i className="fas fa-check-circle text-emerald-600"></i>
              </div>
            </div>
          </div>
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4 hover:shadow-md transition-shadow">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-amber-600">支払待ち</p>
                <p className="text-2xl font-bold text-amber-700">{paymentStats.pending}</p>
              </div>
              <div className="w-10 h-10 bg-amber-100 rounded-lg flex items-center justify-center">
                <i className="fas fa-clock text-amber-600"></i>
              </div>
            </div>
          </div>
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4 hover:shadow-md transition-shadow">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-red-600">支払失敗</p>
                <p className="text-2xl font-bold text-red-700">{paymentStats.failed}</p>
              </div>
              <div className="w-10 h-10 bg-red-100 rounded-lg flex items-center justify-center">
                <i className="fas fa-times-circle text-red-600"></i>
              </div>
            </div>
          </div>
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4 hover:shadow-md transition-shadow">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">未払い</p>
                <p className="text-2xl font-bold text-gray-700">{paymentStats.unpaid}</p>
              </div>
              <div className="w-10 h-10 bg-gray-100 rounded-lg flex items-center justify-center">
                <i className="fas fa-exclamation-triangle text-gray-600"></i>
              </div>
            </div>
          </div>
        </div>

        {/* Search and Filters */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 mb-8">
          <form onSubmit={handleSearch} className="space-y-4">
            <div className="grid grid-cols-1 lg:grid-cols-4 gap-4">
              <div className="lg:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  検索
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <i className="fas fa-search text-gray-400"></i>
                  </div>
                  <input
                    type="text"
                    value={searchTerm}
                    onChange={(e: ChangeEvent<HTMLInputElement>) =>
                      setSearchTerm(e.target.value)
                    }
                    placeholder="依頼者名、依頼内容で検索..."
                    className="block w-full pl-10 pr-3 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  ステータス
                </label>
                <select
                  value={selectedStatus}
                  onChange={(e: ChangeEvent<HTMLSelectElement>) =>
                    setSelectedStatus(e.target.value)
                  }
                  className="block w-full py-3 px-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors cursor-pointer"
                >
                  <option value="all">全てのステータス</option>
                  <option value="pending">未着手</option>
                  <option value="in_progress">作業中</option>
                  <option value="completed">完了</option>
                  <option value="cancelled">キャンセル</option>
                </select>
              </div>
              <div className="flex items-end space-x-2">
                <Button type="submit" className="flex-1 bg-gradient-to-r from-blue-500 to-indigo-600 hover:from-blue-600 hover:to-indigo-700 text-white font-medium py-3 px-4 rounded-lg transition-all duration-200 shadow-sm hover:shadow-md">
                  <i className="fas fa-search mr-2"></i>
                  検索
                </Button>
                <button
                  type="button"
                  onClick={clearFilters}
                  className="px-4 py-3 text-sm text-gray-600 hover:text-gray-800 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  <i className="fas fa-times"></i>
                </button>
              </div>
            </div>
          </form>
        </div>

        {/* Error Message */}
        {error && (
          <div className="mb-6 bg-red-50 border border-red-200 rounded-xl p-4 flex items-center justify-between">
            <div className="flex items-center">
              <i className="fas fa-exclamation-triangle text-red-500 mr-3"></i>
              <span className="text-red-700">{error}</span>
            </div>
            <button
              onClick={() => setError(null)}
              className="text-red-500 hover:text-red-700 transition-colors"
            >
              <i className="fas fa-times"></i>
            </button>
          </div>
        )}

        {/* Loading State */}
        {loading ? (
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-12">
            <div className="text-center">
              <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-r from-blue-100 to-indigo-100 rounded-full mb-4">
                <i className="fas fa-spinner fa-spin text-blue-600 text-xl"></i>
              </div>
              <h3 className="text-lg font-medium text-gray-900 mb-2">読み込み中</h3>
              <p className="text-gray-600">依頼データを取得しています...</p>
            </div>
          </div>
        ) : (
          <>
            {/* Premium Table */}
            {requests.length > 0 ? (
              <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
                {/* Table Header Summary */}
                <div className="bg-gradient-to-r from-slate-50 to-blue-50 px-6 py-4 border-b border-gray-200">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-4">
                      <div className="flex items-center space-x-2">
                        <i className="fas fa-table text-blue-600"></i>
                        <span className="text-sm font-medium text-gray-700">お土産依頼一覧</span>
                      </div>
                      <div className="text-sm text-gray-600">
                        全<span className="font-semibold text-blue-600">{totalCount}</span>件
                      </div>
                    </div>
                    <div className="flex items-center space-x-4 text-sm text-gray-600">
                      <div className="flex items-center space-x-1">
                        <div className="w-3 h-3 bg-emerald-100 rounded-full"></div>
                        <span>支払済: {paymentStats.paid}</span>
                      </div>
                      <div className="flex items-center space-x-1">
                        <div className="w-3 h-3 bg-amber-100 rounded-full"></div>
                        <span>支払待ち: {paymentStats.pending}</span>
                      </div>
                      <div className="flex items-center space-x-1">
                        <div className="w-3 h-3 bg-red-100 rounded-full"></div>
                        <span>支払失敗: {paymentStats.failed}</span>
                      </div>
                      <div className="flex items-center space-x-1">
                        <div className="w-3 h-3 bg-gray-100 rounded-full"></div>
                        <span>未払い: {paymentStats.unpaid}</span>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gradient-to-r from-slate-50 to-blue-50">
                      <tr>
                        <th className="px-6 py-4 text-left text-xs font-bold text-gray-700 uppercase tracking-wider">
                          <div className="flex items-center space-x-2">
                            <i className="fas fa-hashtag text-gray-500"></i>
                            <span>依頼ID</span>
                          </div>
                        </th>
                        <th className="px-6 py-4 text-left text-xs font-bold text-gray-700 uppercase tracking-wider">
                          <div className="flex items-center space-x-2">
                            <i className="fas fa-file-alt text-gray-500"></i>
                            <span>依頼内容</span>
                          </div>
                        </th>
                        <th className="px-6 py-4 text-left text-xs font-bold text-gray-700 uppercase tracking-wider">
                          <div className="flex items-center space-x-2">
                            <i className="fas fa-calendar-check text-gray-500"></i>
                            <span>希望納期</span>
                          </div>
                        </th>
                        <th className="px-6 py-4 text-left text-xs font-bold text-gray-700 uppercase tracking-wider">
                          <div className="flex items-center space-x-2">
                            <i className="fas fa-tasks text-gray-500"></i>
                            <span>ステータス</span>
                          </div>
                        </th>
                        <th className="px-6 py-4 text-left text-xs font-bold text-gray-700 uppercase tracking-wider">
                          <div className="flex items-center space-x-2">
                            <i className="fas fa-yen-sign text-gray-500"></i>
                            <span>支払金額</span>
                          </div>
                        </th>
                        <th className="px-6 py-4 text-left text-xs font-bold text-gray-700 uppercase tracking-wider">
                          <div className="flex items-center space-x-2">
                            <i className="fas fa-credit-card text-gray-500"></i>
                            <span>支払状況</span>
                          </div>
                        </th>
                        <th className="px-6 py-4 text-left text-xs font-bold text-gray-700 uppercase tracking-wider">
                          <div className="flex items-center space-x-2">
                            <i className="fas fa-clock text-gray-500"></i>
                            <span>依頼日時</span>
                          </div>
                        </th>
                        <th className="px-6 py-4 text-left text-xs font-bold text-gray-700 uppercase tracking-wider">
                          <div className="flex items-center space-x-2">
                            <i className="fas fa-paperclip text-gray-500"></i>
                            <span>添付ファイル</span>
                          </div>
                        </th>
                        <th className="px-6 py-4 text-left text-xs font-bold text-gray-700 uppercase tracking-wider">
                          <div className="flex items-center space-x-2">
                            <i className="fas fa-cogs text-gray-500"></i>
                            <span>操作</span>
                          </div>
                        </th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-100">
                      {requests.map((request, index) => {
                        const statusConfig = getStatusConfig(request.request_status);
                        const paymentConfig = getPaymentStatusConfig(request.payment_details);

                        return (
                          <tr
                            key={request.uid}
                            className={`hover:bg-gradient-to-r hover:from-blue-50 hover:to-indigo-50 transition-all duration-300 ${
                              index % 2 === 0 ? 'bg-white' : 'bg-gray-50/30'
                            } hover:shadow-sm`}
                          >
                            <td className="px-6 py-4 whitespace-nowrap">
                              <div className="flex items-center">
                                <div className="w-8 h-8 bg-gradient-to-r from-blue-100 to-indigo-100 rounded-lg flex items-center justify-center mr-3">
                                  <i className="fas fa-hashtag text-blue-600 text-xs"></i>
                                </div>
                                <div>
                                  <div className="text-sm font-mono font-semibold text-gray-900">
                                    #{request.uid}
                                  </div>
                                  <div className="text-xs text-gray-500">
                                    {request.request_type}
                                  </div>
                                </div>
                              </div>
                            </td>
                            <td className="px-6 py-4">
                              <div className="max-w-xs">
                                <div className="text-sm font-medium text-gray-900 line-clamp-2">
                                  {request.description}
                                </div>
                                {request.special_note && (
                                  <div className="text-xs text-gray-500 mt-1 line-clamp-1">
                                    <i className="fas fa-sticky-note mr-1"></i>
                                    {request.special_note}
                                  </div>
                                )}
                              </div>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <div className="flex items-center">
                                <div className={`w-8 h-8 rounded-lg flex items-center justify-center mr-3 ${
                                  new Date(request.desire_delivery_date) < new Date()
                                    ? 'bg-red-100'
                                    : Math.ceil((new Date(request.desire_delivery_date).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24)) <= 3
                                    ? 'bg-amber-100'
                                    : 'bg-emerald-100'
                                }`}>
                                  <i className={`fas fa-calendar-check text-xs ${
                                    new Date(request.desire_delivery_date) < new Date()
                                      ? 'text-red-600'
                                      : Math.ceil((new Date(request.desire_delivery_date).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24)) <= 3
                                      ? 'text-amber-600'
                                      : 'text-emerald-600'
                                  }`}></i>
                                </div>
                                <div>
                                  <div className={`text-sm font-medium ${
                                    new Date(request.desire_delivery_date) < new Date()
                                      ? 'text-red-700'
                                      : 'text-gray-900'
                                  }`}>
                                    {new Date(request.desire_delivery_date).toLocaleDateString("ja-JP")}
                                  </div>
                                  <div className={`text-xs ${
                                    new Date(request.desire_delivery_date) < new Date()
                                      ? 'text-red-600 font-medium'
                                      : Math.ceil((new Date(request.desire_delivery_date).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24)) <= 3
                                      ? 'text-amber-600'
                                      : 'text-gray-500'
                                  }`}>
                                    {new Date(request.desire_delivery_date) < new Date() ? (
                                      <span>期限切れ</span>
                                    ) : (
                                      <span>残り{Math.ceil((new Date(request.desire_delivery_date).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24))}日</span>
                                    )}
                                  </div>
                                </div>
                              </div>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <div className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-bold ${statusConfig.bgColor} ${statusConfig.textColor} border border-current border-opacity-20`}>
                                <i className={`fas ${statusConfig.icon} mr-2`}></i>
                                {statusConfig.label}
                              </div>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <div className="flex items-center">
                                <div className="w-8 h-8 bg-gradient-to-r from-emerald-100 to-green-100 rounded-lg flex items-center justify-center mr-3">
                                  <i className="fas fa-yen-sign text-emerald-600 text-xs"></i>
                                </div>
                                <div>
                                  <div className="text-sm font-bold text-gray-900">
                                    {request.payment_details ?
                                      formatCurrency(request.payment_details.amount, request.payment_details.currency)
                                      : "未設定"
                                    }
                                  </div>
                                  {request.payment_details && (
                                    <div className="text-xs text-gray-500">
                                      {request.payment_details.payment_type}
                                    </div>
                                  )}
                                </div>
                              </div>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <div className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-bold ${paymentConfig.bgColor} ${paymentConfig.textColor} border border-current border-opacity-20`}>
                                <i className={`fas ${paymentConfig.icon} mr-2`}></i>
                                {paymentConfig.label}
                              </div>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <div className="flex items-center">
                                <div className="w-8 h-8 bg-gradient-to-r from-blue-100 to-indigo-100 rounded-lg flex items-center justify-center mr-3">
                                  <i className="fas fa-clock text-blue-600 text-xs"></i>
                                </div>
                                <div>
                                  <div className="text-sm font-medium text-gray-900">
                                    {new Date(request.created_at).toLocaleDateString("ja-JP")}
                                  </div>
                                  <div className="text-xs text-gray-500">
                                    {new Date(request.created_at).toLocaleTimeString("ja-JP", {
                                      hour: '2-digit',
                                      minute: '2-digit'
                                    })}
                                  </div>
                                </div>
                              </div>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              {request.request_files && request.request_files.length > 0 ? (
                                <div className="flex items-center">
                                  <div className="w-8 h-8 bg-gradient-to-r from-purple-100 to-pink-100 rounded-lg flex items-center justify-center mr-3">
                                    <i className="fas fa-paperclip text-purple-600 text-xs"></i>
                                  </div>
                                  <div>
                                    <div className="text-sm font-medium text-gray-900">
                                      {request.request_files.length}件
                                    </div>
                                    <div className="text-xs text-gray-500">
                                      {request.request_files.filter(f => f.file_status === 'completed').length}/{request.request_files.length} 完了
                                    </div>
                                  </div>
                                </div>
                              ) : (
                                <div className="flex items-center">
                                  <div className="w-8 h-8 bg-gray-100 rounded-lg flex items-center justify-center mr-3">
                                    <i className="fas fa-minus text-gray-400 text-xs"></i>
                                  </div>
                                  <span className="text-sm text-gray-500">なし</span>
                                </div>
                              )}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-right">
                              <div className="flex items-center justify-end space-x-2">
                                <Link
                                  href={`/admin/souvenir-requests/${request.uid}`}
                                  className="inline-flex items-center px-4 py-2 bg-gradient-to-r from-blue-500 to-indigo-600 hover:from-blue-600 hover:to-indigo-700 text-white text-sm font-medium rounded-lg transition-all duration-200 shadow-sm hover:shadow-md transform hover:scale-105"
                                >
                                  <i className="fas fa-eye mr-2"></i>
                                  詳細
                                </Link>
                                <div className="relative">
                                  <button
                                    className="inline-flex items-center px-3 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 text-sm font-medium rounded-lg transition-all duration-200 shadow-sm hover:shadow-md"
                                    title="クイックアクション"
                                  >
                                    <i className="fas fa-ellipsis-v"></i>
                                  </button>
                                </div>
                              </div>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>
            ) : (
              /* Empty State */
              <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-12 text-center">
                <div className="inline-flex items-center justify-center w-20 h-20 bg-gradient-to-r from-gray-100 to-gray-200 rounded-full mb-6">
                  <i className="fas fa-file-alt text-gray-400 text-2xl"></i>
                </div>
                <h3 className="text-xl font-semibold text-gray-900 mb-2">
                  依頼データが見つかりません
                </h3>
                <p className="text-gray-600 mb-6">
                  指定された条件に一致するお土産依頼はありません
                </p>
                {(searchTerm || selectedStatus !== "all") && (
                  <button
                    onClick={clearFilters}
                    className="inline-flex items-center px-4 py-2 bg-gradient-to-r from-blue-500 to-indigo-600 hover:from-blue-600 hover:to-indigo-700 text-white font-medium rounded-lg transition-colors"
                  >
                    <i className="fas fa-filter mr-2"></i>
                    フィルターをクリア
                  </button>
                )}
              </div>
            )}

            {/* Premium Pagination */}
            {totalPages > 1 && (
              <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                <div className="flex flex-col sm:flex-row items-center justify-between space-y-4 sm:space-y-0">
                  <div className="flex items-center space-x-4">
                    <div className="text-sm text-gray-600">
                      <span className="font-medium">{totalCount.toLocaleString()}</span> 件中{" "}
                      <span className="font-medium">
                        {currentPage === 1 ? 1 : (currentPage - 1) * 12 + 1} -{" "}
                        {Math.min(currentPage * 12, totalCount)}
                      </span>{" "}
                      件を表示
                    </div>
                    <div className="flex items-center space-x-2">
                      <span className="text-sm text-gray-500">表示件数:</span>
                      <select
                        value="12"
                        className="text-sm border border-gray-300 rounded-lg px-2 py-1 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                        disabled
                      >
                        <option value="12">12件</option>
                      </select>
                    </div>
                  </div>
                  <div className="flex items-center space-x-2">
                    <button
                      onClick={() => setCurrentPage(1)}
                      disabled={currentPage === 1}
                      className="p-2 text-gray-400 hover:text-blue-600 hover:bg-blue-50 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:text-gray-400 disabled:hover:bg-transparent rounded-lg transition-all duration-200"
                      title="最初のページ"
                    >
                      <i className="fas fa-angle-double-left"></i>
                    </button>
                    <button
                      onClick={() => setCurrentPage(currentPage - 1)}
                      disabled={currentPage === 1}
                      className="p-2 text-gray-400 hover:text-blue-600 hover:bg-blue-50 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:text-gray-400 disabled:hover:bg-transparent rounded-lg transition-all duration-200"
                      title="前のページ"
                    >
                      <i className="fas fa-angle-left"></i>
                    </button>

                    <div className="flex items-center space-x-1">
                      {Array.from({ length: totalPages }, (_, i) => i + 1)
                        .filter((page) => {
                          if (page === 1 || page === totalPages) return true;
                          if (Math.abs(page - currentPage) <= 2) return true;
                          return false;
                        })
                        .map((page, index, array) => {
                          const prevPage = array[index - 1];
                          const showEllipsis = prevPage && page - prevPage > 1;

                          return (
                            <React.Fragment key={page}>
                              {showEllipsis && (
                                <span className="px-3 py-2 text-gray-400">...</span>
                              )}
                              <button
                                onClick={() => setCurrentPage(page)}
                                className={`px-4 py-2 text-sm font-medium rounded-lg transition-all duration-200 ${
                                  currentPage === page
                                    ? "bg-gradient-to-r from-blue-500 to-indigo-600 text-white shadow-sm"
                                    : "text-gray-600 hover:bg-blue-50 hover:text-blue-600"
                                }`}
                              >
                                {page}
                              </button>
                            </React.Fragment>
                          );
                        })}
                    </div>

                    <button
                      onClick={() => setCurrentPage(currentPage + 1)}
                      disabled={currentPage === totalPages}
                      className="p-2 text-gray-400 hover:text-blue-600 hover:bg-blue-50 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:text-gray-400 disabled:hover:bg-transparent rounded-lg transition-all duration-200"
                      title="次のページ"
                    >
                      <i className="fas fa-angle-right"></i>
                    </button>
                    <button
                      onClick={() => setCurrentPage(totalPages)}
                      disabled={currentPage === totalPages}
                      className="p-2 text-gray-400 hover:text-blue-600 hover:bg-blue-50 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:text-gray-400 disabled:hover:bg-transparent rounded-lg transition-all duration-200"
                      title="最後のページ"
                    >
                      <i className="fas fa-angle-double-right"></i>
                    </button>
                  </div>
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
};

export default MainComponent;
