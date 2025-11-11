import { saveTheme, loadTheme, toggleTheme, keyBindings } from "./config.js";

saveTheme();
loadTheme();

const themeBtn = document.getElementById("toggleTheme");
const themeIcon = document.getElementById("themeIcon");

function updateIcon(theme) {
  if (theme === "light") {
    themeIcon.classList.remove("fa-moon");
    themeIcon.classList.add("fa-sun");
  } else {
    themeIcon.classList.remove("fa-sun");
    themeIcon.classList.add("fa-moon");
  }
}

updateIcon(document.documentElement.getAttribute("data-theme"));

themeBtn.addEventListener("click", () => {
  toggleTheme();
  const currentTheme = document.documentElement.getAttribute("data-theme");
  updateIcon(currentTheme);
});




const container = document.querySelector(".canvas-container");
const bgCanvas = document.getElementById("bg");
const bgCtx = bgCanvas.getContext("2d");

const displayCanvas = document.createElement('canvas');
const displayCtx = displayCanvas.getContext('2d');

const createNewProjectModal = document.getElementById("createNewProject");
const createNewProjectBtn = document.getElementById("createNewProjectBtn");

function createNewProject() {
    const inputWidth = document.getElementById('canvasWidth');
    const inputHeight = document.getElementById('canvasHeight');

    createNewProjectBtn.addEventListener('click', () => {
        initCanvas(inputWidth.value, inputHeight.value);
        createNewProjectModal.classList.remove('active');
    });
}

function initCanvas(canvasWidth, canvasHeight) {
    bgCanvas.width = canvasWidth * 2;
    bgCanvas.height = canvasHeight * 2;
    bgCanvas.style.width = canvasWidth + 'px';
    bgCanvas.style.height = canvasHeight + 'px';
    bgCtx.scale(2, 2);
    bgCtx.fillStyle = "#fff";
    bgCtx.fillRect(0, 0, canvasWidth, canvasHeight);

    // 表示用キャンバス（常に最前面）
    displayCanvas.width = bgCanvas.width;
    displayCanvas.height = bgCanvas.height;
    displayCanvas.style.position = 'absolute';
    displayCanvas.style.top = 0;
    displayCanvas.style.left = 0;
    displayCanvas.style.zIndex = 999;
    displayCanvas.id = "displayCanvas";
    container.appendChild(displayCanvas);

    // 描画イベントは表示用キャンバスで受け取る
    displayCanvas.addEventListener("pointerdown", startDraw);
    displayCanvas.addEventListener("pointermove", draw);
    displayCanvas.addEventListener("pointerup", endDraw);
    displayCanvas.addEventListener("pointerleave", endDraw);

    addLayer();
}


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




let layers = [];
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
eraserBtn.addEventListener('click', () => setActiveTool('eraser'));
brushBtn.addEventListener('click', () => setActiveTool('brush'));
sprayBtn.addEventListener('click', () => setActiveTool('spray'));


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




// === レイヤー追加 ===

let layerIdCounter = 0;

export function addLayer() {
    const canvas = document.createElement("canvas");
    canvas.width = bgCanvas.width;
    canvas.height = bgCanvas.height;
    canvas.style.position = "absolute";
    canvas.style.top = 0;
    canvas.style.left = 0;
    canvas.style.zIndex = layers.length;
    container.appendChild(canvas);

    const ctx = canvas.getContext("2d");
    const layerName = `レイヤー${layerIdCounter++}`;

    // レイヤープロパティ
    layers.push({ canvas, ctx, effect: 'source-over', name: layerName, isVisible: true });

    container.appendChild(canvas);
    addLayerInContainer();
    setActiveLayer(layers.length - 1);
    renderAllLayers();
    saveHistory();
}

window.addLayer = addLayer;


const layerEffectsSelect = document.getElementById('layerEffects');

// === レイヤー操作 ===
function setActiveLayer(index) {
    if (index >= 0 && index < layers.length) {
        currentLayerIndex = index;

        const buttons = document.querySelectorAll('#layerContainer button');
        buttons.forEach((btn) => {
            const btnIndex = parseInt(btn.dataset.index);
            btn.classList.toggle('active', btnIndex === index);
        });

        layerEffectsSelect.value = layers[currentLayerIndex].effect;
    }
}

