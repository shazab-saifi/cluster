import { Send, Plus, Smile } from "lucide-react";
import { Button } from "@workspace/ui/components/button";
import { Input } from "@workspace/ui/components/input";

type MessageComposer = {
  handlerFn: () => void;
  channelId: string;
  message: string;
  setMessage: (val: string) => void;
};

export const MessageComposer = ({
  handlerFn,
  channelId,
  setMessage,
  message,
}: MessageComposer) => {
  return (
    <form
      className="sticky bottom-0 shrink-0 bg-background px-4 py-3"
      onSubmit={(e) => {
        e.preventDefault();
        handlerFn();
      }}
    >
      <div className="flex items-center gap-2 rounded-xl bg-muted px-4 py-2">
        <Button
          type="button"
          variant="ghost"
          size="icon-lg"
          aria-label="Add attachment"
          className="text-muted-foreground hover:text-foreground"
        >
          <Plus className="size-5" />
        </Button>

        <Input
          aria-label={`Message channel ${channelId}`}
          placeholder="Write message"
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          className="h-full flex-1 border-0 bg-transparent px-1 shadow-none placeholder:text-sm focus-visible:ring-0 dark:bg-transparent"
        />

        <Button
          type="button"
          variant="ghost"
          size="icon-lg"
          aria-label="Choose emoji"
          className="text-muted-foreground hover:text-foreground"
        >
          <Smile className="size-5" />
        </Button>

        <Button
          type="submit"
          size="icon-lg"
          className="hover:bg-indigo-400 dark:hover:bg-indigo-400"
          aria-label="Send message"
        >
          <Send className="size-5" />
        </Button>
      </div>
    </form>
  );
};
