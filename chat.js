(() => {
  const form = document.getElementById('form');
  const input = document.getElementById('input');
  const messages = document.getElementById('messages');

  // Laad eerdere berichten (voor nu niks)
  const loadMessages = () => {
    messages.innerHTML = '';
    // placeholder: geen voorgedrukte tekst
  };

  // Bericht versturen
  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    const text = input.value.trim();
    if (!text) return;

    const li = document.createElement('li');
    li.textContent = text;
    messages.appendChild(li);
    messages.scrollTop = messages.scrollHeight;

    input.value = '';

    // TODO: POST naar Cloudflare Durable Object endpoint
    // await fetch("/api", {
    //   method: "POST",
    //   body: JSON.stringify({ text }),
    // });
  });

  loadMessages();
})();
