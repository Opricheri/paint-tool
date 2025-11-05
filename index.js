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
currentPenSize.value = penSizeValue.toFixed(1);

penSize.addEventListener('input', () => {
    const value = sliderToPenSize(penSize.value);
    currentPenSize.value = value.toFixed(1);
    penSizeValue = value;
});

currentPenSize.addEventListener('input', (e) => {
    penSizeValue = e.target.value;
})

const penSizeButtons = document.querySelectorAll('#penSizeSelector button');


penSizeButtons.forEach(btn => {
    btn.addEventListener('click', () => {
        const size = parseFloat(btn.dataset.size);
        penSizeValue = size;

        // スライダーも更新
        penSize.value = penSizeToSlider(size);
        currentPenSize.value = size.toFixed(1);
    });
});


const penColorInput = document.getElementById('penColor');
const colorPreview = document.getElementById("colorPreview");
const colorCode = document.getElementById('colorCode');
const colorSelector = document.getElementById('colorSelector');

colorPreview.style.backgroundColor = penColorInput.value;


// For Safari
colorPreview.addEventListener("click", () => {
  penColorInput.click();
});
colorPreview.addEventListener("touchstart", () => {
  penColorInput.click();
});
//

penColorInput.addEventListener("input", (e) => {
    const color = e.target.value;
    colorPreview.style.backgroundColor = color;
    colorCode.textContent = color;
});

colorSelector.addEventListener('change', function () {
    const color = this.value;
    penColorInput.value = color;  // カラーピッカーと同期
    colorPreview.style.backgroundColor = color;
    colorCode.textContent = color;
});




const layers = [];
let tool = 'pen';
let currentLayerIndex = 0;
let drawing = false;
let lastX, lastY;

const currentPen = document.getElementById("currentPen");

const penBtn = document.getElementById('penBtn');
const eraserBtn = document.getElementById('eraserBtn');
const brushBtn = document.getElementById('brushBtn');
const sprayBtn = document.getElementById('sprayBtn');
const moveBtn = document.getElementById('moveBtn');

const brushes = [penBtn, eraserBtn, brushBtn, sprayBtn, moveBtn];

function setActiveBrush(selectedBrush) {
    brushes.forEach(brush => brush.classList.remove('active'));
    selectedBrush.classList.add('active');
}

function setActiveTool(tool) {
    if (tool === 'move') {
        container.classList.add('move-cursor');
    } else {
        container.classList.remove('move-cursor');
    }
    currentPen.textContent = tool.charAt(0).toUpperCase() + tool.slice(1);
}

moveBtn.addEventListener('click', () => setActiveTool('move'));
penBtn.addEventListener('click', () => setActiveTool('pen'));


penBtn.addEventListener('click', () => {
    currentPen.textContent = 'Pen';
    tool = 'pen';
    setActiveBrush(penBtn);
})

eraserBtn.addEventListener('click', () => {
    currentPen.textContent = 'Eraser';
    tool = 'eraser';
    setActiveBrush(eraserBtn);
})

brushBtn.addEventListener('click', () => {
    currentPen.textContent = 'Brush';
    tool = 'brush';
    setActiveBrush(brushBtn);
})

sprayBtn.addEventListener('click', () => {
    currentPen.textContent = 'Spray';
    tool = 'spray';
    setActiveBrush(sprayBtn);
})

moveBtn.addEventListener('click', () => {
    currentPen.textContent = 'Move';
    tool = 'move';
    setActiveBrush(moveBtn);
})



setActiveBrush(penBtn);




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


const layerEffectsSelect = document.getElementById('layerEffects');

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

    const seg = { x1: lastX, y1: lastY, x2: x, y2: y, width: pressure * penSizeValue };
    strokeSegments.push(seg);

    const ctx = layers[currentLayerIndex].ctx;

    ctx.beginPath();
    ctx.moveTo(seg.x1, seg.y1);
    ctx.lineTo(seg.x2, seg.y2);
    ctx.lineWidth = seg.width;
    ctx.lineCap = "round";
    ctx.lineJoin = "round";

    switch (tool) {
        case 'pen':
            ctx.globalCompositeOperation = 'source-over';
            ctx.fillStyle = penColorInput.value;
            ctx.strokeStyle = penColorInput.value;
            drawTexturedBrush(ctx, seg.x1, seg.y1, seg.x2, seg.y2, seg.width, { density: 1, shape: 'circle', scatter: 0.1 });
            break;
        case 'eraser':
            ctx.globalCompositeOperation = 'destination-out';
            ctx.strokeStyle = 'rgba(0,0,0,1)';
            drawTexturedBrush(ctx, seg.x1, seg.y1, seg.x2, seg.y2, seg.width, { density: 1, shape: 'circle', scatter: 1 });
            break;
        case 'brush':
            ctx.globalCompositeOperation = 'source-over';
            ctx.fillStyle = penColorInput.value;
            ctx.strokeStyle = penColorInput.value;
            drawTexturedBrush(ctx, seg.x1, seg.y1, seg.x2, seg.y2, seg.width);
            break;
        case 'spray':
            ctx.globalCompositeOperation = 'source-over';
            ctx.fillStyle = penColorInput.value;
            ctx.strokeStyle = penColorInput.value;
            drawTexturedBrush(ctx, seg.x1, seg.y1, seg.x2, seg.y2, seg.width, { density: 20, shape: 'triangle', scatter: 30 });
            break;
    }

    lastX = x;
    lastY = y;

    renderAllLayers();
}

