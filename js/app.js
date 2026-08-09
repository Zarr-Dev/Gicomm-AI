(() => {
  "use strict";

  const $ = (selector, root = document) => root.querySelector(selector);
  const $$ = (selector, root = document) => [...root.querySelectorAll(selector)];

  const state = {
    theme: localStorage.getItem("gicomm-theme") || "system",
    selectedImage: null,
    recognition: null,
    listening: false,
    currentUtterance: null,
    speakingButton: null,
    chats: JSON.parse(localStorage.getItem("gicomm-demo-chats") || "[]"),
    settings: {
      enterToSend: localStorage.getItem("gicomm-enter-to-send") !== "false",
      showCounter: localStorage.getItem("gicomm-show-counter") !== "false",
      speechLanguage: localStorage.getItem("gicomm-speech-language") || "id-ID",
      speechRate: Number(localStorage.getItem("gicomm-speech-rate") || "1"),
      showThinking: localStorage.getItem("gicomm-show-thinking") !== "false"
    }
  };

  const els = {
    landing: $("#landingView"),
    app: $("#appView"),
    heroLogin: $("#heroLoginBtn"),
    heroGoogle: $("#heroGoogleBtn"),
    start: $("#startBtn"),
    aboutBtn: $("#aboutBtn"),
    aboutLogin: $("#aboutLoginBtn"),
    aboutModal: $("#aboutModal"),
    closeAbout: $("#closeAboutBtn"),
    newChat: $("#newChatBtn"),
    accountBtn: $("#accountBtn"),
    accountMenu: $("#accountMenu"),
    signOut: $("#signOutBtn"),
    accountName: $("#accountName"),
    accountEmail: $("#accountEmail"),
    accountAvatar: $("#accountAvatar"),
    accountFallback: $("#accountAvatarFallback"),
    menuName: $("#menuName"),
    menuEmail: $("#menuEmail"),
    menuAvatar: $("#menuAvatar"),
    menuFallback: $("#menuAvatarFallback"),
    settingsAvatar: $("#settingsAvatar"),
    settingsFallback: $("#settingsAvatarFallback"),
    settingsName: $("#settingsName"),
    settingsEmail: $("#settingsEmail"),
    settingsModal: $("#settingsModal"),
    settingsTitle: $("#settingsTitle"),
    closeSettings: $("#closeSettingsBtn"),
    settingsNav: $("#settingsNav"),
    themeStatus: $("#themeStatus"),
    messageInput: $("#messageInput"),
    sendBtn: $("#sendBtn"),
    micBtn: $("#micBtn"),
    attachBtn: $("#attachBtn"),
    imageInput: $("#imageInput"),
    imagePreview: $("#imagePreview"),
    tokenCounter: $("#tokenCounter"),
    messages: $("#messages"),
    welcome: $("#welcomeState"),
    welcomeTitle: $("#welcomeTitle"),
    history: $("#historyList"),
    clearChat: $("#clearChatBtn"),
    openSidebar: $("#openSidebarBtn"),
    closeSidebar: $("#closeSidebarBtn"),
    sidebar: $("#sidebar"),
    mobileOverlay: $("#mobileOverlay"),
    toastRegion: $("#toastRegion"),
    enterToSend: $("#enterToSend"),
    showCounter: $("#showCounter"),
    speechLanguage: $("#speechLanguage"),
    speechRate: $("#speechRate"),
    showThinking: $("#showThinking")
  };

  function toast(message, duration = 2800) {
    const node = document.createElement("div");
    node.className = "toast";
    node.textContent = message;
    els.toastRegion.appendChild(node);
    setTimeout(() => node.remove(), duration);
  }

  function setTheme(theme) {
    state.theme = theme;
    document.documentElement.dataset.theme = theme;
    localStorage.setItem("gicomm-theme", theme);

    const label = theme === "dark" ? "Black" : theme === "light" ? "White" : "System";
    els.themeStatus.textContent = `Current: ${label}`;

    $$(".theme-option").forEach(btn => {
      btn.classList.toggle("active", btn.dataset.themeChoice === theme);
    });
  }

  function getUserName(user) {
    return user?.user_metadata?.full_name ||
           user?.user_metadata?.name ||
           user?.email?.split("@")[0] ||
           "User";
  }

  function getUserAvatar(user) {
    return user?.user_metadata?.avatar_url ||
           user?.user_metadata?.picture ||
           "";
  }

  function applyUser(user) {
    const loggedIn = !!user;
    els.landing.classList.toggle("hidden", loggedIn);
    els.app.classList.toggle("hidden", !loggedIn);

    if (!loggedIn) return;

    const name = getUserName(user);
    const email = user.email || "Google account";
    const avatar = getUserAvatar(user);

    els.accountName.textContent = name;
    els.accountEmail.textContent = email;
    els.menuName.textContent = name;
    els.menuEmail.textContent = email;
    els.settingsName.textContent = name;
    els.settingsEmail.textContent = email;
    els.welcomeTitle.textContent = `Good to see you, ${name.split(" ")[0]}.`;

    [els.accountAvatar, els.menuAvatar, els.settingsAvatar].forEach(img => {
      if (avatar) {
        img.src = avatar;
        img.hidden = false;
      } else {
        img.hidden = true;
      }
    });
    [els.accountFallback, els.menuFallback, els.settingsFallback].forEach(fallback => {
      fallback.textContent = name.slice(0, 1).toUpperCase();
      fallback.hidden = !!avatar;
    });
  }

  function closeAllPopovers() {
    els.accountMenu.classList.add("hidden");
  }

  function positionAccountMenu() {
    const rect = els.accountBtn.getBoundingClientRect();
    const menuWidth = 285;
    let left = rect.left;
    if (left + menuWidth > window.innerWidth - 10) left = window.innerWidth - menuWidth - 10;
    els.accountMenu.style.left = `${Math.max(10, left)}px`;
    els.accountMenu.style.bottom = `${Math.max(10, window.innerHeight - rect.top + 8)}px`;
  }

  function openSettings(panel = "general") {
    closeAllPopovers();
    els.settingsModal.classList.remove("hidden");
    activateSettingsPanel(panel);
  }

  function closeSettings() {
    els.settingsModal.classList.add("hidden");
  }

  function activateSettingsPanel(panel) {
    $$(".settings-tab").forEach(tab => tab.classList.toggle("active", tab.dataset.panel === panel));
    $$(".settings-panel").forEach(section => section.classList.toggle("active", section.dataset.panelContent === panel));
    const titles = {
      general: "Settings",
      profile: "Profile",
      appearance: "Appearance",
      speech: "Voice & Speech",
      ai: "AI preferences",
      privacy: "Privacy & Security",
      shortcuts: "Keyboard shortcuts",
      about: "About Gicomm"
    };
    els.settingsTitle.textContent = titles[panel] || "Settings";
  }

  function autoResize() {
    els.messageInput.style.height = "auto";
    els.messageInput.style.height = Math.min(180, els.messageInput.scrollHeight) + "px";
    els.tokenCounter.textContent = `${els.messageInput.value.length}/4000`;
    els.sendBtn.disabled = !els.messageInput.value.trim() && !state.selectedImage;
  }

  function resetComposer() {
    els.messageInput.value = "";
    state.selectedImage = null;
    els.imageInput.value = "";
    els.imagePreview.classList.add("hidden");
    els.imagePreview.innerHTML = "";
    autoResize();
  }

  function renderImagePreview() {
    if (!state.selectedImage) {
      els.imagePreview.classList.add("hidden");
      els.imagePreview.innerHTML = "";
      return;
    }

    const url = URL.createObjectURL(state.selectedImage);
    els.imagePreview.classList.remove("hidden");
    els.imagePreview.innerHTML = `
      <div class="preview-chip">
        <img src="${url}" alt="Selected image">
        <span>${escapeHtml(state.selectedImage.name)}</span>
        <button id="removeImageBtn" aria-label="Remove image">×</button>
      </div>
    `;
    $("#removeImageBtn").addEventListener("click", () => {
      state.selectedImage = null;
      els.imageInput.value = "";
      renderImagePreview();
      autoResize();
    });
  }

  function escapeHtml(value) {
    return String(value)
      .replaceAll("&", "&amp;")
      .replaceAll("<", "&lt;")
      .replaceAll(">", "&gt;")
      .replaceAll('"', "&quot;")
      .replaceAll("'", "&#039;");
  }

  function addMessage(role, text, imageUrl = "") {
    els.welcome.classList.add("hidden");

    const wrapper = document.createElement("article");
    wrapper.className = `message ${role}`;

    const bubble = document.createElement("div");
    bubble.className = "message-bubble";

    if (imageUrl) {
      const img = document.createElement("img");
      img.src = imageUrl;
      img.alt = "Attached image";
      img.style.cssText = "display:block;max-width:260px;max-height:220px;border-radius:12px;margin-bottom:9px;object-fit:cover;";
      bubble.appendChild(img);
    }

    const textNode = document.createElement("div");
    textNode.textContent = text;
    bubble.appendChild(textNode);

    wrapper.appendChild(bubble);

    if (role === "ai") {
      const meta = document.createElement("div");
      meta.className = "message-meta";
      const tts = document.createElement("button");
      tts.className = "tts-btn";
      tts.textContent = "▶ Play";
      tts.dataset.tts = text;
      meta.appendChild(tts);
      bubble.appendChild(meta);

      tts.addEventListener("click", () => toggleSpeech(tts, text));
    }

    els.messages.appendChild(wrapper);
    requestAnimationFrame(() => {
      els.chatContent.scrollTop = els.chatContent.scrollHeight;
    });
  }

  function addTyping() {
    const wrapper = document.createElement("article");
    wrapper.className = "message ai";
    wrapper.id = "typingMessage";
    wrapper.innerHTML = `<div class="message-bubble"><span class="typing"><span></span><span></span><span></span></span></div>`;
    els.messages.appendChild(wrapper);
    els.chatContent.scrollTop = els.chatContent.scrollHeight;
  }

  function removeTyping() {
    $("#typingMessage")?.remove();
  }

  async function sendMessage() {
    const text = els.messageInput.value.trim();
    if (!text && !state.selectedImage) return;

    const image = state.selectedImage;
    const imageUrl = image ? URL.createObjectURL(image) : "";
    const displayText = text || "Image attached.";

    addMessage("user", displayText, imageUrl);
    rememberChat(displayText);
    resetComposer();

    if (state.settings.showThinking) addTyping();

    await new Promise(resolve => setTimeout(resolve, 700));

    removeTyping();

    // Placeholder until the real Gicomm AI backend is connected.
    const reply = image
      ? "I received your image. The image-analysis backend is not connected in this frontend build yet."
      : `Demo response: I received your message:\n\n“${displayText}”\n\nThe UI, authentication, themes, image selection and voice controls are ready. The real AI API will be connected in the next backend phase.`;

    addMessage("ai", reply);
  }

  function rememberChat(title) {
    const clean = title.replace(/\s+/g, " ").slice(0, 58);
    if (!clean) return;
    state.chats = [{ id: Date.now(), title: clean }, ...state.chats.filter(c => c.title !== clean)].slice(0, 12);
    localStorage.setItem("gicomm-demo-chats", JSON.stringify(state.chats));
    renderHistory();
  }

  function renderHistory() {
    if (!state.chats.length) {
      els.history.innerHTML = `<div class="empty-history">Your conversations will appear here.</div>`;
      return;
    }
    els.history.innerHTML = state.chats.map(chat => `
      <button class="history-item" data-chat-id="${chat.id}" title="${escapeHtml(chat.title)}">${escapeHtml(chat.title)}</button>
    `).join("");
  }

  function clearCurrentChat() {
    els.messages.innerHTML = "";
    els.welcome.classList.remove("hidden");
    toast("Current chat cleared.");
  }

  function newChat() {
    clearCurrentChat();
    resetComposer();
    els.messageInput.focus();
    closeMobileSidebar();
  }

  function openMobileSidebar() {
    els.sidebar.classList.add("open");
    els.mobileOverlay.classList.remove("hidden");
  }

  function closeMobileSidebar() {
    els.sidebar.classList.remove("open");
    els.mobileOverlay.classList.add("hidden");
  }

  function setupSpeechRecognition() {
    const Recognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!Recognition) {
      els.micBtn.disabled = true;
      els.micBtn.title = "Speech recognition is not supported by this browser";
      return;
    }

    state.recognition = new Recognition();
    state.recognition.continuous = false;
    state.recognition.interimResults = true;
    state.recognition.lang = state.settings.speechLanguage;

    state.recognition.onstart = () => {
      state.listening = true;
      els.micBtn.textContent = "●";
      els.micBtn.setAttribute("aria-label", "Stop speech recognition");
      els.micBtn.title = "Stop speech recognition";
      toast("Listening…");
    };

    state.recognition.onresult = event => {
      let transcript = "";
      for (let i = event.resultIndex; i < event.results.length; i++) {
        transcript += event.results[i][0].transcript;
      }
      els.messageInput.value = transcript;
      autoResize();
    };

    state.recognition.onerror = event => {
      state.listening = false;
      resetMicButton();
      const messages = {
        "not-allowed": "Microphone permission was denied.",
        "no-speech": "No speech was detected.",
        "audio-capture": "No microphone was found."
      };
      toast(messages[event.error] || `Speech recognition error: ${event.error}`);
    };

    state.recognition.onend = () => {
      state.listening = false;
      resetMicButton();
    };
  }

  function resetMicButton() {
    els.micBtn.textContent = "⌕";
    els.micBtn.setAttribute("aria-label", "Speech to text");
    els.micBtn.title = "Speech to text";
  }

  function toggleSpeech(button, text) {
    if (!("speechSynthesis" in window)) {
      toast("Text-to-speech is not supported by this browser.");
      return;
    }

    if (state.speakingButton === button && window.speechSynthesis.speaking) {
      if (window.speechSynthesis.paused) {
        window.speechSynthesis.resume();
        button.textContent = "⏸ Pause";
      } else {
        window.speechSynthesis.pause();
        button.textContent = "▶ Resume";
      }
      return;
    }

    window.speechSynthesis.cancel();
    $$(".tts-btn").forEach(btn => btn.textContent = "▶ Play");

    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = state.settings.speechLanguage;
    utterance.rate = state.settings.speechRate;

    utterance.onstart = () => {
      state.currentUtterance = utterance;
      state.speakingButton = button;
      button.textContent = "⏸ Pause";
    };

    utterance.onend = () => {
      button.textContent = "↻ Replay";
      state.currentUtterance = null;
      state.speakingButton = null;
    };

    utterance.onerror = () => {
      button.textContent = "▶ Play";
      state.currentUtterance = null;
      state.speakingButton = null;
    };

    window.speechSynthesis.speak(utterance);
  }

  function bindEvents() {
    [els.heroLogin, els.heroGoogle, els.aboutLogin].forEach(btn => {
      btn.addEventListener("click", async () => {
        try {
          if (!GicommAuth.configured) {
            toast("Isi Supabase URL dan publishable key di js/config.js terlebih dahulu.");
            return;
          }
          await GicommAuth.signInWithGoogle();
        } catch (error) {
          console.error(error);
          toast(error.message || "Google sign-in failed.");
        }
      });
    });

    els.start.addEventListener("click", () => {
      if (GicommAuth.user) {
        newChat();
      } else {
        els.heroGoogle.click();
      }
    });

    els.aboutBtn.addEventListener("click", () => els.aboutModal.classList.remove("hidden"));
    els.closeAbout.addEventListener("click", () => els.aboutModal.classList.add("hidden"));
    els.aboutModal.addEventListener("click", e => {
      if (e.target === els.aboutModal) els.aboutModal.classList.add("hidden");
    });

    els.accountBtn.addEventListener("click", e => {
      e.stopPropagation();
      const hidden = els.accountMenu.classList.contains("hidden");
      closeAllPopovers();
      if (hidden) {
        positionAccountMenu();
        els.accountMenu.classList.remove("hidden");
      }
    });

    document.addEventListener("click", e => {
      if (!els.accountMenu.contains(e.target) && e.target !== els.accountBtn) closeAllPopovers();
    });

    $$("[data-settings]").forEach(btn => {
      btn.addEventListener("click", () => openSettings(btn.dataset.settings));
    });

    els.closeSettings.addEventListener("click", closeSettings);
    els.settingsModal.addEventListener("click", e => {
      if (e.target === els.settingsModal) closeSettings();
    });

    $$(".settings-tab").forEach(tab => {
      tab.addEventListener("click", () => activateSettingsPanel(tab.dataset.panel));
    });

    $$(".theme-option").forEach(btn => {
      btn.addEventListener("click", () => setTheme(btn.dataset.themeChoice));
    });

    els.signOut.addEventListener("click", async () => {
      try {
        await GicommAuth.signOut();
        closeAllPopovers();
        toast("Signed out.");
      } catch (error) {
        console.error(error);
        toast(error.message || "Sign out failed.");
      }
    });

    els.messageInput.addEventListener("input", autoResize);
    els.messageInput.addEventListener("keydown", e => {
      if (e.key === "Enter" && !e.shiftKey && state.settings.enterToSend) {
        e.preventDefault();
        sendMessage();
      }
    });

    els.sendBtn.addEventListener("click", sendMessage);

    els.attachBtn.addEventListener("click", () => els.imageInput.click());
    els.imageInput.addEventListener("change", () => {
      const file = els.imageInput.files?.[0];
      if (!file) return;
      if (!file.type.startsWith("image/")) {
        toast("Only image files are allowed.");
        els.imageInput.value = "";
        return;
      }
      if (file.size > 10 * 1024 * 1024) {
        toast("Image is larger than 10 MB.");
        els.imageInput.value = "";
        return;
      }
      state.selectedImage = file;
      renderImagePreview();
      autoResize();
    });

    els.micBtn.addEventListener("click", () => {
      if (!state.recognition) {
        toast("Speech recognition is not supported by this browser.");
        return;
      }
      if (state.listening) {
        state.recognition.stop();
      } else {
        state.recognition.lang = state.settings.speechLanguage;
        state.recognition.start();
      }
    });

    els.newChat.addEventListener("click", newChat);
    els.clearChat.addEventListener("click", clearCurrentChat);
    els.openSidebar.addEventListener("click", openMobileSidebar);
    els.closeSidebar.addEventListener("click", closeMobileSidebar);
    els.mobileOverlay.addEventListener("click", closeMobileSidebar);
    els.appBrand.addEventListener("click", e => { e.preventDefault(); newChat(); });

    $$(".suggestion-card").forEach(card => {
      card.addEventListener("click", () => {
        els.messageInput.value = card.dataset.prompt;
        autoResize();
        els.messageInput.focus();
      });
    });

    els.enterToSend.addEventListener("change", () => {
      state.settings.enterToSend = els.enterToSend.checked;
      localStorage.setItem("gicomm-enter-to-send", String(els.enterToSend.checked));
    });

    els.showCounter.addEventListener("change", () => {
      state.settings.showCounter = els.showCounter.checked;
      localStorage.setItem("gicomm-show-counter", String(els.showCounter.checked));
      els.tokenCounter.classList.toggle("hidden", !els.showCounter.checked);
    });

    els.speechLanguage.addEventListener("change", () => {
      state.settings.speechLanguage = els.speechLanguage.value;
      localStorage.setItem("gicomm-speech-language", state.settings.speechLanguage);
      if (state.recognition) state.recognition.lang = state.settings.speechLanguage;
    });

    els.speechRate.addEventListener("input", () => {
      state.settings.speechRate = Number(els.speechRate.value);
      localStorage.setItem("gicomm-speech-rate", String(state.settings.speechRate));
    });

    els.showThinking.addEventListener("change", () => {
      state.settings.showThinking = els.showThinking.checked;
      localStorage.setItem("gicomm-show-thinking", String(els.showThinking.checked));
    });

    document.addEventListener("keydown", e => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "n") {
        e.preventDefault();
        if (GicommAuth.user) newChat();
      }
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        if (GicommAuth.user) {
          toast("Chat search UI is ready for the next database phase.");
        }
      }
      if (e.key === "Escape") {
        closeAllPopovers();
        closeSettings();
        els.aboutModal.classList.add("hidden");
        closeMobileSidebar();
        if (state.listening) state.recognition?.stop();
      }
    });

    window.addEventListener("resize", () => {
      if (!els.accountMenu.classList.contains("hidden")) positionAccountMenu();
    });
  }

  function initSettings() {
    setTheme(state.theme);
    els.enterToSend.checked = state.settings.enterToSend;
    els.showCounter.checked = state.settings.showCounter;
    els.speechLanguage.value = state.settings.speechLanguage;
    els.speechRate.value = state.settings.speechRate;
    els.showThinking.checked = state.settings.showThinking;
    els.tokenCounter.classList.toggle("hidden", !state.settings.showCounter);
  }

  function init() {
    initSettings();
    renderHistory();
    setupSpeechRecognition();
    bindEvents();
    autoResize();

    window.addEventListener("gicomm:auth", e => {
      applyUser(e.detail.user);
      if (e.detail.event === "SIGNED_IN") toast("Signed in successfully.");
      if (e.detail.event === "SIGNED_OUT") {
        els.messages.innerHTML = "";
        els.welcome.classList.remove("hidden");
        resetComposer();
      }
    });

    // In case auth initialized before this listener.
    applyUser(GicommAuth.user);
  }

  init();
})();
