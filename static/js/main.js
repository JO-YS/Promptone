document.addEventListener("DOMContentLoaded", () => {
  const openVoicePickerBtn = document.getElementById("openVoicePickerBtn");
  const closeVoicePickerBtn = document.getElementById("closeVoicePickerBtn");
  const voicePickerPanel = document.getElementById("voicePickerPanel");
  const selectedVoiceInfo = document.getElementById("selectedVoiceInfo");
  const voiceResults = document.getElementById("voiceResults");
  const voiceSearch = document.getElementById("voiceSearch");
  const outputFormatSelect = document.getElementById("output_format");
  const activeFilters = document.getElementById("activeFilters");
  const clearFiltersBtn = document.getElementById("clearFiltersBtn");
  const tooltip = document.getElementById("tooltipTime");
  const convertBtn = document.getElementById("convertBtn");
  const audioPlayer = document.getElementById("audioPlayer");
  const downloadBtn = document.getElementById("downloadBtn");
  const playBtn = document.getElementById("playBtn");
  const progressBar = document.getElementById("progressBar");
  const currentTimeEl = document.getElementById("currentTime");
  const durationEl = document.getElementById("duration");
  const textArea = document.getElementById("text");
  const promptArea = document.getElementById("prompt");
  const charCount = document.getElementById("charCount");
  const volumeSlider = document.getElementById("volumeSlider");
  const volumeIcon = document.getElementById("volumeIcon");

  let allVoices = [];
  let selectedVoice = null;

  [promptArea, textArea].forEach((area) => {
    autoResize(area); // 초기 크기 설정
    area.addEventListener("input", () => autoResize(area));
  });

  function autoResize(textarea) {
    textarea.style.height = "auto"; // 높이 초기화
    textarea.style.height = textarea.scrollHeight + "px"; // 내용 높이만큼 설정
  }

  function getCheckedValues(containerId) {
    return Array.from(document.querySelectorAll(`#${containerId} input[type="checkbox"]:checked`)).map(cb => cb.value);
  }

  function renderCheckboxGroup(containerId, values) {
    const container = document.querySelector(`#${containerId} .checkbox-list`);
    container.innerHTML = "";
    values.forEach(value => {
      const id = `${containerId}_${value.replace(/\s+/g, "_")}`;
      const label = document.createElement("label");
      label.htmlFor = id;
      label.innerHTML = `<input type="checkbox" value="${value}" id="${id}"> ${value}`;
      container.appendChild(label);
    });
  }

  function renderVoiceCards(voices) {
    voiceResults.innerHTML = "";

    const template = document.getElementById("voiceCardTemplate");

    voices.forEach((voice) => {
      const card = template.content.cloneNode(true);

      card.querySelector(".displayName").textContent = voice.displayName;
      card.querySelector(".displayLanguage").textContent = `${voice.displayLanguage} (${voice.locale})`;
      card.querySelector(".genderAccent").textContent = `${voice.gender || ""}${voice.accent ? " / " + voice.accent : ""}`;

      const badgeContainer = card.querySelector(".style-badges");
      (voice.availableStyles || []).forEach(style => {
        const badge = document.createElement("span");
        badge.className = "badge";
        badge.textContent = style;
        badgeContainer.appendChild(badge);
      });

      card.querySelector(".selectVoiceBtn").addEventListener("click", () => {
        selectedVoice = voice;
        selectedVoiceInfo.textContent = `🎤 ${voice.displayName} - ${voice.displayLanguage} (${voice.gender})`;
        voicePickerPanel.classList.add("hidden");
      });

      voiceResults.appendChild(card);
    });
  }

  function renderActiveFilters() {
    const filterMap = {
      groupLocale: { label: "Locale", values: getCheckedValues("groupLocale") },
      groupAccent: { label: "Accent", values: getCheckedValues("groupAccent") },
      groupGender: { label: "Gender", values: getCheckedValues("groupGender") },
      groupStyle: { label: "Style", values: getCheckedValues("groupStyle") },
      groupAge: { label: "Age", values: getCheckedValues("groupAge") }
    };

    const container = activeFilters;
    container.innerHTML = "";

    let hasAny = false;

    for (const [groupId, { label, values }] of Object.entries(filterMap)) {
      if (values.length === 0) continue;
      hasAny = true;

      const groupDiv = document.createElement("div");
      groupDiv.className = "filter-group-summary";

      const title = document.createElement("div");
      title.className = "filter-group-title";
      title.textContent = `[${label}]`;
      groupDiv.appendChild(title);

      values.forEach(value => {
        const chip = document.createElement("span");
        chip.className = "filter-chip";
        chip.innerHTML = `${value} <button class="remove-chip" data-group="${groupId}" data-value="${value}">X</button>`;
        groupDiv.appendChild(chip);
      });

      container.appendChild(groupDiv);
    }

    if (!hasAny) {
      container.textContent = "No filters applied.";
    }

  }

  function clearAllFilters() {
    document.querySelectorAll(".filter-group input[type=checkbox]").forEach(cb => cb.checked = false);
    voiceSearch.value = "";
    updateVoiceFilter();
  }

  function updateVoiceFilter() {
    const search = voiceSearch.value.trim().toLowerCase();
    const locs = getCheckedValues("groupLocale");
    const accents = getCheckedValues("groupAccent");
    const genders = getCheckedValues("groupGender");
    const styles = getCheckedValues("groupStyle");
    const ages = getCheckedValues("groupAge");

    const filtered = allVoices.filter(v => {
      const matchSearch = !search || [v.displayName, v.description, v.accent, v.displayLanguage, v.locale, ...(v.availableStyles || [])].some(field => field && field.toLowerCase().includes(search));
      const matchLocale = locs.length === 0 || locs.includes(v.locale);
      const matchAccent = accents.length === 0 || accents.includes(v.accent || "");
      const matchGender = genders.length === 0 || genders.includes(v.gender);
      const matchStyle = styles.length === 0 || (v.availableStyles || []).some(s => styles.includes(s));
      const matchAge = ages.length === 0 || ages.includes(v.description || "");
      return matchSearch && matchLocale && matchAccent && matchGender && matchStyle && matchAge;
    });

    renderVoiceCards(filtered);
    renderActiveFilters();
  }

  async function fetchVoices() {
    try {
      const res = await fetch("/voices");
      if (!res.ok) throw new Error("Failed to fetch voices");
      allVoices = await res.json();
      const extractUniqueSorted = (arr) => [...new Set(arr.filter(Boolean))].sort();

      renderCheckboxGroup("groupLocale", extractUniqueSorted(allVoices.map(v => v.locale)));
      renderCheckboxGroup("groupAccent", extractUniqueSorted(allVoices.map(v => v.accent)));
      renderCheckboxGroup("groupGender", extractUniqueSorted(allVoices.map(v => v.gender)));
      renderCheckboxGroup("groupStyle", extractUniqueSorted(allVoices.flatMap(v => v.availableStyles || [])));
      renderCheckboxGroup("groupAge", extractUniqueSorted(allVoices.map(v => v.description)));

      renderVoiceCards(allVoices);
      renderActiveFilters();
    } catch (err) {
      console.error("❌ Failed to load voices:", err);
      alert("❌ Voice 목록을 불러오는 데 실패했습니다.");
    }
  }

  async function fetchSettingsFromGemini(text, promptText) {
    const geminiPrompt = `System: You are an expert assistant that generates voice synthesis parameters for the Murf.ai API.
    Your task is to convert a user prompt into a natural-sounding speech configuration in JSON format, using valid Murf-compatible parameters.
    
    Guidelines:
    - Insert natural-sounding pauses using [pause Xs] format (e.g., [pause 0.5s]) only when it improves clarity, emphasis, or rhythm.
    - Use pitch and rate in the range 0.5 to 2.0 (default: 1.0).
    - Use variation in the range 0.0 to 1.0 (default: 0.0).
    - Use audioDuration and pronunciationDictionary only if needed.
    - Allowed styles: ${JSON.stringify(selectedVoice.availableStyles)}
    
    📌 For pronunciationDictionary:
    - You can specify **multiple words**.
    - Each word may use a **different pronunciation format**, chosen from:
      - IPA (International Phonetic Alphabet): \`"Murf": "mɜːrf"\`
      - Phonetic spelling (English): \`"niche": "neesh"\`
      - Korean-style transliteration (or similar): \`"Murf": "머프"\`
      - Syllable-separated (using hyphens): \`"comfortable": "com-fort-a-ble"\`
      - SSML <phoneme> tag (escaped):  
        \`"Charles": "<phoneme alphabet=\\"ipa\\" ph=\\"tʃɑːrlz\\">Charles</phoneme>"\`
    
    - You are not limited to Korean. Use pronunciation formats applicable to the target language and supported by Murf.
    
    Respond ONLY with a valid JSON object using the schema below:
    {
      "text": "(string with optional [pause Xs])",
      "pitch": 1.0,                      // float, 0.5 to 2.0
      "rate": 1.0,                       // float, 0.5 to 2.0
      "style": "Conversational",         // one of the allowed styles
      "variation": 0.0,                  // float, 0.0 to 1.0
      "audioDuration": 0.0,              // optional, in seconds
      "pronunciationDictionary": {
        "word1": "custom pronunciation",
        "word2": "<phoneme ...>...</phoneme>"
      }
    }
    
    Original text to transform:
    ${text}
    
    User intent and context:
    ${promptText}`;
    

    const response = await fetch("/gemini", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ prompt: geminiPrompt })
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.detail || error.error || "Gemini 오류");
    }

    return await response.json();
  }

  async function convertTextToSpeech(payload) {
    const response = await fetch("/tts", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ settings: payload })
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.detail || error.error || "TTS 오류");
    }

    return await response.json();
  }

  function setupPlayerInteractions(audioUrl) {
    audioPlayer.src = audioUrl;
    audioPlayer.load();
    audioPlayer.style.display = "block";
    downloadBtn.href = audioUrl;
    downloadBtn.setAttribute("download", "murf_output.mp3");

    // Show download button after conversion
    downloadBtn.style.display = "inline-block";

    progressBar.addEventListener("mousemove", (e) => {
      const rect = progressBar.getBoundingClientRect();
      const percent = (e.clientX - rect.left) / rect.width;
      const hoverTime = audioPlayer.duration * percent;

      tooltip.style.left = `${e.clientX - rect.left}px`;
      tooltip.style.display = "block";
      tooltip.textContent = formatTime(hoverTime);
    });

    progressBar.addEventListener("mouseleave", () => {
      tooltip.style.display = "none";
    });

    downloadBtn.addEventListener("click", async (e) => {
      e.preventDefault();
      const confirmed = confirm("정말 다운로드하시겠습니까?");
      if (!confirmed) return;

      try {
        const response = await fetch(audioUrl);
        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = "murf_output.mp3";
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        window.URL.revokeObjectURL(url);
      } catch (err) {
        alert("다운로드에 실패했습니다.");
        console.error("Download error:", err);
      }
    });

    document.getElementById("resultSection").style.display = "block";
  }

  function formatTime(seconds) {
    const min = Math.floor(seconds / 60);
    const sec = Math.floor(seconds % 60).toString().padStart(2, "0");
    return `${min}:${sec}`;
  }

  textArea.addEventListener("input", () => {
    const length = textArea.value.length;
    charCount.textContent = `${length} / 3000`;
  });

  function updateProgressBar() {
    if (!audioPlayer.duration || isNaN(audioPlayer.duration)) return;
  
    const percent = (audioPlayer.currentTime / audioPlayer.duration) * 100;
    progressBar.value = audioPlayer.currentTime;
    progressBar.style.setProperty('--progress', `${percent}%`);
    currentTimeEl.textContent = formatTime(audioPlayer.currentTime);
  }
  

  convertBtn.addEventListener("click", async () => {
    const prompt = document.getElementById("prompt").value.trim();
    const text = document.getElementById("text").value.trim();
    const format = outputFormatSelect.value;

    if (!prompt || !text || !selectedVoice || !format) {
      alert("Please provide text, prompt, format, and select a voice.");
      return;
    }

    // Hide download button before conversion
    downloadBtn.style.display = "none";
    playBtn.innerHTML = '<i class="fas fa-pause"></i>';

    convertBtn.disabled = true;
    convertBtn.innerHTML = `<span class="loading-spinner"></span> Converting...`;

    try {
      const geminiSettings = await fetchSettingsFromGemini(text,prompt);
      const finalPayload = {
        voiceId: selectedVoice.voiceId,
        multiNativeLocale: selectedVoice.locale,
        format: format,
        sampleRate: (format === "ALAW" || format === "ULAW") ? 8000 : 44100,
        ...geminiSettings
      };

      const result = await convertTextToSpeech(finalPayload);
      const audioUrl = result.audioFile ?? result.audioUrl ?? result.audio_url;

      if (!audioUrl) throw new Error("No audio URL in response");
      setupPlayerInteractions(audioUrl);
    } catch (err) {
      console.error("❌ Error:", err);
      alert("❌ 변환 실패: " + err.message);
    } finally {
      convertBtn.disabled = false;
      convertBtn.innerHTML = "🎙️ Convert to Voice";
    }
  });

  voiceSearch.addEventListener("input", updateVoiceFilter);
  ["groupLocale", "groupAccent", "groupGender", "groupStyle", "groupAge"].forEach(id => {
    document.getElementById(id).addEventListener("change", updateVoiceFilter);
  });

  activeFilters.addEventListener("click", (e) => {
    const btn = e.target.closest(".remove-chip");
    if (!btn) return;
    const group = btn.dataset.group;
    const value = btn.dataset.value;
    const checkboxes = document.querySelectorAll(`#${group} input[type="checkbox"]`);
    checkboxes.forEach(cb => {
      if (cb.value === value) cb.checked = false;
    });

    updateVoiceFilter();
  });


  clearFiltersBtn.addEventListener("click", clearAllFilters);

  openVoicePickerBtn.addEventListener("click", () => {
    voicePickerPanel.classList.remove("hidden");
    setTimeout(() => {
      const searchInput = document.getElementById("voiceSearch");
      if (searchInput && searchInput.offsetParent !== null) searchInput.focus();
    }, 50);
  });

  closeVoicePickerBtn.addEventListener("click", () => voicePickerPanel.classList.add("hidden"));

  audioPlayer.addEventListener("loadedmetadata", () => {
    progressBar.max = audioPlayer.duration;
    progressBar.step = 0.01;
    durationEl.textContent = formatTime(audioPlayer.duration);
    updateProgressBar();
  });

  audioPlayer.addEventListener("timeupdate", updateProgressBar);

  audioPlayer.addEventListener("ended", () => {
    progressBar.value = audioPlayer.duration;
    currentTimeEl.textContent = formatTime(audioPlayer.duration);
    playBtn.innerHTML = '<i class="fas fa-pause"></i>'; // 재생 중
  });

  audioPlayer.addEventListener("pause", () => {
    playBtn.innerHTML = '<i class="fas fa-pause"></i>'; // 재생 중
  });

  progressBar.addEventListener("input", () => {
    audioPlayer.currentTime = progressBar.value;
    updateProgressBar(); 
  });

  playBtn.addEventListener("click", () => {
    if (audioPlayer.paused) {
      audioPlayer.play();
      playBtn.innerHTML = '<i class="fas fa-play"></i>';  // 정지 상태
    } else {
      audioPlayer.pause();
      playBtn.innerHTML = '<i class="fas fa-pause"></i>'; // 재생 중
    }
  });

  document.querySelectorAll(".filter-group .filter-toggle").forEach(btn => {
    btn.addEventListener("click", () => {
      const group = btn.closest(".filter-group");
      const isOpen = group.classList.contains("open");

      document.querySelectorAll(".filter-group").forEach(g => g.classList.remove("open"));

      if (!isOpen) {
        group.classList.add("open");
      }

      e.stopPropagation();
    });
  });

  document.addEventListener("click", (e) => {
    const isInsideFilterGroup = e.target.closest(".filter-group");
    if (!isInsideFilterGroup) {
      document.querySelectorAll(".filter-group").forEach(g => g.classList.remove("open"));
    }
  });



  window.addEventListener("click", (e) => {
    const modal = document.getElementById("voicePickerPanel");
    const modalContent = modal.querySelector(".modal-content");

    const clickedInsideModal = modalContent.contains(e.target);
    const isRemoveChip = e.target.closest(".remove-chip");

    if (
      !modal.classList.contains("hidden") &&
      !clickedInsideModal &&
      !isRemoveChip &&
      e.target.id !== "openVoicePickerBtn"
    ) {
      modal.classList.add("hidden");
    }
  });



  window.addEventListener("keydown", (e) => {
    if (e.key === "Escape") {
      const modal = document.getElementById("voicePickerPanel");
      if (!modal.classList.contains("hidden")) {
        modal.classList.add("hidden");
      }
    }
  });

  fetchVoices();

  // 볼륨 슬라이더로 오디오 볼륨 조절
  volumeSlider.addEventListener("input", () => {
    audioPlayer.volume = volumeSlider.value;
    updateVolumeIcon();
  });

  // 아이콘 클릭 시 음소거/해제
  volumeIcon.addEventListener("click", () => {
    if (audioPlayer.muted) {
      audioPlayer.muted = false;
      volumeSlider.value = audioPlayer.volume;
    } else {
      audioPlayer.muted = true;
      volumeSlider.value = 0;
    }
    updateVolumeIcon();
  });

  // 볼륨 아이콘 상태 업데이트
  function updateVolumeIcon() {
    if (audioPlayer.muted || audioPlayer.volume == 0) {
      volumeIcon.textContent = "🔇";
    } else if (audioPlayer.volume < 0.5) {
      volumeIcon.textContent = "🔉";
    } else {
      volumeIcon.textContent = "🔊";
    }
  }

  // 오디오 볼륨 변경 시 슬라이더와 아이콘 동기화
  audioPlayer.addEventListener("volumechange", () => {
    if (!audioPlayer.muted) {
      volumeSlider.value = audioPlayer.volume;
    }
    updateVolumeIcon();
  });

  // 초기 볼륨 설정
  audioPlayer.volume = 1;
  updateVolumeIcon();
  
});
