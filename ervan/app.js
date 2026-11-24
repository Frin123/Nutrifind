/**
 * ============================================================================
 * NUTRISCAN AI - LOGIKA APLIKASI UTAMA
 * ============================================================================
 */

// Mengambil API Key secara aman dari file config.js (yang diabaikan oleh .gitignore)
const apiKey = (window.APP_CONFIG && window.APP_CONFIG.GEMINI_API_KEY) || "";
const GEMINI_MODEL = "gemini-3-flash-preview";
const GEMINI_ENDPOINT = `https://generativelanguage.googleapis.com/v1beta/models/${GEMINI_MODEL}:generateContent?key=${apiKey}`;

// Kunci Penyimpanan LocalStorage
const STORAGE_KEYS = {
  TARGET_CALORIES: "nutriscan_target_calories_v1",
  DAILY_LOG: "nutriscan_daily_log_v1",
  LOG_DATE: "nutriscan_log_date_v1",
};

// State Aplikasi
let state = {
  targetCalories: 2000,
  dailyLog: [],
  currentAnalysis: null,
  currentImageFull: null,
  currentImageThumb: null,
  cameraStream: null,
  isScanning: false,
};

// Data Fallback Realistis untuk Contoh Cepat (dan saat offline / API key belum diisi)
const PRESET_FALLBACK_DATA = {
  nasi_goreng: {
    nama_makanan: "Nasi Goreng Spesial Telur & Udang",
    estimasi_porsi: "1 piring (±350g)",
    kalori: 580,
    protein: 22,
    karbohidrat: 68,
    lemak: 24,
    serat: 4,
    skor_kesehatan: 6,
    kategori_kesehatan: "Tinggi Kalori",
    bahan_terdeteksi: ["Nasi Putih", "Telur Mata Sapi", "Udang", "Kecap Manis", "Mentimun", "Tomat", "Kerupuk"],
    saran_nutrisi: "Kaya energi dan protein. Kurangi kerupuk serta tambahkan porsi sayur segar untuk menyeimbangkan kadar lemak dan serat.",
  },
  salad_ayam: {
    nama_makanan: "Salad Dada Ayam Panggang & Alpukat",
    estimasi_porsi: "1 mangkuk besar (±300g)",
    kalori: 340,
    protein: 34,
    karbohidrat: 16,
    lemak: 15,
    serat: 8,
    skor_kesehatan: 9,
    kategori_kesehatan: "Tinggi Protein & Seimbang",
    bahan_terdeteksi: ["Dada Ayam Panggang", "Selada Romaine", "Alpukat", "Tomat Ceri", "Mentimun", "Minyak Zaitun"],
    saran_nutrisi: "Pilihan sangat bergizi dengan protein tinggi dan lemak sehat dari alpukat. Cocok untuk menjaga massa otot dan rasa kenyang lebih lama.",
  },
  kopi_susu: {
    nama_makanan: "Es Kopi Susu Gula Aren",
    estimasi_porsi: "1 gelas reguler (±250ml)",
    kalori: 210,
    protein: 5,
    karbohidrat: 31,
    lemak: 7,
    serat: 0,
    skor_kesehatan: 5,
    kategori_kesehatan: "Tinggi Gula",
    bahan_terdeteksi: ["Espresso", "Susu Segar Full Cream", "Gula Aren Cair", "Es Batu"],
    saran_nutrisi: "Memberi dorongan energi cepat, namun cukup tinggi gula sederhana. Pertimbangkan opsi 'less sugar' bila dikonsumsi setiap hari.",
  },
};

// Referensi Elemen DOM
const el = {
  toastContainer: document.getElementById("toast-container"),
  // Header & Modal Target
  headerCalorieSummary: document.getElementById("header-calorie-summary"),
  headerCalorieBar: document.getElementById("header-calorie-bar"),
  openTargetModalBtn: document.getElementById("open-target-modal-btn"),
  editTargetSecondaryBtn: document.getElementById("edit-target-secondary-btn"),
  targetModal: document.getElementById("target-modal"),
  closeTargetModal: document.getElementById("close-target-modal"),
  cancelTargetBtn: document.getElementById("cancel-target-btn"),
  targetForm: document.getElementById("target-form"),
  targetCalorieInput: document.getElementById("target-calorie-input"),
  // Modal Reset
  openResetModalBtn: document.getElementById("open-reset-modal-btn"),
  resetModal: document.getElementById("reset-modal"),
  cancelResetBtn: document.getElementById("cancel-reset-btn"),
  confirmResetBtn: document.getElementById("confirm-reset-btn"),
  // Scanner
  scannerViewport: document.getElementById("scanner-viewport"),
  dropzoneView: document.getElementById("dropzone-view"),
  fileInput: document.getElementById("file-input"),
  cameraView: document.getElementById("camera-view"),
  cameraVideo: document.getElementById("camera-video"),
  openCameraBtn: document.getElementById("open-camera-btn"),
  closeCameraBtn: document.getElementById("close-camera-btn"),
  capturePhotoBtn: document.getElementById("capture-photo-btn"),
  triggerUploadBtn: document.getElementById("trigger-upload-btn"),
  resetScannerBtn: document.getElementById("reset-scanner-btn"),
  previewView: document.getElementById("preview-view"),
  previewImage: document.getElementById("preview-image"),
  scanningOverlay: document.getElementById("scanning-overlay"),
  scanningStatusText: document.getElementById("scanning-status-text"),
  cameraErrorBox: document.getElementById("camera-error-box"),
  cameraErrorMessage: document.getElementById("camera-error-message"),
  // Hasil Analisis
  resultEmptyState: document.getElementById("result-empty-state"),
  resultContent: document.getElementById("result-content"),
  resultThumb: document.getElementById("result-thumb"),
  resultHealthBadge: document.getElementById("result-health-badge"),
  resultFallbackTag: document.getElementById("result-fallback-tag"),
  resultFoodName: document.getElementById("result-food-name"),
  resultPortion: document.getElementById("result-portion"),
  resultCalories: document.getElementById("result-calories"),
  resultCaloriePercent: document.getElementById("result-calorie-percent"),
  resultProtein: document.getElementById("result-protein"),
  resultCarbs: document.getElementById("result-carbs"),
  resultFat: document.getElementById("result-fat"),
  resultFiber: document.getElementById("result-fiber"),
  barProtein: document.getElementById("bar-protein"),
  barCarbs: document.getElementById("bar-carbs"),
  barFat: document.getElementById("bar-fat"),
  barFiber: document.getElementById("bar-fiber"),
  resultIngredients: document.getElementById("result-ingredients"),
  resultAdvice: document.getElementById("result-advice"),
  addToLogBtn: document.getElementById("add-to-log-btn"),
  // Catatan Harian
  todayDateBadge: document.getElementById("today-date-badge"),
  dailyTotalCalories: document.getElementById("daily-total-calories"),
  dailyTargetCalories: document.getElementById("daily-target-calories"),
  dailyRemainingText: document.getElementById("daily-remaining-text"),
  dailyProgressBar: document.getElementById("daily-progress-bar"),
  dailyTotalProtein: document.getElementById("daily-total-protein"),
  dailyTotalCarbs: document.getElementById("daily-total-carbs"),
  dailyTotalFat: document.getElementById("daily-total-fat"),
  dailyTotalFiber: document.getElementById("daily-total-fiber"),
  dailyLogList: document.getElementById("daily-log-list"),
  helperCanvas: document.getElementById("helper-canvas"),
};

