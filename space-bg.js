/* =========================================
   LATAR LUAR ANGKASA
   Galaksi spiral berputar + bintang berkelip
   Dipakai bersama oleh berita.html dan detail-berita.html
========================================= */

(function () {

    const canvas = document.createElement("canvas");
    canvas.id = "space-bg";
    canvas.setAttribute("aria-hidden", "true");

    Object.assign(canvas.style, {
        position: "fixed",
        inset: "0",
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
    let frame = 0;


    function rand(min, max) {
        return min + Math.random() * (max - min);
    }


    /* =========================
       INISIALISASI
    ========================= */

    function init() {

        dpr = Math.min(window.devicePixelRatio || 1, 2);
        w = window.innerWidth;
        h = window.innerHeight;

        canvas.width = w * dpr;
        canvas.height = h * dpr;
        ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

        // Bintang kecil
        const count = Math.min(450, Math.round((w * h) / 4500));

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

        // Partikel galaksi spiral (koordinat ternormalisasi)
        galaxy = [];

        for (let i = 0; i < 1600; i++) {

            const arm = i % 2;
            const r = Math.pow(Math.random(), 0.65);
            const theta0 = arm * Math.PI + r * 5.2;

            // Sebaran acak agar lengan tidak terlihat kaku
            const scatter = (Math.random() + Math.random() + Math.random() - 1.5);
            const spread = 0.05 + r * 0.12;

            let color;
            if (r < 0.22)      color = "255,236,200";
            else if (r < 0.7)  color = "160,195,255";
            else               color = "196,160,255";

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

        if (reduceMotion) draw();
    }


    /* =========================
       GAMBAR
    ========================= */

    function drawNebula() {

        const g = ctx.createRadialGradient(
            w * 0.25, h * 0.75, 0,
            w * 0.25, h * 0.75, Math.max(w, h) * 0.55
        );

        g.addColorStop(0, "rgba(99,102,241,0.14)");
        g.addColorStop(1, "rgba(99,102,241,0)");

        ctx.fillStyle = g;
        ctx.fillRect(0, 0, w, h);

        const g2 = ctx.createRadialGradient(
            w * 0.85, h * 0.15, 0,
            w * 0.85, h * 0.15, Math.max(w, h) * 0.4
        );

        g2.addColorStop(0, "rgba(14,165,233,0.10)");
        g2.addColorStop(1, "rgba(14,165,233,0)");

        ctx.fillStyle = g2;
        ctx.fillRect(0, 0, w, h);
    }


    function drawStars() {

        for (const s of stars) {

            const twinkle =
                0.55 + 0.45 * Math.sin(frame * s.speed + s.phase);

            ctx.beginPath();
            ctx.arc(s.x, s.y, s.r, 0, Math.PI * 2);
            ctx.fillStyle = `rgba(${s.color},${s.base * twinkle})`;
            ctx.fill();
        }
    }


    function drawGalaxy() {

        const size = Math.min(w, h);
        const cx = w * 0.72;
        const cy = h * 0.32;
        const R = size * 0.42;

        const tilt = -0.45;
        const cosT = Math.cos(tilt);
        const sinT = Math.sin(tilt);

        // Inti galaksi bercahaya
        const core = ctx.createRadialGradient(cx, cy, 0, cx, cy, R * 0.35);
        core.addColorStop(0, "rgba(255,230,190,0.45)");
        core.addColorStop(0.4, "rgba(200,170,255,0.15)");
        core.addColorStop(1, "rgba(200,170,255,0)");

        ctx.fillStyle = core;
        ctx.fillRect(cx - R, cy - R, R * 2, R * 2);

        // Partikel lengan spiral, berputar dengan kecepatan berbeda
        // (bagian dalam lebih cepat dari bagian luar)
        const spin = frame * 0.0009;

        for (const p of galaxy) {

            const angle = p.theta0 + spin / (0.25 + p.r);

            let x = Math.cos(angle) * p.r + p.sx;
            let y = Math.sin(angle) * p.r + p.sy;

            // Miringkan galaksi lalu ratakan vertikal agar terlihat seperti piringan
            const rx = x * cosT - y * sinT;
            const ry = (x * sinT + y * cosT) * 0.42;

            ctx.fillStyle = `rgba(${p.color},${p.alpha})`;
            ctx.fillRect(cx + rx * R, cy + ry * R, p.size, p.size);
        }
    }


    function draw() {

        ctx.clearRect(0, 0, w, h);

        drawNebula();
        drawStars();
        drawGalaxy();
    }


    function loop() {

        frame++;
        draw();
        requestAnimationFrame(loop);
    }


    /* =========================
       START
    ========================= */

    init();

    if (!reduceMotion) {
        loop();
    }

    window.addEventListener("resize", () => {

        init();
    });

})();
