// DOM Elements
const video = document.getElementById("video");
const canvas = document.getElementById("canvas");
const ctx = canvas.getContext("2d");
const overlayCanvas = document.getElementById("overlay");
const overlayCtx = overlayCanvas.getContext("2d");

// Canvas Dimensions
canvas.width = overlayCanvas.width = 640;
canvas.height = overlayCanvas.height = 480;

// Optimize canvas performance
overlayCtx.imageSmoothingEnabled = false;
ctx.imageSmoothingEnabled = false;

// State Variables
let drawing = false;
let color = "red";
let lastX = 0, lastY = 0;
let path = [];
let aiDrawing = false;
let aiDrawingGenerator = null;
let lastCommandTime = 0;
const COMMAND_DEBOUNCE = 1000; // 1 second debounce
let lastFrameTime = 0;
const FRAME_INTERVAL = 1000 / 60; // 60 FPS cap

// Text input variables
let isTyping = false;
let currentText = '';
let textX = 0;
let textY = 0;
let isCalculating = false;

// Heart Sound - Preload for better performance
const heartSound = new Audio("static/heart_sound.mp3");
heartSound.preload = 'auto';
let heartPlayed = false;

// Flip Canvas for Mirroring with optimized context saving
function flipCanvas() {
    ctx.save();
    ctx.translate(canvas.width, 0);
    ctx.scale(-1, 1);
    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
    ctx.restore();
}

// MediaPipe Hands Setup with optimized settings
const hands = new Hands({ locateFile: file => `https://cdn.jsdelivr.net/npm/@mediapipe/hands/${file}` });
hands.setOptions({
    maxNumHands: 1,
    modelComplexity: 0, // Reduced complexity for better performance
    minDetectionConfidence: 0.7, // Slightly reduced for better responsiveness
    minTrackingConfidence: 0.7
});

hands.onResults(results => {
    // Use requestAnimationFrame for smooth rendering
    requestAnimationFrame(() => {
        const currentTime = performance.now();
        if (currentTime - lastFrameTime < FRAME_INTERVAL) return;
        lastFrameTime = currentTime;

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

                // Limit path array size for better performance
                path.push({ x, y });
                if (path.length > 50) path.shift();

                if (path.length > 30) checkForHeart();
            }

            lastX = x;
            lastY = y;
        }
    });
});

// Camera Setup with optimized frame rate
const camera = new Camera(video, {
    onFrame: async () => {
        await hands.send({ image: video });
    },
    width: 640,
    height: 480,
    frameRate: 30 // Limit frame rate for better performance
});
camera.start();

// Voice Recognition Setup with error handling and auto-restart
const recognition = new (window.SpeechRecognition || window.webkitSpeechRecognition)();
recognition.continuous = true;
recognition.interimResults = true;

// Exponential backoff for recognition restarts
let restartAttempts = 0;
const MAX_RESTART_DELAY = 30000; // Maximum 30 second delay

// Function to restart recognition with exponential backoff
function restartRecognition() {
    try {
        recognition.stop();
        const delay = Math.min(Math.pow(2, restartAttempts) * 1000, MAX_RESTART_DELAY);
        setTimeout(() => {
            try {
                recognition.start();
                console.log("Recognition restarted after delay:", delay);
                restartAttempts = Math.max(0, restartAttempts - 1); // Reduce attempt count on successful restart
            } catch (e) {
                console.error("Failed to restart recognition:", e);
                restartAttempts++;
                restartRecognition();
            }
        }, delay);
    } catch (e) {
        console.error("Error in recognition restart:", e);
    }
}

// Add error handling for recognition
recognition.onerror = (event) => {
    console.error("Speech recognition error:", event.error);
    restartAttempts++;
    restartRecognition();
};

recognition.onend = () => {
    console.log("Speech recognition ended, restarting...");
    restartRecognition();
};

