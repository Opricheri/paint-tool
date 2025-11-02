const container = document.querySelector(".canvas-container");
const bgCanvas = document.getElementById("bg");
const bgCtx = bgCanvas.getContext("2d");

bgCtx.fillStyle = "#fff";
bgCtx.fillRect(0, 0, bgCanvas.width, bgCanvas.height);

bgCanvas.width = 400 * 2;
bgCanvas.height = 400 * 2;
bgCanvas.style.width = '400px';
bgCanvas.style.height = '400px';
bgCtx.scale(2, 2);


const penSize = document.getElementById('penSize');
const currentPenSize = document.getElementById('currentPenSizeValue');

let penSizeValue = 10;


function sliderToPenSize(sliderValue) {
    // min 0.1, max 1000 の対数変換
    return Math.pow(10, sliderValue);
}

function penSizeToSlider(penSizeValue) {
    return Math.log10(penSizeValue);
}

penSize.value = penSizeToSlider(penSizeValue);
currentPenSize.textContent = penSizeValue.toFixed(1);

penSize.addEventListener('input', () => {
    const value = sliderToPenSize(penSize.value);
    currentPenSize.textContent = value.toFixed(1);
    penSizeValue = value;
});


const penSizeButtons = document.querySelectorAll('#penSizeSelector button');

penSizeButtons.forEach(btn => {
    btn.addEventListener('click', () => {
        const size = parseFloat(btn.dataset.size);
        penSizeValue = size;

        // スライダーも更新
        penSize.value = penSizeToSlider(size);
        currentPenSize.textContent = size.toFixed(1);
    });
});


const colorButtons = document.querySelectorAll('#colorSelector button');

colorButtons.forEach(btn => {
    btn.addEventListener('click', () => {
        const color = btn.getAttribute('data-color');
        penColorInput.value = color;  // カラーピッカーと同期
    });
});



const layers = [];
let tool = 'pen';
let currentLayerIndex = 0;
let drawing = false;
let lastX, lastY;

const currentPen = document.getElementById("currentPen");

const penColorInput = document.getElementById('penColor');
const layerEffectsSelect = document.getElementById('layerEffects');

document.getElementById('penBtn').addEventListener('click', () => {
    currentPen.textContent = 'Pen';
    tool = 'pen';
})

document.getElementById('eraserBtn').addEventListener('click', () => {
    currentPen.textContent = 'Eraser';
    tool = 'eraser';
})

// 表示用キャンバス（常に最前面）
const displayCanvas = document.createElement('canvas');
displayCanvas.width = bgCanvas.width;
displayCanvas.height = bgCanvas.height;
displayCanvas.style.position = 'absolute';
displayCanvas.style.top = 0;
displayCanvas.style.left = 0;
displayCanvas.style.zIndex = 999;
container.appendChild(displayCanvas);
const displayCtx = displayCanvas.getContext('2d');

// 描画イベントは表示用キャンバスで受け取る
displayCanvas.addEventListener("pointerdown", startDraw);
displayCanvas.addEventListener("pointermove", draw);
displayCanvas.addEventListener("pointerup", endDraw);
displayCanvas.addEventListener("pointerleave", endDraw);


// === レイヤー追加 ===
function addLayer() {
    const canvas = document.createElement("canvas");
    canvas.width = bgCanvas.width;
    canvas.height = bgCanvas.height;
    canvas.style.position = "absolute";
    canvas.style.top = 0;
    canvas.style.left = 0;
    canvas.style.zIndex = layers.length; // 描画用は表示順は任意
    container.appendChild(canvas);

    const ctx = canvas.getContext("2d");
    layers.push({ canvas, ctx, effect: 'source-over' });

    addLayerInContainer();
    setActiveLayer(layers.length - 1);
    renderAllLayers();
}

// === レイヤー操作 ===
function setActiveLayer(index) {
    if (index >= 0 && index < layers.length) {
        currentLayerIndex = index;

        const buttons = document.querySelectorAll('#layerContainer button');
        buttons.forEach((btn, i) => {
            const btnIndex = parseInt(btn.textContent.replace('レイヤー', ''));
            btn.classList.toggle('active', btnIndex === index);
        });

        layerEffectsSelect.value = layers[currentLayerIndex].effect;
    }
}

function addLayerInContainer() {
    const layerContainer = document.getElementById('layerContainer');
    const index = layers.length - 1;
    const btn = document.createElement('button');
    btn.textContent = `レイヤー${index}`;
    btn.addEventListener('click', () => setActiveLayer(index));
    layerContainer.insertBefore(btn, layerContainer.firstChild);
}

// === 描画関連 ===
let zoom = 1; // 現在の倍率

function getPos(e, canvas) {
    const rect = canvas.getBoundingClientRect();
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;
    return {
        x: (e.clientX - rect.left) * scaleX,
        y: (e.clientY - rect.top) * scaleY
    };
}

let strokeSegments = [];

function startDraw(e) {
    drawing = true;
    const pos = getPos(e, displayCanvas);
    lastX = pos.x;
    lastY = pos.y;
    strokeSegments = [];
}

