import { prismaClient } from "@repo/db/clint";
import jwt from "jsonwebtoken";
import type { WebSocket as WsWebSocket } from "ws";
import { WebSocketServer } from "ws";
import { JWT_SECRET } from "./config";

const port = Number(process.env.WS_PORT || process.env.PORT || 8081);
const wss = new WebSocketServer({ port });

// Startup and error logs
console.log(`WebSocket server starting on port ${port}...`);
wss.on("listening", () => {
  console.log(`WebSocket server is running on port ${port}`);
});
wss.on("error", (err) => {
  console.error("WebSocket server error:", err);
});

interface User {
  ws: WsWebSocket;
  rooms: string[];
  userId: string;
}

const users: User[] = [];

function checkUser(token: string): string | null {
  try {
    const decoded = jwt.verify(token, JWT_SECRET);

    if (typeof decoded === "string") return null;
    if (!decoded || !decoded.userId) return null;

    return decoded.userId;
  } catch {
    return null;
  }
}

wss.on("connection", (ws, request) => {
  const url = request.url;
  if (!url) return;

  const queryParams = new URLSearchParams(url.split("?")[1]);
  const token = queryParams.get("token") || "";
  const userId = checkUser(token);

  if (userId == null) {
    ws.close();
    return;
  }

  users.push({
    ws,
    rooms: [],
    userId,
  });

  ws.on("message", async (data) => {
    let parsedData: any;
    try {
      parsedData =
        typeof data === "string" ? JSON.parse(data) : JSON.parse(data.toString());
    } catch {
      return;
    }

    if (parsedData.type === "join_room") {
      const user = users.find((x) => x.userId === userId);
      user?.rooms.push(parsedData.roomId);
    }

    if (parsedData.type === "leave_room") {
      const user = users.find((x) => x.userId === userId);
      if (!user) return;

      user.rooms = user.rooms.filter((x) => x !== parsedData.roomId);
    }

    console.log("message received");
    console.log(parsedData);

    if (parsedData.type === "chat") {
      const roomId = parsedData.roomId;
      const message = parsedData.message;

      await prismaClient.chat.create({
        data: {
          roomId: Number(roomId),
          message,
          userId,
        },
      });

      users.forEach((user) => {
        if (user.rooms.includes(roomId)) {
          user.ws.send(
            JSON.stringify({
              type: "chat",
              message,
              roomId,
            })
          );
        }
      });
    }
  });

  ws.on("close", () => {
    console.log("WebSocket connection closed for user:", userId);
  });
});
