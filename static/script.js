// DOM Elements
const video = document.getElementById("video");
const canvas = document.getElementById("canvas");
const ctx = canvas.getContext("2d");
const overlayCanvas = document.getElementById("overlay");
const overlayCtx = overlayCanvas.getContext("2d");

// Canvas Dimensions
canvas.width = overlayCanvas.width = 640;
canvas.height = overlayCanvas.height = 480;

// State Variables
let drawing = false;
let color = "red";
let lastX = 0, lastY = 0;
let path = [];
let aiDrawing = false;
let aiDrawingGenerator = null;

// Heart Sound
const heartSound = new Audio("static/heart_sound.mp3");

// Ensure sound plays only once per heart detection
let heartPlayed = false;



// Flip Canvas for Mirroring
function flipCanvas() {
    ctx.save();
    ctx.translate(canvas.width, 0);
    ctx.scale(-1, 1);
    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
    ctx.restore();
}

// MediaPipe Hands Setup
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

        x = overlayCanvas.width - x; // Mirror the x-coordinate

        if (drawing && !aiDrawing) {
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

// Camera Setup
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

    // Check if drawn in pink color
    if (color !== "pink") return;

    // Adjusted aspect ratio range for more flexibility
    if (aspectRatio < 0.6 || aspectRatio > 1.4 || width < 50 || height < 50) return;

    let centerX = (minX + maxX) / 2;
    let leftSide = path.filter(p => p.x < centerX);
    let rightSide = path.filter(p => p.x > centerX);

    // Ensure left and right sides are balanced
    if (Math.abs(leftSide.length - rightSide.length) > 30) return;

    // Ensure a distinct bottom point
    let bottomPoint = path.reduce((a, b) => (a.y > b.y ? a : b));
    if (bottomPoint.y < maxY - 15) return;

    console.log("💖 Pink Heart Detected! Playing Sound...");
    heartSound.play().catch(e => console.log("Sound play blocked:", e));

    path = []; // Reset after detection
}

// Standard Colors
const standardColors = ["red", "blue", "green", "yellow", "black", "white", "pink", "purple", "orange", "brown", "gray"];

function isValidColor(colorName) {
    return standardColors.includes(colorName.toLowerCase());
}

