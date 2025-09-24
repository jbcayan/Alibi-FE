"use client";
import React from "react";
import Link from "next/link";

const Footer = () => {
  return (
    <footer className="bg-black/20 backdrop-blur-md border-t border-white/10 mt-auto">
      <div className="max-w-7xl mx-auto px-4 py-8">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {/* Company Info */}
          <div className="space-y-4">
            <h3 className="text-xl font-semibold text-white">Example.jp</h3>
            <p className="text-gray-300 text-sm">
              日本のためのモダンなWebアプリケーション
            </p>
          </div>

          {/* Quick Links */}
          <div className="space-y-4">
            <h4 className="text-lg font-medium text-white">リンク</h4>
            <div className="space-y-2">
              <Link
                href="/privacy-policy"
                className="block text-gray-300 hover:text-white transition-colors text-sm"
              >
                プライバシーポリシー
              </Link>
              <Link
                href="/terms-of-service"
                className="block text-gray-300 hover:text-white transition-colors text-sm"
              >
                利用規約
              </Link>
            </div>
          </div>

          {/* Contact/Support */}
          <div className="space-y-4">
            <h4 className="text-lg font-medium text-white">サポート</h4>
            <div className="space-y-2">
              <p className="text-gray-300 text-sm">
                お問い合わせ: support@example.jp
              </p>
              <p className="text-gray-300 text-sm">
                © 2024 Example.jp. All rights reserved.
              </p>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;