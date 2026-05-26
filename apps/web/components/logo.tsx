import { MessageSquareCode } from "lucide-react";

export function Logo() {
  return (
    <div className="flex justify-center">
      <div className="flex size-10 items-center justify-center rounded-sm border border-white/10 bg-white/4">
        <MessageSquareCode size={20} />
      </div>
    </div>
  );
}
