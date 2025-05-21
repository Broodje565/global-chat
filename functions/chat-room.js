export class ChatRoom {
  constructor(state, env) {
    this.state = state;
    this.env = env;
    this.clients = [];
  }

  async fetch(request) {
    if (request.headers.get("Upgrade") !== "websocket") {
      return new Response("Expected WebSocket", { status: 400 });
    }

    const webSocketPair = new WebSocketPair();
    const [clientSocket, serverSocket] = Object.values(webSocketPair);

    await this.state.acceptWebSocket(serverSocket);
    this.handleSession(serverSocket);
    return new Response(null, { status: 101, webSocket: clientSocket });
  }

  handleSession(socket) {
    this.clients.push(socket);

    socket.addEventListener("message", e => {
      this.broadcast(e.data);
    });

    socket.addEventListener("close", () => {
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
