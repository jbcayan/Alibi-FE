"use client";
import React, { useState, useEffect } from "react";
import { useForm, SubmitHandler } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import Button from "@/components/ui/Button";
import { userApiClient } from "@/infrastructure/user/userAPIClient";
import { ToastContainer, toast } from "react-toastify";
import Link from "next/link";
import { Eye, EyeOff, Key, CheckCircle } from "lucide-react";
import { useParams, useRouter } from "next/navigation";

// Zod validation schema
const resetConfirmSchema = z
  .object({
    new_password: z
      .string()
      .min(1, "新しいパスワードを入力してください")
      .min(6, "パスワードは6文字以上で入力してください")
      .regex(
        /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/,
        "パスワードは大文字、小文字、数字を含む必要があります"
      ),
    confirm_password: z.string().min(1, "パスワード確認を入力してください"),
  })
  .refine((data) => data.new_password === data.confirm_password, {
    message: "パスワードが一致しません",
    path: ["confirm_password"],
  });

type ResetConfirmFormData = z.infer<typeof resetConfirmSchema>;

const ResetPasswordConfirmPage = () => {
  const [loading, setLoading] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [resetComplete, setResetComplete] = useState(false);
  const [isValidLink, setIsValidLink] = useState(true);
  const params = useParams();
  const router = useRouter();
  const uid = params?.uid as string;
  const token = params?.token as string;

  const {
    register,
    handleSubmit,
    formState: { errors },
    watch,
  } = useForm<ResetConfirmFormData>({
    resolver: zodResolver(resetConfirmSchema),
    mode: "onChange",
  });

  const watchPassword = watch("new_password", "");

  useEffect(() => {
    // Check if uid and token are present
    if (!uid || !token) {
      toast.error("無効なリセットリンクです", { position: "top-center" });
      setIsValidLink(false);
      setTimeout(() => {
        router.push("/reset-password");
      }, 2000);
    }
  }, [uid, token, router]);

  const onSubmit: SubmitHandler<ResetConfirmFormData> = async (data) => {
    if (!uid || !token) {
      toast.error("無効なリセットリンクです", { position: "top-center" });
      return;
    }

    setLoading(true);

    try {
      const response = await userApiClient.passwordResetConfirm({
        uid: uid as string,
        token: token as string,
        new_password: data.new_password,
        confirm_password: data.confirm_password,
      });
      console.log({ responseFromRESET: response });

      toast.success("パスワードが正常に変更されました！", {
        position: "top-center",
      });

      setResetComplete(true);

      // Redirect to login after 3 seconds
      setTimeout(() => {
        router.push("/login");
      }, 3000);
    } catch (error: any) {
      console.error("Password reset failed:", error);

      if (error.response?.status === 400) {
        toast.error("リセットリンクの有効期限が切れているか、無効です", {
          position: "top-center",
        });
      } else if (error.response?.status === 422) {
        toast.error("入力内容に誤りがあります", {
          position: "top-center",
        });
      } else if (error.response?.status === 404) {
        toast.error("ユーザーが見つかりません", {
          position: "top-center",
        });
      } else {
        toast.error(
          "パスワードリセットに失敗しました。しばらく時間をおいて再度お試しください",
          {
            position: "top-center",
          }
        );
      }
    } finally {
      setLoading(false);
    }
  };

  const getPasswordStrength = (password: string) => {
    let strength = 0;
    if (password.length >= 6) strength++;
    if (/[a-z]/.test(password)) strength++;
    if (/[A-Z]/.test(password)) strength++;
    if (/\d/.test(password)) strength++;
    if (/[!@#$%^&*(),.?":{}|<>]/.test(password)) strength++;
    return strength;
  };

  const getStrengthColor = (strength: number) => {
    if (strength < 2) return "bg-red-500";
    if (strength < 4) return "bg-yellow-500";
    return "bg-green-500";
  };

  const getStrengthText = (strength: number) => {
    if (strength < 2) return "弱い";
    if (strength < 4) return "普通";
    return "強い";
  };

  // Invalid link screen
  if (!isValidLink) {
    return (
      <div className="min-h-screen main_gradient_bg text-white">
        <main className="flex min-h-screen flex-col items-center justify-center px-4">
          <ToastContainer />
          <div className="w-full max-w-md text-center">
            <div className="glass-card p-8 rounded-lg">
              <Key className="mx-auto mb-4 h-16 w-16 text-red-400" />
              <h2 className="text-white lg:text-2xl text-xl mb-4">
                無効なリンク
              </h2>
              <p className="text-gray-300 mb-6">
                このパスワードリセットリンクは無効です。新しいリセット要求を送信してください。
              </p>
              <Button
                onClick={() => router.push("/reset-password")}
                variant="glassBrand"
                className="w-full"
              >
                パスワードリセット要求
              </Button>
            </div>
          </div>
        </main>
      </div>
    );
  }

  // Success screen
  if (resetComplete) {
    return (
      <div className="min-h-screen main_gradient_bg text-white">
        <main className="flex min-h-screen flex-col items-center justify-center px-4">
          <ToastContainer />
          <div className="w-full max-w-md text-center">
            <div className="glass-card p-8 rounded-lg">
              <CheckCircle className="mx-auto mb-4 h-16 w-16 text-green-400" />
              <h2 className="text-white lg:text-2xl text-xl mb-4">
                パスワードリセット完了！
              </h2>
              <p className="text-gray-300 mb-6">
                パスワードが正常に変更されました。新しいパスワードでログインできます。
              </p>
              <p className="text-sm text-gray-400 mb-6">
                3秒後にログインページにリダイレクトします...
              </p>
              <Button
                onClick={() => router.push("/login")}
                variant="glassBrand"
                className="w-full"
              >
                ログインページへ
              </Button>
            </div>
          </div>
        </main>
      </div>
    );
  }

  // Loading screen while params are not available
  if (!params) {
    return (
      <div className="min-h-screen main_gradient_bg text-white">
        <main className="flex min-h-screen flex-col items-center justify-center px-4">
          <div className="glass-card p-8 rounded-lg">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-400 mx-auto"></div>
            <p className="text-center mt-4 text-gray-300">読み込み中...</p>
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen main_gradient_bg text-white">
      <main className="flex min-h-screen flex-col items-center justify-center px-4">
        <ToastContainer />

        <div className="w-full max-w-md">
          <div className="text-center mb-8">
            <Key className="mx-auto mb-4 h-12 w-12 text-blue-400" />
            <h2 className="text-white lg:text-3xl text-2xl mb-2">
              新しいパスワード設定
            </h2>
            <p className="text-gray-300 text-sm">
              新しいパスワードを入力してください
            </p>
          </div>

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
            <div className="rounded-lg border glass-card p-6 space-y-4">
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

                {/* Password Strength Indicator */}
                {watchPassword && (
                  <div className="mt-2">
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-xs text-gray-400">
                        パスワード強度
                      </span>
                      <span
                        className={`text-xs ${
                          getPasswordStrength(watchPassword) < 2
                            ? "text-red-400"
                            : getPasswordStrength(watchPassword) < 4
                            ? "text-yellow-400"
                            : "text-green-400"
                        }`}
                      >
                        {getStrengthText(getPasswordStrength(watchPassword))}
                      </span>
                    </div>
                    <div className="w-full bg-gray-600 rounded-full h-1">
                      <div
                        className={`h-1 rounded-full transition-all duration-300 ${getStrengthColor(
                          getPasswordStrength(watchPassword)
                        )}`}
                        style={{
                          width: `${Math.min(
                            getPasswordStrength(watchPassword) * 25,
                            100
                          )}%`,
                        }}
                      />
                    </div>
                  </div>
                )}
              </div>

              {/* Confirm Password */}
              <div className="relative">
                <label className="block text-sm font-medium mb-2 text-gray-200">
                  パスワード確認
                </label>
                <input
                  type={showConfirmPassword ? "text" : "password"}
                  {...register("confirm_password")}
                  className="glass-input w-full p-3 pr-10"
                  placeholder="パスワードを再入力"
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

              {/* Password Requirements */}
              <div className="mt-4 p-3 bg-gray-800/50 rounded-lg">
                <p className="text-xs text-gray-400 mb-2">パスワード要件:</p>
                <ul className="text-xs text-gray-400 space-y-1">
                  <li
                    className={
                      watchPassword.length >= 6 ? "text-green-400" : ""
                    }
                  >
                    • 6文字以上
                  </li>
                  <li
                    className={
                      /[a-z]/.test(watchPassword) ? "text-green-400" : ""
                    }
                  >
                    • 小文字を含む
                  </li>
                  <li
                    className={
                      /[A-Z]/.test(watchPassword) ? "text-green-400" : ""
                    }
                  >
                    • 大文字を含む
                  </li>
                  <li
                    className={/\d/.test(watchPassword) ? "text-green-400" : ""}
                  >
                    • 数字を含む
                  </li>
                </ul>
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

          <div className="text-center mt-6">
            <Link
              href="/login"
              className="text-blue-400 hover:underline text-sm"
            >
              ログインページに戻る
            </Link>
          </div>
        </div>
      </main>
    </div>
  );
};

export default ResetPasswordConfirmPage;
