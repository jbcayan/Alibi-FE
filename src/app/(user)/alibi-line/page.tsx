/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";
import React from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useForm } from "react-hook-form";
import "./style.css";
import Button from "@/components/ui/Button";
import Menu from "@/components/home/Menu";
import alibiLineFormSchema from "@/schemas/alibiLine";

type AlibiLineFormData = z.infer<typeof alibiLineFormSchema>;

// Page component (this should be the default export for Next.js pages)
export default function AlibiLinePage() {
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
    reset,
    watch,
  } = useForm<AlibiLineFormData>({
    resolver: zodResolver(alibiLineFormSchema),
    defaultValues: {
      title: "",
      messageContent: "",
      messageCount: 1,
      startDate: "",
      endDate: "",
      additionalNotes: "",
    },
  });

  const onFormSubmit = async (data: AlibiLineFormData) => {
    try {
      console.log("Dependency form submitted:", data);
      // Handle form submission here
      // You can add your API call or other logic here

      // Reset form after successful submission
      reset();
    } catch (error) {
      console.error("Form submission error:", error);
    }
  };

  const formValues = watch();

  return (
    <div className="min-h-screen text-white  relative">
      <div className="max-w-2xl mt-6 mx-auto">
        {/* Form Container */}
        <div className="glass-card p-8 relative">
          {/* Coming Soon Overlay */}
          <div
            style={{
              position: "fixed",
              top: 0,
              left: 0,
              width: "100%",
              height: "100%",
              background: "rgba(0,0,0,0.6)",
              zIndex: 1000,
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              justifyContent: "center",
              pointerEvents: "all",
            }}
          >
            <span
              style={{
                color: "#fff",
                fontSize: "2.5rem",
                fontWeight: "bold",
                textShadow: "0 2px 8px #000, 0 0 40px #fff2",
                opacity: 0.95,
                letterSpacing: 2,
              }}
            >
              Coming Soon
            </span>
            <span
              style={{
                color: "#fff",
                marginTop: 12,
                fontSize: "1.2rem",
                opacity: 0.8,
              }}
            >
              This feature is not available yet.
            </span>

            {/* Back Button */}
            <button
              onClick={() => window.history.back()}
              style={{
                marginTop: 30,
                padding: "10px 20px",
                backgroundColor: "#ffffff22",
                color: "#fff",
                border: "1px solid #fff5",
                borderRadius: "6px",
                fontSize: "1rem",
                cursor: "pointer",
                transition: "background 0.3s",
              }}
              onMouseOver={(e) => {
                e.currentTarget.style.backgroundColor = "#ffffff33";
              }}
              onMouseOut={(e) => {
                e.currentTarget.style.backgroundColor = "#ffffff22";
              }}
            >
              ← Back
            </button>
          </div>

          <form onSubmit={handleSubmit(onFormSubmit)} className="space-y-6">
            {/* Title Section */}
            <div className="space-y-3">
              <label
                className="block text-sm font-medium"
                style={{ color: "var(--color-neutral-300)" }}
                htmlFor="title"
              >
                タイトル <span className="text-red-400">*</span>
              </label>
              <input
                id="title"
                type="text"
                {...register("title")}
                placeholder="依頼のタイトルを入力してください"
                className={`w-full px-4 py-3 glass border-0 text-white placeholder-gray-400 focus:outline-none focus:ring-2 transition-all duration-300 ${
                  errors.title ? "ring-2 ring-red-500" : ""
                }`}
                style={
                  {
                    ["--tw-ring-color" as any]: errors.title
                      ? "#ef4444"
                      : "var(--color-brand-500)",
                    color: "var(--color-white)",
                  } as React.CSSProperties
                }
                disabled={isSubmitting}
              />
              {errors.title && (
                <p className="text-red-400 text-sm mt-1">
                  {errors.title.message}
                </p>
              )}
            </div>

            {/* Message Content Section */}
            <div className="space-y-3">
              <label
                className="block text-sm font-medium"
                style={{ color: "var(--color-neutral-300)" }}
                htmlFor="messageContent"
              >
                メッセージの内容 <span className="text-red-400">*</span>
              </label>
              <textarea
                id="messageContent"
                {...register("messageContent")}
                placeholder="希望するメッセージや取り組みの内容を具体的に記入してください"
                rows={6}
                className={`w-full px-4 py-3 glass border-0 text-white placeholder-gray-400 focus:outline-none focus:ring-2 transition-all duration-300 resize-none ${
                  errors.messageContent ? "ring-2 ring-red-500" : ""
                }`}
                style={
                  {
                    ["--tw-ring-color" as any]: errors.messageContent
                      ? "#ef4444"
                      : "var(--color-brand-500)",
                    color: "var(--color-white)",
                  } as React.CSSProperties
                }
                disabled={isSubmitting}
              />
              <div className="flex justify-between items-center">
                {errors.messageContent && (
                  <p className="text-red-400 text-sm">
                    {errors.messageContent.message}
                  </p>
                )}
                <p className="text-gray-400 text-xs ml-auto">
                  {formValues.messageContent?.length || 0}/1000
                </p>
              </div>
            </div>

            {/* Message Count Section */}
            <div className="space-y-3">
              <label
                className="block text-sm font-medium"
                style={{ color: "var(--color-neutral-300)" }}
                htmlFor="messageCount"
              >
                メッセージ数 <span className="text-red-400">*</span>
              </label>
              <input
                id="messageCount"
                type="number"
                {...register("messageCount", { valueAsNumber: true })}
                min="1"
                max="100"
                className={`w-full px-4 py-3 glass border-0 text-white focus:outline-none focus:ring-2 transition-all duration-300 ${
                  errors.messageCount ? "ring-2 ring-red-500" : ""
                }`}
                style={
                  {
                    ["--tw-ring-color" as any]: errors.messageCount
                      ? "#ef4444"
                      : "var(--color-brand-500)",
                    color: "var(--color-white)",
                  } as React.CSSProperties
                }
                disabled={isSubmitting}
              />
              {errors.messageCount && (
                <p className="text-red-400 text-sm mt-1">
                  {errors.messageCount.message}
                </p>
              )}
            </div>

            {/* Date Range Section */}
            <div className="grid grid-cols-2 gap-6">
              {/* Start Date */}
              <div className="space-y-3">
                <label
                  className="block text-sm font-medium"
                  style={{ color: "var(--color-neutral-300)" }}
                  htmlFor="startDate"
                >
                  開始日時 <span className="text-red-400">*</span>
                </label>
                <input
                  id="startDate"
                  type="date"
                  {...register("startDate")}
                  className={`w-full px-4 py-3 glass border-0 text-white focus:outline-none focus:ring-2 transition-all duration-300 ${
                    errors.startDate ? "ring-2 ring-red-500" : ""
                  }`}
                  style={
                    {
                      ["--tw-ring-color" as any]: errors.startDate
                        ? "#ef4444"
                        : "var(--color-brand-500)",
                      color: "var(--color-white)",
                      colorScheme: "dark",
                    } as React.CSSProperties
                  }
                  disabled={isSubmitting}
                />
                {errors.startDate && (
                  <p className="text-red-400 text-sm mt-1">
                    {errors.startDate.message}
                  </p>
                )}
              </div>

              {/* End Date */}
              <div className="space-y-3">
                <label
                  className="block text-sm font-medium"
                  style={{ color: "var(--color-neutral-300)" }}
                  htmlFor="endDate"
                >
                  終了日時 <span className="text-red-400">*</span>
                </label>
                <input
                  id="endDate"
                  type="date"
                  {...register("endDate")}
                  className={`w-full px-4 py-3 glass border-0 text-white focus:outline-none focus:ring-2 transition-all duration-300 ${
                    errors.endDate ? "ring-2 ring-red-500" : ""
                  }`}
                  style={
                    {
                      ["--tw-ring-color" as any]: errors.endDate
                        ? "#ef4444"
                        : "var(--color-brand-500)",
                      color: "var(--color-white)",
                      colorScheme: "dark",
                    } as React.CSSProperties
                  }
                  disabled={isSubmitting}
                />
                {errors.endDate && (
                  <p className="text-red-400 text-sm mt-1">
                    {errors.endDate.message}
                  </p>
                )}
              </div>
            </div>

            {/* Additional Notes Section */}
            <div className="space-y-3">
              <label
                className="block text-sm font-medium"
                style={{ color: "var(--color-neutral-300)" }}
                htmlFor="additionalNotes"
              >
                追加メモ
              </label>
              <textarea
                id="additionalNotes"
                {...register("additionalNotes")}
                placeholder="その他の要望があれば記入してください"
                rows={4}
                className="w-full px-4 py-3 glass border-0 text-white placeholder-gray-400 focus:outline-none focus:ring-2 transition-all duration-300 resize-none"
                style={
                  {
                    ["--tw-ring-color" as any]: "var(--color-brand-500)",
                    color: "var(--color-white)",
                  } as React.CSSProperties
                }
                disabled={isSubmitting}
              />
              <p className="text-gray-400 text-xs">
                {formValues.additionalNotes?.length || 0}/500
              </p>
            </div>

            {/* Submit Button */}
            <Button
              type="submit"
              variant="glassBrand"
              className="w-full"
              disabled={isSubmitting}
            >
              {isSubmitting ? (
                <div className="flex items-center justify-center space-x-2">
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  <span>送信中...</span>
                </div>
              ) : (
                "依頼を送信する"
              )}
            </Button>
          </form>
        </div>
      </div>
    </div>
  );
}