// Function to evaluate mathematical expressions with improved error handling and debugging
function evaluateExpression(expression) {
    try {
        console.log('Original expression:', expression);
        
        // Remove all spaces and validate input
        expression = expression.replace(/\s+/g, '');
        
        // Basic input validation
        if (!expression) {
            throw new Error('Empty expression');
        }
        
        if (!/^[0-9+\-*/^().]+$/.test(expression)) {
            throw new Error('Invalid characters in expression');
        }
        
        console.log('Cleaned expression:', expression);
        
        // Basic arithmetic operations with validation
        const operators = {
            '+': (a, b) => {
                if (isNaN(a) || isNaN(b)) throw new Error('Invalid operands for addition');
                return a + b;
            },
            '-': (a, b) => {
                if (isNaN(a) || isNaN(b)) throw new Error('Invalid operands for subtraction');
                return a - b;
            },
            '*': (a, b) => {
                if (isNaN(a) || isNaN(b)) throw new Error('Invalid operands for multiplication');
                return a * b;
            },
            '/': (a, b) => {
                if (isNaN(a) || isNaN(b)) throw new Error('Invalid operands for division');
                if (b === 0) throw new Error('Division by zero');
                return a / b;
            },
            '^': (a, b) => {
                if (isNaN(a) || isNaN(b)) throw new Error('Invalid operands for exponentiation');
                return Math.pow(a, b);
            }
        };
        
        // Split by operators while keeping them
        const tokens = expression.split(/([+\-*/^()])/).filter(token => token.length > 0);
        console.log('Initial tokens:', tokens);
        
        // Validate balanced parentheses
        let parenCount = 0;
        for (let char of expression) {
            if (char === '(') parenCount++;
            if (char === ')') parenCount--;
            if (parenCount < 0) throw new Error('Unmatched closing parenthesis');
        }
        if (parenCount !== 0) throw new Error('Unmatched opening parenthesis');
        
        // Handle parentheses first
        while (tokens.includes('(')) {
            console.log('Processing parentheses, current tokens:', tokens);
            const openIndex = tokens.lastIndexOf('(');
            const closeIndex = tokens.indexOf(')', openIndex);
            if (closeIndex === -1) throw new Error('Mismatched parentheses');
            
            const subExpression = tokens.slice(openIndex + 1, closeIndex).join('');
            console.log('Evaluating sub-expression:', subExpression);
            const result = evaluateExpression(subExpression);
            tokens.splice(openIndex, closeIndex - openIndex + 1, result.toString());
            console.log('After parentheses evaluation:', tokens);
        }
        
        // Evaluate exponents first
        for (let i = 1; i < tokens.length; i += 2) {
            if (tokens[i] === '^') {
                console.log('Processing exponentiation:', tokens[i-1], '^', tokens[i+1]);
                const result = operators['^'](parseFloat(tokens[i-1]), parseFloat(tokens[i+1]));
                tokens.splice(i-1, 3, result.toString());
                i -= 2;
                console.log('After exponentiation:', tokens);
            }
        }
        
        // Evaluate multiplication and division
        for (let i = 1; i < tokens.length; i += 2) {
            if (tokens[i] === '*' || tokens[i] === '/') {
                console.log('Processing multiplication/division:', tokens[i-1], tokens[i], tokens[i+1]);
                const result = operators[tokens[i]](parseFloat(tokens[i-1]), parseFloat(tokens[i+1]));
                tokens.splice(i-1, 3, result.toString());
                i -= 2;
                console.log('After multiplication/division:', tokens);
            }
        }
        
        // Validate first token is a number for addition/subtraction
        if (tokens.length > 0 && isNaN(parseFloat(tokens[0]))) {
            throw new Error('Expression must start with a number');
        }
        
        // Then evaluate addition and subtraction
        let result = parseFloat(tokens[0]);
        for (let i = 1; i < tokens.length; i += 2) {
            console.log('Processing addition/subtraction:', result, tokens[i], tokens[i+1]);
            if (!operators[tokens[i]]) {
                throw new Error('Invalid operator: ' + tokens[i]);
            }
            result = operators[tokens[i]](result, parseFloat(tokens[i+1]));
            console.log('Current result:', result);
        }
        
        // Check for invalid result
        if (isNaN(result) || !isFinite(result)) {
            throw new Error('Invalid result');
        }
        
        console.log('Final result:', result);
        return Math.round(result * 1000) / 1000; // Round to 3 decimal places
        
    } catch (error) {
        console.error('Expression evaluation error:', error.message);
        return 'Error: ' + error.message;
    }
}

