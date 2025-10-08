"use client";

import React, { useEffect, useState } from "react";
import Menu from "@/components/home/Menu";
import { userApiClient } from "@/infrastructure/user/userAPIClient";
import { GalleryItem } from "@/infrastructure/user/utils/types";
import { FiDownload } from "react-icons/fi";
import Button from "@/components/ui/Button";
import { X } from "lucide-react";
import { FileText, Music, Video, File } from "lucide-react";
import Spinner from "@/components/ui/Spinner";

const IMAGES_PER_PAGE = 12;

const AlibiPhotos = () => {
  const [selectedProduct, setSelectedProduct] = useState<string>("");
  const [galleryItems, setGalleryItems] = useState<GalleryItem[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [previewImage, setPreviewImage] = useState<GalleryItem | null>(null);
  const [currentPage, setCurrentPage] = useState(1);

  const fetchGallery = async () => {
    try {
      const res = await userApiClient.getGalleryPhotos();
      setGalleryItems(res.results || []);
    } catch (error) {
      console.error("Failed to fetch gallery:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchGallery();
  }, []);

  const handleProductSelect = (productId: string) => {
    setSelectedProduct(productId);
  };

  // Download a single image
  const handleDownload = async (url: string, title: string) => {
    try {
      // Use API proxy to force download with proper headers
      const token = localStorage.getItem('accessToken');
      const downloadUrl = `/api/download-image?url=${encodeURIComponent(url)}&title=${encodeURIComponent(title)}${token ? `&token=${encodeURIComponent(token)}` : ''}`;

      // Create a temporary link to trigger download
      const link = document.createElement('a');
      link.href = downloadUrl;
      link.download = title || 'download';
      link.style.display = 'none';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } catch (error) {
      console.error('Download failed:', error);
      // Fallback: open in new tab if download fails
      const token = localStorage.getItem('accessToken');
      const downloadUrl = `/api/download-image?url=${encodeURIComponent(url)}&title=${encodeURIComponent(title)}${token ? `&token=${encodeURIComponent(token)}` : ''}`;
      window.open(downloadUrl, '_blank');
    }
  };

  // Pagination logic
  const totalPages = Math.ceil(galleryItems.length / IMAGES_PER_PAGE);
  const paginatedItems = galleryItems.slice(
    (currentPage - 1) * IMAGES_PER_PAGE,
    currentPage * IMAGES_PER_PAGE
  );

  return (
    <div className=" min-h-screen mb-6">
      <div className="max-w-6xl mx-auto px-4">
        <div className="text-center mt-10 mb-6">
          <h2 className="text-2xl font-bold text-white">ギャラリー</h2>
        </div>
        {loading ? (
          <Spinner />
        ) : (
          <>
            <div className="grid sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
              {paginatedItems.map((item) => (
                <div
                  key={item.uid}
                  className="group relative cursor-pointer transform transition-all duration-300 hover:scale-105 hover:-translate-y-1"
                  onClick={() => setPreviewImage(item)}
                >
                  {/* Card Container */}
                  <div className="relative rounded-2xl bg-white/10 shadow-xl border border-white/20 hover:border-blue-400 transition-all duration-300 backdrop-blur-xl overflow-hidden group-hover:shadow-blue-200/40">
                    {/* Image Container */}
                    <div className="relative aspect-square overflow-hidden bg-gray-100 flex items-center justify-center">
                      {item.file_type === "image" ? (
                        /* Main Image */
                        <img
                          src={item.file}
                          alt={item.title}
                          className="w-full h-full object-cover transition-all duration-300 group-hover:scale-110"
                        />
                      ) : item.file_type === "video" ? (
                        /* Video */
                        <video controls className="w-full h-full object-cover">
                          <source src={item.file} />
                          Your browser does not support video.
                        </video>
                      ) : (
                        /* File Type Icon */
                        <div className="flex flex-col items-center justify-center text-gray-500">
                          {item.file_type === 'pdf' && <FileText className="w-12 h-12 mb-2" />}
                          {item.file_type === 'audio' && <Music className="w-12 h-12 mb-2" />}
                          {(item.file_type === 'docx' || item.file_type === 'xlsx' || item.file_type === 'pptx') && <File className="w-12 h-12 mb-2" />}
                          {(!['image', 'video', 'pdf', 'audio', 'docx', 'xlsx', 'pptx'].includes(item.file_type || '')) && <File className="w-12 h-12 mb-2" />}
                          <span className="text-xs font-medium uppercase">{item.file_type || 'FILE'}</span>
                        </div>
                      )}
                      {/* Overlay */}
                      <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                    </div>

                    {/* Content Section */}
                    <div className="p-3 relative">
                      {/* Title */}
                      <h3 className="text-white font-semibold text-sm mb-2 leading-tight truncate">
                        {item.title}
                      </h3>

                      {/* Action Indicator */}
                      <div className="flex items-center justify-between">
                        <div className="text-xs text-blue-400/70 font-medium">
                          ダウンロード
                        </div>
                        <div className="w-6 h-6 rounded-full bg-blue-500/20 flex items-center justify-center group-hover:bg-blue-400/30 transition-all duration-300">
                          <FiDownload className="w-3 h-3 text-blue-400" />
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
            {/* Pagination controls */}
            {totalPages > 1 && (
              <div className="flex justify-center mt-8 gap-2">
                {Array.from({ length: totalPages }, (_, i) => i + 1).map(
                  (page) => (
                    <button
                      key={page}
                      onClick={() => setCurrentPage(page)}
                      className={`px-4 py-2 rounded-lg text-sm font-semibold transition-all ${
                        currentPage === page
                          ? "bg-blue-500 text-white"
                          : "bg-white/10 text-blue-300 hover:bg-blue-400/20 border border-white/20"
                      }`}
                    >
                      {page}
                    </button>
                  )
                )}
              </div>
            )}
            {/* Image preview modal */}
            {previewImage && (
              <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4">
                <div className="glass-black max-w-3xl w-full overflow-hidden relative rounded-2xl">
                  {/* Close Button */}
                  <button
                    className="absolute top-4 right-4 text-white/80 hover:text-white w-9 h-9 flex items-center justify-center text-4xl cursor-pointer transition-all z-10"
                    onClick={() => setPreviewImage(null)}
                  >
                    <X size={30} className="hover:text-red-500" />
                  </button>

                  {/* Two Section Layout */}
                  <div className="flex flex-col md:flex-row">
                    {/* Image Section */}
                    <div className="md:w-1/2 p-6 flex items-center justify-center bg-gradient-to-br from-blue-100/20 to-white/10 backdrop-blur-md">
                      <div className="w-full">
                        {previewImage.file_type === "image" ? (
                          <img
                            src={previewImage.file}
                            alt={previewImage.title}
                            className="w-full h-auto object-cover rounded-xl shadow-lg border border-white/10"
                          />
                        ) : previewImage.file_type === "video" ? (
                          <video controls className="w-full h-auto object-cover rounded-xl shadow-lg border border-white/10">
                            <source src={previewImage.file} />
                            Your browser does not support video.
                          </video>
                        ) : (
                          <div className="flex flex-col items-center justify-center p-8 bg-white/10 rounded-xl border border-white/20">
                            {previewImage.file_type === 'pdf' && <FileText className="w-16 h-16 mb-4 text-white/80" />}
                            {previewImage.file_type === 'audio' && <Music className="w-16 h-16 mb-4 text-white/80" />}
                            {(previewImage.file_type === 'docx' || previewImage.file_type === 'xlsx' || previewImage.file_type === 'pptx') && <File className="w-16 h-16 mb-4 text-white/80" />}
                            {(!['image', 'video', 'pdf', 'audio', 'docx', 'xlsx', 'pptx'].includes(previewImage.file_type || '')) && <File className="w-16 h-16 mb-4 text-white/80" />}
                            <span className="text-white/80 text-sm font-medium uppercase">{previewImage.file_type || 'FILE'}</span>
                            <p className="text-white/60 text-xs mt-2 text-center">
                              {previewImage.title}
                            </p>
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Form Section */}
                    <div className="md:w-1/2 p-6 bg-gradient-to-br from-white/10 to-white/5 backdrop-blur-md">
                      <div className="h-full flex flex-col">
                        {/* Header */}
                        <div className="text-center mb-6">
                          <h3 className="text-2xl text-white font-semibold mb-2">
                            {previewImage.title}
                          </h3>
                        </div>

                        {/* Description */}
                        <div className="mb-6">
                          <p className="text-gray-300 text-sm leading-relaxed">
                            {previewImage.description}
                          </p>
                        </div>

                        {/* Download Button */}
                        <div className="mt-auto pt-4">
                          <Button
                            variant="glassSec"
                            size="md"
                            leftIcon={<FiDownload className="text-lg" />}
                            className="rounded-lg border border-white/20 w-full hover:bg-blue-400/20 transition-all"
                            onClick={() =>
                              handleDownload(previewImage.file, previewImage.title)
                            }
                          >
                            ダウンロード
                          </Button>
                        </div>
                      </div>
                    </div>
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

export default AlibiPhotos;
