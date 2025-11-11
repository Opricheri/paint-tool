document.querySelectorAll('[data-modal-target]').forEach(btn => {
  btn.addEventListener('click', () => {
    const target = btn.getAttribute('data-modal-target');
    const modal = document.querySelector(target);
    if (modal) openModal(modal);
  });
});

document.addEventListener('click', (e) => {
  if (e.target.matches('[data-close]')) {
    const modal = e.target.closest('.modal');
    closeModal(modal);
  }
});

document.addEventListener('keydown', (e) => {
  if (e.key === 'Escape') {
    document.querySelectorAll('.modal.active').forEach(closeModal);
  }
});

function openModal(modal) {
  const overlay = document.getElementById('modalOverlay');
  if (overlay) overlay.classList.add('active');

  modal.style.display = 'flex';
  setTimeout(() => modal.classList.add('active'), 10);

  disableCanvasInteraction();
}

function closeModal(modal) {
  const overlay = document.getElementById('modalOverlay');
  if (overlay) overlay.classList.remove('active');

  modal.classList.remove('active');
  setTimeout(() => {
    if (!modal.classList.contains('active')) {
      modal.style.display = 'none';
    }
  }, 200);

  enableCanvasInteraction();
}

function disableCanvasInteraction() {
  displayCanvas.style.pointerEvents = 'none';
  layers.forEach(layer => layer.canvas.style.pointerEvents = 'none');
}

function enableCanvasInteraction() {
  displayCanvas.style.pointerEvents = 'auto';
  layers.forEach(layer => layer.canvas.style.pointerEvents = 'auto');
}
