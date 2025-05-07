const canvas = document.getElementById('rouletteCanvas');
const ctx = canvas.getContext('2d');
const spinButton = document.getElementById('spinButton');
const updateWheelButton = document.getElementById('updateWheelButton');
const winnerDisplay = document.getElementById('winnerDisplay');
const segmentInputsContainer = document.getElementById('segmentInputs');

const addSegmentButton = document.getElementById('addSegmentButton');
const removeSegmentButton = document.getElementById('removeSegmentButton');
const numSegmentsInput = document.getElementById('numSegmentsInput');

const wheelRadius = 200;
const innerRadiusFraction = 0.2;

canvas.width = wheelRadius * 2;
canvas.height = wheelRadius * 2;

const segmentColors = [
    '#4285F4', '#DB4437', '#F4B400', '#0F9D58', // Google Colors
    '#7F4FC9', '#FF6D00', '#00ACC1', '#FF4081', // Some more vibrant colors
    '#4E342E', '#546E7A'
];

const initialTexts = [
    "???", "evento de games", "davi brito", "serie do momento", "filme do momento",
    "???", "???", "covaco", "???", "pé em pé"
];

let numSegments = 10;
const MIN_SEGMENTS = 2;
const MAX_SEGMENTS = 30; // Max reasonable segments for visibility

let segmentTexts = [];
let currentRotation = 0;
let isSpinning = false;

function initializeSegmentTexts() {
    const currentTextCount = segmentTexts.length;
    if (numSegments > currentTextCount) {
        for (let i = currentTextCount; i < numSegments; i++) {
            segmentTexts.push(initialTexts[i] || `Option ${i + 1}`);
        }
    } else if (numSegments < currentTextCount) {
        segmentTexts.splice(numSegments); // Remove excess texts from the end
    }
    // Ensure segmentTexts has exactly numSegments items, filling with defaults if needed
    while(segmentTexts.length < numSegments) {
        segmentTexts.push(`Option ${segmentTexts.length + 1}`);
    }
    if (segmentTexts.length > numSegments) {
        segmentTexts = segmentTexts.slice(0, numSegments);
    }
}


function updateSegmentCountButtons() {
    numSegmentsInput.value = numSegments;
    addSegmentButton.disabled = numSegments >= MAX_SEGMENTS;
    removeSegmentButton.disabled = numSegments <= MIN_SEGMENTS;
}

function handleAddSegment() {
    if (numSegments < MAX_SEGMENTS) {
        numSegments++;
        segmentTexts.push(`Option ${numSegments}`); // Add new default text
        updateAllUI();
    }
}

function handleRemoveSegment() {
    if (numSegments > MIN_SEGMENTS) {
        numSegments--;
        segmentTexts.pop(); // Remove last text
        updateAllUI();
    }
}

function createInputFields() {
    segmentInputsContainer.innerHTML = ''; // Clear existing
    for (let i = 0; i < numSegments; i++) {
        const div = document.createElement('div');
        div.classList.add('segment-input-item');

        const label = document.createElement('label');
        label.textContent = `Segment ${i + 1}:`;
        label.htmlFor = `segment${i}`;

        const input = document.createElement('input');
        input.type = 'text';
        input.id = `segment${i}`;
        input.value = segmentTexts[i] || `Segment ${i+1}`; // Fallback if text is missing
        input.dataset.index = i;

        div.appendChild(label);
        div.appendChild(input);
        segmentInputsContainer.appendChild(div);
    }
}

function updateSegmentTextsFromInputs() {
    const inputs = segmentInputsContainer.querySelectorAll('input');
    const newTexts = [];
    inputs.forEach(input => {
        newTexts[input.dataset.index] = input.value;
    });
    segmentTexts = newTexts; // Update the main array
    // Ensure segmentTexts array has the correct length, even if inputs were weird
    while(segmentTexts.length < numSegments) segmentTexts.push(`Option ${segmentTexts.length + 1}`);
    if(segmentTexts.length > numSegments) segmentTexts = segmentTexts.slice(0, numSegments);
    
    drawWheel(); // Redraw with new texts
}


function getFittedFontSize(text, segmentAngle, availableWidth) {
    let fontSize = 18; // Max font size (reduced a bit for more segments)
    const minFontSize = 7;
    ctx.font = `${fontSize}px Arial`;
    let textWidth = ctx.measureText(text).width;

    while (textWidth > availableWidth && fontSize > minFontSize) {
        fontSize -= 1;
        ctx.font = `${fontSize}px Arial`;
        textWidth = ctx.measureText(text).width;
    }
    // If still too wide even at minFontSize, it will overflow. Could add truncation here.
    // e.g., if (textWidth > availableWidth && text.length > 5) text = text.substring(0, Math.floor(text.length * availableWidth / textWidth) - 3) + "...";
    return fontSize;
}