/**
 * ============================================================================
 * UTILITAS UMUM & TOAST NOTIFICATION
 * ============================================================================
 */

function formatNumber(num) {
  return Math.round(num).toLocaleString("id-ID");
}

function getTodayDateString() {
  const now = new Date();
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-${String(now.getDate()).padStart(2, "0")}`;
}

function formatIndonesianDate() {
  return new Intl.DateTimeFormat("id-ID", {
    weekday: "long",
    day: "numeric",
    month: "short",
    year: "numeric",
  }).format(new Date());
}

function showToast(message, type = "success") {
  const toast = document.createElement("div");
  const styles = {
    success: "bg-slate-900 text-white border-emerald-500/40",
    warning: "bg-orange-950 text-orange-50 border-orange-500/40",
    info: "bg-slate-800 text-white border-slate-600",
  };
  const iconColor = type === "warning" ? "text-orange-400" : "text-emerald-400";

  toast.className = `pointer-events-auto flex items-center gap-3 px-4 py-3 rounded-2xl shadow-xl border text-xs sm:text-sm font-medium animate-fade-in ${styles[type] || styles.success}`;
  toast.innerHTML = `
    <svg class="w-5 h-5 ${iconColor} shrink-0" fill="none" stroke="currentColor" stroke-width="2.2" viewBox="0 0 24 24">
      <path stroke-linecap="round" stroke-linejoin="round" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
    </svg>
    <span class="flex-1">${message}</span>
  `;
  el.toastContainer.appendChild(toast);

  setTimeout(() => {
    toast.style.opacity = "0";
    toast.style.transform = "translateY(6px)";
    toast.style.transition = "all 0.25s ease";
    setTimeout(() => toast.remove(), 260);
  }, 3200);
}

/**
 * ============================================================================
 * PENYIMPANAN LOCALSTORAGE & SINKRONISASI HARIAN
 * ============================================================================
 */

function loadStateFromStorage() {
  try {
    const savedTarget = localStorage.getItem(STORAGE_KEYS.TARGET_CALORIES);
    if (savedTarget && !isNaN(Number(savedTarget))) {
      state.targetCalories = Math.max(800, Math.min(6000, Number(savedTarget)));
    }

    const todayStr = getTodayDateString();
    const savedDate = localStorage.getItem(STORAGE_KEYS.LOG_DATE);

    if (savedDate === todayStr) {
      const savedLog = localStorage.getItem(STORAGE_KEYS.DAILY_LOG);
      if (savedLog) {
        state.dailyLog = JSON.parse(savedLog);
      }
    } else {
      state.dailyLog = [];
      localStorage.setItem(STORAGE_KEYS.LOG_DATE, todayStr);
      localStorage.setItem(STORAGE_KEYS.DAILY_LOG, JSON.stringify([]));
    }
  } catch (err) {
    state.dailyLog = [];
  }
}

function saveStateToStorage() {
  try {
    localStorage.setItem(STORAGE_KEYS.TARGET_CALORIES, String(state.targetCalories));
    localStorage.setItem(STORAGE_KEYS.LOG_DATE, getTodayDateString());
    localStorage.setItem(STORAGE_KEYS.DAILY_LOG, JSON.stringify(state.dailyLog));
  } catch (err) {
    showToast("Penyimpanan browser penuh, beberapa riwayat lama tidak tersimpan.", "warning");
  }
}

/**
 * ============================================================================
 * PEMROSESAN GAMBAR & ILUSTRASI CONTOH CEPAT PADA CANVAS
 * ============================================================================
 */

function processImageSource(sourceElementOrDataUrl) {
  return new Promise((resolve, reject) => {
    const processImg = (img) => {
      const canvas = el.helperCanvas;
      const ctx = canvas.getContext("2d");

      // 1. Ukuran optimal untuk analisis AI (maks 768px)
      const maxDim = 768;
      let w = img.width || img.videoWidth;
      let h = img.height || img.videoHeight;
      if (w > maxDim || h > maxDim) {
        if (w > h) {
          h = Math.round((h * maxDim) / w);
          w = maxDim;
        } else {
          w = Math.round((w * maxDim) / h);
          h = maxDim;
        }
      }
      canvas.width = w;
      canvas.height = h;
      ctx.clearRect(0, 0, w, h);
      ctx.drawImage(img, 0, 0, w, h);
      const fullDataUrl = canvas.toDataURL("image/jpeg", 0.85);

      // 2. Thumbnail kecil (96x96) agar hemat kuota localStorage
      const thumbSize = 96;
      canvas.width = thumbSize;
      canvas.height = thumbSize;
      const minSide = Math.min(img.width || img.videoWidth, img.height || img.videoHeight);
      const sx = ((img.width || img.videoWidth) - minSide) / 2;
      const sy = ((img.height || img.videoHeight) - minSide) / 2;
      ctx.drawImage(img, sx, sy, minSide, minSide, 0, 0, thumbSize, thumbSize);
      const thumbDataUrl = canvas.toDataURL("image/jpeg", 0.7);

      resolve({ fullDataUrl, thumbDataUrl });
    };

    if (typeof sourceElementOrDataUrl === "string") {
      const img = new Image();
      img.onload = () => processImg(img);
      img.onerror = reject;
      img.src = sourceElementOrDataUrl;
    } else {
      processImg(sourceElementOrDataUrl);
    }
  });
}

function generatePresetFoodImage(presetKey) {
  const canvas = el.helperCanvas;
  const ctx = canvas.getContext("2d");
  const W = 640;
  const H = 480;
  canvas.width = W;
  canvas.height = H;

  const bgGrad = ctx.createLinearGradient(0, 0, W, H);
  bgGrad.addColorStop(0, "#fef3c7");
  bgGrad.addColorStop(1, "#e2e8f0");
  ctx.fillStyle = bgGrad;
  ctx.fillRect(0, 0, W, H);

  ctx.strokeStyle = "rgba(148, 163, 184, 0.18)";
  ctx.lineWidth = 2;
  for (let y = 40; y < H; y += 55) {
    ctx.beginPath();
    ctx.moveTo(0, y);
    ctx.lineTo(W, y);
    ctx.stroke();
  }

  if (presetKey === "nasi_goreng") {
    ctx.fillStyle = "rgba(15, 23, 42, 0.14)";
    ctx.beginPath();
    ctx.ellipse(320, 255, 195, 155, 0, 0, Math.PI * 2);
    ctx.fill();

    ctx.fillStyle = "#ffffff";
    ctx.beginPath();
    ctx.ellipse(320, 242, 195, 155, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = "#cbd5e1";
    ctx.lineWidth = 4;
    ctx.stroke();

    ctx.strokeStyle = "#f1f5f9";
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.ellipse(320, 242, 155, 120, 0, 0, Math.PI * 2);
    ctx.stroke();

    ctx.fillStyle = "#b45309";
    ctx.beginPath();
    ctx.ellipse(310, 248, 125, 92, -0.08, 0, Math.PI * 2);
    ctx.fill();

    const riceColors = ["#d97706", "#92400e", "#f59e0b", "#78350f"];
    for (let i = 0; i < 160; i++) {
      const angle = Math.random() * Math.PI * 2;
      const rx = Math.random() * 112;
      const ry = Math.random() * 80;
      const gx = 310 + Math.cos(angle) * rx;
      const gy = 248 + Math.sin(angle) * ry;
      ctx.fillStyle = riceColors[i % riceColors.length];
      ctx.beginPath();
      ctx.ellipse(gx, gy, 5, 2.8, angle, 0, Math.PI * 2);
      ctx.fill();
    }

    for (let i = 0; i < 24; i++) {
      const gx = 235 + Math.random() * 150;
      const gy = 195 + Math.random() * 105;
      ctx.fillStyle = i % 2 === 0 ? "#16a34a" : "#dc2626";
      ctx.beginPath();
      ctx.arc(gx, gy, 4, 0, Math.PI * 2);
      ctx.fill();
    }

    ctx.fillStyle = "#fffbeb";
    ctx.beginPath();
    ctx.ellipse(335, 222, 54, 42, 0.2, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = "#fde68a";
    ctx.lineWidth = 2;
    ctx.stroke();

    ctx.fillStyle = "#f59e0b";
    ctx.beginPath();
    ctx.arc(340, 220, 20, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = "#fef3c7";
    ctx.beginPath();
    ctx.arc(334, 214, 5, 0, Math.PI * 2);
    ctx.fill();

    ctx.strokeStyle = "#ea580c";
    ctx.lineWidth = 11;
    ctx.lineCap = "round";
    ctx.beginPath();
    ctx.arc(255, 250, 18, 0.2, Math.PI * 1.3);
    ctx.stroke();

    ctx.fillStyle = "#22c55e";
    ctx.beginPath();
    ctx.arc(415, 275, 22, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = "#bbf7d0";
    ctx.beginPath();
    ctx.arc(415, 275, 16, 0, Math.PI * 2);
    ctx.fill();

    ctx.fillStyle = "#ef4444";
    ctx.beginPath();
    ctx.arc(390, 305, 20, 0, Math.PI * 2);
    ctx.fill();

    ctx.fillStyle = "#fef9c3";
    ctx.strokeStyle = "#eab308";
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.ellipse(225, 195, 28, 20, -0.4, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();
  } else if (presetKey === "salad_ayam") {
    ctx.fillStyle = "rgba(15, 23, 42, 0.14)";
    ctx.beginPath();
    ctx.arc(320, 252, 168, 0, Math.PI * 2);
    ctx.fill();

    ctx.fillStyle = "#ffffff";
    ctx.beginPath();
    ctx.arc(320, 240, 168, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = "#cbd5e1";
    ctx.lineWidth = 5;
    ctx.stroke();

    const greens = ["#15803d", "#16a34a", "#22c55e", "#4ade80"];
    for (let i = 0; i < 36; i++) {
      const angle = (i / 36) * Math.PI * 2;
      const dist = 45 + (i % 3) * 32;
      const lx = 320 + Math.cos(angle) * dist;
      const ly = 240 + Math.sin(angle) * dist;
      ctx.fillStyle = greens[i % greens.length];
      ctx.beginPath();
      ctx.ellipse(lx, ly, 34, 22, angle, 0, Math.PI * 2);
      ctx.fill();
    }

    for (let i = 0; i < 4; i++) {
      ctx.fillStyle = "#a3e635";
      ctx.strokeStyle = "#3f6212";
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.ellipse(245 + i * 14, 255 + i * 12, 26, 13, -0.5, 0, Math.PI * 2);
      ctx.fill();
      ctx.stroke();
    }

    for (let i = 0; i < 5; i++) {
      const cx = 315 + i * 16;
      const cy = 205 + i * 15;
      ctx.fillStyle = "#f59e0b";
      ctx.beginPath();
      ctx.roundRect(cx - 32, cy - 12, 64, 22, 10);
      ctx.fill();

      ctx.strokeStyle = "#78350f";
      ctx.lineWidth = 2.5;
      ctx.beginPath();
      ctx.moveTo(cx - 14, cy - 9);
      ctx.lineTo(cx - 6, cy + 8);
      ctx.moveTo(cx + 8, cy - 9);
      ctx.lineTo(cx + 16, cy + 8);
      ctx.stroke();
    }

    const tomatoes = [
      [265, 195],
      [385, 255],
      [325, 310],
      [240, 230],
    ];
    tomatoes.forEach(([tx, ty]) => {
      ctx.fillStyle = "#ef4444";
      ctx.beginPath();
      ctx.arc(tx, ty, 14, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = "#fca5a5";
      ctx.beginPath();
      ctx.arc(tx - 4, ty - 4, 4, 0, Math.PI * 2);
      ctx.fill();
    });
  } else if (presetKey === "kopi_susu") {
    ctx.strokeStyle = "#059669";
    ctx.lineWidth = 12;
    ctx.lineCap = "round";
    ctx.beginPath();
    ctx.moveTo(355, 70);
    ctx.lineTo(318, 260);
    ctx.stroke();

    ctx.fillStyle = "rgba(15, 23, 42, 0.14)";
    ctx.beginPath();
    ctx.ellipse(320, 415, 95, 22, 0, 0, Math.PI * 2);
    ctx.fill();

    ctx.save();
    ctx.beginPath();
    ctx.moveTo(235, 140);
    ctx.lineTo(405, 140);
    ctx.lineTo(382, 405);
    ctx.lineTo(258, 405);
    ctx.closePath();
    ctx.clip();

    const milkGrad = ctx.createLinearGradient(0, 140, 0, 405);
    milkGrad.addColorStop(0, "#78350f");
    milkGrad.addColorStop(0.32, "#b45309");
    milkGrad.addColorStop(0.45, "#fef3c7");
    milkGrad.addColorStop(0.82, "#fde68a");
    milkGrad.addColorStop(1, "#451a03");
    ctx.fillStyle = milkGrad;
    ctx.fillRect(230, 140, 180, 270);

    ctx.strokeStyle = "#78350f";
    ctx.lineWidth = 10;
    ctx.beginPath();
    ctx.moveTo(250, 320);
    ctx.quadraticCurveTo(285, 360, 265, 405);
    ctx.moveTo(385, 310);
    ctx.quadraticCurveTo(350, 355, 370, 405);
    ctx.stroke();

    ctx.fillStyle = "rgba(255, 255, 255, 0.45)";
    ctx.strokeStyle = "rgba(255, 255, 255, 0.75)";
    ctx.lineWidth = 2;
    const cubes = [
      [265, 165, 42],
      [322, 160, 44],
      [285, 210, 40],
      [335, 215, 38],
    ];
    cubes.forEach(([x, y, s]) => {
      ctx.beginPath();
      ctx.roundRect(x, y, s, s, 8);
      ctx.fill();
      ctx.stroke();
    });
    ctx.restore();

    ctx.strokeStyle = "rgba(255, 255, 255, 0.85)";
    ctx.lineWidth = 4;
    ctx.beginPath();
    ctx.moveTo(235, 140);
    ctx.lineTo(405, 140);
    ctx.lineTo(382, 405);
    ctx.lineTo(258, 405);
    ctx.closePath();
    ctx.stroke();

    ctx.fillStyle = "rgba(255, 255, 255, 0.45)";
    ctx.beginPath();
    ctx.arc(320, 140, 85, Math.PI, 0);
    ctx.fill();
    ctx.stroke();
  }

  return canvas.toDataURL("image/jpeg", 0.9);
}

/**
 * ============================================================================
 * INTEGRASI GEMINI API (ANALISIS GAMBAR MAKANAN TERSTRUKTUR JSON)
 * ============================================================================
 */

async function fetchWithBackoff(url, options, maxRetries = 3) {
  let delay = 1000;
  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      const response = await fetch(url, options);
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`);
      }
      return await response.json();
    } catch (error) {
      if (attempt === maxRetries) {
        throw error;
      }
      await new Promise((res) => setTimeout(res, delay));
      delay *= 2;
    }
  }
}

