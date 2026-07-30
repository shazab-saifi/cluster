# Message flow

1. The client sends a message event and updates the UI optimistically.
2. The WebSocket backend appends the event to a Redis Stream, then broadcasts it to clients. If the append fails, it notifies the originating client that the message failed.
3. A worker consumes stream events and persists them according to their type. Database failures are left pending for retry.
4. A recovery worker reprocesses pending entries (PEL) from the Redis Stream.

`XADD` is the durability boundary: after a successful append, the system is responsible for preserving and processing the message.