// Add keyboard event listener for 'T' key and text input
document.addEventListener('keydown', (e) => {
    // Toggle text input mode with 'T' key
    if (e.key.toLowerCase() === 't' && !isTyping) {
        isTyping = true;
        drawing = false; // Disable drawing while typing
        overlayCanvas.style.cursor = 'text';
        // Center initial cursor position
        textX = overlayCanvas.width / 2;
        textY = overlayCanvas.height / 2;
        console.log("Text input mode activated");
        return;
    }

    // Handle text input when in typing mode
    if (isTyping) {
        const ctx = overlayCanvas.getContext('2d');
        ctx.font = '24px Arial'; // Larger font size
        ctx.fillStyle = color;
        ctx.textAlign = 'center'; // Center align text
        ctx.textBaseline = 'middle'; // Vertically center text

        // Handle Escape key to exit text mode
        if (e.key === 'Escape') {
            isTyping = false;
            currentText = '';
            overlayCanvas.style.cursor = 'default';
            console.log("Text input mode deactivated");
            return;
        }

        // Handle Backspace
        if (e.key === 'Backspace') {
            if (currentText.length > 0) {
                // Clear the text area
                const textMetrics = ctx.measureText(currentText);
                ctx.clearRect(
                    textX - textMetrics.width/2 - 10,
                    textY - 30,
                    textMetrics.width + 20,
                    60
                );
                currentText = currentText.slice(0, -1);
                // Redraw the text
                ctx.fillText(currentText + '|', textX, textY);
            }
            e.preventDefault();
            return;
        }

        // Handle Enter key to evaluate expression and show result
        if (e.key === 'Enter' && isTyping) {
            if (currentText.length > 0) {
                try {
                    // Check if the text looks like a mathematical expression
                    if (/[\d+\-*/^()]/.test(currentText)) {
                        console.log('Attempting to evaluate expression:', currentText);
                        const result = evaluateExpression(currentText);
                        
                        // Clear the current text area
                        const textMetrics = ctx.measureText(currentText);
                        ctx.clearRect(
                            textX - textMetrics.width/2 - 10,
                            textY - 30,
                            textMetrics.width + 20,
                            60
                        );
                        
                        // Show expression and result
                        const finalText = typeof result === 'string' && result.startsWith('Error') 
                            ? result  // Show error message
                            : `${currentText} = ${result}`; // Show calculation
                        
                        ctx.fillText(finalText, textX, textY);
                        console.log('Displayed result:', finalText);
                    } else {
                        // Not a mathematical expression, just display the text
                        ctx.fillText(currentText, textX, textY);
                    }
                    
                    currentText = '';
                    textY += 40; // Move down for next input
                    
                } catch (error) {
                    console.error('Error handling expression:', error);
                    ctx.fillText('Error in calculation', textX, textY);
                    currentText = '';
                    textY += 40;
                }
            }
            return;
        }

        // Handle regular text input
        if (e.key.length === 1) {
            // Clear previous text and cursor
            const textMetrics = ctx.measureText(currentText);
            ctx.clearRect(
                textX - textMetrics.width/2 - 10,
                textY - 30,
                textMetrics.width + 20,
                60
            );
            currentText += e.key;
            // Draw updated text with cursor
            ctx.fillText(currentText + '|', textX, textY);
        }
    }
});

// Add click handler for text placement
overlayCanvas.addEventListener('click', (e) => {
    if (isTyping) {
        textX = e.offsetX;
        textY = e.offsetY;
        currentText = '';
        
        // Show initial cursor
        const ctx = overlayCanvas.getContext('2d');
        ctx.font = '24px Arial';
        ctx.fillStyle = color;
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText('|', textX, textY);
    }
});