async function analyzeFoodImageWithGemini(base64DataUrl, presetKey = null) {
  const parts = base64DataUrl.split(",");
  const mimeMatch = parts[0].match(/:(.*?);/);
  const mimeType = mimeMatch ? mimeMatch[1] : "image/jpeg";
  const base64Data = parts[1];

  const promptText =
    "Analisis gambar makanan atau minuman ini secara akurat sebagai ahli gizi profesional Indonesia. " +
    "Identifikasi nama makanan dalam Bahasa Indonesia, estimasi ukuran porsi, kandungan nutrisi per porsi (kalori dalam kkal, protein, karbohidrat, lemak, serat dalam gram), " +
    "skor kesehatan dari 1 sampai 10 (10 sangat sehat), kategori kesehatan singkat (contoh: 'Seimbang', 'Tinggi Protein', 'Tinggi Kalori', 'Tinggi Gula'), " +
    "daftar bahan utama yang terlihat, serta satu kalimat saran nutrisi singkat dan praktis dalam Bahasa Indonesia.";

  const payload = {
    contents: [
      {
        role: "user",
        parts: [
          { text: promptText },
          {
            inlineData: {
              mimeType: mimeType,
              data: base64Data,
            },
          },
        ],
      },
    ],
    generationConfig: {
      responseMimeType: "application/json",
      responseSchema: {
        type: "OBJECT",
        properties: {
          nama_makanan: { type: "STRING" },
          estimasi_porsi: { type: "STRING" },
          kalori: { type: "NUMBER" },
          protein: { type: "NUMBER" },
          karbohidrat: { type: "NUMBER" },
          lemak: { type: "NUMBER" },
          serat: { type: "NUMBER" },
          skor_kesehatan: { type: "NUMBER" },
          kategori_kesehatan: { type: "STRING" },
          bahan_terdeteksi: {
            type: "ARRAY",
            items: { type: "STRING" },
          },
          saran_nutrisi: { type: "STRING" },
        },
        required: [
          "nama_makanan",
          "estimasi_porsi",
          "kalori",
          "protein",
          "karbohidrat",
          "lemak",
          "serat",
          "skor_kesehatan",
          "kategori_kesehatan",
          "bahan_terdeteksi",
          "saran_nutrisi",
        ],
      },
    },
  };

  try {
    // Jika API Key masih placeholder, langsung arahkan ke fallback agar cepat
    if (!apiKey || apiKey === "MASUKKAN_GEMINI_API_KEY_ANDA_DI_SINI") {
      throw new Error("API Key belum dikonfigurasi di config.js");
    }

    const result = await fetchWithBackoff(GEMINI_ENDPOINT, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });

    const rawText = result?.candidates?.[0]?.content?.parts?.[0]?.text;
    if (!rawText) {
      throw new Error("Respons AI kosong");
    }

    const parsed = JSON.parse(rawText);
    return { data: normalizeNutritionData(parsed), isFallback: false };
  } catch (err) {
    if (presetKey && PRESET_FALLBACK_DATA[presetKey]) {
      return { data: { ...PRESET_FALLBACK_DATA[presetKey] }, isFallback: true };
    }

    return {
      data: {
        nama_makanan: "Hidangan Makanan Terdeteksi",
        estimasi_porsi: "1 porsi sedang (±300g)",
        kalori: 420,
        protein: 18,
        karbohidrat: 52,
        lemak: 15,
        serat: 5,
        skor_kesehatan: 7,
        kategori_kesehatan: "Seimbang",
        bahan_terdeteksi: ["Karbohidrat Utama", "Sumber Protein", "Sayuran Pelengkap"],
        saran_nutrisi: "Mode estimasi aktif (pastikan API Key di config.js sudah diisi untuk analisis AI penuh).",
      },
      isFallback: true,
    };
  }
}