function endDraw() {
    drawing = false;
    strokeSegments = [];
    lastX = undefined;
    lastY = undefined;
    renderAllLayers();
}



/**
 * drawTexturedBrush
 * @param {CanvasRenderingContext2D} ctx
 * @param {number} x1 - 始点X
 * @param {number} y1 - 始点Y
 * @param {number} x2 - 終点X
 * @param {number} y2 - 終点Y
 * @param {number} width - ブラシ幅
 * @param {object} options - ブラシオプション
 *    options.density: 点の密度 (1~10くらい)
 *    options.shape: 'circle' | 'square'
 *    options.scatter: 散布範囲 (px)
 */
function drawTexturedBrush(ctx, x1, y1, x2, y2, width, options = {}) {
    const density = options.density || 5;
    const shape = options.shape || 'circle';
    const scatter = options.scatter || 2;

    // 線分の長さを計算
    const dx = x2 - x1;
    const dy = y2 - y1;
    const distance = Math.sqrt(dx * dx + dy * dy);

    for (let i = 0; i < distance; i += 1) {
        // 線上の位置
        const t = i / distance;
        const x = x1 + dx * t;
        const y = y1 + dy * t;

        // 点を複数配置
        for (let j = 0; j < density; j++) {
            const offsetX = (Math.random() - 0.5) * width * scatter;
            const offsetY = (Math.random() - 0.5) * width * scatter;

            if (shape === 'circle') {
                ctx.beginPath();
                ctx.arc(x + offsetX, y + offsetY, width / 2, 0, Math.PI * 2);
                ctx.fill();
            } else if (shape === 'square') {
                ctx.fillRect(x + offsetX - width / 2, y + offsetY - width / 2, width, width);
            } else if (shape === 'triangle') {
                const px = x + offsetX;
                const py = y + offsetY;
                const height = width * Math.sqrt(3) / 2; // 正三角形の高さ
                ctx.beginPath();
                ctx.moveTo(px, py - height / 2);          // 上の頂点
                ctx.lineTo(px - width / 2, py + height / 2); // 左下
                ctx.lineTo(px + width / 2, py + height / 2); // 右下
                ctx.closePath();
                ctx.fill();
            }
        }
    }
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
    const container = document.querySelector('.canvas-container');

    const canvasWidth = displayCanvas.width * zoom;
    const canvasHeight = displayCanvas.height * zoom;

    const minOffsetX = Math.min(0, container.clientWidth - canvasWidth);
    const minOffsetY = Math.min(0, container.clientHeight - canvasHeight);
    const maxOffsetX = Math.max(0, canvasWidth - container.clientWidth);
    const maxOffsetY = Math.max(0, canvasHeight - container.clientHeight);

    offsetX = Math.min(Math.max(offsetX, minOffsetX), maxOffsetX);
    offsetY = Math.min(Math.max(offsetY, minOffsetY), maxOffsetY);

    const transform = `translate(${-offsetX}px, ${-offsetY}px) scale(${zoom})`;
    displayCanvas.style.transform = transform;
    layers.forEach(layer => layer.canvas.style.transform = transform);
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



displayCanvas.addEventListener('pointerdown', (e) => {
    if (tool === 'move') {
        isPanning = true;
        drawing = false;
        startPanX = e.clientX;
        startPanY = e.clientY;
    } else {
        startDraw(e);
    }
});

displayCanvas.addEventListener('pointermove', (e) => {
    if (isPanning && tool === 'move') {
        offsetX -= (e.clientX - startPanX) / zoom;
        offsetY -= (e.clientY - startPanY) / zoom;
        startPanX = e.clientX;
        startPanY = e.clientY;
        updateZoom();
    } else if (drawing) {
        draw(e);
    }
});

displayCanvas.addEventListener('pointerup', () => {
    if (tool === 'move') isPanning = false;
    else endDraw();
});
displayCanvas.addEventListener('pointerleave', () => {
    if (tool === 'move') isPanning = false;
    else endDraw();
});



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
    reader.onload = function (event) {
        const img = new Image();
        img.onload = function () {
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


[bgCanvas, displayCanvas, ...layers.map(l => l.canvas)].forEach(c => {
    c.addEventListener('contextmenu', e => e.preventDefault());
});


document.addEventListener('contextmenu', e => e.preventDefault());
displayCanvas.addEventListener('contextmenu', e => e.preventDefault());
displayCanvas.addEventListener('pointerdown', e => e.preventDefault());
displayCanvas.addEventListener('pointermove', e => e.preventDefault());

// 最初のレイヤー追加
addLayer();
