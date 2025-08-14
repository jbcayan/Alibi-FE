"use client";
import React, { useState } from "react";
import { useForm, SubmitHandler } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import Button from "@/components/ui/Button";
import { userApiClient } from "@/infrastructure/user/userAPIClient";
import Cookies from "js-cookie";
import { ToastContainer, toast } from "react-toastify";
import Link from "next/link";
import { Eye, EyeOff, ArrowLeft } from "lucide-react";
import { useRouter } from "next/navigation";

// Zod validation schema
const changePasswordSchema = z
  .object({
    old_password: z.string().min(1, "現在のパスワードを入力してください"),
    new_password: z
      .string()
      .min(1, "新しいパスワードを入力してください")
      .min(6, "新しいパスワードは6文字以上で入力してください"),
    confirm_password: z.string().min(1, "確認用パスワードを入力してください"),
  })
  .refine((data) => data.new_password === data.confirm_password, {
    message: "パスワードが一致しません",
    path: ["confirm_password"],
  });

type ChangePasswordFormData = z.infer<typeof changePasswordSchema>;

const ChangePasswordPage = () => {
  const [loading, setLoading] = useState(false);
  const [showOldPassword, setShowOldPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const router = useRouter();

  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
  } = useForm<ChangePasswordFormData>({
    resolver: zodResolver(changePasswordSchema),
    mode: "onChange",
  });

  const onSubmit: SubmitHandler<ChangePasswordFormData> = async (data) => {
    setLoading(true);

    try {
      await userApiClient.changePassword(data);
      toast.success("パスワードが正常に変更されました！", {
        position: "top-center",
      });

      // Clear form
      reset();

      // Redirect after a short delay
      await new Promise((resolve) => setTimeout(resolve, 1500));
      router.push("/user/profile"); // or wherever you want to redirect
    } catch (error: any) {
      console.error("Change password failed:", error);

      if (error.response?.status === 400) {
        const errorData = error.response?.data;

        if (errorData?.old_password) {
          toast.error("現在のパスワードが正しくありません", {
            position: "top-center",
          });
        } else if (errorData?.new_password) {
          toast.error("新しいパスワードの形式が正しくありません", {
            position: "top-center",
          });
        } else {
          toast.error("入力内容に誤りがあります", {
            position: "top-center",
          });
        }
      } else if (error.response?.status === 401) {
        toast.error("認証に失敗しました。再度ログインしてください", {
          position: "top-center",
        });
        // Redirect to login
        setTimeout(() => router.push("/login"), 1500);
      } else {
        toast.error(
          "パスワード変更に失敗しました。しばらく時間をおいて再度お試しください",
          {
            position: "top-center",
          }
        );
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen main_gradient_bg text-white">
      <main className="flex min-h-screen flex-col items-center justify-center px-4">
        <ToastContainer />

        <div className="w-full max-w-md">
          {/* Back button */}
          <div className="mb-6">
            <Link
              href="/user/profile"
              className="inline-flex items-center text-blue-400 hover:text-blue-300 transition-colors"
            >
              <ArrowLeft size={18} className="mr-2" />
              戻る
            </Link>
          </div>

          <h2 className="text-white lg:text-3xl text-2xl mb-6 text-center">
            パスワード変更
          </h2>

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
            <div className="rounded-lg border glass-card p-6 space-y-4">
              {/* Current Password */}
              <div className="relative">
                <label className="block text-sm font-medium mb-2 text-gray-200">
                  現在のパスワード
                </label>
                <input
                  type={showOldPassword ? "text" : "password"}
                  {...register("old_password")}
                  className="glass-input w-full p-3 pr-10"
                  placeholder="現在のパスワードを入力"
                  disabled={loading}
                />
                <button
                  type="button"
                  className="absolute top-[42px] right-3 text-gray-400 hover:text-white transition-colors"
                  onClick={() => setShowOldPassword((prev) => !prev)}
                  disabled={loading}
                >
                  {showOldPassword ? (
                    <EyeOff className="cursor-pointer" size={18} />
                  ) : (
                    <Eye className="cursor-pointer" size={18} />
                  )}
                </button>
                {errors.old_password && (
                  <p className="mt-1 text-sm text-red-400">
                    {errors.old_password.message}
                  </p>
                )}
              </div>

              {/* New Password */}
              <div className="relative">
                <label className="block text-sm font-medium mb-2 text-gray-200">
                  新しいパスワード
                </label>
                <input
                  type={showNewPassword ? "text" : "password"}
                  {...register("new_password")}
                  className="glass-input w-full p-3 pr-10"
                  placeholder="新しいパスワードを入力"
                  disabled={loading}
                />
                <button
                  type="button"
                  className="absolute top-[42px] right-3 text-gray-400 hover:text-white transition-colors"
                  onClick={() => setShowNewPassword((prev) => !prev)}
                  disabled={loading}
                >
                  {showNewPassword ? (
                    <EyeOff className="cursor-pointer" size={18} />
                  ) : (
                    <Eye className="cursor-pointer" size={18} />
                  )}
                </button>
                {errors.new_password && (
                  <p className="mt-1 text-sm text-red-400">
                    {errors.new_password.message}
                  </p>
                )}
              </div>

              {/* Confirm New Password */}
              <div className="relative">
                <label className="block text-sm font-medium mb-2 text-gray-200">
                  新しいパスワード（確認）
                </label>
                <input
                  type={showConfirmPassword ? "text" : "password"}
                  {...register("confirm_password")}
                  className="glass-input w-full p-3 pr-10"
                  placeholder="新しいパスワードを再入力"
                  disabled={loading}
                />
                <button
                  type="button"
                  className="absolute top-[42px] right-3 text-gray-400 hover:text-white transition-colors"
                  onClick={() => setShowConfirmPassword((prev) => !prev)}
                  disabled={loading}
                >
                  {showConfirmPassword ? (
                    <EyeOff className="cursor-pointer" size={18} />
                  ) : (
                    <Eye className="cursor-pointer" size={18} />
                  )}
                </button>
                {errors.confirm_password && (
                  <p className="mt-1 text-sm text-red-400">
                    {errors.confirm_password.message}
                  </p>
                )}
              </div>
            </div>

            <Button
              className="w-full"
              type="submit"
              loading={loading}
              variant="glassBrand"
              disabled={loading}
            >
              {loading ? "変更中..." : "パスワードを変更"}
            </Button>
          </form>

          <div className="mt-8 glass-card p-4 rounded-lg">
            <h3 className="text-sm font-medium text-gray-200 mb-2">
              パスワード要件：
            </h3>
            <ul className="text-xs text-gray-400 space-y-1">
              <li>• 8文字以上で入力してください</li>
              <li>• 安全のため、推測しにくいパスワードを設定してください</li>
              <li>
                • 他のサービスで使用していないパスワードを使用してください
              </li>
            </ul>
          </div>
        </div>
      </main>
    </div>
  );
};

export default ChangePasswordPage;
