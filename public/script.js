// 🌐 Backend URL (use localhost for local development)
const API_URL = "http://localhost:5000";

// 🔹 Section switching (Login / Signup / Forgot / Chatbot)
function showSection(sectionId) {
  document.querySelectorAll(".form-container, .chat-container").forEach(div => {
    div.style.display = "none";
  });
  document.querySelector(".input-area").style.display = "none";
  document.getElementById(sectionId).style.display = "block";
  if (sectionId === "chatPage") {
    document.querySelector(".input-area").style.display = "flex";
  }
}

// ============================
// 🔹 LOGIN
// ============================
async function login() {
  const email = document.getElementById("loginEmail").value.trim();
  const password = document.getElementById("loginPassword").value.trim();

  if (!email || !password) {
    alert("⚠️ Please fill all fields!");
    return;
  }

  try {
    const res = await fetch(`${API_URL}/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, password })
    });

    const data = await res.json();
    if (data.message === "Login successful") {
      alert("✅ Login successful!");
      showSection("chatPage");
    } else {
      alert(data.error || "❌ Login failed!");
    }
  } catch (err) {
    console.error("Login error:", err);
    alert("⚠️ Server error while login");
  }
}

// ============================
// 🔹 SIGNUP
// ============================
async function signup() {
  const name = document.getElementById("signupName").value.trim();
  const email = document.getElementById("signupEmail").value.trim();
  const password = document.getElementById("signupPassword").value.trim();

  if (!name || !email || !password) {
    alert("⚠️ Please fill all fields!");
    return;
  }

  try {
    const res = await fetch(`${API_URL}/signup`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name, email, password })
    });

    const data = await res.json();
    if (data.message) {
      alert("🎉 Signup successful! You can now login.");
      showSection("loginPage");
    } else {
      alert(data.error || "Signup failed!");
    }
  } catch (err) {
    console.error("Signup error:", err);
    alert("⚠️ Server error while signup");
  }
}

// ============================
// 🔹 FORGOT PASSWORD
// ============================
async function forgotPassword() {
  const email = document.getElementById("forgotEmail").value.trim();

  if (!email) {
    alert("⚠️ Please enter your email!");
    return;
  }

  try {
    const res = await fetch(`${API_URL}/forgot-password`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email })
    });

    const data = await res.json();
    alert(data.message || data.error);
    if (data.message) showSection("loginPage");
  } catch (err) {
    console.error("Forgot password error:", err);
    alert("⚠️ Server error while password reset");
  }
}

// ============================
// 🔹 Helper function to check if user is near bottom
// ============================
function isNearBottom(chatBox) {
  return chatBox.scrollTop + chatBox.clientHeight >= chatBox.scrollHeight - 50; // 50px threshold
}

// ============================
// 🔹 AI Chatbot
// ============================
async function sendMessage() {
  const input = document.getElementById("userInput").value.trim();
  if (!input) return;

  const chatBox = document.getElementById("chatBox");

  // 🧍 User message
  const userDiv = document.createElement("div");
  userDiv.className = "user";
  userDiv.textContent = input;
  chatBox.appendChild(userDiv);

  // 🤖 Bot reply (temporary loading message)
  const botDiv = document.createElement("div");
  botDiv.className = "bot";
  botDiv.textContent = "Thinking...";
  chatBox.appendChild(botDiv);

  // Always auto-scroll to the latest message
  botDiv.scrollIntoView({ behavior: 'smooth' });
  document.getElementById("userInput").value = "";

  try {
    const res = await fetch(`${API_URL}/chat`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ message: input })
    });

    const data = await res.json();
    botDiv.textContent = data.reply || "Sorry, I couldn’t understand.";
  } catch (err) {
    console.error("Chatbot error:", err);
    botDiv.textContent = "⚠️ Server error while getting AI reply.";
  }

  // Always auto-scroll to the latest message
  botDiv.scrollIntoView({ behavior: 'smooth' });
}

// 🔹 Press Enter to send message
document.getElementById("userInput").addEventListener("keypress", function (e) {
  if (e.key === "Enter") {
    sendMessage();
  }
});

// ============================
// 🔹 Audio Recording
// ============================
let mediaRecorder;
let audioChunks = [];
let isRecording = false;

async function toggleRecording() {
  const recordBtn = document.getElementById("recordBtn");

  if (!isRecording) {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      mediaRecorder = new MediaRecorder(stream);
      audioChunks = [];

      mediaRecorder.ondataavailable = (event) => {
        audioChunks.push(event.data);
      };

      mediaRecorder.onstop = () => {
        const audioBlob = new Blob(audioChunks, { type: 'audio/wav' });
        sendAudio(audioBlob);
        stream.getTracks().forEach(track => track.stop());
      };

      mediaRecorder.start();
      isRecording = true;
      recordBtn.textContent = "⏹️ Stop";
      recordBtn.style.background = "#ff0000";
    } catch (err) {
      console.error("Error accessing microphone:", err);
      alert("⚠️ Could not access microphone. Please check permissions.");
    }
  } else {
    mediaRecorder.stop();
    isRecording = false;
    recordBtn.textContent = "🎤 Record";
    recordBtn.style.background = "#ffd700";
  }
}

async function sendAudio(audioBlob) {
  const chatBox = document.getElementById("chatBox");

  // 🧍 User message
  const userDiv = document.createElement("div");
  userDiv.className = "user";
  userDiv.textContent = "🎤 Audio message sent";
  chatBox.appendChild(userDiv);

  // 🤖 Bot reply (temporary loading message)
  const botDiv = document.createElement("div");
  botDiv.className = "bot";
  botDiv.textContent = "Processing audio...";
  chatBox.appendChild(botDiv);

  // Always auto-scroll to the latest message
  botDiv.scrollIntoView({ behavior: 'smooth' });

  const formData = new FormData();
  formData.append("audio", audioBlob, "recording.wav");

  try {
    const res = await fetch(`${API_URL}/chat`, {
      method: "POST",
      body: formData
    });

    const data = await res.json();
    botDiv.textContent = data.reply || "Sorry, I couldn’t process the audio.";
  } catch (err) {
    console.error("Audio send error:", err);
    botDiv.textContent = "⚠️ Server error while processing audio.";
  }

  // Always auto-scroll to the latest message
  botDiv.scrollIntoView({ behavior: 'smooth' });
}

// ============================
// 🔹 File Upload
// ============================
document.getElementById("fileInput").addEventListener("change", function (event) {
  const file = event.target.files[0];
  if (file) {
    sendFile(file);
  }
});

async function sendFile(file) {
  const chatBox = document.getElementById("chatBox");

  // 🧍 User message
  const userDiv = document.createElement("div");
  userDiv.className = "user";
  userDiv.textContent = `📎 File uploaded: ${file.name}`;
  chatBox.appendChild(userDiv);

  // 🤖 Bot reply (temporary loading message)
  const botDiv = document.createElement("div");
  botDiv.className = "bot";
  botDiv.textContent = "Processing file...";
  chatBox.appendChild(botDiv);

  if (isNearBottom(chatBox)) {
    botDiv.scrollIntoView({ behavior: 'smooth' });
  }

  const formData = new FormData();
  formData.append("file", file);

  try {
    const res = await fetch(`${API_URL}/chat`, {
      method: "POST",
      body: formData
    });

    const data = await res.json();
    botDiv.textContent = data.reply || "Sorry, I couldn’t process the file.";
  } catch (err) {
    console.error("File send error:", err);
    botDiv.textContent = "⚠️ Server error while processing file.";
  }

  if (isNearBottom(chatBox)) {
    botDiv.scrollIntoView({ behavior: 'smooth' });
  }
}
