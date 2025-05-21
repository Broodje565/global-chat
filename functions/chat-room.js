export class ChatRoom {
  constructor(state, env) {
    this.state = state;
    this.env = env;
    this.clients = [];
    this.ipMessages = new Map(); // voor rate limiting
  }

  async fetch(request) {
    if (request.headers.get("Upgrade") !== "websocket") {
      return new Response("Expected WebSocket", { status: 400 });
    }

    const webSocketPair = new WebSocketPair();
    const [clientSocket, serverSocket] = Object.values(webSocketPair);

    // IP halen uit headers (werkt alleen als je via proxy X-Forwarded-For gebruikt)
    const ip = request.headers.get("cf-connecting-ip") || "unknown";

    await this.state.acceptWebSocket(serverSocket);
    this.handleSession(serverSocket, ip);

    return new Response(null, { status: 101, webSocket: clientSocket });
  }

  handleSession(socket, ip) {
    const MAX_CLIENTS = 100;
    const INACTIVITY_TIMEOUT = 10 * 60 * 1000; // 10 minuten

    if (this.clients.length >= MAX_CLIENTS) {
      socket.close(1013, "Server is full. Try again later.");
      return;
    }

    this.clients.push(socket);

    // ⏱️ Inactiviteit timer
    let inactivity = setTimeout(() => {
      socket.close(1000, "Inactivity timeout");
    }, INACTIVITY_TIMEOUT);

    socket.addEventListener("message", e => {
      clearTimeout(inactivity);
      inactivity = setTimeout(() => {
        socket.close(1000, "Inactivity timeout");
      }, INACTIVITY_TIMEOUT);

      // 🛡️ Rate limiting per IP
      const now = Date.now();
      if (!this.ipMessages.has(ip)) {
        this.ipMessages.set(ip, []);
      }

      const timestamps = this.ipMessages.get(ip).filter(ts => now - ts < 60000);
      timestamps.push(now);

      if (timestamps.length > 20) {
        socket.send("⛔️ Te veel berichten (max 20/minuut).");
        return;
      }

      this.ipMessages.set(ip, timestamps);

      // Verstuur naar iedereen
      this.broadcast(e.data);
    });

    socket.addEventListener("close", () => {
      clearTimeout(inactivity);
      this.clients = this.clients.filter(s => s !== socket);
    });
  }

  broadcast(message) {
    for (const client of this.clients) {
      try {
        client.send(message);
      } catch (e) {
        console.error("Failed to send message", e);
      }
    }
  }
}

export default {
  fetch: (req, env, ctx) => {
    const obj = new ChatRoom(req.ctx.state, env);
    return obj.fetch(req);
  }
};
