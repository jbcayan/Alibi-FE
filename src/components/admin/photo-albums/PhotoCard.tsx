import { Photo } from "@/infrastructure/gallery/utils/types";
import { PencilRuler, SquarePen, Trash, Trash2 } from "lucide-react";

const PhotoCard: React.FC<{
  photo: any;
  onDelete: (photoId: number | string) => void;
  onUpdate: (photoId: number | string) => void;
}> = ({ photo, onDelete, onUpdate }) => (
  <div className="group overflow-hidden rounded-lg border border-gray-200 bg-white transition-all hover:shadow-lg">
    <div className="aspect-square overflow-hidden">
      <img
        src={photo.url}
        alt={photo.title || "アリバイ写真"}
        className="h-full w-full object-cover transition-transform group-hover:scale-105"
      />
    </div>
    <div className="p-3">
      <p className="mb-1 truncate text-sm text-gray-800">
        {photo.title || "タイトルなし"}
      </p>
      <p className="text-xs text-gray-500">
        {new Date(photo.created_at).toLocaleDateString("ja-JP")}
      </p>
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

export default PhotoCard;