// Update voice commands to include text mode
recognition.onresult = (event) => {
    const now = Date.now();
    if (now - lastCommandTime < COMMAND_DEBOUNCE) return;
    
    const command = event.results[event.results.length - 1][0].transcript.trim().toLowerCase();
    console.log(`Voice command received: ${command}`);

    lastCommandTime = now;

    if (command === "start drawing") {
        drawing = true;
        isTyping = false; // Disable text mode when drawing
        console.log("Drawing started");
    }
    if (command === "stop drawing") {
        drawing = false;
        console.log("Drawing stopped");
    }
    if (command === "start typing") {
        isTyping = true;
        drawing = false;
        overlayCanvas.style.cursor = 'text';
        console.log("Text input mode activated");
    }
    if (command === "stop typing") {
        isTyping = false;
        currentText = '';
        overlayCanvas.style.cursor = 'default';
        console.log("Text input mode deactivated");
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

    // AI Object Drawing with optimized animation
    for (let object in aiDrawingTemplates) {
        if (command === `draw ${object}`) {
            overlayCtx.clearRect(0, 0, overlayCanvas.width, overlayCanvas.height);
            path = [];
            aiDrawing = true;
            drawing = true;
            aiDrawingGenerator = drawObject(aiDrawingTemplates[object]);
            
            // Optimize animation frame rate
            let lastFrameTime = 0;
            const FRAME_INTERVAL = 1000 / 30; // 30 FPS
            
            function animateDrawing(timestamp) {
                if (lastFrameTime === 0) lastFrameTime = timestamp;
                const elapsed = timestamp - lastFrameTime;
                
                if (elapsed >= FRAME_INTERVAL) {
                    if (!aiDrawingGenerator.next().done) {
                        lastFrameTime = timestamp;
                        requestAnimationFrame(animateDrawing);
                    }
                } else {
                    requestAnimationFrame(animateDrawing);
                }
            }
            
            requestAnimationFrame(animateDrawing);
            break;
        }
    }
};

// Start recognition with error handling
try {
    recognition.start();
} catch (e) {
    console.error("Error starting recognition:", e);
    // Retry after a short delay
    setTimeout(() => {
        try {
            recognition.start();
        } catch (e) {
            console.error("Failed to start recognition after retry:", e);
            restartRecognition();
        }
    }, 1000);
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

function checkForHeart() {
    if (path.length < 30) return; // Minimum strokes required

    let minX = Math.min(...path.map(p => p.x));
    let maxX = Math.max(...path.map(p => p.x));
    let minY = Math.min(...path.map(p => p.y));
    let maxY = Math.max(...path.map(p => p.y));

    let width = maxX - minX;
    let height = maxY - minY;
    let aspectRatio = width / height;

    if (color !== "pink") return;

    // Check for a circle (roughly equal width & height)
    if (aspectRatio >= 0.8 && aspectRatio <= 1.2 && width >= 30 && height >= 30) {
        console.log("⭕ Pink Circle Detected! Playing Sound...");
        heartSound.play().catch(e => console.log("Sound play blocked:", e));
        path = [];
        return;
    }

    // Check for a heart shape (wider aspect ratio tolerance)
    if (aspectRatio >= 0.4 && aspectRatio <= 1.7 && width >= 30 && height >= 30) {
        let centerX = (minX + maxX) / 2;
        let leftSide = path.filter(p => p.x < centerX);
        let rightSide = path.filter(p => p.x > centerX);

        if (Math.abs(leftSide.length - rightSide.length) > 50) return;

        let bottomPoint = path.reduce((a, b) => (a.y > b.y ? a : b));
        if (bottomPoint.y < maxY - 25) return; // Increased tolerance for imperfect bottom

        console.log("💖 Pink Heart Detected! Playing Sound...");
        heartSound.play().catch(e => console.log("Sound play blocked:", e));
        
        path = [];
    }
}

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
