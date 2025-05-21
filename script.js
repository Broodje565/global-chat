const chatBox = document.getElementById('chat-box');
const form = document.getElementById('chat-form');
const input = document.getElementById('msg-input');

// Vul dit in met jouw eigen Worker URL:
const ws = new WebSocket('wss://your-worker-name.your-subdomain.workers.dev/api');

ws.addEventListener('message', event => {
  const div = document.createElement('div');
  div.textContent = event.data;
  chatBox.appendChild(div);
  chatBox.scrollTop = chatBox.scrollHeight;
});

form.addEventListener('submit', e => {
  e.preventDefault();
  if (input.value.trim()) {
    ws.send(input.value.trim());
    input.value = '';
  }
});