function normalizeNutritionData(raw) {
  return {
    nama_makanan: String(raw.nama_makanan || "Makanan Tidak Dikenal"),
    estimasi_porsi: String(raw.estimasi_porsi || "1 porsi"),
    kalori: Math.max(0, Math.round(Number(raw.kalori) || 0)),
    protein: Math.max(0, Math.round((Number(raw.protein) || 0) * 10) / 10),
    karbohidrat: Math.max(0, Math.round((Number(raw.karbohidrat) || 0) * 10) / 10),
    lemak: Math.max(0, Math.round((Number(raw.lemak) || 0) * 10) / 10),
    serat: Math.max(0, Math.round((Number(raw.serat) || 0) * 10) / 10),
    skor_kesehatan: Math.min(10, Math.max(1, Math.round(Number(raw.skor_kesehatan) || 7))),
    kategori_kesehatan: String(raw.kategori_kesehatan || "Seimbang"),
    bahan_terdeteksi:
      Array.isArray(raw.bahan_terdeteksi) && raw.bahan_terdeteksi.length > 0
        ? raw.bahan_terdeteksi
        : ["Bahan Alami"],
    saran_nutrisi: String(raw.saran_nutrisi || "Konsumsi dalam porsi seimbang sesuai kebutuhan harian Anda."),
  };
}

