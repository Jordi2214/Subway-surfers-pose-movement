/* 
  Pose UI System
  Integrates a real-time webcam feed and prediction bars.
  Prepared for TensorFlow.js pose models to be plugged in.
*/

// Global state for game integration
window.poseAction = "idle";
window.poseConfidence = 0;

const CLASSES = ["Up", "Right", "Left", "Down", "Standby"];

// Store the latest pose data
let currentPose = null;
let currentPredictions = null;
let isModelConnected = false;

const KEY_MAP = {
    "Up": { key: "ArrowUp", code: "ArrowUp", keyCode: 38 },
    "Down": { key: "ArrowDown", code: "ArrowDown", keyCode: 40 },
    "Left": { key: "ArrowLeft", code: "ArrowLeft", keyCode: 37 },
    "Right": { key: "ArrowRight", code: "ArrowRight", keyCode: 39 },
};

let activeKeyInfo = null;

function dispatchKey(type, keyInfo) {
    const event = new KeyboardEvent(type, {
        key: keyInfo.key,
        code: keyInfo.code,
        keyCode: keyInfo.keyCode,
        which: keyInfo.keyCode,
        bubbles: true,
        cancelable: true
    });
    
    // Unity games usually listen on the canvas, document, or window.
    const canvas = document.querySelector("canvas");
    if (canvas) canvas.dispatchEvent(event);
    document.dispatchEvent(event);
    window.dispatchEvent(event);
}

let lastActionTime = 0;
const COOLDOWN_MS = 600; // 600ms minimum between actions to completely stop double-swipes

/**
 * Updates the global state and triggers game inputs.
 */
function setPoseAction(action, confidence) {
    // Note: User threshold changed to 0.8 for stricter control
    let targetAction = confidence > 0.8 ? action : "Standby";

    if (window.poseAction !== targetAction) {
        const now = Date.now();
        
        // Check if we are outside the cooldown window
        if (now - lastActionTime > COOLDOWN_MS) {
            
            // Press the new key if it's not Standby
            if (targetAction !== "Standby" && KEY_MAP[targetAction]) {
                const keyInfo = KEY_MAP[targetAction];
                activeKeyInfo = keyInfo;
                
                // Quick tap: fire 'keydown' immediately
                dispatchKey('keydown', keyInfo);
                
                // Release with 'keyup' precisely 100ms later to emulate a true keyboard tap
                setTimeout(() => {
                    dispatchKey('keyup', keyInfo);
                    if (activeKeyInfo === keyInfo) activeKeyInfo = null;
                }, 100);
                
                lastActionTime = now;
            }
            
            window.poseAction = targetAction;
            
        } else if (targetAction === "Standby") {
            // Unconditionally allow state to reset to standby during cooldown
            window.poseAction = targetAction;
        }
    }

    window.poseConfidence = confidence;

    const dbg = document.getElementById("debug-text");
    if (dbg) {
        // Keeping the display showing the raw detected action
        dbg.innerText = `Action: ${action} (${Math.round(confidence * 100)}%)`;
    }
}

/**
 * Hook function to be called externally by TensorFlow.js model update loop.
 * @param {Object} pose - The pose object (keypoints, etc.)
 * @param {Object} predictions - E.g. { "Amunt": 0.1, "Dreta": 0.8, ... }
 */
window.onPoseUpdate = function(pose, predictions) {
    isModelConnected = true;
    currentPose = pose;
    currentPredictions = predictions;

    // Update bars
    let maxCls = "Standby";
    let maxVal = 0;

    for (let cls of CLASSES) {
        let val = (predictions[cls] || 0); // 0.0 to 1.0
        let valPercent = Math.min(100, Math.max(0, val * 100)); // Clamp 0-100%

        let fill = document.getElementById("bar-" + cls);
        let text = document.getElementById("text-" + cls);

        if (fill && text) {
            fill.style.width = valPercent + "%";
            text.style.left = valPercent + "%";
            text.innerText = Math.round(valPercent) + "%";
        }

        if (val > maxVal) {
            maxVal = val;
            maxCls = cls;
        }
    }

    setPoseAction(maxCls, maxVal);
}

/**
 * Initialize webcam safely
 */
function initWebcam() {
    const video = document.getElementById('webcam-video');
    if (!video) return;

    if (navigator.mediaDevices && navigator.mediaDevices.getUserMedia) {
        navigator.mediaDevices.getUserMedia({ video: { facingMode: 'user' }, audio: false })
            .then((stream) => {
                video.srcObject = stream;
                video.onloadedmetadata = () => {
                    video.play();
                };
            })
            .catch((err) => {
                console.warn("Webcam access denied or unavailable:", err);
                const dbg = document.getElementById("debug-text");
                if (dbg) dbg.innerText = "WEBCAM ERROR";
            });
    }
}

/**
 * Renders the skeleton directly on the canvas.
 * Simulates a placeholder skeleton if no model is connected yet.
 */
