import { cn } from "@workspace/ui/lib/utils";
import { Skeleton } from "./skeleton";

function MessageSkeleton({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="message-skeleton"
      className={cn(
        "flex w-full items-start gap-2.5 px-2 py-1 sm:gap-3",
        className
      )}
      {...props}
    >
      <Skeleton className="size-8 shrink-0 rounded-full sm:size-10" />
      <div className="min-w-0 flex-1 space-y-2 pt-0.5">
        <div className="flex items-center gap-2">
          <Skeleton className="h-3.5 w-24 sm:w-32" />
          <Skeleton className="h-3 w-14 sm:w-20" />
        </div>
        <div className="space-y-1.5">
          <Skeleton className="h-3.5 w-full max-w-md" />
          <Skeleton className="h-3.5 w-4/5 max-w-xs sm:w-3/5" />
        </div>
      </div>
    </div>
  );
}

export { MessageSkeleton };