function moveCurrentLayerDown() {
    const index = currentLayerIndex;
    if (index <= 0) return;

    [layers[index - 1], layers[index]] = [layers[index], layers[index - 1]];

    currentLayerIndex = index - 1;

    reorderDOM();
    addLayerInContainer();
    setActiveLayer(currentLayerIndex);
    renderAllLayers();
    saveHistory();
}

function moveCurrentLayerUp() {
    const index = currentLayerIndex;
    if (index >= layers.length - 1) return;

    [layers[index], layers[index + 1]] = [layers[index + 1], layers[index]];

    currentLayerIndex = index + 1;

    reorderDOM();
    addLayerInContainer();
    setActiveLayer(currentLayerIndex);
    renderAllLayers();
    saveHistory();
}

function reorderDOM() {
    layers.forEach(layer => {
        container.appendChild(layer.canvas);
    });
}

function addLayerInContainer() {
    const layerContainer = document.getElementById('layerContainer');
    layerContainer.innerHTML = '';

    layers.forEach((layer, i) => {
        const div = document.createElement('div');
        const btn = document.createElement('button');
        const visibleBtn = document.createElement('button');

        div.className = "layer-content";

        btn.textContent = layer.name;
        btn.dataset.index = i;
        btn.onclick = () => setActiveLayer(i);
        btn.classList.toggle("active", i === currentLayerIndex);

        btn.ondblclick = () => {
            const input = document.createElement("input");
            input.type = "text";
            input.value = layer.name;
            input.className = "layer-edit-input";

            btn.replaceWith(input);
            input.focus();
            input.select();

            const finish = () => {
                layer.name = input.value;
                addLayerInContainer();
            };

            input.addEventListener("blur", finish);
            input.addEventListener("keydown", (e) => {
                if (e.key === "Enter") finish();
                if (e.key === "Escape") addLayerInContainer();
            });
        };

        visibleBtn.className = "visible-btn";
        visibleBtn.dataset.index = i;
        const iconClass = layer.isVisible ? "fa-solid fa-eye" : "fa-solid fa-eye-slash";
        visibleBtn.innerHTML = `<i class="${iconClass}"></i>`;
        if (!layer.isVisible) visibleBtn.classList.add("active");
        visibleBtn.onclick = () => toggleVisible(i);


        div.appendChild(btn);
        div.appendChild(visibleBtn);
        layerContainer.insertBefore(div, layerContainer.firstChild);
    });
}


export function deleteLayerFromContainer() {
    const index = currentLayerIndex;
    if (layers.length <= 1) {
        return;
    }

    container.removeChild(layers[index].canvas);
    layers.splice(index, 1);

    if (currentLayerIndex >= layers.length) {
        currentLayerIndex = layers.length - 1;
    } else if (currentLayerIndex > index) {
        currentLayerIndex -= 1;
    }

    addLayerInContainer();
    setActiveLayer(currentLayerIndex);
    renderAllLayers();
    saveHistory(layers);
}

window.deleteLayerFromContainer = deleteLayerFromContainer;

export function copyLayer() {
    const index = currentLayerIndex;
    const srcLayer = layers[index];

    if (!srcLayer) return;

    const newCanvas = document.createElement('canvas');
    newCanvas.width = srcLayer.canvas.width;
    newCanvas.height = srcLayer.canvas.height;
    newCanvas.style.position = 'absolute';
    newCanvas.style.top = 0;
    newCanvas.style.left = 0;
    newCanvas.style.zIndex = layers.length;
    newCanvas.style.transformOrigin = 'top left';
    container.appendChild(newCanvas);

    const newCtx = newCanvas.getContext('2d');

    newCtx.drawImage(srcLayer.canvas, 0, 0);

    const newLayer = {
        canvas: newCanvas,
        ctx: newCtx,
        effect: srcLayer.effect,
        name: srcLayer.name + ' コピー',
        isVisible: srcLayer.isVisible
    };

    if (newLayer.name.includes(" コピー")) {
        newLayer.name = srcLayer.name.replace(" コピー", "");
        newLayer.name = newLayer.name + ' コピー';
    };

    layers.splice(index + 1, 0, newLayer);

    reorderDOM();
    addLayerInContainer();
    setActiveLayer(index + 1);
    renderAllLayers();
    saveHistory();
}

