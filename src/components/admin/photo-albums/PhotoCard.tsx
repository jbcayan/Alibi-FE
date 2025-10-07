import { Photo } from "@/infrastructure/gallery/utils/types";
import { PencilRuler, SquarePen, Trash, Trash2, Lock, Eye, FileText, Music, Video, File } from "lucide-react";

const PhotoCard: React.FC<{
  photo: any;
  onDelete: (photoId: number | string) => void;
  onUpdate: (photoId: number | string) => void;
}> = ({ photo, onDelete, onUpdate }) => {
  const getFileIcon = (fileType: string) => {
    switch (fileType?.toLowerCase()) {
      case 'image':
        return null; // Show actual image
      case 'audio':
        return <Music className="h-8 w-8 text-blue-500" />;
      case 'video':
        return <Video className="h-8 w-8 text-red-500" />;
      case 'pdf':
        return <FileText className="h-8 w-8 text-red-600" />;
      case 'docx':
      case 'doc':
        return <FileText className="h-8 w-8 text-blue-600" />;
      case 'pptx':
      case 'ppt':
        return <FileText className="h-8 w-8 text-orange-500" />;
      case 'xlsx':
      case 'xls':
        return <FileText className="h-8 w-8 text-green-500" />;
      default:
        return <File className="h-8 w-8 text-gray-500" />;
    }
  };

  const isImage = photo.file_type === 'image';

  return (
    <div className="group overflow-hidden rounded-lg border border-gray-200 bg-white transition-all hover:shadow-lg">
      <div className="aspect-square overflow-hidden relative bg-gray-50 flex items-center justify-center">
        {isImage ? (
          <img
            src={photo.url}
            alt={photo.title || "ギャラリーファイル"}
            className="h-full w-full object-cover transition-transform group-hover:scale-105"
          />
        ) : (
          <div className="flex flex-col items-center justify-center space-y-2">
            {getFileIcon(photo.file_type)}
            <span className="text-xs text-gray-500 uppercase font-medium">
              {photo.file_type || 'FILE'}
            </span>
          </div>
        )}
        {/* Visibility indicator */}
        <div className="absolute top-2 right-2">
          {photo.is_public ? (
            <div className="bg-green-500 text-white p-1 rounded-full">
              <Eye className="h-3 w-3" />
            </div>
          ) : (
            <div className="bg-red-500 text-white p-1 rounded-full">
              <Lock className="h-3 w-3" />
            </div>
          )}
        </div>
      </div>
      <div className="p-3">
        <p className="mb-1 truncate text-sm text-gray-800">
          {photo.title || "タイトルなし"}
        </p>
        <div className="flex items-center justify-between text-xs text-gray-500 mb-1">
          <span>{new Date(photo.created_at).toLocaleDateString("ja-JP")}</span>
          {!photo.is_public && photo.price && (
            <span className="text-red-600 font-medium">¥{photo.price}</span>
          )}
        </div>
        <div className="mt-2 flex justify-between space-x-2">
          {/* Edit button  */}
          <button
            onClick={() => onUpdate(photo.id)}
            className="text-gray-600 cursor-pointer hover:text-red-500"
          >
            <SquarePen className="text-blue-500" />
          </button>
          <button
            onClick={() => onDelete(photo.id)}
            className="text-gray-600 cursor-pointer hover:text-red-500"
          >
            <Trash2 className="text-red-500" />
          </button>
        </div>
      </div>
    </div>
  );
};

export default PhotoCard;