// AI Drawing Templates
const aiDrawingTemplates = {
    circle: [
        { x: 320, y: 100 },  // Top
        { x: 390, y: 130 },  // Top-right
        { x: 420, y: 200 },  // Right
        { x: 390, y: 270 },  // Bottom-right
        { x: 320, y: 300 },  // Bottom
        { x: 250, y: 270 },  // Bottom-left
        { x: 220, y: 200 },  // Left
        { x: 250, y: 130 },  // Top-left
        { x: 320, y: 100 }   // Close the shape
    ],

    // Ellipse approximation using 12 points
    ellipse: [
        { x: 320, y: 100 },  // Top
        { x: 370, y: 115 },  // Upper-right
        { x: 400, y: 160 },  // Right-upper
        { x: 410, y: 200 },  // Right
        { x: 400, y: 240 },  // Right-lower
        { x: 370, y: 285 },  // Bottom-right
        { x: 320, y: 300 },  // Bottom
        { x: 270, y: 285 },  // Bottom-left
        { x: 240, y: 240 },  // Left-lower
        { x: 230, y: 200 },  // Left
        { x: 240, y: 160 },  // Left-upper
        { x: 270, y: 115 },  // Upper-left
        { x: 320, y: 100 }   // Close the shape
    ],

    // Rectangle
    rectangle: [
        { x: 220, y: 150 },  // Top-left
        { x: 420, y: 150 },  // Top-right
        { x: 420, y: 250 },  // Bottom-right
        { x: 220, y: 250 },  // Bottom-left
        { x: 220, y: 150 }   // Close the shape
    ],

    // Parallelogram
    parallelogram: [
        { x: 250, y: 150 },  // Top-left
        { x: 420, y: 150 },  // Top-right
        { x: 370, y: 250 },  // Bottom-right
        { x: 200, y: 250 },  // Bottom-left
        { x: 250, y: 150 }   // Close the shape
    ],

    // Trapezoid
    trapezoid: [
        { x: 260, y: 150 },  // Top-left
        { x: 380, y: 150 },  // Top-right
        { x: 420, y: 250 },  // Bottom-right
        { x: 220, y: 250 },  // Bottom-left
        { x: 260, y: 150 }   // Close the shape
    ],

    // Crescent
    crescent: [
        { x: 350, y: 100 },  // Top-right
        { x: 400, y: 150 },  // Right-top
        { x: 420, y: 200 },  // Right
        { x: 400, y: 250 },  // Right-bottom
        { x: 350, y: 300 },  // Bottom-right
        { x: 300, y: 250 },  // Bottom-left
        { x: 320, y: 200 },  // Left
        { x: 300, y: 150 },  // Top-left
        { x: 350, y: 100 }   // Close the shape
    ],

    // Arrow
    arrow: [
        { x: 200, y: 200 },  // Tail start
        { x: 350, y: 200 },  // Tail end
        { x: 350, y: 150 },  // Arrowhead bottom-left
        { x: 420, y: 225 },  // Arrowhead point
        { x: 350, y: 300 },  // Arrowhead bottom-right
        { x: 350, y: 250 },  // Tail top
        { x: 200, y: 250 },  // Tail end
        { x: 200, y: 200 }   // Close the shape
    ],

    // Diamond
    diamond: [
        { x: 320, y: 100 },  // Top
        { x: 400, y: 200 },  // Right
        { x: 320, y: 300 },  // Bottom
        { x: 240, y: 200 },  // Left
        { x: 320, y: 100 }   // Close the shape
    ],

    // Infinity symbol approximation
    infinity: [
        { x: 270, y: 200 },  // Left-center
        { x: 250, y: 170 },  // Left-top
        { x: 220, y: 170 },  // Left-top-left
        { x: 200, y: 200 },  // Left-left
        { x: 220, y: 230 },  // Left-bottom-left
        { x: 250, y: 230 },  // Left-bottom
        { x: 270, y: 200 },  // Left-center
        { x: 370, y: 200 },  // Right-center
        { x: 390, y: 170 },  // Right-top
        { x: 420, y: 170 },  // Right-top-right
        { x: 440, y: 200 },  // Right-right
        { x: 420, y: 230 },  // Right-bottom-right
        { x: 390, y: 230 },  // Right-bottom
        { x: 370, y: 200 }   // Right-center
    ],
    triangle: [
        { x: 320, y: 100 },
        { x: 200, y: 300 },
        { x: 440, y: 300 },
        { x: 320, y: 100 }
    ],
    square: [
        { x: 200, y: 100 },
        { x: 440, y: 100 },
        { x: 440, y: 300 },
        { x: 200, y: 300 },
        { x: 200, y: 100 }
    ],
    pentagon: [
        { x: 320, y: 100 },   // Top
        { x: 440, y: 180 },   // Top right
        { x: 380, y: 300 },   // Bottom right
        { x: 260, y: 300 },   // Bottom left
        { x: 200, y: 180 },   // Top left
        { x: 320, y: 100 }    // Close the shape
    ],
    hexagon: [
        { x: 320, y: 100 },   // Top
        { x: 440, y: 160 },   // Top right
        { x: 440, y: 240 },   // Bottom right
        { x: 320, y: 300 },   // Bottom
        { x: 200, y: 240 },   // Bottom left
        { x: 200, y: 160 },   // Top left
        { x: 320, y: 100 }    // Close the shape
    ],
    octagon: [
        { x: 320, y: 100 },   // Top
        { x: 420, y: 140 },   // Top right
        { x: 440, y: 220 },   // Right top
        { x: 440, y: 280 },   // Right bottom
        { x: 420, y: 360 },   // Bottom right
        { x: 320, y: 400 },   // Bottom
        { x: 220, y: 360 },   // Bottom left
        { x: 200, y: 280 },   // Left bottom
        { x: 200, y: 220 },   // Left top
        { x: 220, y: 140 },   // Top left
        { x: 320, y: 100 }    // Close the shape
    ],
    star: [
        { x: 320, y: 100 },   // Top point
        { x: 350, y: 200 },   // Right point
        { x: 440, y: 220 },   // Outer right point
        { x: 370, y: 280 },   // Bottom right point
        { x: 400, y: 380 },   // Bottom outer point
        { x: 320, y: 320 },   // Bottom center
        { x: 240, y: 380 },   // Bottom outer left
        { x: 270, y: 280 },   // Bottom left point
        { x: 200, y: 220 },   // Outer left point
        { x: 290, y: 200 },   // Left point
        { x: 320, y: 100 }    // Close the shape
    ],
    cross: [
        { x: 320, y: 100 },   // Top of vertical line
        { x: 320, y: 250 },   // Middle of vertical line
        { x: 200, y: 250 },   // Left of horizontal line
        { x: 200, y: 280 },   // Bottom left
        { x: 320, y: 280 },   // Bottom of vertical line
        { x: 320, y: 400 },   // Bottom of vertical line
        { x: 350, y: 400 },   // Bottom right of vertical line
        { x: 350, y: 280 },   // Bottom of vertical line
        { x: 440, y: 280 },   // Bottom right
        { x: 440, y: 250 },   // Right of horizontal line
        { x: 350, y: 250 },   // Middle of horizontal line
        { x: 350, y: 100 },   // Top of vertical line
        { x: 320, y: 100 }    // Close the shape
    ],
    leaf: [
        { x: 320, y: 100 },   // Top of leaf
        { x: 250, y: 180 },   // Left curve
        { x: 320, y: 250 },   // Bottom middle
        { x: 390, y: 180 },   // Right curve
        { x: 320, y: 100 }    // Close the shape
    ],
    cloud: [
        { x: 250, y: 200 },   // Left curve
        { x: 280, y: 150 },   // Top left
        { x: 350, y: 130 },   // Top middle
        { x: 420, y: 150 },   // Top right
        { x: 450, y: 200 },   // Right curve
        { x: 420, y: 250 },   // Bottom right
        { x: 350, y: 270 },   // Bottom middle
        { x: 280, y: 250 },   // Bottom left
        { x: 250, y: 200 }    // Close the shape
    ],
    heart: [
        { x: 320, y: 150 },   // Top point
        { x: 250, y: 100 },   // Left curve top
        { x: 200, y: 150 },   // Left curve bottom
        { x: 250, y: 220 },   // Left bottom curve
        { x: 320, y: 280 },   // Bottom point
        { x: 390, y: 220 },   // Right bottom curve
        { x: 440, y: 150 },   // Right curve bottom
        { x: 390, y: 100 },   // Right curve top
        { x: 320, y: 150 }    // Close the shape
    ],
    spiral: [
        { x: 320, y: 200 },
        { x: 280, y: 180 },
        { x: 300, y: 220 },
        { x: 340, y: 240 },
        { x: 360, y: 210 },
        { x: 340, y: 180 },
        { x: 310, y: 170 },
        { x: 290, y: 190 },
        { x: 310, y: 220 },
        { x: 350, y: 240 },
        { x: 380, y: 220 }
    ],
    fractal: [
        { x: 320, y: 100 },
        { x: 280, y: 160 },
        { x: 350, y: 180 },
        { x: 300, y: 240 },
        { x: 370, y: 260 },
        { x: 340, y: 320 },
        { x: 400, y: 340 }
    ],
    house: [
        { x: 320, y: 100 },   // Roof peak
        { x: 200, y: 220 },   // Left corner of base
        { x: 200, y: 350 },   // Left bottom
        { x: 440, y: 350 },   // Right bottom
        { x: 440, y: 220 },   // Right corner of base
        { x: 320, y: 100 }    // Close the shape
    ],
    pyramid: [
        { x: 320, y: 100 },   // Top point
        { x: 200, y: 350 },   // Bottom left
        { x: 440, y: 350 },   // Bottom right
        { x: 320, y: 100 }    // Close the shape
    ]
};

