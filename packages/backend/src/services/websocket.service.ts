import { Server as HTTPServer } from "http";
import { Server as SocketIOServer } from "socket.io";

let io: SocketIOServer | null = null;

export function initializeWebSocket(server: HTTPServer) {
  io = new SocketIOServer(server, {
    cors: {
      origin: process.env.CORS_ORIGIN || "*",
      methods: ["GET", "POST"],
    },
  });

  io.on("connection", (socket) => {
    console.log(`✅ Client connected: ${socket.id}`);

    socket.on("join-feed", (userId: string) => {
      socket.join(`user:${userId}`);
      socket.join("community");
      console.log(`👤 User ${userId} joined feed rooms`);
    });

    socket.on("disconnect", () => {
      console.log(`❌ Client disconnected: ${socket.id}`);
    });
  });

  console.log("🔌 WebSocket server initialized");
  return io;
}

export function getIO(): SocketIOServer | null {
  return io;
}

export function broadcastFeedEvent(event: {
  type: string;
  userId: string;
  content: string;
  metadata?: any;
}) {
  if (!io) {
    console.warn("WebSocket not initialized");
    return;
  }

  // Broadcast to community feed
  io.to("community").emit("feed:new-event", {
    id: `event_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
    ...event,
    createdAt: new Date().toISOString(),
  });

  // Also send to specific user
  io.to(`user:${event.userId}`).emit("feed:my-event", {
    id: `event_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
    ...event,
    createdAt: new Date().toISOString(),
  });

  console.log(`📡 Broadcasted feed event: ${event.type}`);
}
