/* ============================================================================
   NUTRISCAN AI - STYLESHEET KUSTOM
   ============================================================================ */

body {
  font-family: 'Inter', -apple-system, BlinkMacSystemFont, sans-serif;
  background-color: #f8fafc;
  color: #0f172a;
  overflow-x: hidden;
}

/* Animasi garis laser pemindaian AI */
@keyframes scanLine {
  0% {
    top: 4%;
    opacity: 0.2;
  }
  15% {
    opacity: 1;
  }
  50% {
    top: 92%;
    opacity: 1;
  }
  85% {
    opacity: 1;
  }
  100% {
    top: 4%;
    opacity: 0.2;
  }
}

/* Animasi kemunculan elemen halus */
@keyframes fadeIn {
  0% {
    opacity: 0;
    transform: translateY(8px);
  }
  100% {
    opacity: 1;
    transform: translateY(0);
  }
}

.animate-scan-line {
  animation: scanLine 2.2s ease-in-out infinite;
}

.animate-fade-in {
  animation: fadeIn 0.35s ease-out forwards;
}

/* Efek gradasi laser hijau emerald */
.scan-laser {
  background: linear-gradient(
    to bottom,
    rgba(16, 185, 129, 0) 0%,
    rgba(16, 185, 129, 0.35) 75%,
    rgba(16, 185, 129, 0.95) 100%
  );
  box-shadow: 0 4px 16px rgba(16, 185, 129, 0.65);
}

/* Kartu efek kaca transparan */
.glass-card {
  background: rgba(255, 255, 255, 0.95);
  backdrop-filter: blur(8px);
}