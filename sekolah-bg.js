/* =========================================
   LATAR ANIMASI PERANGKAT SEKOLAH
   Buku, pensil, pulpen, penghapus, sapu, tas, globe, dan lainnya
   melayang pelan di latar belakang halaman (mode cerah saja)
========================================= */

(function () {

    // Ikon perangkat sekolah (emoji). Penghapus digambar khusus di bawah.
    const ICONS = [
        "📚", "📖", "✏️", "🖊️", "🖍️", "📏", "📐", "✂️",
        "🎒", "🧹", "🌍", "🧮", "🎨", "🔔", "🎓", "🏫",
        "🔬", "🧪", "📓", "🗂️"
    ];

    const canvas = document.createElement("canvas");
    canvas.id = "school-bg";
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
    let items = [];
    let frame = 0;
    let lastW = 0, lastH = 0;
    let resizeTimer = null;


    function rand(min, max) {
        return min + Math.random() * (max - min);
    }


    function sizeCanvas() {

        const mobile = window.innerWidth < 768;

        dpr = mobile ? 1 : Math.min(window.devicePixelRatio || 1, 2);

        w = window.innerWidth;
        h = window.innerHeight;

        canvas.width = Math.round(w * dpr);
        canvas.height = Math.round(h * dpr);
        ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    }


    function initItems() {

        const mobile = window.innerWidth < 768;
        const max = mobile ? 22 : 40;
        const count = Math.min(max, Math.round((w * h) / 30000));

        items = Array.from({ length: count }, () => {

            const isEraser = Math.random() < 0.12;

            return {
                type: isEraser ? "eraser" : "icon",
                icon: ICONS[Math.floor(Math.random() * ICONS.length)],
                x: Math.random() * w,
                y: Math.random() * h,
                vx: rand(-0.15, 0.15),
                vy: rand(-0.35, -0.1),
                swayPhase: rand(0, Math.PI * 2),
                size: rand(26, 50),
                rot: rand(0, Math.PI * 2),
                vr: rand(-0.003, 0.003),
                alpha: rand(0.16, 0.30),
                // Warna hijau atau oranye bergantian
                color: Math.random() < 0.5 ? "22,163,74" : "249,115,22"
            };
        });
    }


    function drawEraser(g) {

        // Badan penghapus: setengah merah muda, setengah biru
        const width = g.size * 1.5;
        const height = g.size * 0.7;

        ctx.fillStyle = "#f9a8d4";
        ctx.fillRect(-width / 2, -height / 2, width / 2, height);

        ctx.fillStyle = "#60a5fa";
        ctx.fillRect(0, -height / 2, width / 2, height);

        ctx.fillStyle = "#e5e7eb";
        ctx.fillRect(-width / 2, height * 0.05, width, height * 0.25);
    }


    function draw() {

        ctx.clearRect(0, 0, w, h);

        for (const g of items) {

            // Melayang naik pelan dengan sedikit ayunan
            g.x += g.vx + Math.sin(frame * 0.008 + g.swayPhase) * 0.2;
            g.y += g.vy;
            g.rot += g.vr;

            if (g.y < -80) g.y = h + 80;
            if (g.x < -80) g.x = w + 80;
            if (g.x > w + 80) g.x = -80;

            ctx.save();
            ctx.translate(g.x, g.y);
            ctx.rotate(g.rot);
            ctx.globalAlpha = g.alpha;

            if (g.type === "eraser") {

                drawEraser(g);

            } else {

                ctx.font =
                    `${g.size}px "Apple Color Emoji", "Segoe UI Emoji", "Noto Color Emoji", sans-serif`;
                ctx.textAlign = "center";
                ctx.textBaseline = "middle";
                ctx.fillText(g.icon, 0, 0);
            }

            ctx.restore();
        }
    }


    function loop() {

        frame++;
        draw();
        requestAnimationFrame(loop);
    }


    function onResize() {

        const widthChanged = window.innerWidth !== lastW;
        const heightChanged = Math.abs(window.innerHeight - lastH) > 120;

        sizeCanvas();

        if (widthChanged || heightChanged || items.length === 0) {
            initItems();
        }

        lastW = window.innerWidth;
        lastH = window.innerHeight;

        if (reduceMotion) draw();
    }


    window.addEventListener("resize", () => {

        clearTimeout(resizeTimer);
        resizeTimer = setTimeout(onResize, 150);

    });


    onResize();

    if (!reduceMotion) {
        loop();
    }

})();