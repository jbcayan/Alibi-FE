"use client";
import React, { useState } from "react";
import Button from "@/components/admin/ui/Button";
import BulkDownloadModal from "@/components/admin/BulkDownloadModal";
import Breadcrumbs from "@/components/ui/Breadcrumbs";
import { Download } from "lucide-react";

const Downloads: React.FC = () => {
  const [showBulkDownloadModal, setShowBulkDownloadModal] =
    useState<boolean>(false);

  return (
    <div className="flex min-h-screen flex-col lg:p-4 bg-white">
      {/* Breadcrumbs */}
      <div className="mb-8">
        <Breadcrumbs
          items={[{ label: "ダウンロード", href: "/admin/downloads" }]}
          homeHref="/admin"
        />
      </div>

      {/* Header */}
      <header className="border-b border-gray-200 bg-white px-4 py-4 sm:px-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-lg font-semibold text-gray-800 sm:text-2xl">
              ダウンロード管理
            </h1>
            <p className="text-sm text-gray-600 mt-1">
              依頼データの一括ダウンロードと管理
            </p>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 px-4 py-6 sm:px-6">
        <div className="max-w-4xl mx-auto">
          {/* Quick Actions Section */}
          <div className="mb-8">
            <h2 className="text-lg font-semibold text-gray-800 mb-4">
              クイックダウンロード
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              <div className="bg-white border border-gray-200 rounded-lg p-6 hover:shadow-md transition-shadow">
                <div className="flex items-center mb-4">
                  <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                    <i className="fa-solid fa-download text-blue-600 text-xl"></i>
                  </div>
                  <div className="ml-4">
                    <h3 className="font-semibold text-gray-800">編集依頼</h3>
                    <p className="text-sm text-gray-600">写真編集依頼データ</p>
                  </div>
                </div>
                <Button
                  onClick={() => setShowBulkDownloadModal(true)}
                  className="w-full flex items-center bg-blue-600 cursor-pointer hover:bg-blue-700 text-white"
                >
                  <Download />
                  <span className="">ダウンロードリクエスト</span>
                </Button>
              </div>

              <div className="bg-white border border-gray-200 rounded-lg p-6 hover:shadow-md transition-shadow">
                <div className="flex items-center mb-4">
                  <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
                    <i className="fa-solid fa-file-export text-green-600 text-xl"></i>
                  </div>
                  <div className="ml-4">
                    <h3 className="font-semibold text-gray-800">レポート</h3>
                    <p className="text-sm text-gray-600">依頼統計レポート</p>
                  </div>
                </div>
                <Button
                  onClick={() => {
                    /* TODO: Implement report download */
                  }}
                  className="w-full bg-gray-600 cursor-pointer hover:bg-gray-700 text-white"
                  disabled
                >
                  <i className="fa-solid fa-chart-bar mr-2"></i>
                  レポート作成
                </Button>
              </div>

              <div className="bg-white border border-gray-200 rounded-lg p-6 hover:shadow-md transition-shadow">
                <div className="flex items-center mb-4">
                  <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center">
                    <i className="fa-solid fa-archive text-purple-600 text-xl"></i>
                  </div>
                  <div className="ml-4">
                    <h3 className="font-semibold text-gray-800">アーカイブ</h3>
                    <p className="text-sm text-gray-600">過去のダウンロード</p>
                  </div>
                </div>
                <Button
                  onClick={() => {
                    /* TODO: Implement archive view */
                  }}
                  className="w-full bg-gray-600 cursor-pointer hover:bg-gray-700 text-white"
                  disabled
                >
                  <i className="fa-solid fa-history mr-2"></i>
                  履歴を見る
                </Button>
              </div>
            </div>
          </div>

          {/* Download Statistics */}
          <div className="mb-8">
            <h2 className="text-lg font-semibold text-gray-800 mb-4">
              ダウンロード統計
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="bg-white border border-gray-200 rounded-lg p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-600">今日</p>
                    <p className="text-2xl font-bold text-gray-800">--</p>
                  </div>
                  <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                    <i className="fa-solid fa-download text-blue-600"></i>
                  </div>
                </div>
              </div>

              <div className="bg-white border border-gray-200 rounded-lg p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-600">今週</p>
                    <p className="text-2xl font-bold text-gray-800">--</p>
                  </div>
                  <div className="w-10 h-10 bg-green-100 rounded-full flex items-center justify-center">
                    <i className="fa-solid fa-calendar-week text-green-600"></i>
                  </div>
                </div>
              </div>

              <div className="bg-white border border-gray-200 rounded-lg p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-600">今月</p>
                    <p className="text-2xl font-bold text-gray-800">--</p>
                  </div>
                  <div className="w-10 h-10 bg-yellow-100 rounded-full flex items-center justify-center">
                    <i className="fa-solid fa-calendar-alt text-yellow-600"></i>
                  </div>
                </div>
              </div>

              <div className="bg-white border border-gray-200 rounded-lg p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-600">総計</p>
                    <p className="text-2xl font-bold text-gray-800">--</p>
                  </div>
                  <div className="w-10 h-10 bg-purple-100 rounded-full flex items-center justify-center">
                    <i className="fa-solid fa-chart-line text-purple-600"></i>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Instructions */}
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-6">
            <h3 className="font-semibold text-blue-800 mb-3">
              <i className="fa-solid fa-info-circle mr-2"></i>
              ダウンロードガイド
            </h3>
            <ul className="text-sm text-blue-700 space-y-2">
              <li className="flex items-start">
                <i className="fa-solid fa-check-circle text-blue-600 mr-2 mt-1"></i>
                <span>
                  <strong>編集依頼一括ダウンロード：</strong>
                  指定期間内の写真編集依頼をZIPファイルでダウンロードできます
                </span>
              </li>
              <li className="flex items-start">
                <i className="fa-solid fa-check-circle text-blue-600 mr-2 mt-1"></i>
                <span>
                  <strong>フィルター機能：</strong>
                  依頼タイプ（写真、記念品、動画）別にダウンロードが可能です
                </span>
              </li>
              <li className="flex items-start">
                <i className="fa-solid fa-check-circle text-blue-600 mr-2 mt-1"></i>
                <span>
                  <strong>プレビュー機能：</strong>
                  ダウンロード前に対象件数を確認できます
                </span>
              </li>
              <li className="flex items-start">
                <i className="fa-solid fa-check-circle text-blue-600 mr-2 mt-1"></i>
                <span>
                  <strong>ステータス確認：</strong>
                  完了、作業中、未着手、キャンセル別の件数が表示されます
                </span>
              </li>
            </ul>
          </div>
        </div>
      </main>

      {/* Bulk Download Modal */}
      <BulkDownloadModal
        isOpen={showBulkDownloadModal}
        onClose={() => setShowBulkDownloadModal(false)}
      />
    </div>
  );
};

export default Downloads;
