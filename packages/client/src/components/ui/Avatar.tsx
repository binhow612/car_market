import { User } from "lucide-react";
import { cn } from "../../lib/utils";

interface AvatarProps {
  src?: string;
  alt?: string;
  size?: "sm" | "md" | "lg" | "xl";
  className?: string;
}

const sizeClasses = {
  sm: "h-8 w-8",
  md: "h-12 w-12",
  lg: "h-16 w-16",
  xl: "h-32 w-32",
};

const iconSizes = {
  sm: "h-3 w-3",
  md: "h-5 w-5",
  lg: "h-7 w-7",
  xl: "h-12 w-12",
};

export function Avatar({
  src,
  alt = "Avatar",
  size = "md",
  className,
}: AvatarProps) {
  return (
    <div
      className={cn(
        "rounded-full bg-gray-200 flex items-center justify-center overflow-hidden border-2 border-gray-200",
        sizeClasses[size],
        className
      )}
    >
      {src ? (
        <img src={src} alt={alt} className="w-full h-full object-cover" />
      ) : (
        <User className={cn("text-gray-500", iconSizes[size])} />
      )}
    </div>
  );
}