function drawLoop() {
    const canvas = document.getElementById('pose-canvas');
    const video = document.getElementById('webcam-video');

    if (canvas && video && video.readyState === video.HAVE_ENOUGH_DATA) {
        // Match canvas dimensions to actual video size to avoid distortion
        if (canvas.width !== video.videoWidth) {
            canvas.width = video.videoWidth;
            canvas.height = video.videoHeight;
        }

        const ctx = canvas.getContext('2d');
        const w = canvas.width;
        const h = canvas.height;

        ctx.clearRect(0, 0, w, h);

        if (!isModelConnected) {
            // Draw placeholder skeleton / loading animation
            drawPlaceholderSkeleton(ctx, w, h);
            // Simulate bars doing something interesting
            simulateLoadingBars();
        } else if (currentPose && currentPose.keypoints) {
            // Draw real keypoints
            // TFJS PoseNet/MoveNet keypoints usually contain { x, y, score, name }
            ctx.fillStyle = "#10b981"; // Emerald green
            ctx.strokeStyle = "#ffffff";
            ctx.lineWidth = 2;

            for (let kp of currentPose.keypoints) {
                // Check score threshold
                if (kp.score > 0.3) {
                    ctx.beginPath();
                    ctx.arc(kp.x, kp.y, 4, 0, 2 * Math.PI);
                    ctx.fill();
                    ctx.stroke();
                }
            }
            
            // NOTE: Add code here to draw skeletal lines based on keypoint connections
            // (Depends on the specific TF.js model topology used later: MoveNet vs PoseNet)
        }
    }

    requestAnimationFrame(drawLoop);
}

/**
 * Simulates a floating stick figure while waiting for TF.js.
 */
function drawPlaceholderSkeleton(ctx, w, h) {
    let t = Date.now() / 1000;
    ctx.strokeStyle = "rgba(255, 255, 255, 0.4)";
    ctx.fillStyle = "rgba(16, 185, 129, 0.6)"; 
    ctx.lineWidth = 3;
    ctx.lineCap = "round";
    ctx.lineJoin = "round";

    let cx = w / 2;
    let cy = h / 2;

    let dx = Math.sin(t) * 15;
    let dy = Math.cos(t * 1.5) * 8;

    let head = { x: cx + dx, y: cy - 40 + dy };
    let body = { x: cx + dx / 2, y: cy + 20 + dy / 2 };
    let larm = { x: cx - 30 + dx, y: cy - 10 + dy };
    let rarm = { x: cx + 30 + dx, y: cy - 10 + dy };

    ctx.beginPath();
    ctx.moveTo(head.x, head.y);
    ctx.lineTo(body.x, body.y);
    ctx.moveTo(larm.x, larm.y);
    ctx.lineTo(body.x, body.y - 15);
    ctx.lineTo(rarm.x, rarm.y);
    ctx.stroke();

    ctx.beginPath();
    ctx.arc(head.x, head.y, 12, 0, 2 * Math.PI);
    ctx.fill();

    // Loading text
    ctx.fillStyle = "rgba(255, 255, 255, 0.8)";
    ctx.font = "14px 'Inter', sans-serif";
    ctx.textAlign = "center";
    ctx.fillText("Waiting for TF.js...", cx, h - 15);
}

/**
 * Animated fake values for the bars so it looks alive before TF.js loads.
 */
function simulateLoadingBars() {
    let t = Date.now() / 1000;
    // We only simulate UI animation, we DO NOT call setPoseAction
    // so the game remains completely idle until real model loads.
    let fakePreds = {
        "Up": (Math.sin(t) * 0.5 + 0.5) * 0.1,
        "Right": (Math.cos(t) * 0.5 + 0.5) * 0.1,
        "Left": (Math.sin(t + 2) * 0.5 + 0.5) * 0.1,
        "Down": (Math.cos(t + 2) * 0.5 + 0.5) * 0.1,
        "Standby": (Math.sin(t * 0.5) * 0.2 + 0.8) // Keeps standby high
    };

    for (let cls of CLASSES) {
        let valPercent = fakePreds[cls] * 100;
        let fill = document.getElementById("bar-" + cls);
        let text = document.getElementById("text-" + cls);

        if (fill && text) {
            fill.style.width = valPercent + "%";
            text.style.left = valPercent + "%";
            text.innerText = "—"; // Don't show fake numbers, just animate bar
        }
    }
}

// Ensure things start correctly
document.addEventListener("DOMContentLoaded", () => {
    // Show UI with clear fade-in
    setTimeout(() => {
        const ui = document.getElementById('pose-ui-container');
        if (ui) ui.classList.add('pose-ui-visible');
    }, 600); // Slight delay for dramatic premium feel
    
    // Set initial debug state
    setPoseAction("idle", 0);

    initWebcam();
    requestAnimationFrame(drawLoop);
});