window.copyLayer = copyLayer;


let history = [];
let historyIndex = -1;
const HISTORY_LIMIT = 30;

function saveHistory() {
    history = history.slice(0, historyIndex + 1);

    const snapshot = layers.map(layer => {
        return {
            imageData: layer.ctx.getImageData(0, 0, layer.canvas.width, layer.canvas.height),
            effect: layer.effect,
            name: layer.name,
            isVisible: layer.isVisible,
            width: layer.canvas.width,
            height: layer.canvas.height
        };
    });

    history.push(snapshot);
    historyIndex++;

    if (history.length > HISTORY_LIMIT + 1) {
        history.shift();
        historyIndex--;
    }
}

// undo
export function undo() {
    if (historyIndex <= 0) return;
    historyIndex--;

    const snapshot = history[historyIndex];

    layers.forEach(layer => container.removeChild(layer.canvas));
    layers = [];

    snapshot.forEach(savedLayer => {
        const newCanvas = document.createElement('canvas');
        newCanvas.width = savedLayer.width;
        newCanvas.height = savedLayer.height;
        newCanvas.style.position = 'absolute';
        newCanvas.style.top = 0;
        newCanvas.style.left = 0;
        newCanvas.style.zIndex = layers.length;
        container.appendChild(newCanvas);

        const newCtx = newCanvas.getContext('2d');
        newCtx.putImageData(savedLayer.imageData, 0, 0);

        layers.push({
            canvas: newCanvas,
            ctx: newCtx,
            effect: savedLayer.effect,
            name: savedLayer.name,
            isVisible: savedLayer.isVisible
        });
    });

    addLayerInContainer();
    setActiveLayer(Math.min(currentLayerIndex, layers.length - 1));
    renderAllLayers();
}

window.undo = undo;

// redo
export function redo() {
    if (historyIndex >= history.length - 1) return;
    historyIndex++;

    const snapshot = history[historyIndex];

    layers.forEach(layer => container.removeChild(layer.canvas));
    layers = [];

    snapshot.forEach(savedLayer => {
        const newCanvas = document.createElement('canvas');
        newCanvas.width = savedLayer.width;
        newCanvas.height = savedLayer.height;
        newCanvas.style.position = 'absolute';
        newCanvas.style.top = 0;
        newCanvas.style.left = 0;
        newCanvas.style.zIndex = layers.length;
        container.appendChild(newCanvas);

        const newCtx = newCanvas.getContext('2d');
        newCtx.putImageData(savedLayer.imageData, 0, 0);

        layers.push({
            canvas: newCanvas,
            ctx: newCtx,
            effect: savedLayer.effect,
            name: savedLayer.name,
            isVisible: savedLayer.isVisible
        });
    });

    addLayerInContainer();
    setActiveLayer(Math.min(currentLayerIndex, layers.length - 1));
    renderAllLayers();
}

window.redo = redo;



document.getElementById("layerUp").onclick = moveCurrentLayerUp;
document.getElementById("layerDown").onclick = moveCurrentLayerDown;



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
    if (layers[currentLayerIndex].isVisible === false) return;
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

    // density: １本の線分上に置く「点」の数, 大=>太く滑らかで負荷大, 小=>凹凸で軽い
    // scatter: 各点を線からランダムに散らす範囲, 大=>スプレーっぽくて負荷やや大, 小=>硬く負荷小 

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
    if (!drawing) return;

    drawing = false;
    strokeSegments = [];
    lastX = undefined;
    lastY = undefined;
    renderAllLayers();
    saveHistory();
    console.log(history, historyIndex);
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
    saveHistory();
});

// === 全レイヤー描画（リアルタイム合成） ===
function renderAllLayers() {
    displayCtx.clearRect(0, 0, displayCanvas.width, displayCanvas.height);
    displayCtx.fillStyle = "#fff";
    displayCtx.fillRect(0, 0, displayCanvas.width, displayCanvas.height);

    layers.forEach(layer => {
        if (layer.isVisible === true) {
            displayCtx.globalCompositeOperation = layer.effect || 'source-over';
            displayCtx.drawImage(layer.canvas, 0, 0);
        }
    });

    displayCtx.globalCompositeOperation = 'source-over';
}


