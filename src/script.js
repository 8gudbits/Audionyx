let audioContext;
let micStream;
let sourceNode;
let isMicActive = false;
let analyser;
let dataArray;
let bars;
let animationId;

const toggleBtn = document.getElementById("micToggle");
const statusText = document.getElementById("status");
const visualizerBars = document.querySelectorAll(".bar");

function initBars() {
  bars = Array.from(visualizerBars);
  bars.forEach((bar) => {
    bar.style.height = "10px";
  });
}

function animateBars() {
  if (!analyser) return;

  dataArray = new Uint8Array(analyser.frequencyBinCount);
  analyser.getByteFrequencyData(dataArray);

  bars.forEach((bar, i) => {
    const value = dataArray[i % dataArray.length] / 255;
    const height = 10 + value * 30;
    bar.style.height = `${height}px`;
    bar.style.opacity = 0.6 + value * 0.4;
  });

  animationId = requestAnimationFrame(animateBars);
}

function stopAnimation() {
  if (animationId) {
    cancelAnimationFrame(animationId);
  }
  initBars();
}

async function toggleMic() {
  if (!isMicActive) {
    await startMic();
  } else {
    stopMic();
  }
}

async function startMic() {
  try {
    statusText.textContent = "Connecting";
    statusText.style.color = "var(--accent-primary)";

    micStream = await navigator.mediaDevices.getUserMedia({ audio: true });
    audioContext = new (window.AudioContext || window.webkitAudioContext)();

    if (audioContext.state === "suspended") {
      await audioContext.resume();
    }

    analyser = audioContext.createAnalyser();
    analyser.fftSize = 256;

    sourceNode = audioContext.createMediaStreamSource(micStream);
    sourceNode.connect(analyser);
    analyser.connect(audioContext.destination);

    isMicActive = true;
    toggleBtn.classList.add("active");
    statusText.textContent = "Mic live";
    statusText.style.color = "var(--error)";

    animateBars();
  } catch (err) {
    console.error("Mic routing failed:", err);
    statusText.textContent = "Error";
    statusText.style.color = "var(--error)";
    setTimeout(() => {
      statusText.textContent = "Mic off";
      statusText.style.color = "var(--text-secondary)";
    }, 2000);
  }
}

function stopMic() {
  if (sourceNode) {
    sourceNode.disconnect();
    sourceNode = null;
  }
  if (micStream) {
    micStream.getTracks().forEach((track) => track.stop());
    micStream = null;
  }
  if (audioContext) {
    audioContext.close();
    audioContext = null;
  }

  isMicActive = false;
  toggleBtn.classList.remove("active");
  statusText.textContent = "Mic off";
  statusText.style.color = "var(--text-secondary)";

  stopAnimation();
}

document.addEventListener("DOMContentLoaded", () => {
  initBars();
  toggleBtn.addEventListener("click", toggleMic);

  toggleBtn.addEventListener("touchstart", function (e) {
    e.preventDefault();
    this.style.transform = "scale(0.97)";
  });

  toggleBtn.addEventListener("touchend", function (e) {
    e.preventDefault();
    this.style.transform = "";
    toggleMic();
  });

  toggleBtn.addEventListener("contextmenu", function (e) {
    e.preventDefault();
  });

  document.addEventListener(
    "touchmove",
    function (e) {
      if (e.target === document.documentElement || e.target === document.body) {
        e.preventDefault();
      }
    },
    { passive: false }
  );

  document.addEventListener(
    "touchstart",
    function (e) {
      if (e.touches.length === 1) {
        const touch = e.touches[0];
        if (
          touch.clientY <= 10 ||
          touch.clientX <= 10 ||
          touch.clientY >= window.innerHeight - 10 ||
          touch.clientX >= window.innerWidth - 10
        ) {
          e.preventDefault();
        }
      }
    },
    { passive: false }
  );
});

