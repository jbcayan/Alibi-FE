"use client";
import React, { useEffect, useState, ChangeEvent, FC } from "react";
import { useRouter, useParams } from "next/navigation";
import Breadcrumbs from "@/components/ui/Breadcrumbs";
import { baseUrl } from "@/constants/baseApi";

// Interfaces
interface SouvenirRequestDetail {
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
}

interface RequestDetailsProps {}

const RequestDetailsPage: FC<RequestDetailsProps> = () => {
  const router = useRouter();
  const params = useParams();
  const id = params && typeof params.id === "string" ? params.id : "";
  const [request, setRequest] = useState<SouvenirRequestDetail | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (id) fetchRequestDetails();
  }, [id]);

  const fetchRequestDetails = async () => {
    try {
      setLoading(true);
      // Get access token from localStorage
      const accessToken =
        typeof window !== "undefined"
          ? localStorage.getItem("accessToken")
          : null;

      const response = await fetch(
        `${baseUrl}/gallery/admin/souvenir-requests/${id}`,
        {
          method: "GET",
          headers: {
            "Content-Type": "application/json",
            ...(accessToken ? { Authorization: `Bearer ${accessToken}` } : {}),
          },
        }
      );

      if (!response.ok) {
        throw new Error("依頼詳細の取得に失敗しました");
      }

      const data = await response.json();
      setRequest(data);
    } catch (error) {
      setError("依頼詳細の取得に失敗しました");
    } finally {
      setLoading(false);
    }
  };

  const getStatusBadge = (status: string) => {
    const statusConfig = {
      pending: { label: "未着手", color: "bg-yellow-100 text-yellow-800" },
      in_progress: { label: "作業中", color: "bg-blue-100 text-blue-800" },
      completed: { label: "完了", color: "bg-green-100 text-green-800" },
      cancelled: { label: "キャンセル", color: "bg-red-100 text-red-800" },
    };

    const config = statusConfig[status as keyof typeof statusConfig] || {
      label: status,
      color: "bg-gray-100 text-gray-800",
    };

    return (
      <span
        className={`inline-flex rounded-full px-2 py-1 text-xs font-semibold ${config.color}`}
      >
        {config.label}
      </span>
    );
  };

  if (loading) {
    return (
      <div className="flex min-h-screen flex-col bg-white">
        <header className="border-b border-gray-200 bg-white px-4 py-4 sm:px-6">
          <h1 className="text-lg font-semibold text-gray-800 sm:text-2xl">
            依頼詳細
          </h1>
        </header>
        <main className="flex-1 px-4 py-6 sm:px-6">
          <div className="py-12 text-center text-gray-600">読み込み中...</div>
        </main>
      </div>
    );
  }

  if (error || !request) {
    return (
      <div className="flex min-h-screen flex-col bg-white">
        <header className="border-b border-gray-200 bg-white px-4 py-4 sm:px-6">
          <div className="flex items-center gap-4">
            <button
              onClick={() => router.back()}
              className="text-[#357AFF] hover:text-[#2E69DE]"
            >
              <i className="fa-solid fa-arrow-left mr-2"></i>
              戻る
            </button>
            <h1 className="text-lg font-semibold text-gray-800 sm:text-2xl">
              依頼詳細
            </h1>
          </div>
        </header>
        <main className="flex-1 px-4 py-6 sm:px-6">
          <div className="rounded bg-red-50 p-4 text-center text-red-500">
            {error || "依頼が見つかりません"}
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen flex-col bg-white">
      <div className="mb-8">
        <Breadcrumbs
          items={[
            { label: "お土産依頼", href: "/admin/souvenir-requests" },
            { label: "お土産依頼の詳細", href: "/admin/souvenir-requests" },
          ]}
          homeHref="/admin"
        />
      </div>
      <header className="border-b border-gray-200 bg-white px-4 py-4 sm:px-6">
        <div className="flex items-center gap-4">
          <button
            onClick={() => router.back()}
            className="text-[#357AFF] hover:text-[#2E69DE]"
          >
            <i className="fa-solid fa-arrow-left mr-2"></i>
            戻る
          </button>
          <h1 className="text-lg font-semibold text-gray-800 sm:text-2xl">
            依頼詳細 - ID: {request.uid}
          </h1>
        </div>
      </header>

      <main className="flex-1 px-4 py-6 sm:px-6">
        {error && (
          <div className="mb-4 rounded bg-red-50 p-3 text-sm text-red-500">
            {error}
          </div>
        )}

        <div className="grid gap-6 lg:grid-cols-3">
          {/* Main Details */}
          <div className="lg:col-span-2">
            <div className="rounded-lg border border-gray-200 bg-white p-6">
              <h2 className="mb-4 text-xl font-semibold text-gray-800">
                依頼情報
              </h2>

              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <label className="block text-sm font-medium text-gray-500">
                    依頼タイプ
                  </label>
                  <p className="mt-1 text-sm text-gray-900">
                    {request.request_type}
                  </p>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-500">
                    希望納期
                  </label>
                  <p className="mt-1 text-sm text-gray-900">
                    {new Date(request.desire_delivery_date).toLocaleDateString("ja-JP")}
                  </p>
                </div>

                <div className="sm:col-span-2">
                  <label className="block text-sm font-medium text-gray-500">
                    依頼内容
                  </label>
                  <p className="mt-1 text-sm text-gray-900 whitespace-pre-wrap">
                    {request.description}
                  </p>
                </div>

                {request.special_note && (
                  <div className="sm:col-span-2">
                    <label className="block text-sm font-medium text-gray-500">
                      特記事項
                    </label>
                    <p className="mt-1 text-sm text-gray-900 whitespace-pre-wrap">
                      {request.special_note}
                    </p>
                  </div>
                )}
              </div>
            </div>

            {/* Request Files */}
            {request.request_files && request.request_files.length > 0 && (
              <div className="rounded-lg border border-gray-200 bg-white p-6 mt-6">
                <h2 className="mb-4 text-xl font-semibold text-gray-800">
                  依頼ファイル
                </h2>

                <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                  {request.request_files.map((file, index) => (
                    <div key={index} className="border border-gray-200 rounded-lg p-4">
                      <div className="aspect-square bg-gray-100 rounded-lg mb-3 flex items-center justify-center">
                        {file.file_type === 'image' ? (
                          <img
                            src={file.file}
                            alt={`File ${index + 1}`}
                            className="max-w-full max-h-full object-contain rounded"
                          />
                        ) : (
                          <div className="text-gray-400">
                            <i className="fa-solid fa-file text-2xl"></i>
                          </div>
                        )}
                      </div>
                      <div className="text-sm">
                        <p className="font-medium text-gray-900">ファイル {index + 1}</p>
                        <p className="text-gray-600">タイプ: {file.file_type}</p>
                        <p className="text-gray-600">数量: {file.quantity}</p>
                        <p className="text-gray-600">ステータス: {file.file_status}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Status and Actions */}
          <div className="space-y-6">
            {/* Status Card */}
            <div className="rounded-lg border border-gray-200 bg-white p-6">
              <h3 className="mb-4 text-lg font-semibold text-gray-800">
                ステータス管理
              </h3>

              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-500 mb-2">
                  現在のステータス
                </label>
                {getStatusBadge(request.request_status)}
              </div>

              <div className="text-xs text-gray-500">
                <p>
                  依頼日時: {new Date(request.created_at).toLocaleString("ja-JP")}
                </p>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
};

export default RequestDetailsPage;