function drawWheel() {
    if (numSegments === 0) return; // Should not happen with MIN_SEGMENTS
    const anglePerSegment = (2 * Math.PI) / numSegments;
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    for (let i = 0; i < numSegments; i++) {
        const startAngle = i * anglePerSegment;
        const endAngle = (i + 1) * anglePerSegment;

        ctx.beginPath();
        ctx.moveTo(wheelRadius, wheelRadius);
        ctx.arc(wheelRadius, wheelRadius, wheelRadius, startAngle, endAngle);
        ctx.closePath();
        ctx.fillStyle = segmentColors[i % segmentColors.length];
        ctx.fill();
        ctx.strokeStyle = '#333';
        ctx.lineWidth = (numSegments > 15) ? 1 : 2; // Thinner lines for more segments
        ctx.stroke();

        ctx.save();
        ctx.translate(wheelRadius, wheelRadius);
        ctx.rotate(startAngle + anglePerSegment / 2);

        const text = segmentTexts[i] || "";
        // More conservative text radius and available width as segments get smaller
        const textRadiusOuterMargin = (numSegments > 12) ? 0.15 : 0.1;
        const textRadiusFactor = (numSegments > 18) ? 0.60 : 0.7;

        const textRadius = wheelRadius * (1 - innerRadiusFraction - textRadiusOuterMargin) * textRadiusFactor;
        const availableTextWidth = (wheelRadius * (1 - innerRadiusFraction) - (wheelRadius * innerRadiusFraction)) * 0.85 - (numSegments > 10 ? 10 : 0);

        const fontSize = getFittedFontSize(text, anglePerSegment, availableTextWidth);
        ctx.font = `bold ${fontSize}px Arial`;
        ctx.fillStyle = 'white';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        
        ctx.fillText(text, textRadius, 0);
        ctx.restore();
    }

    ctx.beginPath();
    ctx.arc(wheelRadius, wheelRadius, wheelRadius * innerRadiusFraction, 0, 2 * Math.PI);
    ctx.fillStyle = 'white';
    ctx.fill();
    ctx.strokeStyle = '#ccc';
    ctx.lineWidth = 3;
    ctx.stroke();
}


function spin() {
    if (isSpinning || numSegments < MIN_SEGMENTS) return;
    isSpinning = true;
    spinButton.disabled = true;
    winnerDisplay.textContent = "Spinning...";

    const fullSpins = Math.floor(Math.random() * 3) + 4;
    const randomExtraRotation = Math.random() * 360;
    const totalRotationDegrees = (fullSpins * 360) + randomExtraRotation;
    
    const finalRotationStyle = currentRotation + totalRotationDegrees;
    
    canvas.style.transition = 'transform 5s cubic-bezier(0.15, 0.45, 0.35, 1)';
    canvas.style.transform = `rotate(${finalRotationStyle}deg)`;

    setTimeout(() => {
        currentRotation = finalRotationStyle % 360;
        
        let effectiveAngle = (360 - (currentRotation % 360) + 270) % 360;
        
        const anglePerSegmentDegrees = 360 / numSegments;
        const winnerIndex = Math.floor(effectiveAngle / anglePerSegmentDegrees);
        
        // Ensure winnerIndex is within bounds, especially if numSegments changed during spin (should not happen)
        const safeWinnerIndex = Math.max(0, Math.min(winnerIndex, numSegments - 1));

        winnerDisplay.textContent = `Winner: ${segmentTexts[safeWinnerIndex] || 'N/A'}`;
        isSpinning = false;
        spinButton.disabled = false;
        
    }, 5000);
}

function updateAllUI() {
    updateSegmentCountButtons();
    createInputFields();
    drawWheel();
}

// Event Listeners
spinButton.addEventListener('click', spin);
updateWheelButton.addEventListener('click', () => {
    updateSegmentTextsFromInputs(); // This already calls drawWheel
});
addSegmentButton.addEventListener('click', handleAddSegment);
removeSegmentButton.addEventListener('click', handleRemoveSegment);

// Initial setup
function init() {
    numSegments = parseInt(numSegmentsInput.value) || 10;
    if (numSegments < MIN_SEGMENTS) numSegments = MIN_SEGMENTS;
    if (numSegments > MAX_SEGMENTS) numSegments = MAX_SEGMENTS;
    
    initializeSegmentTexts(); // Populate segmentTexts based on initial numSegments and initialTexts
    updateAllUI();
}

init();