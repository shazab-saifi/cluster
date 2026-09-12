import { Smile, X } from "lucide-react";
import { Button } from "@workspace/ui/components/button";
import React, { useLayoutEffect, useRef, useState } from "react";

interface EditInputProps {
  message: string;
  messageId: string;
  handleEdit: (messageId: string, message: string) => void;
  setIsEditing: (value: { messageId: string; message: string } | null) => void;
}

const EditInput = ({
  message,
  messageId,
  handleEdit,
  setIsEditing,
}: EditInputProps) => {
  const [editedMessage, setEditedMessage] = useState<string>(message);
  const inputRef = useRef<HTMLInputElement>(null);

  useLayoutEffect(() => {
    const input = inputRef.current;
    if (!input) return;

    input.focus();
    const len = input.value.length;
    input.setSelectionRange(len, len);
  }, [messageId]);

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter" && editedMessage.trim().length > 0) {
      handleEdit(messageId, editedMessage.trim());
    } else if (e.key === "Escape") {
      setIsEditing(null);
    }
  };

  return (
    <div className="w-full">
      <div className="flex flex-1 items-center justify-between rounded-lg border-2 bg-background p-2">
        <input
          ref={inputRef}
          name="message-edit-input"
          autoFocus
          value={editedMessage}
          onChange={(e) => setEditedMessage(e.target.value)}
          className="flex-1 bg-transparent px-1 focus:outline-none"
          onKeyDown={handleKeyDown}
        />
        <div className="flex gap-1">
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
            type="button"
            variant="ghost"
            size="icon-lg"
            aria-label="Cancel edit"
            className="text-muted-foreground hover:text-foreground"
            onClick={() => setIsEditing(null)}
          >
            <X />
          </Button>
        </div>
      </div>
      <p className="mt-1 text-xs">
        Press <span className="text-accent">ESC</span> key to cancel edit, or{" "}
        <span className="text-accent">Enter</span> key to complete edit.
      </p>
    </div>
  );
};

export default React.memo(EditInput);
