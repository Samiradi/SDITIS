/* =========================================
   LATAR ANIMASI + TEMA SIANG / MALAM
   Dipakai bersama oleh berita.html dan detail-berita.html

   Siang (06.00 - 17.59): tema hijau dan oranye,
                          latar huruf dan angka melayang
   Malam (18.00 - 05.59): tema luar angkasa,
                          galaksi berputar dan bintang berkelip
========================================= */

(function () {

    const DAY_START = 6;
    const DAY_END = 18;

    // Huruf dan angka yang melayang saat siang
    const DAY_CHARS = [
        "A", "B", "C", "D", "E", "F", "G", "H", "K", "M",
        "N", "P", "R", "S", "T", "W", "Y", "Z",
        "0", "1", "2", "3", "4", "5", "6", "7", "8", "9",
        "ا", "ب", "ت", "ث", "ج", "ح", "د", "ر", "س", "ع", "ق"
    ];

    const canvas = document.createElement("canvas");
    canvas.id = "space-bg";
    canvas.setAttribute("aria-hidden", "true");

    Object.assign(canvas.style, {
        position: "fixed",
        left: "0",
        top: "0",
        width: "100%",
        height: "100%",
        zIndex: "-1",
        pointerEvents: "none"
    });

    document.body.prepend(canvas);

    const ctx = canvas.getContext("2d");
    const reduceMotion =
        window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    let w = 0, h = 0, dpr = 1;
    let stars = [];
    let galaxy = [];
    let glyphs = [];
    let nebulaA = null, nebulaB = null;
    let dayGlowA = null, dayGlowB = null;
    let frame = 0;
    let isDay = false;
    let lastW = 0, lastH = 0;
    let resizeTimer = null;


    function rand(min, max) {
        return min + Math.random() * (max - min);
    }


    /* =========================
       GAYA TEMA SIANG (hijau & oranye)
    ========================= */

    function injectDayStyles() {

        const style = document.createElement("style");
        style.id = "theme-day-style";

        style.textContent = `

            html.theme-day {
                background:
                    linear-gradient(
                        180deg,
                        #f0fdf4 0%,
                        #fffaf0 100%
                    ) fixed;

                --space-card: rgba(255, 255, 255, .92);
                --space-border: rgba(22, 101, 52, .16);
                --space-text: #1f2937;
                --space-muted: #4b5563;
                --space-heading: #14532d;
                --space-accent: #15803d;
                --space-gold: #c2410c;
            }

            html.theme-day .topbar {
                background: #166534;
                color: #ecfdf5;
            }

            html.theme-day .navbar {
                background: rgba(255, 255, 255, .94);
                border-bottom-color: var(--space-border);
            }

            html.theme-day .nav-menu > li > a {
                color: #374151;
            }

            html.theme-day .nav-menu > li > a:hover,
            html.theme-day .nav-menu > li.active > a {
                color: #15803d;
                background: #dcfce7;
            }

            html.theme-day .dropdown-menu {
                background: #ffffff;
                border-color: var(--space-border);
            }

            html.theme-day .dropdown-menu a {
                color: #374151;
            }

            html.theme-day .dropdown-menu a:hover {
                background: #dcfce7;
                color: #15803d;
            }

            html.theme-day .mobile-toggle {
                background: #dcfce7;
                color: #15803d;
            }

            @media (max-width: 800px) {

                html.theme-day .nav-menu {
                    background: #ffffff;
                }

            }

            html.theme-day .hero {
                background:
                    linear-gradient(
                        120deg,
                        rgba(20, 83, 45, .9),
                        rgba(234, 88, 12, .65)
                    ),
                    url('./images/berita.jpg') center/cover;
            }

            html.theme-day .breadcrumb {
                background: rgba(255, 255, 255, .85);
            }

            html.theme-day .section-label {
                background: #ffedd5;
                color: #c2410c;
            }

            html.theme-day .filter-btn {
                background: rgba(255, 255, 255, .9);
                color: #14532d;
            }

            html.theme-day .filter-btn:hover,
            html.theme-day .filter-btn.active {
                background: linear-gradient(135deg, #16a34a, #f97316);
                box-shadow: 0 0 16px rgba(249, 115, 22, .35);
            }

            html.theme-day .featured:hover,
            html.theme-day .news-card:hover {
                box-shadow: 0 0 26px rgba(22, 163, 74, .22);
            }

            html.theme-day .badge {
                background: #ffedd5;
                color: #c2410c;
            }

            html.theme-day .read-more {
                color: #15803d;
            }

            html.theme-day .read-more:hover {
                color: #ea580c;
            }

            html.theme-day .info-box {
                background: #dcfce7;
                border-left-color: #16a34a;
            }

            html.theme-day .info-box i {
                color: #15803d;
            }

            html.theme-day .info-box p,
            html.theme-day .article-body,
            html.theme-day .category-list a {
                color: #374151;
            }

            html.theme-day .category-list a:hover {
                color: #15803d;
            }

            html.theme-day .article-category {
                background: #ffedd5;
                color: #c2410c;
            }

            html.theme-day .article-body blockquote {
                background: #f0fdf4;
                border-left-color: #f97316;
                color: #14532d;
            }

            html.theme-day .share a {
                background: #dcfce7;
                color: #15803d;
            }

            html.theme-day .share a:hover {
                background: linear-gradient(135deg, #16a34a, #f97316);
                color: #ffffff;
            }

            html.theme-day .back-button {
                background: linear-gradient(135deg, #16a34a, #f97316);
            }

            html.theme-day .back-button:hover {
                background: linear-gradient(135deg, #15803d, #ea580c);
            }

            html.theme-day .cta {
                background: linear-gradient(135deg, #14532d, #c2410c);
            }

            html.theme-day .cta h2 {
                color: #ffffff;
            }

            html.theme-day .cta p {
                color: rgba(255, 255, 255, .92);
            }

            html.theme-day footer {
                background: #052e16;
                border-top-color: rgba(22, 101, 52, .4);
            }

        `;

        document.head.appendChild(style);
    }


    /* =========================
       UKURAN CANVAS
    ========================= */

    function sizeCanvas() {

        const mobile = window.innerWidth < 768;

        // Di HP, resolusi dibatasi agar tetap ringan
        dpr = mobile ? 1 : Math.min(window.devicePixelRatio || 1, 2);

        w = window.innerWidth;
        h = window.innerHeight;

        canvas.width = Math.round(w * dpr);
        canvas.height = Math.round(h * dpr);
        ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

        // Gradien disimpan agar tidak dibuat ulang setiap frame

        // Malam: nebula ungu dan biru
        nebulaA = ctx.createRadialGradient(
            w * 0.25, h * 0.75, 0,
            w * 0.25, h * 0.75, Math.max(w, h) * 0.55
        );
        nebulaA.addColorStop(0, "rgba(99,102,241,0.14)");
        nebulaA.addColorStop(1, "rgba(99,102,241,0)");

        nebulaB = ctx.createRadialGradient(
            w * 0.85, h * 0.15, 0,
            w * 0.85, h * 0.15, Math.max(w, h) * 0.4
        );
        nebulaB.addColorStop(0, "rgba(14,165,233,0.10)");
        nebulaB.addColorStop(1, "rgba(14,165,233,0)");

        // Siang: cahaya hijau dan oranye yang lembut
        dayGlowA = ctx.createRadialGradient(
            w * 0.1, h * 0.1, 0,
            w * 0.1, h * 0.1, Math.max(w, h) * 0.5
        );
        dayGlowA.addColorStop(0, "rgba(34,197,94,0.14)");
        dayGlowA.addColorStop(1, "rgba(34,197,94,0)");

        dayGlowB = ctx.createRadialGradient(
            w * 0.9, h * 0.9, 0,
            w * 0.9, h * 0.9, Math.max(w, h) * 0.5
        );
        dayGlowB.addColorStop(0, "rgba(249,115,22,0.14)");
        dayGlowB.addColorStop(1, "rgba(249,115,22,0)");
    }


    /* =========================
       BINTANG (malam)
    ========================= */

    function initStars() {

        const mobile = window.innerWidth < 768;
        const max = mobile ? 200 : 450;
        const count = Math.min(max, Math.round((w * h) / 4500));

        stars = Array.from({ length: count }, () => {

            const roll = Math.random();

            return {
                x: Math.random() * w,
                y: Math.random() * h,
                r: rand(0.3, 1.5),
                base: rand(0.35, 0.95),
                speed: rand(0.01, 0.05),
                phase: rand(0, Math.PI * 2),
                color:
                    roll < 0.12 ? "255,214,170" :
                    roll < 0.25 ? "170,200,255" :
                                  "255,255,255"
            };
        });
    }


    /* =========================
       GALAKSI (malam, dibuat sekali)
    ========================= */

    function buildGalaxy() {

        const mobile = window.innerWidth < 768;
        const total = mobile ? 900 : 1600;

        galaxy = [];

        for (let i = 0; i < total; i++) {

            const arm = i % 2;
            const r = Math.pow(Math.random(), 0.65);
            const theta0 = arm * Math.PI + r * 5.2;

            const scatter = Math.random() + Math.random() + Math.random() - 1.5;
            const spread = 0.05 + r * 0.12;

            let color;
            if (r < 0.22)     color = "255,236,200";
            else if (r < 0.7) color = "160,195,255";
            else              color = "196,160,255";

            galaxy.push({
                r,
                theta0,
                sx: scatter * spread,
                sy: (Math.random() + Math.random() - 1) * spread,
                size: rand(0.6, 1.8),
                alpha: rand(0.35, 0.95) * (1 - r * 0.45),
                color
            });
        }
    }


    /* =========================
       HURUF & ANGKA MELAYANG (siang)
    ========================= */

    function initGlyphs() {

        const mobile = window.innerWidth < 768;
        const max = mobile ? 35 : 70;
        const count = Math.min(max, Math.round((w * h) / 22000));

        glyphs = Array.from({ length: count }, () => ({
            ch: DAY_CHARS[Math.floor(Math.random() * DAY_CHARS.length)],
            x: Math.random() * w,
            y: Math.random() * h,
            vx: rand(-0.25, 0.25),
            vy: rand(-0.4, -0.1),
            swayPhase: rand(0, Math.PI * 2),
            size: rand(14, 38),
            rot: rand(0, Math.PI * 2),
            vr: rand(-0.004, 0.004),
            alpha: rand(0.18, 0.42),
            color: Math.random() < 0.5 ? "22,163,74" : "249,115,22"
        }));
    }


    /* =========================
       GAMBAR
    ========================= */

    function drawNight() {

        ctx.clearRect(0, 0, w, h);

        ctx.fillStyle = nebulaA;
        ctx.fillRect(0, 0, w, h);

        ctx.fillStyle = nebulaB;
        ctx.fillRect(0, 0, w, h);

        // Bintang berkelip
        for (const s of stars) {

            const twinkle =
                0.55 + 0.45 * Math.sin(frame * s.speed + s.phase);

            ctx.beginPath();
            ctx.arc(s.x, s.y, s.r, 0, Math.PI * 2);
            ctx.fillStyle = `rgba(${s.color},${s.base * twinkle})`;
            ctx.fill();
        }

        drawGalaxy();
    }


    function drawGalaxy() {

        const size = Math.min(w, h);
        const cx = w * 0.72;
        const cy = h * 0.32;
        const R = size * 0.42;

        const tilt = -0.45;
        const cosT = Math.cos(tilt);
        const sinT = Math.sin(tilt);

        const core = ctx.createRadialGradient(cx, cy, 0, cx, cy, R * 0.35);
        core.addColorStop(0, "rgba(255,230,190,0.45)");
        core.addColorStop(0.4, "rgba(200,170,255,0.15)");
        core.addColorStop(1, "rgba(200,170,255,0)");

        ctx.fillStyle = core;
        ctx.fillRect(cx - R, cy - R, R * 2, R * 2);

        // Bagian dalam berputar lebih cepat daripada bagian luar
        const spin = frame * 0.0009;

        for (const p of galaxy) {

            const angle = p.theta0 + spin / (0.25 + p.r);

            const x = Math.cos(angle) * p.r + p.sx;
            const y = Math.sin(angle) * p.r + p.sy;

            const rx = x * cosT - y * sinT;
            const ry = (x * sinT + y * cosT) * 0.42;

            ctx.fillStyle = `rgba(${p.color},${p.alpha})`;
            ctx.fillRect(cx + rx * R, cy + ry * R, p.size, p.size);
        }
    }


    function drawDay() {

        ctx.clearRect(0, 0, w, h);

        ctx.fillStyle = dayGlowA;
        ctx.fillRect(0, 0, w, h);

        ctx.fillStyle = dayGlowB;
        ctx.fillRect(0, 0, w, h);

        for (const g of glyphs) {

            // Bergerak pelan, sedikit berayun ke kiri dan kanan
            g.x += g.vx + Math.sin(frame * 0.01 + g.swayPhase) * 0.2;
            g.y += g.vy;
            g.rot += g.vr;

            // Muncul kembali dari sisi lain layar
            if (g.y < -60) g.y = h + 60;
            if (g.x < -60) g.x = w + 60;
            if (g.x > w + 60) g.x = -60;

            ctx.save();
            ctx.translate(g.x, g.y);
            ctx.rotate(g.rot);
            ctx.font = `700 ${g.size}px Poppins, sans-serif`;
            ctx.textAlign = "center";
            ctx.textBaseline = "middle";
            ctx.fillStyle = `rgba(${g.color},${g.alpha})`;
            ctx.fillText(g.ch, 0, 0);
            ctx.restore();
        }
    }


    function draw() {

        if (isDay) {
            drawDay();
        } else {
            drawNight();
        }
    }


    /* =========================
       ANIMASI
    ========================= */

    function loop() {

        frame++;
        draw();
        requestAnimationFrame(loop);
    }


    /* =========================
       TEMA SIANG / MALAM
    ========================= */

    function applyTheme() {

        const hour = new Date().getHours();

        isDay = hour >= DAY_START && hour < DAY_END;

        document.documentElement.classList.toggle("theme-day", isDay);

        if (reduceMotion) draw();
    }


    /* =========================
       RESIZE
    ========================= */

    function onResize() {

        const widthChanged = window.innerWidth !== lastW;

        // Perubahan kecil tinggi (misalnya bilah alamat HP muncul/hilang)
        // tidak membuat elemen diacak ulang
        const heightChanged = Math.abs(window.innerHeight - lastH) > 120;

        sizeCanvas();

        if (widthChanged || heightChanged || stars.length === 0) {
            initStars();
            initGlyphs();
        }

        lastW = window.innerWidth;
        lastH = window.innerHeight;

        if (reduceMotion) draw();
    }


    window.addEventListener("resize", () => {

        clearTimeout(resizeTimer);
        resizeTimer = setTimeout(onResize, 150);

    });


    /* =========================
       START
    ========================= */

    injectDayStyles();
    buildGalaxy();
    onResize();
    applyTheme();

    if (!reduceMotion) {
        loop();
    }

    // Periksa ulang setiap menit agar berganti sendiri saat pergantian waktu
    setInterval(applyTheme, 60 * 1000);

})();