function toggleVisible(i) {
    const layer = layers[i];
    layer.isVisible = !layer.isVisible;
    renderAllLayers();
    const btns = document.querySelectorAll('#layerContainer .visible-btn');

    btns.forEach((btn) => {
        const btnIndex = parseInt(btn.dataset.index);
        btn.classList.toggle("active", layers[btnIndex].isVisible === false);
        const icon = btn.querySelector("i");
        icon.className = layers[btnIndex].isVisible
            ? "fa-solid fa-eye"
            : "fa-solid fa-eye-slash";
    });
}


//#region ズーム・移動 

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

    const canvasWidth = displayCanvas.width;
    const canvasHeight = displayCanvas.height;

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

displayCanvas.addEventListener('pointerup', () => {
    isPanning = false;
    container.classList.remove('move-cursor');
});

displayCanvas.addEventListener('pointerdown', (e) => {
    if (e.shiftKey || tool === 'move') {
        container.classList.add('move-cursor');
        isPanning = true;
        drawing = false;
        startPanX = e.clientX;
        startPanY = e.clientY;
        return;
    }

    startDraw(e);
});

displayCanvas.addEventListener('pointermove', (e) => {
    if (isPanning) {
        drawing = false;
        offsetX -= (e.clientX - startPanX);
        offsetY -= (e.clientY - startPanY);
        startPanX = e.clientX;
        startPanY = e.clientY;
        updateZoom();
    } else if (drawing) {
        draw(e);
    }
});
//#endregion


export function defaultZoom() {
    zoom = 1;
    offsetX = 0;
    offsetY = 0;

    const transform = `translate(${-offsetX}px, ${-offsetY}px) scale(${zoom})`;
    displayCanvas.style.transform = transform;
    layers.forEach(layer => layer.canvas.style.transform = transform);
    bgCanvas.style.transform = transform;

    displayCanvas.style.transformOrigin = 'top left';
    layers.forEach(layer => layer.canvas.style.transformOrigin = 'top left');
    bgCanvas.style.transformOrigin = 'top left';

    zoomLabel.textContent = Math.round(zoom * 100) + '%';
}

window.defaultZoom = defaultZoom;



document.getElementById("saveJPG").addEventListener('click', () => {
    const dataURL = displayCanvas.toDataURL('image/jpeg', 1);

    const link = document.createElement('a');
    link.href = dataURL;
    link.download = 'undefined.jpg';
    link.click();
})


const loadImageInput = document.getElementById('loadImage');

loadImageInput.addEventListener('change', async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    
    await loadKWZM(file);
});


document.getElementById("saveKWZM").addEventListener('click', () => {
    const snapshot = {
        meta: {
            format: 'kwzm',
            version: 1.0,
            date: new Date().toISOString()
        },
        canvas: {
            width: bgCanvas.width,
            height: bgCanvas.height
        },
        layers: layers.map(layer => ({
            name: layer.name,
            effect: layer.effect,
            isVisible: layer.isVisible,
            imageData: layer.canvas.toDataURL('image/png')
        }))
    }

    const jsonString = JSON.stringify(snapshot);

    const blob = new Blob([jsonString], { type: 'application/json' });
    const url = URL.createObjectURL(blob);

    const a = document.createElement('a');
    a.href = url;
    a.download = 'illustration.kwzm';
    a.click();
    URL.revokeObjectURL(url);
});

