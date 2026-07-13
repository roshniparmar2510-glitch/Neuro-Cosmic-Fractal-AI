function typeWriter(element, text, speed = 15) {
  let i = 0;

  function typing() {
    if (i < text.length) {
      element.innerHTML += text.charAt(i);
      i++;
      setTimeout(typing, speed);
    }
  }

  typing();
}

const uploadBtn = document.getElementById("uploadBtn");

if (uploadBtn) {
  uploadBtn.addEventListener("click", async () => {
    const file = document.getElementById("pdfFile").files[0];

    if (!file) {
      alert("Please select a PDF first.");
      return;
    }

    const formData = new FormData();
    formData.append("pdf", file);

    try {
      const response = await fetch("/upload-pdf", {
        method: "POST",
        body: formData
      });

      const data = await response.json();

      if (data.error) {
        alert(data.error);
        return;
      }

      alert("✅ PDF uploaded successfully!");
      console.log(data.text);

    } catch (err) {
      console.error(err);
      alert("Upload failed.");
    }
  });
}

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

  const aiMessage = document.createElement("div");
  aiMessage.className = "message ai";
  aiMessage.innerHTML = "Neuro-Cosmic AI is thinking...";
  chat.appendChild(aiMessage);

  chat.scrollTop = chat.scrollHeight;

  try {
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

    aiMessage.innerHTML = "";
    typeWriter(aiMessage, data.answer);

    localStorage.setItem("chatHistory", chat.innerHTML);

  } catch (err) {
    console.error(err);
    aiMessage.innerHTML = "❌ Something went wrong.";
  }
}
