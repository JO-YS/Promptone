// 🎤 PromptOne - AI Voice Generator - Main JavaScript
// Improved version with better error handling, security, and performance

class PromptOneVoiceGenerator {
  constructor() {
    this.allVoices = [];
    this.selectedVoice = null;
    this.elements = {};
    this.isInitialized = false;
    
    this.init();
  }

  init() {
    try {
      this.initializeElements();
      this.setupEventListeners();
      this.fetchVoices();
      this.isInitialized = true;
    } catch (error) {
      console.error('Failed to initialize PromptOneVoiceGenerator:', error);
      this.showError('애플리케이션 초기화에 실패했습니다.');
    }
  }

  initializeElements() {
    const elementIds = [
      'openVoicePickerBtn', 'closeVoicePickerBtn', 'voicePickerPanel',
      'selectedVoiceInfo', 'voiceResults', 'voiceSearch', 'output_format',
      'activeFilters', 'clearFiltersBtn', 'tooltipTime', 'convertBtn',
      'audioPlayer', 'downloadBtn', 'playBtn', 'progressBar', 'timeDisplay',
      'text', 'prompt', 'charCount', 'volumeSlider', 'volumeIcon'
    ];

    this.elements = {};
    elementIds.forEach(id => {
      const element = document.getElementById(id);
      if (!element) {
        console.warn(`Element not found: ${id}`);
        return;
      }
      this.elements[id] = element;
    });
  }

  setupEventListeners() {
    // Textarea auto-resize
    [this.elements.prompt, this.elements.text].forEach(area => {
      if (area) {
        this.autoResize(area);
        area.addEventListener('input', () => this.autoResize(area));
      }
    });

    // Character count
    if (this.elements.text && this.elements.charCount) {
      this.elements.text.addEventListener('input', () => {
        const length = this.elements.text.value.length;
        this.elements.charCount.textContent = `${length} / 3000`;
      });
    }

    // Voice picker
    if (this.elements.openVoicePickerBtn) {
      this.elements.openVoicePickerBtn.addEventListener('click', () => this.openVoicePicker());
    }
    if (this.elements.closeVoicePickerBtn) {
      this.elements.closeVoicePickerBtn.addEventListener('click', () => this.closeVoicePicker());
    }

    // Search and filters
    if (this.elements.voiceSearch) {
      this.elements.voiceSearch.addEventListener('input', () => this.updateVoiceFilter());
    }
    if (this.elements.clearFiltersBtn) {
      this.elements.clearFiltersBtn.addEventListener('click', () => this.clearAllFilters());
    }

    // Convert button
    if (this.elements.convertBtn) {
      this.elements.convertBtn.addEventListener('click', () => this.handleConvert());
    }

    // Audio player controls
    this.setupAudioPlayerControls();

    // Filter groups
    this.setupFilterGroups();

    // Modal interactions
    this.setupModalInteractions();

    // Output format selector
    this.setupOutputFormatSelector();
  }

  autoResize(textarea) {
    textarea.style.height = 'auto';
    textarea.style.height = textarea.scrollHeight + 'px';
  }

