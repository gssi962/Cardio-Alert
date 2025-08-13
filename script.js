// Data containers and timers
let heartbeatData = [];
let tempData = [];
let labels = [];
let intervalId = null;
let countdownInterval = null;
let countdownValue = 15 * 60; // seconds countdown for 15 minutes

// Get Canvas contexts for Charts
const heartbeatCtx = document.getElementById('heartbeatChart').getContext('2d');
const tempCtx = document.getElementById('tempChart').getContext('2d');

// Chart.js charts initialization
const hbChart = new Chart(heartbeatCtx, {
  type: 'line',
  data: {
    labels,
    datasets: [{
      label: 'Heartbeat (BPM)',
      data: heartbeatData,
      borderColor: 'red',
      backgroundColor: 'rgba(255,0,0,0.2)',
      fill: true,
      tension: 0.3
    }]
  },
  options: {
    responsive: true,
    animation: false,
    scales: {
      y: { min: 50, max: 120 },
      x: { display: false }
    },
    plugins: {
      legend: { display: false }
    }
  }
});

const temperatureChart = new Chart(tempCtx, {
  type: 'line',
  data: {
    labels,
    datasets: [{
      label: 'Temperature (°C)',
      data: tempData,
      borderColor: 'orange',
      backgroundColor: 'rgba(255,165,0,0.2)',
      fill: true,
      tension: 0.3
    }]
  },
  options: {
    responsive: true,
    animation: false,
    scales: {
      y: { min: 35, max: 39 },
      x: { display: false }
    },
    plugins: {
      legend: { display: false }
    }
  }
});

// Elements shortcuts
const hbValueEl = document.getElementById("hbValue");
const tempValueEl = document.getElementById("tempValue");
const statusValueEl = document.getElementById("statusValue");
const faceOverlay = document.getElementById("face-overlay");
const alertMsg = document.getElementById("alertMsg");
const countdownTimer = document.getElementById("countdownTimer");
const smsStatus = document.getElementById("smsStatus");
const logPanel = document.getElementById("logPanel");
const alarmSound = document.getElementById("alarmSound");

// Start monitoring button
document.getElementById("startBtn").addEventListener("click", () => {
  startCamera();
  startSimulation();
  logPanel.textContent = "";  // clear log on new session
  appendLog("Monitoring started.");
});

// Scroll to Monitoring panel from hero button
document.getElementById("scrollToMonitoring").addEventListener("click", () => {
  document.getElementById("monitoring").scrollIntoView({ behavior: "smooth" });
});

// Test alarm sound button fixes + speech test
document.getElementById("testAlarmBtn").addEventListener("click", () => {
  playAlarm();
  speak("This is a test alarm for the Cardio Alert system.");
  appendLog("Test alarm triggered by user.");
});

// Start camera function
function startCamera() {
  navigator.mediaDevices.getUserMedia({ video: { width: 640, height: 360, facingMode: "user" } })
    .then(stream => {
      document.getElementById('camera').srcObject = stream;
      appendLog("Camera started.");
    })
    .catch(err => {
      console.error("Camera error: ", err);
      appendLog("Camera error: " + err.message);
    });
}

// Start vitals simulation
function startSimulation() {
  clearInterval(intervalId);
  let time = 0;

  intervalId = setInterval(() => {
    time++;

    // Smooth vitals updates using easing-like random fluctuation
    const lastHB = heartbeatData.length ? heartbeatData[heartbeatData.length - 1] : 75;
    const lastTemp = tempData.length ? tempData[tempData.length - 1] : 36.5;

    const hb = clamp( Math.round(lastHB + (Math.random() * 6 - 3)), 60, 115 );
    const temp = clamp((parseFloat(lastTemp) + (Math.random() * 0.3 - 0.15)), 35.5, 38.5).toFixed(1);

    labels.push(time);
    heartbeatData.push(hb);
    tempData.push(temp);

    hbValueEl.innerText = hb;
    tempValueEl.innerText = temp;

    if (labels.length > 20) {
      labels.shift();
      heartbeatData.shift();
      tempData.shift();
    }

    hbChart.update();
    temperatureChart.update();

    checkForAlert(hb, temp);

    appendLog(`Time: ${time}s - Heartbeat: ${hb} BPM, Temp: ${temp}°C`);
  }, 1200);
}