async function loadKWZM(file) {
    const text = await file.text();
    const data = JSON.parse(text);

    if (data.meta?.format !== 'kwzm') {
        alert('Invalid file format');
        return;
    }

    const { width, height } = data.canvas;

    
    bgCanvas.width = width;
    bgCanvas.height = height;
    
    displayCanvas.width = width;
    displayCanvas.height = height;
    
    layers.forEach(layer => {
        if (layer.canvas !== bgCanvas && layer.canvas !== displayCanvas) {
            container.removeChild(layer.canvas);
        }
    });
    layers = [];
    

    for (const layerData of data.layers) {
        const layer = createLayer(layerData.name, width, height);
        layer.effect = layerData.effect;
        layer.isVisible = layerData.isVisible ?? true;

        await new Promise(resolve => {
            const img = new Image();
            img.onload = () => {
                layer.ctx.clearRect(0, 0, width, height);
                layer.ctx.drawImage(img, 0, 0);
                resolve();
            };
            img.src = layerData.imageData;
        });

        layers.push(layer);
    }

    history = [];
    historyIndex = -1;

    renderAllLayers();
    addLayerInContainer();
    setActiveLayer(0);

    if (typeof saveHistory === 'function') {
        saveHistory();
    }
}

function createLayer(name = null, width = null, height = null) {
    const canvas = document.createElement("canvas");
    canvas.width = width ?? bgCanvas.width;
    canvas.height = height ?? bgCanvas.height;
    canvas.style.position = "absolute";
    canvas.style.top = 0;
    canvas.style.left = 0;
    canvas.style.zIndex = layers.length;
    container.appendChild(canvas);

    const ctx = canvas.getContext("2d");
    const layerName = name || `レイヤー${layerIdCounter++}`;

    return { canvas, ctx, effect: 'source-over', name: layerName, isVisible: true };
}




const subViewCanvas = document.getElementById('subViewCanvas');
const referenceCtx = subViewCanvas.getContext('2d');
const loadReferenceInput = document.getElementById('loadReference');

subViewCanvas.width = 1600;
subViewCanvas.height = 1600;

// Handle file input
loadReferenceInput.addEventListener('change', (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = function (event) {
        const img = new Image();
        img.onload = function () {
            drawImageToCanvas(img);
            localStorage.setItem("subViewImg", event.target.result);
        };
        img.src = event.target.result;
    };
    reader.readAsDataURL(file);
});

// Restore image from localStorage on page load
window.addEventListener("load", () => {
    const storedImg = localStorage.getItem("subViewImg");
    if (storedImg) {
        const img = new Image();
        img.onload = function () {
            drawImageToCanvas(img);
        };
        img.src = storedImg;
    }
});

// Helper function: draw image centered & scaled
function drawImageToCanvas(img) {
    referenceCtx.clearRect(0, 0, subViewCanvas.width, subViewCanvas.height);

    const scale = Math.min(subViewCanvas.width / img.width, subViewCanvas.height / img.height);
    const w = img.width * scale;
    const h = img.height * scale;
    const x = (subViewCanvas.width - w) / 2;
    const y = (subViewCanvas.height - h) / 2;

    referenceCtx.globalAlpha = 0.8;
    referenceCtx.drawImage(img, x, y, w, h);
}

let subViewOffsetX = 0;
let subViewOffsetY = 0;
let subViewZoom = 1;

const subViewZoomInBtn = document.getElementById('subViewZoomIn');
const subViewZoomOutBtn = document.getElementById('subViewZoomOut');
const subViewZoomLabel = document.getElementById('subViewZoomLabel');

subViewZoomInBtn.addEventListener('click', () => {
    subViewZoom *= 1.1;  // 10%拡大
    updateSubViewZoom();
});

subViewZoomOutBtn.addEventListener('click', () => {
    subViewZoom /= 1.1;  // 10%縮小
    updateSubViewZoom();
});


function updateSubViewZoom() {
    const container = document.querySelector('.subView-container');

    const canvasWidth = subViewCanvas.width;
    const canvasHeight = subViewCanvas.height;

    const minOffsetX = Math.min(0, container.clientWidth - canvasWidth);
    const minOffsetY = Math.min(0, container.clientHeight - canvasHeight);
    const maxOffsetX = Math.max(0, canvasWidth - container.clientWidth);
    const maxOffsetY = Math.max(0, canvasHeight - container.clientHeight);

    subViewOffsetX = Math.min(Math.max(subViewOffsetX, minOffsetX), maxOffsetX);
    subViewOffsetY = Math.min(Math.max(subViewOffsetY, minOffsetY), maxOffsetY);

    const transform = `translate(${-subViewOffsetX}px, ${-subViewOffsetY}px) scale(${subViewZoom})`;
    subViewCanvas.style.transform = transform;
    layers.forEach(layer => layer.canvas.style.transform = transform);

    subViewCanvas.style.transformOrigin = 'top left';
    layers.forEach(layer => layer.canvas.style.transformOrigin = 'top left');

    subViewZoomLabel.textContent = Math.round(subViewZoom * 100) + '%';
}

