"use client";
import React, { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import "./style.css";
import Button from "@/components/ui/Button";
import Menu from "@/components/home/Menu";
import { z } from "zod";
import videoEditingSchema from "@/schemas/videoEdit";
import { userApiClient } from "@/infrastructure/user/userAPIClient";
import {
  UserVideoAudioEditRequest,
  UserVideoAudioEditRequestResponse,
  UserVideoAudioEditRequestsListResponse,
} from "@/infrastructure/user/utils/types";
import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import { Modal } from "@/components/ui/Modal";
import Spinner from "@/components/ui/Spinner";
import { baseUrl } from "@/constants/baseApi";

type VideoEditingFormData = z.infer<typeof videoEditingSchema>;

const VideoEditingForm: React.FC = () => {
  const [mediaPreview, setMediaPreview] = useState<string | null>(null);
  const [mediaFile, setMediaFile] = useState<File | null>(null);
  const [mediaType, setMediaType] = useState<"video" | "audio" | null>(null);
  const [showRequestList, setShowRequestList] = useState(false);
  const [requestList, setRequestList] = useState<
    UserVideoAudioEditRequestResponse[]
  >([]);
  const [loadingRequests, setLoadingRequests] = useState(false);
  const [requestError, setRequestError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<"form" | "list">("form");

  const {
    register,
    handleSubmit,
    formState: { errors },
    setValue,
    clearErrors,
  } = useForm<VideoEditingFormData>({
    resolver: zodResolver(videoEditingSchema),
    defaultValues: {
      editType: "動画編集",
    },
  });

  const onSubmit = async (data: VideoEditingFormData) => {
    try {
      if (!mediaFile) {
        toast.error("メディアファイルを選択してください");
        return;
      }

      let apiEditType: UserVideoAudioEditRequest["edit_type"];
      switch (data.editType) {
        case "動画編集":
          apiEditType = "video_editing";
          break;
        case "音声編集":
          apiEditType = "audio_editing";
          break;
        case "動画・音声編集":
          apiEditType = "video_audio_editing";
          break;
        default:
          apiEditType = "other";
          break;
      }

      const desireDeliveryDate = data.dueDate
        ? new Date(data.dueDate).toISOString()
        : "";

      // Create FormData
      const formData = new FormData();
      formData.append("description", data.description);
      formData.append("special_note", data.additionalNotes || "");
      formData.append("desire_delivery_date", desireDeliveryDate);
      formData.append("edit_type", apiEditType);
      formData.append("request_files", mediaFile); // This is the actual file

      // Use fetch directly, not the current API client method
      const token = localStorage.getItem("accessToken");
      const response = await fetch(
        `${baseUrl}/gallery/video-audio-edit-requests`,
        {
          method: "POST",
          headers: token ? { Authorization: `Bearer ${token}` } : undefined,
          body: formData,
        }
      );

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.detail || "依頼の送信に失敗しました。");
      }

      toast.success("依頼が正常に送信されました！");
    } catch (error) {
      console.error("Failed to submit video/audio edit request:", error);
      toast.error("依頼の送信に失敗しました。もう一度お試しください。");
    }
  };

  const handleMediaUpload = (files: FileList | null) => {
    if (files && files.length > 0) {
      const file = files[0];
      setMediaFile(file);
      setValue("video", files);
      clearErrors("video");

      if (file.type.startsWith("video/")) {
        setMediaType("video");
      } else if (file.type.startsWith("audio/")) {
        setMediaType("audio");
      } else {
        setMediaType(null);
      }

      const url = URL.createObjectURL(file);
      setMediaPreview(url);
    }
  };

  const removeMedia = () => {
    setValue("video", undefined);
    setMediaFile(null);
    setMediaType(null);
    if (mediaPreview) {
      URL.revokeObjectURL(mediaPreview);
      setMediaPreview(null);
    }
  };

  const fetchRequestList = async () => {
    setLoadingRequests(true);
    setRequestError(null);
    try {
      const data: UserVideoAudioEditRequestsListResponse = await userApiClient.getUserVideoAudioEditRequests();
      setRequestList(data.results);
    } catch (err: any) {
      setRequestError(err.message || "依頼一覧の取得に失敗しました");
    } finally {
      setLoadingRequests(false);
    }
  };

  const handleOpenRequestList = () => {
    setShowRequestList(true);
    fetchRequestList();
  };

  const handleCloseRequestList = () => {
    setShowRequestList(false);
  };

  return (
    <div className="mt-24">
      <div className="text-white min-h-screen p-4">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-8">
            <div className="flex justify-center gap-4 mb-6">
              <Button
                variant={activeTab === "form" ? "glassSec" : "glass"}
                className="w-full"
                type="button"
                onClick={() => setActiveTab("form")}
              >
                動画編集依頼
              </Button>
              <Button
                variant={activeTab === "list" ? "glassSec" : "glass"}
                className="w-full"
                type="button"
                onClick={async () => {
                  setActiveTab("list");
                  fetchRequestList();
                }}
              >
                依頼一覧
              </Button>
            </div>
          </div>

          {activeTab === "form" && (
            <form onSubmit={handleSubmit(onSubmit)}>
              <div className="glass-card p-8">
                <div className="mb-8">
                  <h2 className="text-lg font-semibold mb-2 text-white">
                    メディアのアップロード
                  </h2>
                  <p className="text-sm text-gray-300 mb-4">
                    編集したい動画または音声ファイルをアップロードしてください
                  </p>

                  <div
                    className={`video-upload-area h-64 flex items-center justify-center relative overflow-hidden rounded-lg ${
                      mediaPreview ? "has-video" : ""
                    }`}
                  >
                    <input
                      type="file"
                      accept="video/*,audio/*"
                      className="hidden"
                      onChange={(e) => handleMediaUpload(e.target.files)}
                      id="media-upload"
                    />

                    {mediaPreview ? (
                      <>
                        {mediaType === "video" && (
                          <video
                            src={mediaPreview}
                            className="media-preview object-cover rounded-lg w-full h-full"
                            controls
                            style={{
                              width: "100%",
                              height: "100%",
                              padding: "10px",
                            }}
                          />
                        )}
                        {mediaType === "audio" && (
                          <audio
                            src={mediaPreview}
                            className="media-preview w-full h-24 p-2"
                            controls
                          />
                        )}
                        <div className="upload-overlay">
                          <div className="flex flex-col items-center gap-2">
                            <label
                              htmlFor="media-upload"
                              className="change-video-text cursor-pointer bg-black bg-opacity-70 px-3 py-2 rounded text-white text-sm"
                            >
                              メディアを変更
                            </label>
                            <button
                              type="button"
                              onClick={removeMedia}
                              className="text-red-400 text-sm hover:text-red-300 bg-black bg-opacity-70 px-3 py-2 rounded"
                            >
                              削除
                            </button>
                          </div>
                        </div>
                      </>
                    ) : (
                      <label
                        htmlFor="media-upload"
                        className="cursor-pointer text-center w-full h-full flex items-center justify-center"
                      >
                        <div className="text-gray-300">
                          <div className="mb-4 text-4xl">🎬</div>
                          <div className="text-lg mb-2">
                            クリックしてメディアを選択
                          </div>
                          <div className="text-sm opacity-70">
                            動画: MP4, MOV, AVI | 音声: MP3, WAV
                          </div>
                        </div>
                      </label>
                    )}
                  </div>
                  {errors.video && (
                    <p className="error-message mt-2">
                      {errors.video.message as string}
                    </p>
                  )}
                </div>

                <div className="mb-6">
                  <label className="block text-sm font-medium mb-2 text-white">
                    タイトル
                  </label>
                  <input
                    type="text"
                    {...register("title")}
                    className="glass-input w-full p-3"
                    placeholder="依頼のタイトル"
                  />
                  {errors.title && (
                    <p className="error-message">{errors.title.message}</p>
                  )}
                </div>

                {/* Description */}
                <div className="mb-6">
                  <label className="block text-sm font-medium mb-2 text-white">
                    依頼内容
                  </label>
                  <textarea
                    {...register("description")}
                    className="glass-input w-full p-3 h-32 resize-none"
                    placeholder="具体的な依頼内容を記入してください"
                  />
                  {errors.description && (
                    <p className="error-message">
                      {errors.description.message}
                    </p>
                  )}
                </div>

                {/* Edit Type */}
                <div className="mb-6">
                  <label className="block text-sm font-medium mb-2 text-white">
                    編集タイプ
                  </label>
                  <select
                    {...register("editType")}
                    className="glass-input w-full p-3"
                  >
                    <option value="動画編集">動画編集</option>
                    <option value="音声編集">音声編集</option>
                    <option value="動画・音声編集">動画・音声編集</option>
                    <option value="その他">その他</option>
                  </select>
                  {errors.editType && (
                    <p className="error-message">{errors.editType.message}</p>
                  )}
                </div>

                {/* Due Date */}
                <div className="mb-6">
                  <label className="block text-sm font-medium mb-2 text-white">
                    希望納期
                  </label>
                  <input
                    type="date"
                    {...register("dueDate")}
                    className="glass-input w-full p-3"
                  />
                  {errors.dueDate && (
                    <p className="error-message">{errors.dueDate.message}</p>
                  )}
                </div>

                {/* Additional Notes */}
                <div className="mb-8">
                  <label className="block text-sm font-medium mb-2 text-white">
                    追加メモ
                  </label>
                  <textarea
                    {...register("additionalNotes")}
                    className="glass-input w-full p-3 h-24 resize-none"
                    placeholder="その他の要望があれば記入してください"
                  />
                </div>

                {/* Submit Button */}
                <Button type="submit" variant="glassBrand" className="w-full">
                  依頼を送信する
                </Button>
              </div>
            </form>
          )}

          {activeTab === "list" && (
            <div className="glass-card p-8">
              <h2 className="text-lg font-semibold mb-4">依頼一覧</h2>
              {loadingRequests ? (
                <Spinner />
              ) : requestError ? (
                <div className="text-red-500">{requestError}</div>
              ) : requestList.length === 0 ? (
                <div>依頼がありません。</div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {requestList.map((req) => (
                    <div
                      key={req.uid}
                      className="rounded-xl bg-white/10 backdrop-blur-md border border-white/20 shadow-lg hover:shadow-xl hover:border-blue-400 transition-all p-6 flex flex-col gap-3 text-white"
                    >
                      {/* Header with Title and Status */}
                      <div className="flex items-center justify-between">
                        <span className="text-blue-400 font-semibold text-base flex items-center gap-2">
                          <svg
                            width="20"
                            height="20"
                            fill="none"
                            viewBox="0 0 24 24"
                          >
                            <rect
                              width="20"
                              height="20"
                              rx="4"
                              fill="#357AFF"
                            />
                            <path
                              d="M7 10.5V9a5 5 0 0 1 10 0v1.5M7 10.5h10M7 10.5v3.25a2.25 2.25 0 0 0 2.25 2.25h5.5A2.25 2.25 0 0 0 17 13.75V10.5"
                              stroke="#fff"
                              strokeWidth="1.5"
                              strokeLinecap="round"
                              strokeLinejoin="round"
                            />
                          </svg>
                          {req.description}
                        </span>

                        <span
                          className={`px-3 py-1 rounded-full text-xs font-semibold shadow-sm ${
                            req.request_status === "completed" 
                              ? "bg-gradient-to-r from-green-400 to-green-600" 
                              : req.request_status === "pending" 
                              ? "bg-gradient-to-r from-yellow-400 to-yellow-600" 
                              : req.request_status === "approved" 
                              ? "bg-gradient-to-r from-blue-400 to-blue-600" 
                              : "bg-gradient-to-r from-gray-400 to-gray-600"
                          }`}
                        >
                          {req.request_status}
                        </span>
                      </div>

                      {/* Special Note */}
                      {req.special_note && (
                        <div className="text-sm text-gray-300">
                          <span className="font-medium text-white">メモ:</span>{" "}
                          {req.special_note}
                        </div>
                      )}

                      {/* Request Type */}
                      <div className="flex items-center gap-2 text-sm text-gray-300">
                        <span className="font-medium text-white">
                          編集タイプ:
                        </span>
                        <span className="capitalize">
                          {req.request_type
                            ? req.request_type.replace(/_/g, " ")
                            : "N/A"}
                        </span>
                      </div>

                      {/* Delivery Date */}
                      <div className="flex items-center gap-2 text-sm text-gray-300">
                        <span className="font-medium text-white">
                          納期:
                        </span>
                        <span>
                          {new Date(
                            req.desire_delivery_date
                          ).toLocaleDateString("en-GB", {
                            day: "numeric",
                            month: "short",
                            year: "numeric",
                          })}
                        </span>
                      </div>

                      {/* Files Preview */}
                      {Array.isArray(req.files) && req.files.length > 0 && (
                        <div className="flex flex-wrap gap-2 mt-2">
                          {req.files.map((fileObj, idx) =>
                            fileObj.user_request_file ? (
                              <div key={idx} className="flex flex-col items-center">
                                <a
                                  href={fileObj.user_request_file.startsWith('http') ? fileObj.user_request_file : `${baseUrl}${fileObj.user_request_file}`}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="block border border-white/30 rounded-md overflow-hidden bg-white/10 hover:bg-white/20 transition-all"
                                  style={{ width: 100, height: 80 }}
                                >
                                  {fileObj.file_type === 'video' ? (
                                    <video
                                      src={fileObj.user_request_file.startsWith('http') ? fileObj.user_request_file : `${baseUrl}${fileObj.user_request_file}`}
                                      className="object-cover w-full h-full"
                                      style={{ width: '100%', height: '100%' }}
                                      muted
                                    />
                                  ) : (
                                    <img
                                      src={fileObj.user_request_file.startsWith('http') ? fileObj.user_request_file : `${baseUrl}${fileObj.user_request_file}`}
                                      alt={`File ${idx + 1}`}
                                      className="object-cover w-full h-full"
                                      style={{ width: '100%', height: '100%' }}
                                    />
                                  )}
                                </a>
                                <span className="text-xs text-gray-200 mt-1">{fileObj.file_type} {idx + 1}</span>
                              </div>
                            ) : null
                          )}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      </div>
      <ToastContainer />
    </div>
  );
};

export default VideoEditingForm;
