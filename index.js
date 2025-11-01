const container = document.querySelector(".canvas-container");
const bgCanvas = document.getElementById("bg");
const bgCtx = bgCanvas.getContext("2d");

bgCtx.fillStyle = "#fff";
bgCtx.fillRect(0, 0, bgCanvas.width, bgCanvas.height);

const layers = [];
let tool = 'pen';
let currentLayerIndex = 0;
let drawing = false;
let lastX, lastY;

const penColorInput = document.getElementById('penColor');
const layerEffectsSelect = document.getElementById('layerEffects');

document.getElementById('penBtn').addEventListener('click', () => tool = 'pen');
document.getElementById('eraserBtn').addEventListener('click', () => tool = 'eraser');

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
        document.querySelectorAll('#layerContainer button').forEach((btn, i) => {
            btn.classList.toggle('active', i === index);
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
    layerContainer.appendChild(btn);
}

// === 描画関連 ===
function getPos(e, canvas) {
    const rect = canvas.getBoundingClientRect();
    return { x: e.clientX - rect.left, y: e.clientY - rect.top };
}

function startDraw(e) {
    drawing = true;
    const pos = getPos(e, displayCanvas);
    lastX = pos.x;
    lastY = pos.y;

    const ctx = layers[currentLayerIndex].ctx;
    ctx.beginPath();
    ctx.moveTo(lastX, lastY); // ストローク開始位置
}

function draw(e) {
    if (!drawing) return;

    const ctx = layers[currentLayerIndex].ctx;
    const { x, y } = getPos(e, displayCanvas);
    const pressure = e.pressure || 0.5;

    ctx.lineCap = "round";
    ctx.lineJoin = "round";
    ctx.lineWidth = pressure * 8;

    if (tool === 'pen') {
        ctx.globalCompositeOperation = 'source-over';
        ctx.strokeStyle = penColorInput.value;
    } else if (tool === 'eraser') {
        ctx.globalCompositeOperation = 'destination-out'; // 消しゴムモード
        ctx.strokeStyle = 'rgba(0,0,0,1)'; // 実際の色は関係ない
    }
    
    ctx.lineTo(x, y);
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

// 最初のレイヤー追加
addLayer();