/**
 * ============================================================================
 * KONTROL ALUR PEMINDAIAN (SCANNING FLOW) & KAMERA
 * ============================================================================
 */

function stopCameraStream() {
  if (state.cameraStream) {
    state.cameraStream.getTracks().forEach((track) => track.stop());
    state.cameraStream = null;
  }
  el.cameraVideo.srcObject = null;
}

function resetScannerToIdle() {
  stopCameraStream();
  state.isScanning = false;
  el.cameraErrorBox.classList.add("hidden");
  el.cameraView.classList.add("hidden");
  el.previewView.classList.add("hidden");
  el.scanningOverlay.classList.add("hidden");
  el.dropzoneView.classList.remove("hidden");
  el.resetScannerBtn.classList.add("hidden");
  el.scannerViewport.classList.add("border-dashed", "border-slate-300");
  el.scannerViewport.classList.remove("border-solid", "border-emerald-500");
  el.fileInput.value = "";
}

async function startLiveCamera() {
  el.cameraErrorBox.classList.add("hidden");

  if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
    el.cameraErrorMessage.textContent =
      "Browser atau perangkat Anda tidak mendukung akses kamera langsung. Silakan unggah foto dari galeri atau coba Contoh Cepat.";
    el.cameraErrorBox.classList.remove("hidden");
    return;
  }

  try {
    stopCameraStream();
    let stream;
    try {
      stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: { ideal: "environment" } },
        audio: false,
      });
    } catch (e) {
      stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: false });
    }

    state.cameraStream = stream;
    el.cameraVideo.srcObject = stream;

    el.dropzoneView.classList.add("hidden");
    el.previewView.classList.add("hidden");
    el.cameraView.classList.remove("hidden");
    el.resetScannerBtn.classList.remove("hidden");
    el.scannerViewport.classList.remove("border-dashed", "border-slate-300");
    el.scannerViewport.classList.add("border-solid", "border-emerald-500");
  } catch (err) {
    let msg = "Izin kamera ditolak atau kamera sedang digunakan aplikasi lain.";
    if (err.name === "NotFoundError" || err.name === "DevicesNotFoundError") {
      msg = "Tidak ada kamera yang terdeteksi pada perangkat Anda.";
    } else if (err.name === "NotAllowedError" || err.name === "PermissionDeniedError") {
      msg = "Akses kamera diblokir oleh izin browser. Izinkan akses kamera atau unggah file gambar sebagai alternatif.";
    }
    el.cameraErrorMessage.textContent = msg;
    el.cameraErrorBox.classList.remove("hidden");
  }
}

