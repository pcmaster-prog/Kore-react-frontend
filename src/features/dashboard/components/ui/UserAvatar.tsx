import { cx } from "@/lib/utils";
import { getInitials } from "../../utils";

export interface UserAvatarProps {
  name: string;
  className?: string;
}

export default function UserAvatar({ name, className }: UserAvatarProps) {
  return (
    <div
      className={cx(
        "h-9 w-9 rounded-xl bg-k-bg-sidebar text-white flex items-center justify-center text-xs font-black shrink-0",
        className
      )}
    >
      {getInitials(name)}
    </div>
  );
}