let isPanningSubView = false;
let startSubViewPanX, startSubViewPanY;
let panModeByDoubleClick = false;

const subViewContainer = document.querySelector('.subView-container');

subViewCanvas.addEventListener('click', (e) => {
    if (isPanningSubView && panModeByDoubleClick) {
        isPanningSubView = false;
        panModeByDoubleClick = false;
        subViewContainer.classList.remove('move-cursor');
        return;
    }

    isPanningSubView = true;
    panModeByDoubleClick = true;
    subViewContainer.classList.add('move-cursor');
    startSubViewPanX = e.clientX;
    startSubViewPanY = e.clientY;
});

subViewCanvas.addEventListener('pointerup', () => {
    if (!panModeByDoubleClick) {
        isPanningSubView = false;
        subViewContainer.classList.remove('move-cursor');
    }
});

subViewCanvas.addEventListener('pointerdown', (e) => {
    if (e.shiftKey) {
        subViewContainer.classList.add('move-cursor');
        isPanningSubView = true;
        panModeByDoubleClick = false;
        drawing = false;
        startSubViewPanX = e.clientX;
        startSubViewPanY = e.clientY;
        return;
    }
});

subViewCanvas.addEventListener('pointermove', (e) => {
    if (isPanningSubView) {
        subViewOffsetX -= (e.clientX - startSubViewPanX);
        subViewOffsetY -= (e.clientY - startSubViewPanY);
        startSubViewPanX = e.clientX;
        startSubViewPanY = e.clientY;
        updateSubViewZoom();
    }
});



function draggable(handle, element) {
    let offsetX = 0, offsetY = 0, startX = 0, startY = 0;
    let isDragging = false;

    handle.addEventListener('pointerdown', e => {
        isDragging = true;
        startX = e.clientX;
        startY = e.clientY;

        offsetX = parseFloat(element.style.left || 0);
        offsetY = parseFloat(element.style.top || 0);

        e.preventDefault();
    });

    document.addEventListener('pointermove', e => {
        if (!isDragging) return;

        let newX = offsetX + (e.clientX - startX);
        let newY = offsetY + (e.clientY - startY);

        const maxX = window.innerWidth - element.offsetWidth;
        const maxY = window.innerHeight - element.offsetHeight;

        newX = Math.max(0, Math.min(newX, maxX));
        newY = Math.max(0, Math.min(newY, maxY));

        element.style.left = newX + 'px';
        element.style.top = newY + 'px';
    });

    document.addEventListener('pointerup', () => {
        isDragging = false;
    });
}


const sidebar = document.querySelector('.sidebar');
const dragHandle = document.querySelector('.draggableArea');
draggable(dragHandle, sidebar);




document.addEventListener('keydown', (e) => {
    switch(e.key) {
        case keyBindings.zoomIn:
            zoom *= 1.1;
            updateZoom();
            e.preventDefault();
            break;
        case keyBindings.zoomOut:
            zoom /= 1.1;
            updateZoom();
            e.preventDefault();
            break;
        case keyBindings.undo:
            undo();
            e.preventDefault();
            break;
        case keyBindings.redo:
            redo();
            e.preventDefault();
            break;
        case keyBindings.resetZoom:
            defaultZoom();
            e.preventDefault();
            break;
    }
});




[bgCanvas, displayCanvas, ...layers.map(l => l.canvas)].forEach(c => {
    c.addEventListener('contextmenu', e => e.preventDefault());
});


document.addEventListener('contextmenu', e => e.preventDefault());
displayCanvas.addEventListener('contextmenu', e => e.preventDefault());
displayCanvas.addEventListener('pointerdown', e => e.preventDefault());
displayCanvas.addEventListener('pointermove', e => e.preventDefault());

createNewProject();