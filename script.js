const canvas = document.getElementById('rouletteCanvas');
const ctx = canvas.getContext('2d');
const spinButton = document.getElementById('spinButton');
const updateWheelButton = document.getElementById('updateWheelButton');
const winnerDisplay = document.getElementById('winnerDisplay');
const segmentInputsContainer = document.getElementById('segmentInputs');

const numSegments = 10;
const wheelRadius = 200; // Adjust size as needed
const innerRadiusFraction = 0.2; // How large the central white circle is

canvas.width = wheelRadius * 2;
canvas.height = wheelRadius * 2;

// Colors inspired by the image (Google-like colors)
const segmentColors = [
    '#4285F4', // Blue
    '#DB4437', // Red
    '#F4B400', // Yellow
    '#0F9D58', // Green
    '#4285F4',
    '#DB4437',
    '#F4B400',
    '#0F9D58',
    '#4285F4',
    '#DB4437'
];

let segmentTexts = [
    "Opção 1", "Opção 2", "Opção 3", "Opção 4", "Opção 5",
    "Opção 6", "Opção 7", "Opção 8", "Opção 9", "Opção 10"
];

// Initial texts from image (approximate)
const initialTexts = [
    "???", // Top green one, hard to read
    "evento de games",
    "davi brito",
    "serie do momento",
    "filme do momento",
    "???", // Bottom red one
    "???", // Bottom blue
    "covaco",
    "???", // Yellow left
    "pé em pé" // Red left
];
// Use initialTexts if you want to start with them
segmentTexts = [...initialTexts];


let currentRotation = 0;
let isSpinning = false;

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
        input.value = segmentTexts[i] || `Segment ${i+1}`;
        input.dataset.index = i;

        div.appendChild(label);
        div.appendChild(input);
        segmentInputsContainer.appendChild(div);
    }
}

function updateSegmentTextsFromInputs() {
    const inputs = segmentInputsContainer.querySelectorAll('input');
    inputs.forEach(input => {
        segmentTexts[input.dataset.index] = input.value;
    });
    drawWheel(); // Redraw with new texts
}

updateWheelButton.addEventListener('click', updateSegmentTextsFromInputs);

function getFittedFontSize(text, segmentAngle, availableWidth) {
    let fontSize = 20; // Max font size
    const minFontSize = 8;
    ctx.font = `${fontSize}px Arial`;
    let textWidth = ctx.measureText(text).width;

    // Reduce font size until text fits or minFontSize is reached
    while (textWidth > availableWidth && fontSize > minFontSize) {
        fontSize -= 1;
        ctx.font = `${fontSize}px Arial`;
        textWidth = ctx.measureText(text).width;
    }
    return fontSize;
}

function drawWheel() {
    const anglePerSegment = (2 * Math.PI) / numSegments;
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    for (let i = 0; i < numSegments; i++) {
        const startAngle = i * anglePerSegment;
        const endAngle = (i + 1) * anglePerSegment;

        // Draw segment
        ctx.beginPath();
        ctx.moveTo(wheelRadius, wheelRadius);
        ctx.arc(wheelRadius, wheelRadius, wheelRadius, startAngle, endAngle);
        ctx.closePath();
        ctx.fillStyle = segmentColors[i % segmentColors.length];
        ctx.fill();
        ctx.strokeStyle = '#333'; // Darker border for separation
        ctx.lineWidth = 2;
        ctx.stroke();

        // Draw text
        ctx.save();
        ctx.translate(wheelRadius, wheelRadius); // Move origin to center
        ctx.rotate(startAngle + anglePerSegment / 2); // Rotate to middle of segment

        const text = segmentTexts[i] || "";
        const textRadius = wheelRadius * (1 - innerRadiusFraction) * 0.7; // Position text radially
        
        // Estimate available width for text (chord length at textRadius, roughly)
        // This is a heuristic. A more precise calculation would involve arc length.
        const availableTextWidth = (wheelRadius * (1 - innerRadiusFraction) - (wheelRadius * innerRadiusFraction)) * 0.8;

        const fontSize = getFittedFontSize(text, anglePerSegment, availableTextWidth);
        ctx.font = `bold ${fontSize}px Arial`;
        ctx.fillStyle = 'white';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        
        // Draw text along the radial line, adjust x for better centering if needed
        ctx.fillText(text, textRadius, 0); 
        ctx.restore();
    }

    // Draw central white circle
    ctx.beginPath();
    ctx.arc(wheelRadius, wheelRadius, wheelRadius * innerRadiusFraction, 0, 2 * Math.PI);
    ctx.fillStyle = 'white';
    ctx.fill();
    ctx.strokeStyle = '#ccc';
    ctx.lineWidth = 3;
    ctx.stroke();
}


function spin() {
    if (isSpinning) return;
    isSpinning = true;
    spinButton.disabled = true;
    winnerDisplay.textContent = "Spinning...";

    // Calculate total rotation:
    // At least a few full spins + random additional rotation
    const fullSpins = Math.floor(Math.random() * 3) + 4; // 4-6 full spins
    const randomExtraRotation = Math.random() * 360; // Random stopping point
    const totalRotationDegrees = (fullSpins * 360) + randomExtraRotation;

    // Use a smooth transition (cubic-bezier matches the CSS one for consistency)
    // We'll apply this directly to the style for the animation.
    // The actual JS calculation will determine the *final* angle.
    
    const finalRotationStyle = currentRotation + totalRotationDegrees;
    
    canvas.style.transition = 'transform 5s cubic-bezier(0.15, 0.45, 0.35, 1)'; // Dynamic duration if needed
    canvas.style.transform = `rotate(${finalRotationStyle}deg)`;

    // After the CSS transition ends, calculate the winner
    setTimeout(() => {
        currentRotation = finalRotationStyle % 360; // Normalize current rotation
        
        // The pointer is at the top (270 degrees or -90 degrees in mathematical terms)
        // We need to find which segment aligns with this pointer.
        // The wheel rotation is clockwise.
        // A positive rotation means the top of the wheel moved clockwise.
        // So, the segment at the top is effectively at (360 - currentRotation) degrees, adjusted for the pointer's 270deg position.
        
        let effectiveAngle = (360 - (currentRotation % 360) + 270) % 360; // Pointer is at 270 deg (top)
        
        const anglePerSegmentDegrees = 360 / numSegments;
        const winnerIndex = Math.floor(effectiveAngle / anglePerSegmentDegrees);
        
        winnerDisplay.textContent = `Winner: ${segmentTexts[winnerIndex] || 'N/A'}`;
        isSpinning = false;
        spinButton.disabled = false;
        
        // Reset transition so next spin isn't affected by previous one if spin() is called rapidly
        // (though disabled button prevents this)
        // canvas.style.transition = 'none';

    }, 5000); // Match CSS transition duration
}

spinButton.addEventListener('click', spin);

// Initial setup
createInputFields();
drawWheel();