// Draw Object Using Generator
function* drawObject(objectPoints) {
    overlayCtx.strokeStyle = color;
    overlayCtx.lineWidth = 5;
    overlayCtx.lineCap = "round";

    for (let i = 1; i < objectPoints.length; i++) {
        overlayCtx.beginPath();
        overlayCtx.moveTo(objectPoints[i - 1].x, objectPoints[i - 1].y);
        overlayCtx.lineTo(objectPoints[i].x, objectPoints[i].y);
        overlayCtx.stroke();
        yield;
    }

    aiDrawing = false;
    drawing = false;
}

// Voice Recognition Setup
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

    // AI Object Drawing Detection
    for (let object in aiDrawingTemplates) {
        if (command === `draw ${object}`) {
            overlayCtx.clearRect(0, 0, overlayCanvas.width, overlayCanvas.height);
            path = [];
            aiDrawing = true;
            drawing = true;
            aiDrawingGenerator = drawObject(aiDrawingTemplates[object]);
            function animateDrawing() {
                if (!aiDrawingGenerator.next().done) {
                    requestAnimationFrame(animateDrawing);
                }
            }
            animateDrawing();
            break;
        }
    }
};

recognition.start();

// Button Event Listeners
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

// Color Button Event Listeners
document.querySelectorAll(".color-button").forEach(button => {
    button.addEventListener("click", (e) => {
        color = e.target.getAttribute("data-color");
        overlayCtx.strokeStyle = color;
        overlayCtx.beginPath();
        console.log(`Color changed to: ${color} from button`);
    });
});