function draw(e) {
    if (!drawing) return;

    const { x, y } = getPos(e, displayCanvas);
    const pressure = e.pressure || 0.5;

    strokeSegments.push({ x1: lastX, y1: lastY, x2: x, y2: y, width: pressure * penSizeValue })
    
    const ctx = layers[currentLayerIndex].ctx;
    const seg = strokeSegments[strokeSegments.length - 1];
    ctx.beginPath();
    ctx.moveTo(seg.x1, seg.y1);
    ctx.lineTo(seg.x2, seg.y2);
    ctx.lineWidth = seg.width;
    ctx.lineCap = "round";
    ctx.lineJoin = "round";
    
    if (tool === 'pen') {
        ctx.globalCompositeOperation = 'source-over';
        ctx.strokeStyle = penColorInput.value;
    } else if (tool === 'eraser') {
        ctx.globalCompositeOperation = 'destination-out'; // 消しゴムモード
        ctx.strokeStyle = 'rgba(0,0,0,1)'; // 実際の色は関係ない
    }
    
    ctx.stroke();
    
    lastX = x;
    lastY = y;

    renderAllLayers();
}

function endDraw() {
    drawing = false;
    lastX = undefined;
    lastY = undefined;
    renderAllLayers();
}

// === レイヤー効果変更 ===
layerEffectsSelect.addEventListener('change', () => {
    layers[currentLayerIndex].effect = layerEffectsSelect.value;
    renderAllLayers();
});

// === 全レイヤー描画（リアルタイム合成） ===
function renderAllLayers() {
    displayCtx.clearRect(0, 0, displayCanvas.width, displayCanvas.height);
    displayCtx.fillStyle = "#fff";
    displayCtx.fillRect(0, 0, displayCanvas.width, displayCanvas.height);

    layers.forEach(layer => {
        displayCtx.globalCompositeOperation = layer.effect || 'source-over';
        displayCtx.drawImage(layer.canvas, 0, 0);
    });

    displayCtx.globalCompositeOperation = 'source-over';
}


let offsetX = 0;
let offsetY = 0;

const zoomInBtn = document.getElementById('zoomIn');
const zoomOutBtn = document.getElementById('zoomOut');
const zoomLabel = document.getElementById('zoomLabel');

zoomInBtn.addEventListener('click', () => {
    zoom *= 1.1;  // 10%拡大
    updateZoom();
});

zoomOutBtn.addEventListener('click', () => {
    zoom /= 1.1;  // 10%縮小
    updateZoom();
});


function updateZoom() {
    // 最大表示サイズを親コンテナに合わせて補正
    const container = document.querySelector('.canvas-container');
    const maxOffsetX = Math.max(0, (displayCanvas.width * zoom - container.clientWidth));
    const maxOffsetY = Math.max(0, (displayCanvas.height * zoom - container.clientHeight));

    // オフセットを枠内に制限
    offsetX = Math.min(Math.max(offsetX, 0), maxOffsetX);
    offsetY = Math.min(Math.max(offsetY, 0), maxOffsetY);

    const transform = `translate(${-offsetX}px, ${-offsetY}px) scale(${zoom})`;

    displayCanvas.style.transform = transform;
    layers.forEach(layer => {
        layer.canvas.style.transform = transform;
    });
    bgCanvas.style.transform = transform;

    displayCanvas.style.transformOrigin = 'top left';
    layers.forEach(layer => layer.canvas.style.transformOrigin = 'top left');
    bgCanvas.style.transformOrigin = 'top left';

    zoomLabel.textContent = Math.round(zoom * 100) + '%';
}

let isPanning = false;
let startPanX, startPanY;

displayCanvas.addEventListener('pointerdown', (e) => {
    if (e.shiftKey) { // Shift押しながらドラッグでパン
        isPanning = true;
        drawing = false;
        startPanX = e.clientX;
        startPanY = e.clientY;
    }
});

displayCanvas.addEventListener('pointermove', (e) => {
    if (isPanning) {
        offsetX -= (e.clientX - startPanX) / zoom;
        offsetY -= (e.clientY - startPanY) / zoom;
        startPanX = e.clientX;
        startPanY = e.clientY;
        updateZoom();
    }
});

displayCanvas.addEventListener('pointerup', () => isPanning = false);
displayCanvas.addEventListener('pointerleave', () => isPanning = false);



document.getElementById("saveJPG").addEventListener('click', () => {
    const dataURL = displayCanvas.toDataURL('image/jpeg', 1);

    const link = document.createElement('a');
    link.href = dataURL;
    link.download = 'undefined.jpg';
    link.click();
})


const loadImageInput = document.getElementById('loadImage');

loadImageInput.addEventListener('change', (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = function(event) {
        const img = new Image();
        img.onload = function() {
            // 現在のアクティブレイヤーに描画
            const ctx = layers[currentLayerIndex].ctx;
            ctx.clearRect(0, 0, ctx.canvas.width, ctx.canvas.height);
            ctx.drawImage(img, 0, 0, ctx.canvas.width, ctx.canvas.height);
            renderAllLayers();
        }
        img.src = event.target.result;
    }
    reader.readAsDataURL(file);
});


// 最初のレイヤー追加
addLayer();