async function startScanningProcess(imageSource, presetKey = null) {
  if (state.isScanning) return;
  state.isScanning = true;
  el.cameraErrorBox.classList.add("hidden");

  try {
    const { fullDataUrl, thumbDataUrl } = await processImageSource(imageSource);
    stopCameraStream();

    state.currentImageFull = fullDataUrl;
    state.currentImageThumb = thumbDataUrl;

    el.dropzoneView.classList.add("hidden");
    el.cameraView.classList.add("hidden");
    el.previewView.classList.remove("hidden");
    el.scanningOverlay.classList.remove("hidden");
    el.resetScannerBtn.classList.remove("hidden");
    el.scannerViewport.classList.remove("border-dashed", "border-slate-300");
    el.scannerViewport.classList.add("border-solid", "border-emerald-500");

    el.previewImage.src = fullDataUrl;

    const statuses = [
      "Memindai makanan dengan AI...",
      "Mengidentifikasi komposisi bahan...",
      "Menghitung kalori & makronutrisi...",
    ];
    let step = 0;
    el.scanningStatusText.textContent = statuses[0];
    const statusInterval = setInterval(() => {
      step = (step + 1) % statuses.length;
      el.scanningStatusText.textContent = statuses[step];
    }, 900);

    const { data, isFallback } = await analyzeFoodImageWithGemini(fullDataUrl, presetKey);
    clearInterval(statusInterval);

    state.currentAnalysis = data;
    el.scanningOverlay.classList.add("hidden");
    renderAnalysisResult(data, thumbDataUrl, isFallback);

    if (isFallback && !presetKey) {
      showToast("Menggunakan mode estimasi cepat (cek koneksi atau API Key di config.js).", "warning");
    }
  } catch (err) {
    el.scanningOverlay.classList.add("hidden");
    showToast("Gagal memproses gambar. Silakan coba foto lain.", "warning");
  } finally {
    state.isScanning = false;
  }
}

/**
 * ============================================================================
 * RENDER UI: HASIL ANALISIS & CATATAN HARIAN
 * ============================================================================
 */

function renderAnalysisResult(data, thumbUrl, isFallback = false) {
  el.resultEmptyState.classList.add("hidden");
  el.resultContent.classList.remove("hidden");

  el.resultThumb.src = thumbUrl;
  el.resultFoodName.textContent = data.nama_makanan;
  el.resultPortion.querySelector("span").textContent = data.estimasi_porsi;

  const score = data.skor_kesehatan;
  let badgeClasses = "bg-emerald-100 text-emerald-800 border border-emerald-200";
  if (score <= 4) {
    badgeClasses = "bg-red-100 text-red-800 border border-red-200";
  } else if (score <= 6) {
    badgeClasses = "bg-orange-100 text-orange-800 border border-orange-200";
  }
  el.resultHealthBadge.className = `inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold ${badgeClasses}`;
  el.resultHealthBadge.textContent = `Skor ${score}/10 • ${data.kategori_kesehatan}`;

  if (isFallback) {
    el.resultFallbackTag.classList.remove("hidden");
  } else {
    el.resultFallbackTag.classList.add("hidden");
  }

  el.resultCalories.textContent = formatNumber(data.kalori);
  const pctTarget = Math.round((data.kalori / state.targetCalories) * 100);
  el.resultCaloriePercent.textContent = `${pctTarget}% target harian`;

  el.resultProtein.textContent = `${data.protein} g`;
  el.resultCarbs.textContent = `${data.karbohidrat} g`;
  el.resultFat.textContent = `${data.lemak} g`;
  el.resultFiber.textContent = `${data.serat} g`;

  el.barProtein.style.width = `${Math.min(100, Math.round((data.protein / 60) * 100))}%`;
  el.barCarbs.style.width = `${Math.min(100, Math.round((data.karbohidrat / 250) * 100))}%`;
  el.barFat.style.width = `${Math.min(100, Math.round((data.lemak / 70) * 100))}%`;
  el.barFiber.style.width = `${Math.min(100, Math.round((data.serat / 30) * 100))}%`;

  el.resultIngredients.innerHTML = "";
  data.bahan_terdeteksi.forEach((item) => {
    const chip = document.createElement("span");
    chip.className =
      "inline-flex items-center px-2.5 py-1 rounded-xl text-xs font-medium bg-slate-100 text-slate-700 border border-slate-200/70";
    chip.textContent = item;
    el.resultIngredients.appendChild(chip);
  });

  el.resultAdvice.textContent = data.saran_nutrisi;
  el.addToLogBtn.disabled = false;
  el.addToLogBtn.classList.remove("opacity-60");
}

