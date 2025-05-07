const canvas = document.getElementById('rouletteCanvas');
const ctx = canvas.getContext('2d');
const spinButton = document.getElementById('spinButton');
const updateWheelButton = document.getElementById('updateWheelButton');
const winnerDisplay = document.getElementById('winnerDisplay');
const segmentInputsContainer = document.getElementById('segmentInputs');

const addSegmentButton = document.getElementById('addSegmentButton');
const removeSegmentButton = document.getElementById('removeSegmentButton');
const numSegmentsInput = document.getElementById('numSegmentsInput');

console.log("Script loaded.");
console.log("Add button:", addSegmentButton);
console.log("Remove button:", removeSegmentButton);
console.log("Num segments input:", numSegmentsInput);


const wheelRadius = 200;
const innerRadiusFraction = 0.2;

canvas.width = wheelRadius * 2;
canvas.height = wheelRadius * 2;

const segmentColors = [
    '#4285F4', '#DB4437', '#F4B400', '#0F9D58',
    '#7F4FC9', '#FF6D00', '#00ACC1', '#FF4081',
    '#4E342E', '#546E7A', '#C2185B', '#7CB342',
    '#5E35B1', '#039BE5', '#FDD835', '#FB8C00',
    '#8D6E63', '#37474F', '#AD1457', '#689F38' // Added more colors for more segments
];


const initialTexts = [
    "???", "evento de games", "davi brito", "serie do momento", "filme do momento",
    "???", "???", "covaco", "???", "pé em pé"
];

let numSegments = 10; // Default, will be set by init
const MIN_SEGMENTS = 2;
const MAX_SEGMENTS = 30;

let segmentTexts = [];
let currentRotation = 0;
let isSpinning = false;

function initializeSegmentTexts() {
    console.log(`Initializing segment texts for ${numSegments} segments.`);
    segmentTexts = []; // Start fresh
    for (let i = 0; i < numSegments; i++) {
        // Use initialTexts if available, otherwise default
        // This ensures initialTexts are used for the first few segments if numSegments is small
        // or padded if numSegments is large
        segmentTexts.push(initialTexts[i] !== undefined ? initialTexts[i] : `Option ${i + 1}`);
    }
    // If numSegments was changed and initialTexts is no longer relevant for all, ensure correct length
    while (segmentTexts.length < numSegments) {
        segmentTexts.push(`Option ${segmentTexts.length + 1}`);
    }
    if (segmentTexts.length > numSegments) {
        segmentTexts = segmentTexts.slice(0, numSegments);
    }
    console.log("Initialized segmentTexts:", segmentTexts);
}


function updateSegmentCountButtons() {
    console.log(`Updating segment count buttons. Current numSegments: ${numSegments}`);
    numSegmentsInput.value = numSegments;
    addSegmentButton.disabled = numSegments >= MAX_SEGMENTS;
    removeSegmentButton.disabled = numSegments <= MIN_SEGMENTS;
    console.log(`Add button disabled: ${addSegmentButton.disabled}, Remove button disabled: ${removeSegmentButton.disabled}`);
}

function handleAddSegment() {
    console.log("handleAddSegment called.");
    if (numSegments < MAX_SEGMENTS) {
        numSegments++;
        segmentTexts.push(`Option ${numSegments}`);
        console.log(`Segment added. New numSegments: ${numSegments}, segmentTexts:`, segmentTexts);
        updateAllUI();
    } else {
        console.log("Cannot add segment, MAX_SEGMENTS reached.");
    }
}

function handleRemoveSegment() {
    console.log("handleRemoveSegment called.");
    if (numSegments > MIN_SEGMENTS) {
        numSegments--;
        segmentTexts.pop();
        console.log(`Segment removed. New numSegments: ${numSegments}, segmentTexts:`, segmentTexts);
        updateAllUI();
    } else {
        console.log("Cannot remove segment, MIN_SEGMENTS reached.");
    }
}

function createInputFields() {
    console.log(`Creating input fields for ${numSegments} segments.`);
    segmentInputsContainer.innerHTML = '';
    for (let i = 0; i < numSegments; i++) {
        const div = document.createElement('div');
        div.classList.add('segment-input-item');

        const label = document.createElement('label');
        label.textContent = `Segment ${i + 1}:`;
        label.htmlFor = `segment${i}`;

        const input = document.createElement('input');
        input.type = 'text';
        input.id = `segment${i}`;
        input.value = segmentTexts[i] !== undefined ? segmentTexts[i] : `Segment ${i+1}`;
        input.dataset.index = i;

        div.appendChild(label);
        div.appendChild(input);
        segmentInputsContainer.appendChild(div);
    }
    console.log("Input fields created.");
}