  // 🔒 XSS 방지를 위한 안전한 텍스트 삽입
  escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
  }

  // 🎯 성능 개선된 필터링
  updateVoiceFilter() {
    const search = this.elements.voiceSearch ? this.elements.voiceSearch.value.trim().toLowerCase() : '';
    const filters = {
      locale: this.getCheckedValues('groupLocale'),
      accent: this.getCheckedValues('groupAccent'),
      gender: this.getCheckedValues('groupGender'),
      style: this.getCheckedValues('groupStyle'),
      age: this.getCheckedValues('groupAge')
    };

    // 검색어가 있을 때만 검색 인덱스 사용
    const filtered = search 
      ? this.allVoices.filter(v => this.matchesSearch(v, search))
      : this.allVoices;

    // 필터 적용
    const result = filtered.filter(v => this.matchesFilters(v, filters));
    
    this.renderVoiceCards(result);
    this.renderActiveFilters();
  }

  matchesSearch(voice, search) {
    const searchableFields = [
      voice.displayName, voice.description, voice.accent,
      voice.displayLanguage, voice.locale, ...(Array.isArray(voice.availableStyles) ? voice.availableStyles : [])
    ];
    return searchableFields.some(field => 
      field && field.toLowerCase().includes(search)
    );
  }

  matchesFilters(voice, filters) {
    // availableStyles 안전하게 처리
    const availableStyles = Array.isArray(voice.availableStyles) ? voice.availableStyles : [];
    
    return (
      (filters.locale.length === 0 || filters.locale.includes(voice.locale)) &&
      (filters.accent.length === 0 || filters.accent.includes(voice.accent || '')) &&
      (filters.gender.length === 0 || filters.gender.includes(voice.gender)) &&
      (filters.style.length === 0 || availableStyles.some(s => filters.style.includes(s))) &&
      (filters.age.length === 0 || filters.age.includes(voice.description || ''))
    );
  }

  getCheckedValues(containerId) {
    const container = document.getElementById(`${containerId}-list`);
    if (!container) {
      console.warn(`Container not found: #${containerId}-list`);
      return [];
    }
    
    return Array.from(container.querySelectorAll('input[type="checkbox"]:checked'))
      .map(cb => cb.value);
  }

  renderCheckboxGroup(containerId, values) {
    const container = document.querySelector(`#${containerId}-list`);
    if (!container) {
      console.warn(`Container not found: #${containerId}-list`);
      return;
    }

    console.log(`🎯 Rendering ${containerId} with ${values.length} values:`, values);
    container.innerHTML = '';
    
    if (values.length === 0) {
      console.warn(`⚠️ No values for ${containerId}`);
      return;
    }
    
    values.forEach(value => {
      const id = `${containerId}_${value.replace(/\s+/g, '_')}`;
      const label = document.createElement('label');
      label.htmlFor = id;
      
      // 🔒 XSS 방지
      const escapedValue = this.escapeHtml(value);
      label.innerHTML = `<input type="checkbox" value="${escapedValue}" id="${id}"> ${escapedValue}`;
      
      container.appendChild(label);
    });
    
    console.log(`✅ Rendered ${values.length} options for ${containerId}`);
  }

    renderVoiceCards(voices) {
    if (!this.elements.voiceResults) {
      console.error('❌ voiceResults element not found');
      return;
    }
    
    console.log(`🎭 Rendering ${voices.length} voice cards`);
    this.elements.voiceResults.innerHTML = '';
    const template = document.getElementById('voiceCardTemplate');
    
    if (!template) {
      console.error('❌ Voice card template not found');
      return;
    }

    voices.forEach((voice, index) => {
      const card = template.content.cloneNode(true);

      // 🔒 XSS 방지
      const displayNameEl = card.querySelector('.displayName');
      const voiceIdEl = card.querySelector('.voice-id');
      const displayLanguageEl = card.querySelector('.displayLanguage');
      const genderAccentEl = card.querySelector('.genderAccent');
      const descriptionEl = card.querySelector('.description');
      
      if (displayNameEl) displayNameEl.textContent = voice.displayName || '';
      if (voiceIdEl) voiceIdEl.textContent = voice.voiceId || '';
      if (displayLanguageEl) displayLanguageEl.textContent = 
        `${voice.displayLanguage || ''} (${voice.locale || ''})`;
      if (genderAccentEl) genderAccentEl.textContent = 
        `${voice.gender || ''}${voice.accent ? ' / ' + voice.accent : ''}`;
      if (descriptionEl) descriptionEl.textContent = voice.description || '';

      const badgeContainer = card.querySelector('.style-badges');
      if (badgeContainer && Array.isArray(voice.availableStyles)) {
        voice.availableStyles.forEach(style => {
          const badge = document.createElement('span');
          badge.className = 'badge';
          badge.textContent = style;
          badgeContainer.appendChild(badge);
        });
      }

      // 🧹 메모리 누수 방지: 이벤트 리스너 정리
      const selectBtn = card.querySelector('.selectVoiceBtn');
      if (selectBtn) {
        selectBtn.addEventListener('click', () => this.selectVoice(voice));
      }

      this.elements.voiceResults.appendChild(card);
    });
    
    console.log(`✅ Rendered ${voices.length} voice cards`);
  }

  selectVoice(voice) {
    this.selectedVoice = voice;
    if (this.elements.selectedVoiceInfo) {
      this.elements.selectedVoiceInfo.textContent = 
        `🎤 ${voice.displayName} - ${voice.displayLanguage} (${voice.gender})`;
    }
    this.closeVoicePicker();
  }

  renderActiveFilters() {
    if (!this.elements.activeFilters) return;
    
    const filterMap = {
      groupLocale: { label: 'Locale', values: this.getCheckedValues('groupLocale') },
      groupAccent: { label: 'Accent', values: this.getCheckedValues('groupAccent') },
      groupGender: { label: 'Gender', values: this.getCheckedValues('groupGender') },
      groupStyle: { label: 'Style', values: this.getCheckedValues('groupStyle') },
      groupAge: { label: 'Age', values: this.getCheckedValues('groupAge') }
    };

    this.elements.activeFilters.innerHTML = '';
    let hasAny = false;

    for (const [groupId, { label, values }] of Object.entries(filterMap)) {
      if (values.length === 0) continue;
      hasAny = true;

      const groupDiv = document.createElement('div');
      groupDiv.className = 'filter-group-summary';

      const title = document.createElement('div');
      title.className = 'filter-chip-group-title';
      title.textContent = `[${label}]`;
      groupDiv.appendChild(title);

      values.forEach(value => {
        const chip = document.createElement('span');
        chip.className = 'filter-chip';
        
        // 🔒 XSS 방지
        const escapedValue = this.escapeHtml(value);
        chip.innerHTML = `${escapedValue} <button class="remove-chip" data-group="${groupId}" data-value="${escapedValue}">X</button>`;
        
        groupDiv.appendChild(chip);
      });

      this.elements.activeFilters.appendChild(groupDiv);
    }

    if (!hasAny) {
      this.elements.activeFilters.textContent = 'No filters applied.';
    }
  }

  clearAllFilters() {
    document.querySelectorAll('.checkbox-list input[type=checkbox]').forEach(cb => cb.checked = false);
    if (this.elements.voiceSearch) {
      this.elements.voiceSearch.value = '';
    }
    this.updateVoiceFilter();
  }

    async fetchVoices() {
    try {
      console.log('🔍 Fetching voices from /voices...');
      const response = await fetch('/voices');
      console.log('📡 Response status:', response.status);
      
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }
      
      this.allVoices = await response.json();
      console.log('🎤 Loaded voices:', this.allVoices.length);
      console.log('📋 First voice sample:', this.allVoices[0]);
      
      const extractUniqueSorted = (arr) => [...new Set(arr.filter(Boolean))].sort();

      const locales = extractUniqueSorted(this.allVoices.map(v => v.locale));
      const accents = extractUniqueSorted(this.allVoices.map(v => v.accent));
      const genders = extractUniqueSorted(this.allVoices.map(v => v.gender));
      const styles = extractUniqueSorted(this.allVoices.flatMap(v => Array.isArray(v.availableStyles) ? v.availableStyles : []));
      const ages = extractUniqueSorted(this.allVoices.map(v => v.description));

      console.log('🏷️ Filter options:', { locales, accents, genders, styles, ages });

      this.renderCheckboxGroup('groupLocale', locales);
      this.renderCheckboxGroup('groupAccent', accents);
      this.renderCheckboxGroup('groupGender', genders);
      this.renderCheckboxGroup('groupStyle', styles);
      this.renderCheckboxGroup('groupAge', ages);

      this.renderVoiceCards(this.allVoices);
      this.renderActiveFilters();
    } catch (error) {
      console.error('❌ Failed to load voices:', error);
      this.showError('음성 목록을 불러오는 데 실패했습니다.');
    }
  }

  async fetchSettingsFromGemini(text, promptText) {
    if (!this.selectedVoice) {
      throw new Error('음성이 선택되지 않았습니다.');
    }

    const geminiPrompt = `System: You are an expert assistant that generates voice synthesis parameters for the Murf.ai API.
    Your task is to convert a user prompt into a natural-sounding speech configuration in JSON format, using valid Murf-compatible parameters.
    
    Guidelines:
    - Insert natural-sounding pauses using [pause Xs] format (e.g., [pause 0.5s]) only when it improves clarity, emphasis, or rhythm.
    - Use pitch and rate in the range 0.5 to 2.0 (default: 1.0).
    - Use variation in the range 0.0 to 1.0 (default: 0.0).
    - Use audioDuration and pronunciationDictionary only if needed.
    - Allowed styles: ${JSON.stringify(this.selectedVoice.availableStyles)}
    
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
    
    try {
      const response = await fetch('/gemini', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ prompt: geminiPrompt })
    });

    if (!response.ok) {
      const error = await response.json();
        throw new Error(error.detail || error.error || 'Gemini 오류');
    }

    return await response.json();
    } catch (error) {
      console.error('Gemini API error:', error);
      throw new Error(`Gemini 설정 생성 실패: ${error.message}`);
    }
  }

  async convertTextToSpeech(payload) {
    try {
      const response = await fetch('/tts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ settings: payload })
    });

    if (!response.ok) {
      const error = await response.json();
        throw new Error(error.detail || error.error || 'TTS 오류');
    }

    return await response.json();
    } catch (error) {
      console.error('TTS API error:', error);
      throw new Error(`음성 변환 실패: ${error.message}`);
    }
  }

  async handleConvert() {
    const prompt = this.elements.prompt ? this.elements.prompt.value.trim() : '';
    const text = this.elements.text ? this.elements.text.value.trim() : '';
    const format = this.elements.output_format ? this.elements.output_format.value : '';

    if (!prompt || !text || !this.selectedVoice || !format) {
      this.showError('텍스트, 프롬프트, 포맷을 입력하고 음성을 선택해주세요.');
      return;
    }

    // UI 상태 업데이트
    if (this.elements.downloadBtn) {
      this.elements.downloadBtn.style.display = 'none';
    }
    if (this.elements.playBtn) {
      this.elements.playBtn.innerHTML = '<i class="fas fa-play"></i>';
    }
    if (this.elements.convertBtn) {
      this.elements.convertBtn.disabled = true;
      this.elements.convertBtn.innerHTML = '<span class="loading-spinner"></span> 변환 중...';
    }

    try {
      const geminiSettings = await this.fetchSettingsFromGemini(text, prompt);
      const finalPayload = {
        voiceId: this.selectedVoice.voiceId,
        multiNativeLocale: this.selectedVoice.locale,
        format: format,
        sampleRate: (format === 'ALAW' || format === 'ULAW') ? 8000 : 44100,
        ...geminiSettings
      };

      const result = await this.convertTextToSpeech(finalPayload);
      const audioUrl = result.audioFile ?? result.audioUrl ?? result.audio_url;

      if (!audioUrl) {
        throw new Error('오디오 URL이 응답에 없습니다.');
      }

      this.setupPlayerInteractions(audioUrl);
    } catch (error) {
      console.error('❌ Error:', error);
      this.showError(`변환 실패: ${error.message}`);
    } finally {
      if (this.elements.convertBtn) {
        this.elements.convertBtn.disabled = false;
        this.elements.convertBtn.innerHTML = '🎙️ Convert to Voice';
      }
    }
  }

  setupPlayerInteractions(audioUrl) {
    if (this.elements.audioPlayer) {
      this.elements.audioPlayer.src = audioUrl;
      this.elements.audioPlayer.load();
      this.elements.audioPlayer.style.display = 'block';
    }
    if (this.elements.downloadBtn) {
      this.elements.downloadBtn.href = audioUrl;
      this.elements.downloadBtn.setAttribute('download', 'murf_output.mp3');
      this.elements.downloadBtn.style.display = 'inline-block';
    }

    const customPlayer = document.getElementById('customPlayer');
    if (customPlayer) {
      customPlayer.style.display = 'block';
    }
  }

  setupAudioPlayerControls() {
    const audioPlayer = this.elements.audioPlayer;
    const progressBar = this.elements.progressBar;
    const playBtn = this.elements.playBtn;
    const timeDisplay = this.elements.timeDisplay;
    const volumeSlider = this.elements.volumeSlider;
    const volumeIcon = this.elements.volumeIcon;

    if (!audioPlayer || !progressBar || !playBtn || !timeDisplay || !volumeSlider || !volumeIcon) {
      return;
    }

    // Progress bar events
    progressBar.addEventListener('input', () => {
      audioPlayer.currentTime = progressBar.value;
      this.updateProgressBar();
    });

    // Play button
    playBtn.addEventListener('click', () => {
    if (audioPlayer.paused) {
      audioPlayer.play();
        playBtn.innerHTML = '<i class="fas fa-pause"></i>';
    } else {
      audioPlayer.pause();
        playBtn.innerHTML = '<i class="fas fa-play"></i>';
      }
    });

    // Audio events
    audioPlayer.addEventListener('loadedmetadata', () => {
      progressBar.max = audioPlayer.duration;
      progressBar.step = 0.01;
      timeDisplay.textContent = `0:00 / ${this.formatTime(audioPlayer.duration)}`;
      this.updateProgressBar();
    });

    audioPlayer.addEventListener('timeupdate', () => this.updateProgressBar());
    audioPlayer.addEventListener('ended', () => {
      progressBar.value = audioPlayer.duration;
      timeDisplay.textContent = `${this.formatTime(audioPlayer.duration)} / ${this.formatTime(audioPlayer.duration)}`;
      playBtn.innerHTML = '<i class="fas fa-play"></i>';
    });

    audioPlayer.addEventListener('pause', () => {
      playBtn.innerHTML = '<i class="fas fa-play"></i>';
    });

    // Volume controls
    volumeSlider.addEventListener('input', () => {
    audioPlayer.volume = volumeSlider.value;
      this.updateVolumeIcon();
  });

    volumeIcon.addEventListener('click', () => {
    if (audioPlayer.muted) {
      audioPlayer.muted = false;
      volumeSlider.value = audioPlayer.volume;
    } else {
      audioPlayer.muted = true;
      volumeSlider.value = 0;
    }
      this.updateVolumeIcon();
    });

    audioPlayer.addEventListener('volumechange', () => {
      if (!audioPlayer.muted) {
        volumeSlider.value = audioPlayer.volume;
      }
      this.updateVolumeIcon();
    });

    // Initialize volume
    audioPlayer.volume = 1;
    this.updateVolumeIcon();
  }

  updateProgressBar() {
    const audioPlayer = this.elements.audioPlayer;
    const progressBar = this.elements.progressBar;
    const timeDisplay = this.elements.timeDisplay;

    if (!audioPlayer || !progressBar || !timeDisplay || !audioPlayer.duration || isNaN(audioPlayer.duration)) return;

    const percent = (audioPlayer.currentTime / audioPlayer.duration) * 100;
    progressBar.value = audioPlayer.currentTime;
    progressBar.style.setProperty('--progress', `${percent}%`);
    timeDisplay.textContent = `${this.formatTime(audioPlayer.currentTime)} / ${this.formatTime(audioPlayer.duration)}`;
  }

  updateVolumeIcon() {
    const audioPlayer = this.elements.audioPlayer;
    const volumeIcon = this.elements.volumeIcon;

    if (!audioPlayer || !volumeIcon) return;

    if (audioPlayer.muted || audioPlayer.volume == 0) {
      volumeIcon.innerHTML = '<i class="fas fa-volume-mute"></i>';
    } else if (audioPlayer.volume < 0.5) {
      volumeIcon.innerHTML = '<i class="fas fa-volume-down"></i>';
    } else {
      volumeIcon.innerHTML = '<i class="fas fa-volume-up"></i>';
    }
  }

  formatTime(seconds) {
    if (!seconds || isNaN(seconds)) return '0:00';
    
    const min = Math.floor(seconds / 60);
    const sec = Math.floor(seconds % 60).toString().padStart(2, '0');
    return `${min}:${sec}`;
  }

  setupFilterGroups() {
    document.querySelectorAll('.filter-group .filter-toggle').forEach(btn => {
      btn.addEventListener('click', (e) => {
        const group = btn.closest('.filter-group');
        const isOpen = group.classList.contains('open');

        // 모든 필터 그룹 닫기
        document.querySelectorAll('.filter-group').forEach(g => {
          g.classList.remove('open');
          const toggle = g.querySelector('.filter-toggle');
          if (toggle) {
            toggle.setAttribute('aria-expanded', 'false');
          }
        });

        // 클릭된 그룹 열기
        if (!isOpen) {
          group.classList.add('open');
          btn.setAttribute('aria-expanded', 'true');
        }

        e.stopPropagation();
      });
    });

    document.addEventListener('click', (e) => {
      const isInsideFilterGroup = e.target.closest('.filter-group');
      if (!isInsideFilterGroup) {
        document.querySelectorAll('.filter-group').forEach(g => {
          g.classList.remove('open');
          const toggle = g.querySelector('.filter-toggle');
          if (toggle) {
            toggle.setAttribute('aria-expanded', 'false');
          }
        });
      }
    });

    // Filter chip removal
    if (this.elements.activeFilters) {
      this.elements.activeFilters.addEventListener('click', (e) => {
        const btn = e.target.closest('.remove-chip');
        if (!btn) return;
        
        const group = btn.dataset.group;
        const value = btn.dataset.value;
        const checkboxes = document.querySelectorAll(`#${group}-list input[type="checkbox"]`);
        
        checkboxes.forEach(cb => {
          if (cb.value === value) cb.checked = false;
        });

        this.updateVoiceFilter();
      });
    }

    // Filter change events
    ['groupLocale', 'groupAccent', 'groupGender', 'groupStyle', 'groupAge'].forEach(id => {
      const element = document.getElementById(`${id}-list`);
      if (element) {
        element.addEventListener('change', () => this.updateVoiceFilter());
      }
    });
  }

  setupModalInteractions() {
    // Modal close on outside click
    window.addEventListener('click', (e) => {
      const modal = this.elements.voicePickerPanel;
      if (!modal) return;
      
      const modalContent = modal.querySelector('.modal-content');

      const clickedInsideModal = modalContent.contains(e.target);
      const isRemoveChip = e.target.closest('.remove-chip');

      if (
        !modal.classList.contains('hidden') &&
        !clickedInsideModal &&
        !isRemoveChip &&
        e.target.id !== 'openVoicePickerBtn'
      ) {
        this.closeVoicePicker();
      }
    });

    // Escape key to close modal
    window.addEventListener('keydown', (e) => {
      if (e.key === 'Escape') {
        this.closeVoicePicker();
      }
    });
  }

  setupOutputFormatSelector() {
  const btn = document.getElementById('outputFormatBtn');
  const list = document.getElementById('outputFormatList');
    const hiddenInput = this.elements.output_format;

    if (!btn || !list || !hiddenInput) return;

    btn.addEventListener('click', (e) => {
      e.stopPropagation();
      
      if (list.style.display === 'block') {
        list.style.display = 'none';
        list.classList.remove('dropup');
        list.style.width = '';
      } else {
        const btnRect = btn.getBoundingClientRect();
        const listHeight = 280;
        const spaceBelow = window.innerHeight - btnRect.bottom;
        const spaceAbove = btnRect.top;
        
        if (spaceBelow < listHeight && spaceAbove > listHeight) {
          list.classList.add('dropup');
        } else {
          list.classList.remove('dropup');
        }
        
        list.style.display = 'block';
        const options = list.querySelectorAll('.select-option');
        let maxWidth = 0;
        
        options.forEach(option => {
          const optionWidth = option.scrollWidth;
          maxWidth = Math.max(maxWidth, optionWidth);
        });
        
        const totalWidth = maxWidth + 32;
        const minWidth = 120;
        const maxWidthLimit = 300;
        
        list.style.width = Math.max(minWidth, Math.min(totalWidth, maxWidthLimit)) + 'px';
      }
    });

    document.querySelectorAll('.select-option').forEach(option => {
      option.addEventListener('click', () => {
        document.querySelectorAll('.select-option').forEach(o => o.classList.remove('selected'));
        option.classList.add('selected');
        btn.querySelector('.filter-label').textContent = option.textContent;
        hiddenInput.value = option.dataset.value;
        list.style.display = 'none';
        list.classList.remove('dropup');
        list.style.width = '';
      });
    });

    document.addEventListener('click', () => {
      list.style.display = 'none';
      list.classList.remove('dropup');
      list.style.width = '';
    });

    // Set default selected
    document.querySelectorAll('.select-option').forEach(option => {
      if (option.dataset.value === hiddenInput.value) {
        option.classList.add('selected');
      }
    });
  }
  
  openVoicePicker() {
    if (this.elements.voicePickerPanel) {
      this.elements.voicePickerPanel.classList.remove('hidden');
      // 모달이 열릴 때 음성 목록이 로드되었는지 확인
      if (this.allVoices.length === 0) {
        this.fetchVoices();
      }
      // aria-expanded 속성 업데이트
      if (this.elements.openVoicePickerBtn) {
        this.elements.openVoicePickerBtn.setAttribute('aria-expanded', 'true');
      }
      setTimeout(() => {
        const searchInput = this.elements.voiceSearch;
        if (searchInput && searchInput.offsetParent !== null) {
          searchInput.focus();
        }
      }, 50);
    }
  }

  closeVoicePicker() {
    if (this.elements.voicePickerPanel) {
      this.elements.voicePickerPanel.classList.add('hidden');
      // aria-expanded 속성 업데이트
      if (this.elements.openVoicePickerBtn) {
        this.elements.openVoicePickerBtn.setAttribute('aria-expanded', 'false');
      }
    }
  }

  showError(message) {
    alert(message); // 향후 더 나은 에러 UI로 교체 가능
  }
}

// 🚀 PromptOne 애플리케이션 시작
document.addEventListener('DOMContentLoaded', () => {
  new PromptOneVoiceGenerator();
});
