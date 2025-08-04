"use client";
import React, { useState } from "react";
import { useForm, SubmitHandler } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import Button from "@/components/ui/Button";
import { userApiClient } from "@/infrastructure/user/userAPIClient";
import { ToastContainer, toast } from "react-toastify";
import Link from "next/link";
import { ArrowLeft, Mail } from "lucide-react";

// Zod validation schema
const resetRequestSchema = z.object({
  email: z
    .string()
    .min(1, "メールアドレスを入力してください")
    .email("有効なメールアドレスを入力してください"),
});

type ResetRequestFormData = z.infer<typeof resetRequestSchema>;

const ResetPasswordRequestPage = () => {
  const [loading, setLoading] = useState(false);
  const [emailSent, setEmailSent] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
    getValues,
  } = useForm<ResetRequestFormData>({
    resolver: zodResolver(resetRequestSchema),
    mode: "onChange",
  });

  const onSubmit: SubmitHandler<ResetRequestFormData> = async (data) => {
    setLoading(true);

    try {
      console.log({ data });
      const response = await userApiClient.passwordResetRequest(data);
      console.log({ response });

      toast.success("パスワードリセットメールを送信しました！", {
        position: "top-center",
      });

      setEmailSent(true);
    } catch (error: any) {
      console.error("Password reset request failed:", error);

      if (error.response?.status === 404) {
        toast.error("このメールアドレスは登録されていません", {
          position: "top-center",
        });
      } else if (error.response?.status === 400) {
        toast.error("入力内容に誤りがあります", {
          position: "top-center",
        });
      } else {
        toast.error(
          "リクエストに失敗しました。しばらく時間をおいて再度お試しください",
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
          {!emailSent ? (
            <>
              <div className="text-center mb-8">
                <Mail className="mx-auto mb-4 h-12 w-12 text-blue-400" />
                <h2 className="text-white lg:text-3xl text-2xl mb-2">
                  パスワードリセット
                </h2>
                <p className="text-gray-300 text-sm">
                  登録済みのメールアドレスを入力してください
                </p>
              </div>

              <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
                <div className="rounded-lg border glass-card p-6 space-y-4">
                  <div>
                    <label className="block text-sm mb-2 font-medium text-gray-200">
                      メールアドレス
                    </label>
                    <input
                      type="email"
                      {...register("email")}
                      className="glass-input w-full p-3"
                      placeholder="your@email.com"
                      disabled={loading}
                    />
                    {errors.email && (
                      <p className="mt-1 text-sm text-red-400">
                        {errors.email.message}
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
                  {loading ? "送信中..." : "リセットメールを送信"}
                </Button>
              </form>
            </>
          ) : (
            <div className="text-center">
              <div className="glass-card p-8 rounded-lg mb-6">
                <Mail className="mx-auto mb-4 h-16 w-16 text-green-400" />
                <h2 className="text-white lg:text-2xl text-xl mb-4">
                  メールを送信しました
                </h2>
                <p className="text-gray-300 mb-4">
                  <span className="text-blue-400">{getValues("email")}</span>
                  宛にパスワードリセット用のリンクを送信しました。
                </p>
                <p className="text-sm text-gray-400 mb-6">
                  メールが届かない場合は、迷惑メールフォルダもご確認ください。
                </p>
                <Button
                  onClick={() => setEmailSent(false)}
                  variant="glassBrand"
                  className="w-full"
                >
                  再送信する
                </Button>
              </div>
            </div>
          )}
        </div>
      </main>
    </div>
  );
};

export default ResetPasswordRequestPage;