function renderDailyDashboard() {
  el.todayDateBadge.textContent = formatIndonesianDate();

  const totals = state.dailyLog.reduce(
    (acc, item) => {
      acc.kalori += Number(item.kalori) || 0;
      acc.protein += Number(item.protein) || 0;
      acc.karbohidrat += Number(item.karbohidrat) || 0;
      acc.lemak += Number(item.lemak) || 0;
      acc.serat += Number(item.serat) || 0;
      return acc;
    },
    { kalori: 0, protein: 0, karbohidrat: 0, lemak: 0, serat: 0 }
  );

  const target = state.targetCalories;
  const pct = Math.min(100, Math.round((totals.kalori / target) * 100));
  const isOver = totals.kalori > target;

  el.headerCalorieSummary.textContent = `${formatNumber(totals.kalori)} / ${formatNumber(target)} kkal`;
  el.headerCalorieBar.style.width = `${pct}%`;

  el.dailyTotalCalories.textContent = formatNumber(totals.kalori);
  el.dailyTargetCalories.textContent = formatNumber(target);
  el.dailyProgressBar.style.width = `${pct}%`;

  if (isOver) {
    const excess = totals.kalori - target;
    el.dailyRemainingText.textContent = `Melebihi ${formatNumber(excess)} kkal`;
    el.dailyRemainingText.className =
      "text-xs sm:text-sm font-semibold text-orange-700 bg-orange-100 px-3 py-1 rounded-full";
    el.dailyProgressBar.className =
      "h-full bg-gradient-to-r from-orange-500 to-red-500 rounded-full transition-all duration-500";
  } else {
    const rem = target - totals.kalori;
    el.dailyRemainingText.textContent = `Sisa ${formatNumber(rem)} kkal lagi`;
    el.dailyRemainingText.className =
      "text-xs sm:text-sm font-semibold text-emerald-700 bg-emerald-100/80 px-3 py-1 rounded-full";
    el.dailyProgressBar.className =
      "h-full bg-gradient-to-r from-emerald-500 to-emerald-600 rounded-full transition-all duration-500";
  }

  el.dailyTotalProtein.textContent = `${Math.round(totals.protein)}g`;
  el.dailyTotalCarbs.textContent = `${Math.round(totals.karbohidrat)}g`;
  el.dailyTotalFat.textContent = `${Math.round(totals.lemak)}g`;
  el.dailyTotalFiber.textContent = `${Math.round(totals.serat)}g`;

  el.dailyLogList.innerHTML = "";
  if (state.dailyLog.length === 0) {
    el.dailyLogList.innerHTML = `
      <div class="text-center py-8 px-4 rounded-2xl border border-dashed border-slate-200 bg-slate-50/50">
        <p class="text-sm font-semibold text-slate-600">Belum ada makanan tercatat hari ini</p>
        <p class="text-xs text-slate-400 mt-1">Pindai makanan di atas lalu klik <span class="text-emerald-600 font-medium">"Tambah ke Catatan Harian"</span>.</p>
      </div>
    `;
    return;
  }

  state.dailyLog.forEach((entry) => {
    const row = document.createElement("div");
    row.className =
      "flex items-center justify-between gap-3 p-3.5 rounded-2xl bg-white hover:bg-slate-50/90 border border-slate-200/80 transition animate-fade-in";

    row.innerHTML = `
      <div class="flex items-center gap-3.5 min-w-0">
        <img src="${entry.thumb}" alt="${entry.nama_makanan}" class="w-12 h-12 sm:w-14 sm:h-14 rounded-xl object-cover bg-slate-100 border border-slate-200 shrink-0" />
        <div class="min-w-0">
          <div class="flex items-center gap-2">
            <h4 class="text-sm font-bold text-slate-900 truncate">${entry.nama_makanan}</h4>
            <span class="hidden sm:inline-block text-[11px] font-medium text-slate-400">• ${entry.waktu}</span>
          </div>
          <p class="text-xs text-slate-500 truncate">${entry.estimasi_porsi}</p>
          <div class="flex flex-wrap items-center gap-2 mt-1 text-[11px] font-medium text-slate-500">
            <span class="text-emerald-700">P: ${entry.protein}g</span>
            <span>•</span>
            <span class="text-orange-600">K: ${entry.karbohidrat}g</span>
            <span>•</span>
            <span class="text-amber-600">L: ${entry.lemak}g</span>
          </div>
        </div>
      </div>

      <div class="flex items-center gap-2 sm:gap-3 shrink-0">
        <div class="text-right">
          <span class="text-sm sm:text-base font-extrabold text-slate-900">${formatNumber(entry.kalori)}</span>
          <span class="block text-[10px] font-semibold text-orange-600 uppercase">kkal</span>
        </div>
        <button
          type="button"
          data-delete-id="${entry.id}"
          title="Hapus item ini"
          class="delete-log-btn p-2 rounded-xl text-slate-400 hover:text-red-600 hover:bg-red-50 transition"
        >
          <svg class="w-4 h-4" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
          </svg>
        </button>
      </div>
    `;
    el.dailyLogList.appendChild(row);
  });
}

/**
 * ============================================================================
 * EVENT LISTENERS & INISIALISASI
 * ============================================================================
 */

