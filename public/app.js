window.onload = () => {
  const chat = document.getElementById("chat");
  const history = localStorage.getItem("chatHistory");

  if (history) {
    chat.innerHTML = history;
  }
};

async function sendQuestion() {
  const questionBox = document.getElementById("question");
  const chat = document.getElementById("chat");

  const question = questionBox.value.trim();

  if (!question) return;

  chat.innerHTML += `
<div class="message user">
${question}
</div>
`;

  questionBox.value = "";

  chat.innerHTML += `
<div class="message ai" id="thinking">
Neuro-Cosmic AI is thinking...
</div>
`;

  const response = await fetch("/chat", {
    method: "POST",
    headers: {
      "Content-Type": "application/json"
    },
    body: JSON.stringify({
      question: question
    })
  });

  const data = await response.json();

  document.getElementById("thinking").remove();

  chat.innerHTML += `
<div class="message ai">
${data.answer}
</div>
`;

  chat.scrollTop = chat.scrollHeight;

localStorage.setItem("chatHistory", chat.innerHTML);
}
