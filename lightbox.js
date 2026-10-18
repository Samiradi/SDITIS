/* =========================================
   LIGHTBOX FOTO (dipakai di beranda)
   Zoom: tombol, scroll mouse, cubit dua jari, ketuk dua kali
   Pindah foto: tombol panah, geser jari, tombol keyboard
========================================= */

(function () {

    const CSS = `
        .lightbox {
            position: fixed; inset: 0; z-index: 5000;
            display: none; flex-direction: column;
            background: rgba(2, 4, 14, .93);
            backdrop-filter: blur(6px); -webkit-backdrop-filter: blur(6px);
        }
        .lightbox { touch-action: none; }
        .lightbox.open { display: flex; }
        .lb-toolbar {
            display: flex; justify-content: space-between; align-items: center;
            gap: 12px; padding: 14px 20px; color: #e2e8f0; font-size: 13px;
        }
        .lb-tools { display: flex; align-items: center; gap: 8px; }
        .lb-btn {
            width: 40px; height: 40px; display: grid; place-items: center;
            background: rgba(255,255,255,.08); color: #fff;
            border: 1px solid rgba(255,255,255,.15); border-radius: 10px;
            cursor: pointer; font-size: 15px; transition: .2s;
        }
        .lb-btn:hover { background: rgba(39,174,96,.35); }
        .lb-btn-text { width: auto; padding: 0 12px; font-family: inherit; font-size: 12px; font-weight: 600; }
        .lb-stage {
            flex: 1; position: relative; display: flex;
            align-items: center; justify-content: center;
            overflow: hidden; touch-action: none;
        }
        .lb-stage.zoomed { cursor: grab; }
        .lb-stage.dragging { cursor: grabbing; }
        .lb-stage img {
            max-width: 90%; max-height: 85%; object-fit: contain;
            border-radius: 10px; user-select: none; -webkit-user-drag: none;
            transition: transform .15s ease-out; cursor: zoom-in;
        }
        .lb-stage.zoomed img { cursor: grab; }
        .lb-stage.dragging img { transition: none; }
        .lb-nav { position: absolute; top: 50%; transform: translateY(-50%); z-index: 2; }
        .lb-prev { left: 16px; }
        .lb-next { right: 16px; }
        .lb-hint { text-align: center; padding: 10px; color: rgba(255,255,255,.5); font-size: 11px; }
        @media (max-width: 600px) {
            .lb-toolbar { padding: 10px; }
            .lb-hint { display: none; }
            .lb-prev { left: 6px; }
            .lb-next { right: 6px; }
        }
    `;

    const style = document.createElement("style");
    style.textContent = CSS;
    document.head.appendChild(style);

    const box = document.createElement("div");
    box.className = "lightbox";
    box.id = "lightbox";
    box.setAttribute("aria-hidden", "true");
    box.setAttribute("role", "dialog");
    box.innerHTML = `
        <div class="lb-toolbar">
            <span id="lbCounter"></span>
            <div class="lb-tools">
                <button class="lb-btn" id="lbZoomOut" title="Perkecil"><i class="fa-solid fa-magnifying-glass-minus"></i></button>
                <button class="lb-btn lb-btn-text" id="lbZoomReset" title="Ukuran awal">100%</button>
                <button class="lb-btn" id="lbZoomIn" title="Perbesar"><i class="fa-solid fa-magnifying-glass-plus"></i></button>
                <button class="lb-btn" id="lbClose" title="Tutup (Esc)"><i class="fa-solid fa-xmark"></i></button>
            </div>
        </div>
        <div class="lb-stage" id="lbStage"><img id="lbImg" alt=""></div>
        <button class="lb-btn lb-nav lb-prev" id="lbPrev" title="Foto sebelumnya"><i class="fa-solid fa-chevron-left"></i></button>
        <button class="lb-btn lb-nav lb-next" id="lbNext" title="Foto berikutnya"><i class="fa-solid fa-chevron-right"></i></button>
        <p class="lb-hint">Scroll atau tombol + / − untuk zoom · seret untuk menggeser · ← → untuk pindah foto · Esc untuk menutup</p>
    `;
    document.body.appendChild(box);

    const lbStage = document.getElementById("lbStage");
    const lbImg = document.getElementById("lbImg");
    const lbCounter = document.getElementById("lbCounter");
    const lbZoomReset = document.getElementById("lbZoomReset");
    const lbPrev = document.getElementById("lbPrev");
    const lbNext = document.getElementById("lbNext");

    const MIN_SCALE = 1;
    const MAX_SCALE = 5;

    let images = [];
    let index = 0;
    let scale = 1;
    let x = 0;
    let y = 0;


    /* ---------- BUKA / TUTUP ---------- */

    function open(list, start) {
        images = list;
        index = start;
        box.classList.add("open");
        box.setAttribute("aria-hidden", "false");
        document.body.style.overflow = "hidden";
        showImage();
    }

    function close() {
        box.classList.remove("open");
        box.setAttribute("aria-hidden", "true");
        document.body.style.overflow = "";
    }

    function showImage() {
        lbImg.src = images[index];
        lbImg.alt = "Foto dokumentasi " + (index + 1);
        lbCounter.textContent = (index + 1) + " / " + images.length;

        const multiple = images.length > 1;
        lbPrev.style.display = multiple ? "grid" : "none";
        lbNext.style.display = multiple ? "grid" : "none";

        resetZoom();
    }

    function showRelative(step) {
        index = (index + step + images.length) % images.length;
        showImage();
    }


    /* ---------- ZOOM & GESER ---------- */

    function applyTransform() {
        lbImg.style.transform = `translate(${x}px, ${y}px) scale(${scale})`;
        lbZoomReset.textContent = Math.round(scale * 100) + "%";
        lbStage.classList.toggle("zoomed", scale > 1);
    }

    function resetZoom() {
        scale = 1;
        x = 0;
        y = 0;
        applyTransform();
    }

    function clampPan() {
        const maxX = Math.max(0, (lbImg.offsetWidth * scale - lbStage.clientWidth) / 2);
        const maxY = Math.max(0, (lbImg.offsetHeight * scale - lbStage.clientHeight) / 2);
        x = Math.min(maxX, Math.max(-maxX, x));
        y = Math.min(maxY, Math.max(-maxY, y));
    }

    function zoomBy(factor) {
        scale = Math.min(MAX_SCALE, Math.max(MIN_SCALE, scale * factor));
        if (scale === MIN_SCALE) {
            x = 0;
            y = 0;
        }
        clampPan();
        applyTransform();
    }

    function toggleZoom() {
        if (scale > 1) {
            resetZoom();
        } else {
            zoomBy(2.5);
        }
    }


    /* ---------- TOMBOL ---------- */

    document.getElementById("lbClose").addEventListener("click", close);
    document.getElementById("lbZoomIn").addEventListener("click", () => zoomBy(1.4));
    document.getElementById("lbZoomOut").addEventListener("click", () => zoomBy(1 / 1.4));
    lbZoomReset.addEventListener("click", resetZoom);
    lbPrev.addEventListener("click", () => showRelative(-1));
    lbNext.addEventListener("click", () => showRelative(1));

    // Klik area gelap di sekitar foto untuk menutup
    lbStage.addEventListener("click", event => {
        if (event.target === lbStage) close();
    });

    // Scroll mouse untuk zoom
    lbStage.addEventListener("wheel", event => {
        event.preventDefault();
        zoomBy(event.deltaY < 0 ? 1.15 : 1 / 1.15);
    }, { passive: false });


    /* ---------- SENTUH & MOUSE ---------- */

    const pointers = new Map();
    let pinchStartDist = 0;
    let pinchStartScale = 1;
    let panStart = null;
    let swipeStart = null;
    let lastTap = { time: 0, x: 0, y: 0 };

    function distance(a, b) {
        return Math.hypot(a.x - b.x, a.y - b.y);
    }

    box.addEventListener("pointerdown", event => {

        pointers.set(event.pointerId, { x: event.clientX, y: event.clientY });

        if (pointers.size === 2) {
            // Dua jari di mana saja (termasuk tombol): mulai cubit zoom
            const [a, b] = [...pointers.values()];
            pinchStartDist = distance(a, b);
            pinchStartScale = scale;
            panStart = null;
            swipeStart = null;
            return;
        }

        // Satu jari: hanya untuk geser/ketuk jika mulai di area foto
        if (pointers.size === 1 && lbStage.contains(event.target)) {
            swipeStart = { x: event.clientX, y: event.clientY };

            if (scale > 1) {
                panStart = {
                    x: event.clientX - x,
                    y: event.clientY - y
                };
                lbStage.classList.add("dragging");
            }
        }
    });

    window.addEventListener("pointermove", event => {

        if (!pointers.has(event.pointerId)) return;

        pointers.set(event.pointerId, { x: event.clientX, y: event.clientY });

        if (pointers.size === 2 && pinchStartDist > 0) {
            const [a, b] = [...pointers.values()];
            const ratio = distance(a, b) / pinchStartDist;

            scale = Math.min(MAX_SCALE, Math.max(MIN_SCALE, pinchStartScale * ratio));
            if (scale === MIN_SCALE) {
                x = 0;
                y = 0;
            }

            clampPan();
            applyTransform();
            return;
        }

        if (pointers.size === 1 && panStart) {
            x = event.clientX - panStart.x;
            y = event.clientY - panStart.y;
            clampPan();
            applyTransform();
        }
    });

    window.addEventListener("pointerup", endPointer);
    window.addEventListener("pointercancel", endPointer);

    function endPointer(event) {

        if (!pointers.has(event.pointerId)) return;

        const wasSingle = pointers.size === 1;
        pointers.delete(event.pointerId);

        if (pointers.size === 0 && swipeStart && wasSingle && box.classList.contains("open")) {

            const dx = event.clientX - swipeStart.x;
            const dy = event.clientY - swipeStart.y;
            const moved = Math.hypot(dx, dy);
            const now = Date.now();

            if (scale <= 1 && Math.abs(dx) > 60 && Math.abs(dx) > Math.abs(dy)) {

                // Geser kiri = foto berikutnya, kanan = sebelumnya
                showRelative(dx < 0 ? 1 : -1);

            } else if (moved < 10) {

                const isDouble =
                    now - lastTap.time < 300 &&
                    Math.hypot(event.clientX - lastTap.x, event.clientY - lastTap.y) < 40;

                if (isDouble) {
                    lastTap = { time: 0, x: 0, y: 0 };
                    toggleZoom();
                } else {
                    lastTap = { time: now, x: event.clientX, y: event.clientY };
                }
            }
        }

        if (pointers.size === 0) {
            swipeStart = null;
            panStart = null;
            pinchStartDist = 0;
            lbStage.classList.remove("dragging");

        } else if (pointers.size === 1 && scale > 1) {
            // Sisa satu jari setelah cubit: lanjut geser dari posisi itu
            const [p] = [...pointers.values()];
            panStart = { x: p.x - x, y: p.y - y };
        }
    }


    /* ---------- KEYBOARD ---------- */

    document.addEventListener("keydown", event => {

        if (!box.classList.contains("open")) return;

        if (event.key === "Escape") close();
        if (event.key === "ArrowLeft") showRelative(-1);
        if (event.key === "ArrowRight") showRelative(1);
        if (event.key === "+" || event.key === "=") zoomBy(1.4);
        if (event.key === "-") zoomBy(1 / 1.4);
    });


    window.openLightbox = open;

})();