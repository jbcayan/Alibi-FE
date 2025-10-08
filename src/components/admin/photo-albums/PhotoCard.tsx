import { Photo } from "@/infrastructure/gallery/utils/types";
import { PencilRuler, SquarePen, Trash, Trash2, Lock, Eye, FileText, Music, Video, File, Calendar, DollarSign } from "lucide-react";

const PhotoCard: React.FC<{
  photo: any;
  onDelete: (photoId: number | string) => void;
  onUpdate: (photo: any) => void;
}> = ({ photo, onDelete, onUpdate }) => {
  const getFileIcon = (fileType: string) => {
    switch (fileType?.toLowerCase()) {
      case 'image':
        return null; // Show actual image
      case 'audio':
        return <Music className="h-10 w-10 text-blue-500" />;
      case 'video':
        return <Video className="h-10 w-10 text-red-500" />;
      case 'pdf':
        return <FileText className="h-10 w-10 text-red-600" />;
      case 'docx':
      case 'doc':
        return <FileText className="h-10 w-10 text-blue-600" />;
      case 'pptx':
      case 'ppt':
        return <FileText className="h-10 w-10 text-orange-500" />;
      case 'xlsx':
      case 'xls':
        return <FileText className="h-10 w-10 text-green-500" />;
      default:
        return <File className="h-10 w-10 text-gray-500" />;
    }
  };

  const isImage = photo.file_type === 'image';

  return (
    <div className="group relative overflow-hidden rounded-xl border border-gray-200/60 bg-white shadow-sm transition-all duration-300 hover:shadow-xl hover:shadow-gray-200/50 hover:-translate-y-1 hover:border-gray-300/80">
      {/* Main Card Content */}
      <div className="relative">
        {/* Image/File Preview */}
        <div className="aspect-square overflow-hidden bg-gradient-to-br from-gray-50 to-gray-100 flex items-center justify-center relative">
          {isImage ? (
            <img
              src={photo.url}
              alt={photo.title || "ギャラリーファイル"}
              className="h-full w-full object-cover transition-all duration-300 group-hover:scale-110"
              loading="lazy"
            />
          ) : (
            <div className="flex flex-col items-center justify-center space-y-3 p-4">
              {getFileIcon(photo.file_type)}
              <span className="text-xs font-semibold text-gray-600 uppercase tracking-wide">
                {photo.file_type || 'FILE'}
              </span>
            </div>
          )}

          {/* Status Badge - Top Right */}
          <div className="absolute top-3 right-3 z-10">
            <div className={`flex items-center space-x-1 rounded-full px-2 py-1 text-xs font-medium shadow-lg backdrop-blur-sm ${
              photo.is_public
                ? 'bg-green-500/90 text-white'
                : 'bg-red-500/90 text-white'
            }`}>
              {photo.is_public ? (
                <>
                  <Eye className="h-3 w-3" />
                  <span>公開</span>
                </>
              ) : (
                <>
                  <Lock className="h-3 w-3" />
                  <span>非公開</span>
                </>
              )}
            </div>
          </div>

          {/* Hover Overlay */}
          <div className="absolute inset-0 bg-gradient-to-t from-black/20 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
        </div>

        {/* Content Section */}
        <div className="p-4 space-y-3">
          {/* Title */}
          <div>
            <h3 className="font-semibold text-gray-900 text-sm leading-tight line-clamp-2 group-hover:text-blue-600 transition-colors duration-200">
              {photo.title || "タイトルなし"}
            </h3>
            {photo.description && (
              <p className="text-xs text-gray-600 mt-1 line-clamp-1">
                {photo.description}
              </p>
            )}
          </div>

          {/* Metadata */}
          <div className="flex items-center justify-between text-xs text-gray-500">
            <div className="flex items-center space-x-1">
              <Calendar className="h-3 w-3" />
              <span>{new Date(photo.created_at).toLocaleDateString("ja-JP")}</span>
            </div>
            {!photo.is_public && photo.price && (
              <div className="flex items-center space-x-1 text-red-600 font-semibold bg-red-50 px-2 py-1 rounded-md">
                <DollarSign className="h-3 w-3" />
                <span>¥{photo.price}</span>
              </div>
            )}
          </div>

          {/* Action Buttons */}
          <div className="flex items-center justify-end space-x-2 pt-2 border-t border-gray-100">
            <button
              onClick={() => onUpdate(photo)}
              className="flex items-center justify-center w-8 h-8 rounded-lg bg-blue-50 text-blue-600 hover:bg-blue-100 hover:text-blue-700 transition-all duration-200 group/btn"
              title="編集"
            >
              <SquarePen className="h-4 w-4 group-hover/btn:scale-110 transition-transform duration-200" />
            </button>
            <button
              onClick={() => onDelete(photo.id)}
              className="flex items-center justify-center w-8 h-8 rounded-lg bg-red-50 text-red-600 hover:bg-red-100 hover:text-red-700 transition-all duration-200 group/btn"
              title="削除"
            >
              <Trash2 className="h-4 w-4 group-hover/btn:scale-110 transition-transform duration-200" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PhotoCard;
