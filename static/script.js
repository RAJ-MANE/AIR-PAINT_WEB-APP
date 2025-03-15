const video = document.getElementById("video");
const canvas = document.getElementById("canvas");
const ctx = canvas.getContext("2d");

const overlayCanvas = document.getElementById("overlay");
const overlayCtx = overlayCanvas.getContext("2d");

canvas.width = overlayCanvas.width = 640;
canvas.height = overlayCanvas.height = 480;

let drawing = false;
let color = "red";
let lastX = 0, lastY = 0;
let path = [];

const heartSound = new Audio("static/heart_sound.mp3");

function flipCanvas() {
    ctx.save();
    ctx.translate(canvas.width, 0);
    ctx.scale(-1, 1);
    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
    ctx.restore();
}

const hands = new Hands({ locateFile: file => `https://cdn.jsdelivr.net/npm/@mediapipe/hands/${file}` });
hands.setOptions({
    maxNumHands: 1,
    modelComplexity: 1,
    minDetectionConfidence: 0.8,
    minTrackingConfidence: 0.8
});

hands.onResults(results => {
    flipCanvas();

    if (results.multiHandLandmarks.length > 0) {
        const landmarks = results.multiHandLandmarks[0];

        let x = landmarks[8].x * overlayCanvas.width;
        let y = landmarks[8].y * overlayCanvas.height;

        x = overlayCanvas.width - x;

        if (drawing) {
            overlayCtx.strokeStyle = color;
            overlayCtx.lineWidth = 5;
            overlayCtx.lineCap = "round";
            overlayCtx.beginPath();
            overlayCtx.moveTo(lastX, lastY);
            overlayCtx.lineTo(x, y);
            overlayCtx.stroke();

            path.push({ x, y });

            if (path.length > 70) checkForHeart();
        }

        lastX = x;
        lastY = y;
    }
});

const camera = new Camera(video, {
    onFrame: async () => {
        await hands.send({ image: video });
    },
    width: 640,
    height: 480
});
camera.start();

function checkForHeart() {
    if (path.length < 50) return;

    let minX = Math.min(...path.map(p => p.x));
    let maxX = Math.max(...path.map(p => p.x));
    let minY = Math.min(...path.map(p => p.y));
    let maxY = Math.max(...path.map(p => p.y));

    let width = maxX - minX;
    let height = maxY - minY;
    let aspectRatio = width / height;

    // Only detect pink hearts (less accuracy)
    if (color !== "pink") return;
    if (aspectRatio < 0.7 || aspectRatio > 1.3 || width < 60 || height < 60) return;

    let leftSide = path.filter(p => p.x < (minX + maxX) / 2);
    let rightSide = path.filter(p => p.x > (minX + maxX) / 2);
    
    if (Math.abs(leftSide.length - rightSide.length) > 25) return;

    let bottomPoint = path.reduce((a, b) => (a.y > b.y ? a : b));
    if (bottomPoint.y < maxY - 10) return;

    console.log("Pink Heart Detected 💖 (Sound Played)");
    heartSound.play();
    path = [];
}

const standardColors = ["red", "blue", "green", "yellow", "black", "white", "pink", "purple", "orange", "brown", "gray"];

function isValidColor(colorName) {
    return standardColors.includes(colorName.toLowerCase());
}

const recognition = new (window.SpeechRecognition || window.webkitSpeechRecognition)();
recognition.continuous = true;
recognition.onresult = (event) => {
    const command = event.results[event.results.length - 1][0].transcript.trim().toLowerCase();
    console.log(`Voice command received: ${command}`);

    if (command === "start drawing") {
        drawing = true;
        console.log("Drawing started");
    } 
    if (command === "stop drawing") {
        drawing = false;
        console.log("Drawing stopped");
    }
    if (command === "clear canvas") {
        overlayCtx.clearRect(0, 0, overlayCanvas.width, overlayCanvas.height);
        path = [];
        console.log("Canvas cleared by voice command");
    }
    if (command === "take screenshot") {
        const link = document.createElement('a');
        link.href = overlayCanvas.toDataURL('image/png');
        link.download = 'screenshot.png';
        link.click();
        console.log("Screenshot taken");
    }
};

recognition.start();

document.getElementById("startDrawing").addEventListener("click", () => { 
    drawing = true; 
    console.log("Drawing started from button");
});
document.getElementById("stopDrawing").addEventListener("click", () => { 
    drawing = false; 
    console.log("Drawing stopped from button");
});
document.getElementById("clear").addEventListener("click", () => {
    overlayCtx.clearRect(0, 0, overlayCanvas.width, overlayCanvas.height);
    path = [];
    console.log("Canvas cleared");
});

// Add event listeners to color buttons
document.querySelectorAll(".color-button").forEach(button => {
    button.addEventListener("click", (e) => {
        color = e.target.getAttribute("data-color");
        overlayCtx.strokeStyle = color; // Ensure stroke color is updated
        overlayCtx.beginPath(); // Start a new path to avoid mixed colors
        console.log(`Color changed to: ${color} from button`);
    });
});