function updateSegmentTextsFromInputs() {
    console.log("Updating segment texts from inputs.");
    const inputs = segmentInputsContainer.querySelectorAll('input');
    const newTexts = [];
    inputs.forEach(input => {
        newTexts[parseInt(input.dataset.index)] = input.value; // Use parseInt for index
    });
    segmentTexts = newTexts;

    // Safeguard: ensure segmentTexts array has the correct length matching numSegments
    while(segmentTexts.length < numSegments) {
        segmentTexts.push(`Option ${segmentTexts.length + 1}`);
    }
    if(segmentTexts.length > numSegments) {
        segmentTexts = segmentTexts.slice(0, numSegments);
    }
    console.log("Segment texts updated from inputs:", segmentTexts);
    drawWheel();
}


function getFittedFontSize(text, segmentAngle, availableWidth) {
    let fontSize = 18;
    const minFontSize = 7;
    if (!text) text = ""; // Ensure text is not null/undefined

    // Reduce initial font size slightly if many segments
    if (numSegments > 15) fontSize = 14;
    if (numSegments > 20) fontSize = 12;


    ctx.font = `bold ${fontSize}px Arial`;
    let textWidth = ctx.measureText(text).width;

    while (textWidth > availableWidth && fontSize > minFontSize) {
        fontSize -= 1;
        ctx.font = `bold ${fontSize}px Arial`;
        textWidth = ctx.measureText(text).width;
    }
    return fontSize;
}

function drawWheel() {
    console.log(`Drawing wheel with ${numSegments} segments.`);
    if (numSegments < MIN_SEGMENTS) {
        console.error("Attempted to draw wheel with less than MIN_SEGMENTS.");
        return;
    }
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
        ctx.lineWidth = (numSegments > 15) ? 1 : 2;
        ctx.stroke();

        ctx.save();
        ctx.translate(wheelRadius, wheelRadius);
        ctx.rotate(startAngle + anglePerSegment / 2);

        const text = segmentTexts[i] !== undefined ? segmentTexts[i] : "";
        const textRadiusOuterMargin = (numSegments > 12) ? 0.15 : 0.1;
        const textRadiusFactor = (numSegments > 18) ? 0.60 : 0.7;

        const textRadius = wheelRadius * (1 - innerRadiusFraction - textRadiusOuterMargin) * textRadiusFactor;
        // Reduce available width more aggressively for more segments
        let availableTextWidthReduction = 0;
        if (numSegments > 10) availableTextWidthReduction += 10;
        if (numSegments > 20) availableTextWidthReduction += 10;


        const availableTextWidth = Math.max(10, (wheelRadius * (1 - innerRadiusFraction) - (wheelRadius * innerRadiusFraction)) * 0.80 - availableTextWidthReduction);


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
    console.log("Wheel drawn.");
}


function spin() {
    console.log("Spin initiated.");
    if (isSpinning || numSegments < MIN_SEGMENTS) {
        console.log(`Spin blocked. isSpinning: ${isSpinning}, numSegments: ${numSegments}`);
        return;
    }
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
        
        const safeWinnerIndex = Math.max(0, Math.min(winnerIndex, numSegments - 1));

        winnerDisplay.textContent = `Winner: ${segmentTexts[safeWinnerIndex] !== undefined ? segmentTexts[safeWinnerIndex] : 'N/A'}`;
        isSpinning = false;
        spinButton.disabled = false;
        console.log(`Spin finished. Winner: ${segmentTexts[safeWinnerIndex]}`);
        
    }, 5000);
}

function updateAllUI() {
    console.log("updateAllUI called.");
    updateSegmentCountButtons();
    createInputFields();
    drawWheel();
}

// Event Listeners
if (spinButton) spinButton.addEventListener('click', spin);
if (updateWheelButton) updateWheelButton.addEventListener('click', () => {
    console.log("Update Wheel Button clicked.");
    updateSegmentTextsFromInputs();
});

if (addSegmentButton) {
    addSegmentButton.addEventListener('click', handleAddSegment);
} else {
    console.error("Add Segment Button not found!");
}

if (removeSegmentButton) {
    removeSegmentButton.addEventListener('click', handleRemoveSegment);
} else {
    console.error("Remove Segment Button not found!");
}


// Initial setup
function init() {
    console.log("Initializing application.");
    numSegments = parseInt(numSegmentsInput.value);
    if (isNaN(numSegments) || numSegments < MIN_SEGMENTS) numSegments = MIN_SEGMENTS;
    if (numSegments > MAX_SEGMENTS) numSegments = MAX_SEGMENTS;
    numSegmentsInput.value = numSegments; // Ensure input reflects clamped value
    
    initializeSegmentTexts();
    updateAllUI();
    console.log("Initialization complete.");
}

// Ensure DOM is ready before running init, though script at end of body usually suffices
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
} else {
    init(); // DOMContentLoaded has already fired
}
