export default {
  async fetch(req, env, ctx) {
    return await handleWebSocket(req, env);
  }
};

async function handleWebSocket(request, env) {
  if (request.headers.get("Upgrade") !== "websocket") {
    return new Response("Expected WebSocket", { status: 400 });
  }

  const url = new URL(request.url);
  const id = "global";
  const objId = env.CHAT_ROOM.idFromName(id);
  const stub = env.CHAT_ROOM.get(objId);
  return await stub.fetch(request);
}