function initEventListeners() {
  // 1. Upload via Klik Dropzone atau Tombol Upload
  el.dropzoneView.addEventListener("click", () => el.fileInput.click());
  el.triggerUploadBtn.addEventListener("click", () => el.fileInput.click());

  el.fileInput.addEventListener("change", (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith("image/")) {
      showToast("Harap pilih file gambar yang valid (JPG, PNG, WEBP).", "warning");
      return;
    }
    const reader = new FileReader();
    reader.onload = (ev) => startScanningProcess(ev.target.result);
    reader.readAsDataURL(file);
  });

  // 2. Drag and Drop File Gambar
  el.scannerViewport.addEventListener("dragover", (e) => {
    e.preventDefault();
    el.scannerViewport.classList.add("border-emerald-500", "bg-emerald-50/40");
  });

  el.scannerViewport.addEventListener("dragleave", () => {
    el.scannerViewport.classList.remove("border-emerald-500", "bg-emerald-50/40");
  });

  el.scannerViewport.addEventListener("drop", (e) => {
    e.preventDefault();
    el.scannerViewport.classList.remove("border-emerald-500", "bg-emerald-50/40");
    const file = e.dataTransfer?.files?.[0];
    if (!file) return;
    if (!file.type.startsWith("image/")) {
      showToast("File yang dijatuhkan harus berupa gambar.", "warning");
      return;
    }
    const reader = new FileReader();
    reader.onload = (ev) => startScanningProcess(ev.target.result);
    reader.readAsDataURL(file);
  });

  // 3. Kamera Langsung
  el.openCameraBtn.addEventListener("click", startLiveCamera);
  el.closeCameraBtn.addEventListener("click", resetScannerToIdle);
  el.resetScannerBtn.addEventListener("click", resetScannerToIdle);

  el.capturePhotoBtn.addEventListener("click", () => {
    if (!el.cameraVideo.videoWidth) return;
    startScanningProcess(el.cameraVideo);
  });

  // 4. Tombol Coba Contoh Cepat
  document.querySelectorAll(".preset-food-btn").forEach((btn) => {
    btn.addEventListener("click", () => {
      const presetKey = btn.getAttribute("data-preset");
      const generatedImage = generatePresetFoodImage(presetKey);
      startScanningProcess(generatedImage, presetKey);
    });
  });

  // 5. Tambah ke Catatan Harian
  el.addToLogBtn.addEventListener("click", () => {
    if (!state.currentAnalysis) return;

    const now = new Date();
    const timeStr = `${String(now.getHours()).padStart(2, "0")}:${String(now.getMinutes()).padStart(2, "0")}`;

    const newEntry = {
      id: `${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
      waktu: timeStr,
      thumb: state.currentImageThumb,
      ...state.currentAnalysis,
    };

    state.dailyLog.unshift(newEntry);
    saveStateToStorage();
    renderDailyDashboard();

    showToast(`"${newEntry.nama_makanan}" (+${newEntry.kalori} kkal) ditambahkan ke catatan!`);
  });

  // 6. Hapus Item dari Catatan Harian
  el.dailyLogList.addEventListener("click", (e) => {
    const delBtn = e.target.closest(".delete-log-btn");
    if (!delBtn) return;

    const idToDelete = delBtn.getAttribute("data-delete-id");
    state.dailyLog = state.dailyLog.filter((item) => item.id !== idToDelete);
    saveStateToStorage();
    renderDailyDashboard();
    showToast("Item dihapus dari catatan harian.", "info");
  });

  // 7. Modal Ubah Target Kalori
  const openTargetModal = () => {
    el.targetCalorieInput.value = state.targetCalories;
    el.targetModal.classList.remove("hidden");
    el.targetModal.classList.add("flex");
    el.targetCalorieInput.focus();
  };
  const closeTargetModal = () => {
    el.targetModal.classList.add("hidden");
    el.targetModal.classList.remove("flex");
  };

  el.openTargetModalBtn.addEventListener("click", openTargetModal);
  el.editTargetSecondaryBtn.addEventListener("click", openTargetModal);
  el.closeTargetModal.addEventListener("click", closeTargetModal);
  el.cancelTargetBtn.addEventListener("click", closeTargetModal);

  document.querySelectorAll(".preset-target-btn").forEach((btn) => {
    btn.addEventListener("click", () => {
      el.targetCalorieInput.value = btn.getAttribute("data-preset-target");
    });
  });

  el.targetForm.addEventListener("submit", (e) => {
    e.preventDefault();
    const val = Number(el.targetCalorieInput.value);
    if (!val || val < 800 || val > 6000) {
      showToast("Masukkan target kalori antara 800 hingga 6.000 kkal.", "warning");
      return;
    }
    state.targetCalories = Math.round(val);
    saveStateToStorage();
    renderDailyDashboard();
    if (state.currentAnalysis) {
      const pctTarget = Math.round((state.currentAnalysis.kalori / state.targetCalories) * 100);
      el.resultCaloriePercent.textContent = `${pctTarget}% target harian`;
    }
    closeTargetModal();
    showToast(`Target kalori harian diperbarui menjadi ${formatNumber(state.targetCalories)} kkal.`);
  });

  // 8. Modal Reset Catatan Harian
  el.openResetModalBtn.addEventListener("click", () => {
    if (state.dailyLog.length === 0) {
      showToast("Catatan harian sudah kosong.", "info");
      return;
    }
    el.resetModal.classList.remove("hidden");
    el.resetModal.classList.add("flex");
  });

  const closeResetModal = () => {
    el.resetModal.classList.add("hidden");
    el.resetModal.classList.remove("flex");
  };

  el.cancelResetBtn.addEventListener("click", closeResetModal);
  el.confirmResetBtn.addEventListener("click", () => {
    state.dailyLog = [];
    saveStateToStorage();
    renderDailyDashboard();
    closeResetModal();
    showToast("Catatan kalori harian telah di-reset.", "info");
  });
}

// Inisialisasi saat halaman siap
window.addEventListener("DOMContentLoaded", () => {
  loadStateFromStorage();
  renderDailyDashboard();
  initEventListeners();
});
