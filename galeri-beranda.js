/* =========================================
   GALERI DOKUMENTASI BERANDA
   Desktop/laptop : 3 foto terlihat, tombol kiri-kanan
   Mobile         : 1 foto terlihat, geser dengan jari
   Sumber foto    : semua foto "gallery" di data-berita.js
========================================= */

(function () {

    const mount = document.getElementById("galeri-beranda");
    if (!mount) return;

    const items = (typeof newsData !== "undefined" ? newsData : [])
        .flatMap(news =>
            (news.gallery || []).map(src => ({ src, title: news.title }))
        );

    if (items.length === 0) {
        mount.remove();
        return;
    }

    const CSS = `
        .bg-section .section-title span { color: var(--orange); }
        .bg-wrap { position: relative; }
        .bg-viewport {
            display: flex; gap: 18px;
            overflow-x: auto; scroll-snap-type: x mandatory;
            scroll-behavior: smooth; padding: 6px 4px 18px;
            scrollbar-width: none; -ms-overflow-style: none;
        }
        .bg-viewport::-webkit-scrollbar { display: none; }
        .bg-slide {
            flex: 0 0 calc((100% - 36px) / 3);
            scroll-snap-align: start;
            border-radius: 20px; overflow: hidden;
            background: var(--glass);
            border: 1px solid var(--glass-border);
            box-shadow: var(--shadow);
            cursor: zoom-in; transition: transform .4s;
        }
        .bg-slide:hover { transform: translateY(-6px); }
        .bg-slide img {
            width: 100%; height: 240px; object-fit: cover;
            display: block;
        }
        .bg-slide figcaption {
            padding: 12px 16px; font-size: 12px; font-weight: 600;
            color: var(--nav-text); opacity: .8;
            white-space: nowrap; overflow: hidden; text-overflow: ellipsis;
        }
        .bg-btn {
            position: absolute; top: 50%; transform: translateY(-50%);
            z-index: 5; width: 46px; height: 46px; border-radius: 50%;
            border: 1px solid var(--glass-border);
            background: var(--glass); color: var(--green);
            backdrop-filter: blur(10px); -webkit-backdrop-filter: blur(10px);
            box-shadow: var(--shadow); cursor: pointer;
            display: grid; place-items: center; font-size: 16px;
            transition: .3s;
        }
        .bg-btn:hover:not(:disabled) { background: var(--green); color: #fff; }
        .bg-btn:disabled { opacity: .35; cursor: default; }
        .bg-prev { left: -18px; }
        .bg-next { right: -18px; }
        @media (max-width: 800px) {
            .bg-slide { flex: 0 0 100%; }
            .bg-slide img { height: 300px; }
            .bg-btn { display: none; }
        }
    `;

    const style = document.createElement("style");
    style.textContent = CSS;
    document.head.appendChild(style);

    /* ---------- KERANGKA ---------- */

    const section = document.createElement("section");
    section.className = "bg-section";

    const titleBox = document.createElement("div");
    titleBox.className = "section-title reveal show";

    const label = document.createElement("span");
    label.textContent = "Dokumentasi";

    const heading = document.createElement("h2");
    heading.textContent = "Momen Kegiatan Kami";

    const desc = document.createElement("p");
    desc.textContent = "Sebagian dokumentasi kegiatan peserta didik dan sekolah. Ketuk foto untuk memperbesar.";

    titleBox.append(label, heading, desc);

    const container = document.createElement("div");
    container.className = "section-container";

    const wrap = document.createElement("div");
    wrap.className = "bg-wrap";

    const prevBtn = document.createElement("button");
    prevBtn.className = "bg-btn bg-prev";
    prevBtn.setAttribute("aria-label", "Foto sebelumnya");
    prevBtn.innerHTML = '<i class="fa-solid fa-chevron-left"></i>';

    const nextBtn = document.createElement("button");
    nextBtn.className = "bg-btn bg-next";
    nextBtn.setAttribute("aria-label", "Foto berikutnya");
    nextBtn.innerHTML = '<i class="fa-solid fa-chevron-right"></i>';

    const viewport = document.createElement("div");
    viewport.className = "bg-viewport";

    const srcList = items.map(item => item.src);

    items.forEach((item, i) => {

        const figure = document.createElement("figure");
        figure.className = "bg-slide";

        const img = document.createElement("img");
        img.src = item.src;
        img.alt = item.title;
        img.loading = "lazy";

        const caption = document.createElement("figcaption");
        caption.textContent = item.title;

        figure.append(img, caption);

        figure.addEventListener("click", () => {
            window.openLightbox(srcList, i);
        });

        viewport.appendChild(figure);
    });

    wrap.append(prevBtn, viewport, nextBtn);
    container.append(titleBox, wrap);
    section.appendChild(container);
    mount.appendChild(section);

    /* ---------- TOMBOL KIRI & KANAN (desktop) ---------- */

    function stepSize() {
        const slide = viewport.querySelector(".bg-slide");
        if (!slide) return 0;
        const gap = 18;
        return slide.offsetWidth + gap;
    }

    prevBtn.addEventListener("click", () => {
        // Geser satu halaman (3 foto)
        viewport.scrollBy({ left: -stepSize() * 3, behavior: "smooth" });
    });

    nextBtn.addEventListener("click", () => {
        viewport.scrollBy({ left: stepSize() * 3, behavior: "smooth" });
    });

    function updateButtons() {
        const max = viewport.scrollWidth - viewport.clientWidth;
        prevBtn.disabled = viewport.scrollLeft <= 2;
        nextBtn.disabled = viewport.scrollLeft >= max - 2;
    }

    viewport.addEventListener("scroll", updateButtons, { passive: true });
    window.addEventListener("resize", updateButtons);
    updateButtons();

})();