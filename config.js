export function saveTheme(theme="light") {
  localStorage.setItem("theme", theme);
  document.documentElement.setAttribute("data-theme", theme);
}

export function loadTheme() {
  const theme = localStorage.getItem("theme") || "light";
  document.documentElement.setAttribute("data-theme", theme);
}

export function toggleTheme() {
  const currentTheme = document.documentElement.getAttribute("data-theme");
  const newTheme = currentTheme === "light" ? "dark" : "light";
  saveTheme(newTheme);
}


// キーボードショートカット設定
export const keyBindings = {
    zoomIn: ';',       // 拡大
    zoomOut: '-',      // 縮小
    undo: 'z',         // 元に戻す
    redo: 'y',         // やり直し
    resetZoom: 'm'     // ズームリセット
};