// Clamp utility
function clamp(num, min, max) {
  return num <= min ? min : num >= max ? max : num;
}

// Alert & risk level checking
function checkForAlert(hb, temp) {
  if (hb > 90 || temp > 37.5) {
    updateStatus("RISK", "risk", "⚠ Risk Detected! Predicting heart attack in 15 mins!");
    faceOverlay.style.backgroundColor = "rgba(255,0,0,0.4)";
    triggerAlert();
  } else if ((hb >= 80 && hb <= 90) || temp > 37.0) {
    updateStatus("WARNING", "warning", "⚠ Monitor closely");
    faceOverlay.style.backgroundColor = "rgba(255,255,0,0.25)";
    stopCountdown();
    smsStatus.classList.remove("sms-show");
  } else {
    updateStatus("Normal", "normal", "Vitals Normal ✅");
    faceOverlay.style.backgroundColor = "rgba(0,255,0,0.25)";
    stopCountdown();
    smsStatus.classList.remove("sms-show");
  }
}

// Update status UI texts and classes
function updateStatus(statusText, alertClass, alertText) {
  statusValueEl.innerText = statusText;
  alertMsg.innerText = alertText;
  alertMsg.className = alertClass;
}

// Trigger alert logic
function triggerAlert() {
  if (!countdownInterval) {
    startCountdown();
  }
  if (!alarmSound.paused) {
    // Already playing
    return;
  }
  playAlarm();
  speak("Warning! Abnormal vitals detected. Heart attack risk in fifteen minutes.");
  setTimeout(() => {
    smsStatus.classList.add("sms-show");
    appendLog("Notification: SMS sent to family & hospital (simulation).");
    setTimeout(() => smsStatus.classList.remove("sms-show"), 6000);
  }, 6000);
}

// Play alarm sound reliably
function playAlarm() {
  alarmSound.currentTime = 0;
  alarmSound.play().catch(e => console.warn("Audio play issue:", e));
  triggerBlinkEffect(true);
  setTimeout(() => triggerBlinkEffect(false), 7000);
}

// Blink background or alert area for visual alarm effect
function triggerBlinkEffect(on) {
  if (on) {
    document.body.classList.add('blink-red');
  } else {
    document.body.classList.remove('blink-red');
  }
}

// Countdown timer for prediction
function startCountdown() {
  countdownValue = 15 * 60;
  updateCountdownDisplay();
  countdownInterval = setInterval(() => {
    countdownValue--;
    updateCountdownDisplay();
    if (countdownValue <= 0) {
      clearInterval(countdownInterval);
      countdownInterval = null;
      countdownTimer.innerText = "🚨 Heart attack imminent!";
      appendLog("**Heart attack imminent!**");
      triggerBlinkEffect(true);
    }
  }, 1000);
}

function stopCountdown() {
  if (countdownInterval) {
    clearInterval(countdownInterval);
    countdownInterval = null;
  }
  countdownTimer.innerText = "";
  triggerBlinkEffect(false);
}

// Update countdown DOM
function updateCountdownDisplay() {
  let minutes = Math.floor(countdownValue / 60);
  let seconds = countdownValue % 60;
  countdownTimer.innerText = `⏳ Time: ${minutes}:${seconds < 10 ? '0' + seconds : seconds}`;
}

// Text-to-speech alert
function speak(message) {
  try {
    const synth = window.speechSynthesis;
    const utterance = new SpeechSynthesisUtterance(message);
    synth.speak(utterance);
  } catch (e) {
    console.warn("Speech synthesis error", e);
  }
}

// Append logs with timestamp
function appendLog(message) {
  let now = new Date();
  let timeStr = now.toLocaleTimeString();
  logPanel.textContent += `[${timeStr}] ${message}\n`;
  logPanel.scrollTop = logPanel.scrollHeight;
}

// Optional: Scroll to top on page load
window.scrollTo(0,0);





