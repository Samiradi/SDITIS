/* =========================================
   LIGHTBOX FOTO (dipakai di beranda dan detail berita)

   Sentuhan (HP / tablet):
   - Cubit 2 jari      : perbesar / perkecil, mengikuti titik tengah jari
   - Geser 2 jari      : pindahkan foto yang sedang diperbesar
   - Geser 1 jari      : pindahkan foto (saat diperbesar)
   - Geser kiri/kanan  : foto berikutnya / sebelumnya (saat ukuran normal)
   - Ketuk 2 kali     : zoom instan ke titik yang diketuk, ketuk lagi untuk kembali

   Mouse / keyboard: scroll untuk zoom, klik 2 kali, tombol + / -,
   panah kiri/kanan, Esc untuk menutup.
========================================= */

(function () {

    const MIN_SCALE = 1;
    const MAX_SCALE = 5;
    const DOUBLE_TAP_ZOOM = 2.5;

    const CSS = `
        .lightbox {
            position: fixed; inset: 0; z-index: 5000;
            display: none; flex-direction: column;
            background: rgba(2, 4, 14, .93);
            backdrop-filter: blur(6px); -webkit-backdrop-filter: blur(6px);
            touch-action: none;
        }
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
            transition: transform .2s ease-out; cursor: zoom-in;
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
        <div class="lb-stage" id="lbStage"><img id="lbImg" alt="" draggable="false"></div>
        <button class="lb-btn lb-nav lb-prev" id="lbPrev" title="Foto sebelumnya"><i class="fa-solid fa-chevron-left"></i></button>
        <button class="lb-btn lb-nav lb-next" id="lbNext" title="Foto berikutnya"><i class="fa-solid fa-chevron-right"></i></button>
        <p class="lb-hint">Cubit atau tombol + / − untuk zoom · geser untuk memindahkan foto · ketuk 2 kali untuk zoom cepat · ← → untuk pindah foto · Esc untuk menutup</p>
    `;
    document.body.appendChild(box);

    const lbStage = document.getElementById("lbStage");
    const lbImg = document.getElementById("lbImg");
    const lbCounter = document.getElementById("lbCounter");
    const lbZoomReset = document.getElementById("lbZoomReset");
    const lbPrev = document.getElementById("lbPrev");
    const lbNext = document.getElementById("lbNext");

    let images = [];
    let index = 0;

    // Keadaan zoom: skala dan posisi foto (px) relatif ke pusat layar
    let scale = 1;
    let tx = 0;
    let ty = 0;

    // Keadaan sentuhan
    const pointers = new Map();     // pointerId -> {x, y}
    let pinch = null;               // {dist, scale, mid:{x,y}, tx, ty}
    let pan = null;                 // {x, y, tx, ty}
    let startPoint = null;          // {x, y, t} titik awal sentuhan tunggal
    let gestureOnStage = false;     // sentuhan dimulai di area foto
    let pinchUsed = false;          // pada gestur ini pernah ada cubit
    let lastTap = { t: 0, x: 0, y: 0 };


    /* =========================
       HELPER
    ========================= */

    function clamp(value, min, max) {
        return Math.min(max, Math.max(min, value));
    }

    function distance(a, b) {
        return Math.hypot(a.x - b.x, a.y - b.y);
    }

    // Ubah koordinat layar menjadi koordinat relatif terhadap pusat stage
    function toCenter(clientX, clientY) {
        const r = lbStage.getBoundingClientRect();
        return {
            x: clientX - (r.left + r.width / 2),
            y: clientY - (r.top + r.height / 2)
        };
    }

    // Batasi geseran agar foto tidak keluar terlalu jauh dari layar
    function clampPan() {
        const maxX = Math.max(0, (lbImg.offsetWidth * scale - lbStage.clientWidth) / 2);
        const maxY = Math.max(0, (lbImg.offsetHeight * scale - lbStage.clientHeight) / 2);
        tx = clamp(tx, -maxX, maxX);
        ty = clamp(ty, -maxY, maxY);
    }

    function applyTransform() {
        lbImg.style.transform = `translate(${tx}px, ${ty}px) scale(${scale})`;
        lbZoomReset.textContent = Math.round(scale * 100) + "%";
        lbStage.classList.toggle("zoomed", scale > 1);
    }

    function resetZoom() {
        scale = 1;
        tx = 0;
        ty = 0;
        applyTransform();
    }

    // Zoom dengan menjaga titik (px, py) tetap di posisinya
    function zoomAt(newScale, px, py) {
        newScale = clamp(newScale, MIN_SCALE, MAX_SCALE);

        const k = newScale / scale;
        tx = px - (px - tx) * k;
        ty = py - (py - ty) * k;
        scale = newScale;

        if (scale === MIN_SCALE) {
            tx = 0;
            ty = 0;
        }

        clampPan();
        applyTransform();
    }

    function toggleZoomAt(px, py) {
        if (scale > 1) {
            resetZoom();
        } else {
            zoomAt(DOUBLE_TAP_ZOOM, px, py);
        }
    }


    /* =========================
       BUKA / TUTUP / GANTI FOTO
    ========================= */

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


    /* =========================
       TOMBOL & MOUSE
    ========================= */

    document.getElementById("lbClose").addEventListener("click", close);

    document.getElementById("lbZoomIn").addEventListener("click", () => {
        zoomAt(scale * 1.4, 0, 0);
    });

    document.getElementById("lbZoomOut").addEventListener("click", () => {
        zoomAt(scale / 1.4, 0, 0);
    });

    lbZoomReset.addEventListener("click", resetZoom);
    lbPrev.addEventListener("click", () => showRelative(-1));
    lbNext.addEventListener("click", () => showRelative(1));

    // Klik area gelap di sekitar foto untuk menutup
    lbStage.addEventListener("click", event => {
        if (event.target === lbStage) close();
    });

    // Scroll mouse untuk zoom di posisi kursor
    lbStage.addEventListener("wheel", event => {
        event.preventDefault();

        const p = toCenter(event.clientX, event.clientY);
        zoomAt(scale * (event.deltaY < 0 ? 1.15 : 1 / 1.15), p.x, p.y);
    }, { passive: false });


    /* =========================
       SENTUHAN (multi-jari)
    ========================= */

    box.addEventListener("pointerdown", event => {

        if (!box.classList.contains("open")) return;

        pointers.set(event.pointerId, { x: event.clientX, y: event.clientY });

        if (pointers.size === 1) {

            gestureOnStage = lbStage.contains(event.target);
            startPoint = { x: event.clientX, y: event.clientY, t: Date.now() };
            pinchUsed = false;

            if (gestureOnStage && scale > 1) {
                pan = { x: event.clientX, y: event.clientY, tx, ty };
                lbStage.classList.add("dragging");
            }

        } else if (pointers.size === 2) {

            // Dua jari: mulai cubit (zoom + geser dua jari)
            const [a, b] = [...pointers.values()];
            const mid = toCenter((a.x + b.x) / 2, (a.y + b.y) / 2);

            pinchUsed = true;
            pan = null;
            pinch = {
                dist: distance(a, b),
                scale,
                mid,
                tx,
                ty
            };

            lbStage.classList.add("dragging");
        }

    });


    window.addEventListener("pointermove", event => {

        if (!pointers.has(event.pointerId)) return;

        pointers.set(event.pointerId, { x: event.clientX, y: event.clientY });

        // Dua jari: zoom sekaligus geser mengikuti titik tengah jari
        if (pointers.size === 2 && pinch && pinch.dist > 0) {

            const [a, b] = [...pointers.values()];
            const mid = toCenter((a.x + b.x) / 2, (a.y + b.y) / 2);

            const newScale = clamp(
                pinch.scale * (distance(a, b) / pinch.dist),
                MIN_SCALE,
                MAX_SCALE
            );

            const k = newScale / pinch.scale;

            tx = mid.x - (pinch.mid.x - pinch.tx) * k;
            ty = mid.y - (pinch.mid.y - pinch.ty) * k;
            scale = newScale;

            if (scale === MIN_SCALE) {
                tx = 0;
                ty = 0;
            }

            clampPan();
            applyTransform();
            return;
        }

        // Satu jari saat diperbesar: geser foto
        if (pointers.size === 1 && pan) {

            tx = pan.tx + (event.clientX - pan.x);
            ty = pan.ty + (event.clientY - pan.y);

            clampPan();
            applyTransform();
        }

    });


    window.addEventListener("pointerup", endPointer);
    window.addEventListener("pointercancel", endPointer);


    function endPointer(event) {

        if (!pointers.has(event.pointerId)) return;

        const wasLast = pointers.size === 1;
        pointers.delete(event.pointerId);

        if (wasLast) {

            const sp = startPoint;

            if (sp && gestureOnStage && !pinchUsed) {

                const dx = event.clientX - sp.x;
                const dy = event.clientY - sp.y;
                const moved = Math.hypot(dx, dy);
                const duration = Date.now() - sp.t;

                // Geser kiri/kanan untuk pindah foto (saat ukuran normal)
                if (
                    scale === 1 &&
                    Math.abs(dx) > 60 &&
                    Math.abs(dx) > Math.abs(dy)
                ) {
                    showRelative(dx < 0 ? 1 : -1);

                // Ketuk (tidak digeser): cek ketuk 2 kali
                } else if (moved < 10 && duration < 350) {

                    const now = Date.now();
                    const isDouble =
                        now - lastTap.t < 320 &&
                        distance(event, lastTap) < 40;

                    if (isDouble) {
                        lastTap = { t: 0, x: 0, y: 0 };
                        const p = toCenter(event.clientX, event.clientY);
                        toggleZoomAt(p.x, p.y);
                    } else {
                        lastTap = { t: now, x: event.clientX, y: event.clientY };
                    }
                }
            }

            // Reset status gestur
            pinch = null;
            pan = null;
            startPoint = null;
            pinchUsed = false;
            lbStage.classList.remove("dragging");

        } else if (pointers.size === 1 && pinch) {

            // Cubit selesai, satu jari masih menempel: lanjut geser dari sini
            const [p] = [...pointers.values()];

            pinch = null;
            pan = { x: p.x, y: p.y, tx, ty };
        }
    }


    /* =========================
       KEYBOARD
    ========================= */

    document.addEventListener("keydown", event => {

        if (!box.classList.contains("open")) return;

        if (event.key === "Escape") close();
        if (event.key === "ArrowLeft") showRelative(-1);
        if (event.key === "ArrowRight") showRelative(1);
        if (event.key === "+" || event.key === "=") zoomAt(scale * 1.4, 0, 0);
        if (event.key === "-") zoomAt(scale / 1.4, 0, 0);
    });


    window.openLightbox = open;

})();