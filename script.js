document.addEventListener('DOMContentLoaded', () => {
    if (window.location.hash === '#work') {
        document.body.classList.remove('about-mode');
        document.body.classList.add('work-mode');
    }

    const useFinePointerChrome =
        window.matchMedia('(pointer: fine)').matches &&
        window.matchMedia('(hover: hover)').matches;

    // --- Custom Cursor (mouse / fine pointer only) ---
    const cursor = document.querySelector('.cursor');
    const follower = document.querySelector('.cursor-follower');

    if (useFinePointerChrome && cursor && follower) {
        let mouseX = window.innerWidth / 2;
        let mouseY = window.innerHeight / 2;
        let followerX = mouseX;
        let followerY = mouseY;

        document.addEventListener('mousemove', (e) => {
            mouseX = e.clientX;
            mouseY = e.clientY;

            cursor.style.left = `${mouseX}px`;
            cursor.style.top = `${mouseY}px`;
        });

        function animateFollower() {
            followerX += (mouseX - followerX) * 0.15;
            followerY += (mouseY - followerY) * 0.15;

            follower.style.left = `${followerX}px`;
            follower.style.top = `${followerY}px`;

            requestAnimationFrame(animateFollower);
        }
        animateFollower();

        const attachHoverEffects = () => {
            const interactiveElements = document.querySelectorAll(
                'a, button, .interactive, .thumb, .main-title, .category-item'
            );
            interactiveElements.forEach((el) => {
                el.addEventListener('mouseenter', () => follower.classList.add('active'));
                el.addEventListener('mouseleave', () => follower.classList.remove('active'));
            });
        };
        attachHoverEffects();
    } else {
        if (cursor) cursor.style.display = 'none';
        if (follower) follower.style.display = 'none';
    }

    // --- Cursor click stamps (fine pointer only) ---
    if (useFinePointerChrome) {
        const stampsLayer = document.createElement('div');
        stampsLayer.id = 'cursor-stamps-layer';
        stampsLayer.setAttribute('aria-hidden', 'true');
        document.body.appendChild(stampsLayer);

        const STAMP_DRAG_THRESHOLD_PX = 12;
        const STAMP_DRAG_THRESHOLD_SQ = STAMP_DRAG_THRESHOLD_PX * STAMP_DRAG_THRESHOLD_PX;
        const STAMP_VISIBLE_MS = 2600;
        const STAMP_FADE_MS = 550;
        const STAMP_MAX_COUNT = 24;

        let stampGestureOrigin = null;
        let stampMaxDistSq = 0;
        let stampClickEligible = false;

        window.addEventListener(
            'pointerdown',
            (e) => {
                if (e.button !== 0) return;
                stampGestureOrigin = { x: e.clientX, y: e.clientY };
                stampMaxDistSq = 0;
                stampClickEligible = false;
            },
            true
        );

        window.addEventListener(
            'pointermove',
            (e) => {
                if (!stampGestureOrigin || !e.buttons) return;
                const dx = e.clientX - stampGestureOrigin.x;
                const dy = e.clientY - stampGestureOrigin.y;
                const d = dx * dx + dy * dy;
                if (d > stampMaxDistSq) stampMaxDistSq = d;
            },
            true
        );

        window.addEventListener(
            'pointerup',
            (e) => {
                if (e.button !== 0 || !stampGestureOrigin) return;
                stampClickEligible = stampMaxDistSq <= STAMP_DRAG_THRESHOLD_SQ;
                stampGestureOrigin = null;
            },
            true
        );

        function spawnCursorStamp(clientX, clientY) {
            if (!stampsLayer) return;
            while (stampsLayer.children.length >= STAMP_MAX_COUNT) {
                stampsLayer.firstElementChild?.remove();
            }

            const ringLarge = follower && follower.classList.contains('active');
            const stamp = document.createElement('div');
            stamp.className = 'cursor-stamp';
            stamp.style.left = `${clientX}px`;
            stamp.style.top = `${clientY}px`;

            const ring = document.createElement('div');
            ring.className =
                'cursor-stamp__ring' + (ringLarge ? ' cursor-stamp__ring--large' : '');

            stamp.appendChild(ring);
            stampsLayer.appendChild(stamp);

            requestAnimationFrame(() => stamp.classList.add('cursor-stamp--visible'));

            window.setTimeout(() => {
                stamp.classList.add('cursor-stamp--leaving');
                window.setTimeout(() => stamp.remove(), STAMP_FADE_MS);
            }, STAMP_VISIBLE_MS);
        }

        /** Stamps on “empty” clicks only — not on links, buttons, or other UI that does something. */
        function shouldSuppressCursorStamp(target) {
            return Boolean(
                target.closest(
                    [
                        'a[href]',
                        'button',
                        'input',
                        'textarea',
                        'select',
                        'label',
                        '.link-item',
                        '.thumb',
                        '.category-item',
                        '#logo',
                        '.about-inline-link',
                        '.project-link',
                        '.social-links a',
                        '#main-gallery-img',
                        '.floating-text',
                        '.work-detail-thumb',
                        '.detail-back',
                        '.detail-thumb',
                    ].join(', ')
                )
            );
        }

        document.addEventListener(
            'click',
            (e) => {
                if (e.button !== 0) return;
                if (!stampClickEligible) return;
                stampClickEligible = false;
                if (shouldSuppressCursorStamp(e.target)) return;
                spawnCursorStamp(e.clientX, e.clientY);
            },
            true
        );
    }

    setTimeout(() => {
        const mainContent = document.querySelector('.hidden-initially');
        if (mainContent) mainContent.classList.add('visible');
    }, 100);

    // --- Drag to draw floating gray lines ---
    const drawLayer = document.getElementById('draw-layer');
    const SVG_NS = 'http://www.w3.org/2000/svg';
    const floatingLines = [];
    let drawingPath = null;
    let drawingPoints = [];
    let isDrawingLine = false;

    function isInteractiveTarget(target) {
        return Boolean(target.closest(
            'a, button, input, textarea, select, .thumb, .arrow, .floating-text, .project-overlay, .work-detail-panel, .work-detail-layer, .gallery-categories-sidebar, .about-middle, .about-right, .about-left-instruction, .about-intro-bundle, .about-floating-names-slot'
        ));
    }

    function compressPoints(points) {
        if (points.length <= 2) return points;
        const reduced = [points[0]];
        for (let i = 1; i < points.length - 1; i++) {
            const prev = reduced[reduced.length - 1];
            const curr = points[i];
            if (Math.hypot(curr.x - prev.x, curr.y - prev.y) >= 3) reduced.push(curr);
        }
        reduced.push(points[points.length - 1]);
        return reduced;
    }

    function pointsToPath(points) {
        if (!points.length) return '';
        let d = `M ${points[0].x} ${points[0].y}`;
        for (let i = 1; i < points.length; i++) d += ` L ${points[i].x} ${points[i].y}`;
        return d;
    }

    function animateFloatingLines() {
        for (let i = 0; i < floatingLines.length; i++) {
            const line = floatingLines[i];
            line.tx += line.vx;
            line.ty += line.vy;
            line.rot += line.vr;

            const bb = line.baseBox;
            const minX = bb.x + line.tx;
            const minY = bb.y + line.ty;
            const maxX = minX + bb.width;
            const maxY = minY + bb.height;
            const pad = 50;

            if (maxX < -pad) line.tx += window.innerWidth + bb.width + pad * 2;
            if (minX > window.innerWidth + pad) line.tx -= window.innerWidth + bb.width + pad * 2;
            if (maxY < -pad) line.ty += window.innerHeight + bb.height + pad * 2;
            if (minY > window.innerHeight + pad) line.ty -= window.innerHeight + bb.height + pad * 2;

            line.el.setAttribute('transform', `translate(${line.tx} ${line.ty}) rotate(${line.rot} ${line.cx} ${line.cy})`);
        }
        requestAnimationFrame(animateFloatingLines);
    }
    if (useFinePointerChrome) {
        requestAnimationFrame(animateFloatingLines);
    }

    if (useFinePointerChrome && drawLayer) {
        const setLayerSize = () => {
            drawLayer.setAttribute('viewBox', `0 0 ${window.innerWidth} ${window.innerHeight}`);
        };
        setLayerSize();
        window.addEventListener('resize', setLayerSize);

        window.addEventListener('pointerdown', (e) => {
            if (e.button !== 0 || isInteractiveTarget(e.target)) return;
            isDrawingLine = true;
            drawingPoints = [{ x: e.clientX, y: e.clientY }];
            drawingPath = document.createElementNS(SVG_NS, 'path');
            drawingPath.classList.add('draw-line');
            drawLayer.appendChild(drawingPath);
            drawingPath.setAttribute('d', pointsToPath(drawingPoints));
        });

        window.addEventListener('pointermove', (e) => {
            if (!isDrawingLine || !drawingPath) return;
            drawingPoints.push({ x: e.clientX, y: e.clientY });
            drawingPath.setAttribute('d', pointsToPath(compressPoints(drawingPoints)));
        });

        window.addEventListener('pointerup', () => {
            if (!isDrawingLine || !drawingPath) return;
            isDrawingLine = false;
            const finalPoints = compressPoints(drawingPoints);
            if (finalPoints.length < 2) {
                drawingPath.remove();
                drawingPath = null;
                drawingPoints = [];
                return;
            }

            drawingPath.setAttribute('d', pointsToPath(finalPoints));
            const box = drawingPath.getBBox();
            floatingLines.push({
                el: drawingPath,
                tx: 0,
                ty: 0,
                rot: 0,
                vx: (Math.random() - 0.5) * 0.35,
                vy: (Math.random() - 0.5) * 0.35,
                vr: (Math.random() - 0.5) * 0.035,
                cx: box.x + box.width / 2,
                cy: box.y + box.height / 2,
                baseBox: box
            });

            // Let each line live ~10s, then fade out and remove.
            const lineEl = drawingPath;
            setTimeout(() => {
                lineEl.style.transition = 'opacity 0.6s ease';
                lineEl.style.opacity = '0';
                setTimeout(() => {
                    const idx = floatingLines.findIndex((line) => line.el === lineEl);
                    if (idx !== -1) floatingLines.splice(idx, 1);
                    lineEl.remove();
                }, 620);
            }, 10000);

            drawingPath = null;
            drawingPoints = [];
        });
    }

    // --- Draggable Floating Logic (Restored for About page!) ---
    const repulseElements = document.querySelectorAll('.repulse');
    if (repulseElements.length > 0) {
        const elementsData = Array.from(repulseElements).map(el => {
            el.style.userSelect = 'none';
            const data = {
                el,
                x: 0, y: 0, vx: 0, vy: 0,
                ambientPhaseX: Math.random() * Math.PI * 2,
                ambientPhaseY: Math.random() * Math.PI * 2,
                ambientSpeedX: 0.5 + Math.random() * 0.5,
                ambientSpeedY: 0.5 + Math.random() * 0.5,
            };
            el.addEventListener('mouseenter', () => follower?.classList.add('active'));
            el.addEventListener('mouseleave', () => follower?.classList.remove('active'));
            return data;
        });

        let draggedData = null;
        let dragStartX = 0;
        let dragStartY = 0;
        let initialDataX = 0;
        let initialDataY = 0;

        const CLICK_DRAG_THRESHOLD = 12;

        function endFloatDrag(clientX, clientY) {
            if (!draggedData) return;
            draggedData.el.style.removeProperty('z-index');

            const dist = Math.hypot(clientX - dragStartX, clientY - dragStartY);
            if (dist < CLICK_DRAG_THRESHOLD) {
                elementsData.forEach((data) => {
                    if (data !== draggedData) data.el.classList.remove('show-meaning');
                });
                draggedData.el.classList.toggle('show-meaning');
            }

            draggedData = null;
        }

        elementsData.forEach((data) => {
            data.el.addEventListener('pointerdown', (e) => {
                if (e.button !== 0) return;
                e.preventDefault();
                e.stopPropagation();
                draggedData = data;
                dragStartX = e.clientX;
                dragStartY = e.clientY;
                initialDataX = data.x;
                initialDataY = data.y;
                data.el.style.zIndex = '100';
                follower?.classList.add('active');
            });
        });

        window.addEventListener('pointermove', (e) => {
            if (!draggedData) return;
            draggedData.x = initialDataX + (e.clientX - dragStartX);
            draggedData.y = initialDataY + (e.clientY - dragStartY);
            draggedData.vx = 0;
            draggedData.vy = 0;
        });

        window.addEventListener('pointerup', (e) => {
            if (!draggedData) return;
            follower?.classList.remove('active');
            endFloatDrag(e.clientX, e.clientY);
        });

        window.addEventListener('pointercancel', (e) => {
            if (!draggedData) return;
            follower?.classList.remove('active');
            endFloatDrag(e.clientX, e.clientY);
        });

        // Click outside to close all meaning boxes
        window.addEventListener('mousedown', (e) => {
            if (!e.target.closest('.floating-text')) {
                elementsData.forEach(data => data.el.classList.remove('show-meaning'));
            }
        });

        function animateFloat() {
            const time = Date.now() * 0.001;
            const isAboutMode = document.body.classList.contains('about-mode');
            const mobileAbout =
                isAboutMode && window.matchMedia('(max-width: 768px)').matches;
            const aboutNamesSlot =
                isAboutMode ? document.getElementById('about-floating-names-slot') : null;

            elementsData.forEach((data) => {
                data.vx *= 0.985;
                data.vy *= 0.985;

                if (isAboutMode && draggedData !== data) {
                    const drift = mobileAbout ? 0.02 : 0.042;
                    const maxSpeed = mobileAbout ? 0.48 : 0.82;
                    data.vx += (Math.random() - 0.5) * drift;
                    data.vy += (Math.random() - 0.5) * drift;
                    data.vx = Math.max(-maxSpeed, Math.min(maxSpeed, data.vx));
                    data.vy = Math.max(-maxSpeed, Math.min(maxSpeed, data.vy));

                    if (!aboutNamesSlot) {
                        const floatRect = data.el.getBoundingClientRect();
                        const pad = 40;
                        if (floatRect.right < -pad) data.x += window.innerWidth + floatRect.width + pad * 2;
                        if (floatRect.left > window.innerWidth + pad) data.x -= window.innerWidth + floatRect.width + pad * 2;
                        if (floatRect.bottom < -pad) data.y += window.innerHeight + floatRect.height + pad * 2;
                        if (floatRect.top > window.innerHeight + pad) data.y -= window.innerHeight + floatRect.height + pad * 2;
                    }
                }

                data.x += data.vx;
                data.y += data.vy;
                const isDraggingThis = draggedData === data;
                const ambX = mobileAbout ? 10 : 18;
                const ambY = mobileAbout ? 12 : 22;
                const floatX = isDraggingThis ? 0 : Math.sin(time * data.ambientSpeedX + data.ambientPhaseX) * ambX;
                const floatY = isDraggingThis ? 0 : Math.cos(time * data.ambientSpeedY + data.ambientPhaseY) * ambY;

                data.el.style.transform = `translate(${data.x + floatX}px, ${data.y + floatY}px)`;

                if (aboutNamesSlot && draggedData !== data) {
                    const sr = aboutNamesSlot.getBoundingClientRect();
                    if (sr.width < 12 || sr.height < 12) return;
                    const pad = 6;
                    let r = data.el.getBoundingClientRect();
                    let dy = 0;
                    if (r.bottom > sr.bottom - pad) dy -= r.bottom - (sr.bottom - pad);
                    if (r.top < sr.top + pad) dy += sr.top + pad - r.top;
                    if (dy !== 0) {
                        data.y += dy;
                        data.vy *= 0.5;
                        data.el.style.transform = `translate(${data.x + floatX}px, ${data.y + floatY}px)`;
                        r = data.el.getBoundingClientRect();
                    }
                    let dx = 0;
                    if (r.right > sr.right - pad) dx -= r.right - (sr.right - pad);
                    if (r.left < sr.left + pad) dx += sr.left + pad - r.left;
                    if (dx !== 0) {
                        data.x += dx;
                        data.vx *= 0.5;
                        data.el.style.transform = `translate(${data.x + floatX}px, ${data.y + floatY}px)`;
                    }
                }
            });
            requestAnimationFrame(animateFloat);
        }
        setTimeout(animateFloat, 500);
    }

    // --- Scattered Typing Ambient Logic ---
    const mainElement = document.querySelector('main');
    const scatteredContainer = document.createElement('div');
    scatteredContainer.id = 'scattered-words-container';
    if (mainElement) {
        mainElement.prepend(scatteredContainer);
    }

    const scatterWordsList = [
        "unspoken", "unwritten", "untold", "unseen", "unnamed",
        "overlooked", "silence", "margin", "blank", "pause",
        "void", "gap", "invisible", "mundane", "invisible", "elusive"
    ];

    let scatterSessionId = 0;

    /**
     * Edge “scattered” words on the home screen — edit these values only.
     *
     * staggerStepMs / staggerWindowMs — Word #i is scheduled at (i * step + random 0..window) ms
     *   after scatter starts. Raise these to slow how often *new* words start (does not change typing speed).
     * introDelayMs — ms after page load before the first scatter attempts (after intro sentence).
     * maxOnScreen — hard cap on how many words can exist at once (typing + visible + fading).
     * charDelayMin + charDelayRange — ms per typed letter for edge words (min + random up to range).
     * holdMsMin / holdMsRange — ms the full word stays before fading.
     * fadeMs — should match .scattered-word { transition: opacity … } in style.css (same milliseconds).
     */
    const SCATTER_CONFIG = {
        introDelayMs: 2400,
        staggerStepMs: 900,
        staggerWindowMs: 2800,
        gridWordCount: 400,
        maxOnScreen: 5,
        charDelayMin: 110,
        charDelayRange: 95,
        holdMsMin: 500,
        holdMsRange: 380,
        fadeMs: 400,
        capRetryMsMin: 200,
        capRetryMsRange: 180,
        placementRetryMs: 250,
    };

    function scatteredWordOnScreenCount() {
        if (!scatteredContainer) return 0;
        return scatteredContainer.querySelectorAll('.scattered-word').length;
    }

    function spawnOneScatteredWord(session) {
        const alive = () => session === scatterSessionId;
        if (!alive()) return;

        if (document.body.classList.contains('work-mode') || document.body.classList.contains('about-mode')) {
            return;
        }

        if (scatteredWordOnScreenCount() >= SCATTER_CONFIG.maxOnScreen) {
            setTimeout(() => {
                if (alive()) spawnOneScatteredWord(session);
            }, SCATTER_CONFIG.capRetryMsMin + Math.random() * SCATTER_CONFIG.capRetryMsRange);
            return;
        }

        const wordObj = document.createElement('div');
        wordObj.className = 'scattered-word';

        let randX_px = 0, randY_px = 0;
        let randX_pct = 0, randY_pct = 0;
        let attempts = 0;

        while (attempts < 30) {
            const zone = Math.floor(Math.random() * 4);
            if (zone === 0) {
                randX_pct = Math.random() * 20 + 5;
                randY_pct = Math.random() * 90 + 5;
            } else if (zone === 1) {
                randX_pct = Math.random() * 20 + 75;
                randY_pct = Math.random() * 90 + 5;
            } else if (zone === 2) {
                randX_pct = Math.random() * 50 + 25;
                randY_pct = Math.random() * 15 + 5;
            } else {
                randX_pct = Math.random() * 50 + 25;
                randY_pct = Math.random() * 15 + 80;
            }

            randX_px = (randX_pct / 100) * window.innerWidth;
            randY_px = (randY_pct / 100) * window.innerHeight;

            const logoEl = document.getElementById('logo');
            const introEl = document.querySelector('.intro-sentence');
            const logoRect = logoEl ? logoEl.getBoundingClientRect() : { left: -100, right: -100, top: -100, bottom: -100 };
            const introRect = introEl ? introEl.getBoundingClientRect() : { left: -100, right: -100, top: -100, bottom: -100 };

            const buffer = 40;
            const hitLogo = (randX_px > logoRect.left - buffer && randX_px < logoRect.right + buffer && randY_px > logoRect.top - buffer && randY_px < logoRect.bottom + buffer);
            const hitIntro = (randX_px > introRect.left - buffer && randX_px < introRect.right + buffer && randY_px > introRect.top - buffer && randY_px < introRect.bottom + buffer);

            let hitOtherWord = false;
            const existingWords = scatteredContainer.querySelectorAll('.scattered-word');
            for (let i = 0; i < existingWords.length; i++) {
                const wRect = existingWords[i].getBoundingClientRect();
                if (randX_px > wRect.left - 80 && randX_px < wRect.right + 80 &&
                    randY_px > wRect.top - 40 && randY_px < wRect.bottom + 40) {
                    hitOtherWord = true;
                    break;
                }
            }

            if (!hitLogo && !hitIntro && !hitOtherWord) {
                break;
            }
            attempts++;
        }

        if (attempts >= 30) {
            setTimeout(() => {
                if (alive()) spawnOneScatteredWord(session);
            }, SCATTER_CONFIG.placementRetryMs);
            return;
        }

        wordObj.style.left = randX_pct + '%';
        wordObj.style.top = randY_pct + '%';

        scatteredContainer.appendChild(wordObj);

        const theWord = scatterWordsList[Math.floor(Math.random() * scatterWordsList.length)];
        let typeIdx = 0;

        function typeChar() {
            if (!alive()) return;
            if (typeIdx < theWord.length) {
                wordObj.textContent += theWord.charAt(typeIdx);
                typeIdx++;
                setTimeout(
                    typeChar,
                    SCATTER_CONFIG.charDelayMin + Math.random() * SCATTER_CONFIG.charDelayRange
                );
            } else {
                setTimeout(() => {
                    if (!alive()) return;
                    wordObj.style.opacity = 0;
                    setTimeout(() => {
                        wordObj.remove();
                    }, SCATTER_CONFIG.fadeMs);
                }, SCATTER_CONFIG.holdMsMin + Math.random() * SCATTER_CONFIG.holdMsRange);
            }
        }

        typeChar();
    }

    function startHomeScatterStrands() {
        scatterSessionId += 1;
        const session = scatterSessionId;
        const container = document.getElementById('scattered-words-container');
        if (container) container.innerHTML = '';
        setTimeout(() => {
            if (session !== scatterSessionId) return;
            for (let i = 0; i < SCATTER_CONFIG.gridWordCount; i++) {
                const offsetMs =
                    i * SCATTER_CONFIG.staggerStepMs + Math.random() * SCATTER_CONFIG.staggerWindowMs;
                setTimeout(() => {
                    if (session !== scatterSessionId) return;
                    spawnOneScatteredWord(session);
                }, offsetMs);
            }
        }, SCATTER_CONFIG.introDelayMs);
    }

    startHomeScatterStrands();

    // --- Page Transitions ---
    const navWork = document.getElementById('nav-work');
    const navAbout = document.getElementById('nav-about');
    const logo = document.getElementById('logo');

    const staticTextEl = document.querySelector('.static-text');
    const fullStaticText = 'What I find in the.........';
    const INTRO_TYPEWRITER_MS_PER_CHAR = 115;
    let introTypeGen = 0;
    let introTypeIndex = 0;

    function runIntroTyping(session) {
        if (session !== introTypeGen || !staticTextEl) return;
        if (introTypeIndex >= fullStaticText.length) return;
        staticTextEl.textContent += fullStaticText.charAt(introTypeIndex);
        introTypeIndex += 1;
        setTimeout(() => runIntroTyping(session), INTRO_TYPEWRITER_MS_PER_CHAR);
    }

    function startIntroTypewriter() {
        if (!staticTextEl) return;
        introTypeGen += 1;
        const session = introTypeGen;
        introTypeIndex = 0;
        staticTextEl.textContent = '';
        setTimeout(() => runIntroTyping(session), 400);
    }

    startIntroTypewriter();

    // Switch to work mode
    if (navWork) {
        navWork.addEventListener('click', (e) => {
            e.preventDefault();
            document.body.classList.remove('about-mode');
            document.body.classList.add('work-mode');
        });
    }

    // Switch to about mode
    let aboutTypeFinished = false;
    const ABOUT_INSTRUCTION_LINE1 = 'People know me by different names.';
    const ABOUT_INSTRUCTION_LINE2 = 'Click to explore.';

    function fitAboutInstructionLine1() {
        const lineEl = document.querySelector('.about-instruction__line--first');
        if (!lineEl) return;
        let rem = 1.15;
        const minRem = 0.56;
        const step = 0.02;
        lineEl.style.fontSize = `${rem}rem`;
        while (lineEl.scrollWidth > lineEl.clientWidth + 1 && rem > minRem) {
            rem -= step;
            lineEl.style.fontSize = `${rem}rem`;
        }
    }

    let aboutInstructionResizeTimer;
    window.addEventListener('resize', () => {
        clearTimeout(aboutInstructionResizeTimer);
        aboutInstructionResizeTimer = setTimeout(() => {
            if (document.body.classList.contains('about-mode')) {
                fitAboutInstructionLine1();
            }
        }, 100);
    });

    if (navAbout) {
        navAbout.addEventListener('click', (e) => {
            e.preventDefault();
            document.body.classList.remove('work-mode');
            document.body.classList.add('about-mode');

            const line1El = document.getElementById('about-typewriter-line1');
            const line2El = document.getElementById('about-typewriter-line2');
            const cursor1 = document.getElementById('about-type-cursor-1');
            const cursor2 = document.getElementById('about-type-cursor-2');
            const aboutInstructionBox = document.querySelector('.about-left-instruction');
            const aboutInstructionInner = document.querySelector('.about-left-instruction__inner');

            if (
                line1El &&
                line2El &&
                cursor1 &&
                cursor2 &&
                aboutInstructionBox &&
                aboutInstructionInner &&
                !aboutTypeFinished
            ) {
                aboutInstructionInner.classList.add('active-obstacle');
                line1El.textContent = '';
                line2El.textContent = '';
                cursor2.hidden = true;
                cursor1.hidden = false;

                let phase = 1;
                let index = 0;

                function typeAboutInstruction() {
                    if (phase === 1) {
                        if (index < ABOUT_INSTRUCTION_LINE1.length) {
                            line1El.textContent += ABOUT_INSTRUCTION_LINE1.charAt(index);
                            index += 1;
                            fitAboutInstructionLine1();
                            setTimeout(typeAboutInstruction, 70);
                        } else {
                            phase = 2;
                            index = 0;
                            cursor1.hidden = true;
                            cursor2.hidden = false;
                            setTimeout(typeAboutInstruction, 450);
                        }
                    } else if (index < ABOUT_INSTRUCTION_LINE2.length) {
                        line2El.textContent += ABOUT_INSTRUCTION_LINE2.charAt(index);
                        index += 1;
                        setTimeout(typeAboutInstruction, 70);
                    } else {
                        aboutTypeFinished = true;
                        setTimeout(() => {
                            aboutInstructionInner.classList.remove('active-obstacle');
                            aboutInstructionBox.classList.add('fade-out');
                        }, 2500);
                    }
                }

                setTimeout(typeAboutInstruction, 1000);
            }
        });
    }

    // --- Gallery Logic ---
    const mainImg = document.getElementById('main-gallery-img');
    const thumbnails = document.querySelectorAll('.thumb');
    const leftArrow = document.querySelector('.arrow-left');
    const rightArrow = document.querySelector('.arrow-right');
    const categoryItems = document.querySelectorAll('.category-item');

    const galleryData = window.PORTFOLIO_GALLERY || { design: [], fineart: [] };
    const IMAGE_FADE_MS = 260;

    function fadeSwapImage(imgEl, nextSrc, onAfterSwap) {
        if (!imgEl || !nextSrc) return;
        imgEl.style.opacity = '0';
        setTimeout(() => {
            imgEl.src = nextSrc;
            if (typeof onAfterSwap === 'function') onAfterSwap();
            imgEl.style.opacity = '1';
        }, IMAGE_FADE_MS);
    }

    let currentCategory = 'design';
    let currentImages = galleryData[currentCategory];
    let currentGalleryIndex = 0;

    let suppressMainGalleryClickUntil = 0;
    function armSuppressMainGalleryClick() {
        suppressMainGalleryClickUntil = performance.now() + 220;
    }
    function isMainGalleryClickSuppressed() {
        return performance.now() < suppressMainGalleryClickUntil;
    }

    function loadGalleryContent(category, silentSync) {
        currentCategory = category;
        currentImages = galleryData[category];

        // Update all thumbnails with the new category's images
        thumbnails.forEach((thumb, i) => {
            if (currentImages[i]) {
                const item = currentImages[i];
                thumb.src = item.thumbSrc || item.src;
                thumb.style.display = 'block';
            } else {
                thumb.style.display = 'none'; // Hide if fewer images
            }
        });

        // Always start at index 0 when switching categories
        if (silentSync) {
            currentGalleryIndex = 0;
            if (currentImages[0] && mainImg) {
                mainImg.src = currentImages[0].src;
                mainImg.style.opacity = '1';
            }
            thumbnails.forEach((t) => t.classList.remove('active'));
            if (thumbnails[0]) thumbnails[0].classList.add('active');
        } else {
            updateGallery(0);
        }
    }

    function updateGallery(index) {
        currentGalleryIndex = index;

        // Force close overlay if it's open
        const overlay = document.getElementById('project-overlay');
        if (overlay) overlay.classList.remove('active');

        // Smooth crossfade between gallery images
        fadeSwapImage(mainImg, currentImages[index].src);

        thumbnails.forEach(t => t.classList.remove('active'));
        if (thumbnails[index]) {
            thumbnails[index].classList.add('active');
        }
    }

    // Category click listeners
    const galleryContentBox = document.querySelector('.gallery-content');

    categoryItems.forEach(item => {
        item.addEventListener('click', (e) => {
            e.stopPropagation();
            armSuppressMainGalleryClick();
            if (detailOpen) closeDetailView(false);

            // Update active state in sidebar
            categoryItems.forEach(c => c.classList.remove('active'));
            item.classList.add('active');

            // Switch gallery content smoothly
            const category = item.getAttribute('data-category');

            if (galleryContentBox) {
                // Fade out the entire right section (main image + thumbnails)
                galleryContentBox.style.opacity = 0;

                setTimeout(() => {
                    loadGalleryContent(category);
                    galleryContentBox.style.opacity = 1;
                    armSuppressMainGalleryClick();
                }, 400); // Waits for the CSS fade, then loads and fades back in
            } else {
                loadGalleryContent(category);
            }
        });
    });

    thumbnails.forEach(thumb => {
        thumb.addEventListener('click', () => {
            updateGallery(parseInt(thumb.getAttribute('data-index')));
        });
    });

    /* Sync main image + strip with projects-data.js (includes all Design thumbs, e.g. INDIEGO) */
    loadGalleryContent('design', true);

    if (leftArrow) {
        leftArrow.addEventListener('click', () => {
            let newIndex = currentGalleryIndex - 1;
            if (newIndex < 0) newIndex = currentImages.length - 1;
            updateGallery(newIndex);
        });
    }

    if (rightArrow) {
        rightArrow.addEventListener('click', () => {
            let newIndex = currentGalleryIndex + 1;
            if (newIndex >= currentImages.length) newIndex = 0;
            updateGallery(newIndex);
        });
    }

    function stepMainGallery(delta) {
        if (!currentImages.length) return;
        let newIndex = currentGalleryIndex + delta;
        if (newIndex < 0) newIndex = currentImages.length - 1;
        if (newIndex >= currentImages.length) newIndex = 0;
        updateGallery(newIndex);
    }

    // --- Overlay + In-Page Detail Interaction --- //
    const projectOverlay = document.getElementById('project-overlay');
    const overlayTitle = document.getElementById('overlay-title');
    const overlayLink = document.getElementById('overlay-link');

    const detailLayer = document.getElementById('work-detail-layer');
    const detailPanel = document.getElementById('work-detail-panel');
    const detailThumbs = document.getElementById('work-detail-thumbs');
    const detailHero = document.getElementById('work-detail-hero');
    const detailTitle = document.getElementById('work-detail-title');
    const detailYear = document.getElementById('work-detail-year');
    const detailDesc = document.getElementById('work-detail-desc');
    const workDetailArtworkSpec = document.getElementById('work-detail-artwork-spec');
    const workDetailArtworkDesc = document.getElementById('work-detail-artwork-description');

    let detailOpen = false;
    let detailArtworkRevealTimeout = null;
    let previousWorkIndex = 0;
    let detailSlideSources = [];
    let detailSlideIndex = 0;

    function updateWorkDetailHeroAdvanceState() {
        if (!detailHero) return;
        const multi = detailSlideSources.length > 1;
        detailHero.classList.toggle('detail-hero--advance', multi);
        if (multi) {
            detailHero.setAttribute('role', 'button');
            detailHero.setAttribute('tabindex', '0');
            detailHero.setAttribute(
                'aria-label',
                'Show next image. Use Arrow Down for next and Arrow Up for previous.'
            );
        } else {
            detailHero.removeAttribute('role');
            detailHero.removeAttribute('tabindex');
            detailHero.removeAttribute('aria-label');
        }
    }

    function goToDetailSlide(nextIndex) {
        if (!detailOpen || !detailHero || detailSlideSources.length <= 1) return;
        const n = detailSlideSources.length;
        const idx = ((nextIndex % n) + n) % n;
        detailSlideIndex = idx;
        const src = detailSlideSources[idx];
        const item = currentImages[currentGalleryIndex];
        fadeSwapImage(detailHero, src, () => {
            detailHero.classList.remove('detail-hero-grow');
            requestAnimationFrame(() => detailHero.classList.add('detail-hero-grow'));
        });
        if (detailThumbs) {
            detailThumbs.querySelectorAll('.work-detail-thumb').forEach((b, i) => {
                b.classList.toggle('active', i === idx);
            });
        }
        detailHero.alt = item ? `${item.title} — image ${idx + 1}` : 'Project image';
    }

    function advanceWorkDetailHero(e) {
        if (e.type === 'keydown' && e.key !== 'Enter' && e.key !== ' ') return;
        if (e.type === 'keydown') e.preventDefault();
        if (!detailOpen || !detailHero || detailSlideSources.length <= 1) return;
        goToDetailSlide(detailSlideIndex + 1);
    }

    if (detailHero) {
        detailHero.addEventListener('click', advanceWorkDetailHero);
        detailHero.addEventListener('keydown', advanceWorkDetailHero);
    }

    function renderDetailThumbs(slides, activeIndex) {
        if (!detailThumbs) return;
        detailThumbs.innerHTML = '';

        slides.forEach((src, i) => {
            const btn = document.createElement('button');
            btn.type = 'button';
            btn.className = 'work-detail-thumb';
            if (i === activeIndex) btn.classList.add('active');

            const img = document.createElement('img');
            img.src = src;
            img.alt = '';
            btn.appendChild(img);

            btn.addEventListener('click', () => {
                goToDetailSlide(i);
            });

            detailThumbs.appendChild(btn);
        });
    }

    document.addEventListener('keydown', (e) => {
        const el = e.target;
        if (el && el.closest && el.closest('input, textarea, select, [contenteditable="true"]')) {
            return;
        }

        if (detailOpen) {
            if (detailSlideSources.length > 1 && (e.key === 'ArrowUp' || e.key === 'ArrowDown')) {
                e.preventDefault();
                const delta = e.key === 'ArrowDown' ? 1 : -1;
                goToDetailSlide(detailSlideIndex + delta);
                return;
            }
            if (e.key === 'ArrowLeft' || e.key === 'ArrowRight') {
                e.preventDefault();
                return;
            }
            return;
        }

        if (e.key !== 'ArrowLeft' && e.key !== 'ArrowRight') return;

        if (!document.body.classList.contains('work-mode')) return;

        e.preventDefault();
        stepMainGallery(e.key === 'ArrowRight' ? 1 : -1);
    });

    function clearInPageDetailFooter() {
        if (detailArtworkRevealTimeout) {
            clearTimeout(detailArtworkRevealTimeout);
            detailArtworkRevealTimeout = null;
        }
        if (workDetailArtworkDesc) {
            workDetailArtworkDesc.classList.remove('detail-artwork-description--visible');
            workDetailArtworkDesc.hidden = true;
            workDetailArtworkDesc.replaceChildren();
        }
        if (workDetailArtworkSpec) {
            workDetailArtworkSpec.classList.remove('detail-artwork-spec--visible');
            workDetailArtworkSpec.classList.remove('detail-artwork-spec--year-only');
            workDetailArtworkSpec.hidden = true;
            workDetailArtworkSpec.replaceChildren();
        }
    }

    function setInPageDetailFooter(item, category) {
        if (detailArtworkRevealTimeout) {
            clearTimeout(detailArtworkRevealTimeout);
            detailArtworkRevealTimeout = null;
        }

        const isFineArt = category === 'fineart';
        const isDesign = category === 'design';

        if (workDetailArtworkDesc) {
            workDetailArtworkDesc.classList.remove('detail-artwork-description--visible');
            let descText = '';
            if (isFineArt) {
                const raw = item.artworkDescription;
                if (typeof raw === 'string') descText = raw.trim();
                else if (raw && typeof raw.text === 'string') descText = raw.text.trim();
            } else if (isDesign) {
                descText = (item.longDesc || item.desc || '').trim();
            }
            if (!descText) {
                workDetailArtworkDesc.hidden = true;
                workDetailArtworkDesc.replaceChildren();
            } else {
                workDetailArtworkDesc.hidden = false;
                workDetailArtworkDesc.replaceChildren();
                const p = document.createElement('p');
                p.className = 'detail-artwork-description__text';
                p.textContent = descText;
                workDetailArtworkDesc.appendChild(p);
            }
        }

        if (workDetailArtworkSpec) {
            workDetailArtworkSpec.classList.remove('detail-artwork-spec--visible');
            workDetailArtworkSpec.classList.remove('detail-artwork-spec--year-only');

            if (isDesign) {
                const y = (item.year || '').trim();
                if (!y) {
                    workDetailArtworkSpec.hidden = true;
                    workDetailArtworkSpec.replaceChildren();
                } else {
                    workDetailArtworkSpec.hidden = false;
                    workDetailArtworkSpec.classList.add('detail-artwork-spec--year-only');
                    workDetailArtworkSpec.replaceChildren();
                    const p = document.createElement('p');
                    p.textContent = y;
                    workDetailArtworkSpec.appendChild(p);
                }
            } else {
                const spec = item.artworkSpec;
                const lines =
                    isFineArt && spec && Array.isArray(spec.lines) ? spec.lines.filter(Boolean) : [];
                if (!lines.length) {
                    workDetailArtworkSpec.hidden = true;
                    workDetailArtworkSpec.replaceChildren();
                } else {
                    workDetailArtworkSpec.hidden = false;
                    workDetailArtworkSpec.replaceChildren();
                    lines.forEach((line) => {
                        const p = document.createElement('p');
                        p.textContent = line;
                        workDetailArtworkSpec.appendChild(p);
                    });
                }
            }
        }
    }

    function revealInPageDetailFooter() {
        requestAnimationFrame(() => {
            requestAnimationFrame(() => {
                if (workDetailArtworkDesc && !workDetailArtworkDesc.hidden) {
                    workDetailArtworkDesc.classList.add('detail-artwork-description--visible');
                }
                if (workDetailArtworkSpec && !workDetailArtworkSpec.hidden) {
                    workDetailArtworkSpec.classList.add('detail-artwork-spec--visible');
                }
            });
        });
    }

    function openDetailView(options = {}) {
        const fromGalleryImage = Boolean(options.fromGalleryImage);
        const item = currentImages[currentGalleryIndex];
        if (!item || !detailLayer || !detailHero || !detailTitle || !detailDesc) return;

        const workGalleryEl = document.getElementById('work-gallery');
        if (workGalleryEl && window.matchMedia('(min-width: 769px)').matches) {
            workGalleryEl.scrollTop = 0;
        }

        previousWorkIndex = currentGalleryIndex;
        const slides = Array.isArray(item.slides) && item.slides.length > 0 ? item.slides : [item.src];
        let activeSlide = Math.max(0, slides.indexOf(item.src));
        if (
            typeof item.detailStartIndex === 'number' &&
            !Number.isNaN(item.detailStartIndex)
        ) {
            activeSlide = Math.max(
                0,
                Math.min(item.detailStartIndex, slides.length - 1)
            );
        }
        detailSlideSources = slides;
        detailSlideIndex = activeSlide;

        detailHero.src = slides[activeSlide] || item.src;
        detailHero.alt = item.title
            ? slides.length > 1
                ? `${item.title} — image ${activeSlide + 1}`
                : item.title
            : 'Project image';
        detailTitle.textContent = item.title || '';
        const isFineArt = currentCategory === 'fineart';
        const isDesign = currentCategory === 'design';

        if (isFineArt || isDesign) {
            detailDesc.hidden = true;
            detailDesc.textContent = '';
            if (detailYear) {
                detailYear.hidden = true;
                detailYear.textContent = '';
            }
        } else {
            const longExplanation = item.longDesc || item.body || item.desc || '';
            detailDesc.textContent = longExplanation;
            detailDesc.hidden = !longExplanation;
            if (detailYear) {
                const yearText = (item.year || '').trim();
                detailYear.textContent = yearText;
                detailYear.hidden = !yearText;
            }
        }
        const hasMultipleSlides = slides.length > 1;
        const showThumbs = !isFineArt && hasMultipleSlides;

        if (!showThumbs) {
            detailLayer.classList.add('work-detail--no-thumbs');
            if (detailThumbs) detailThumbs.innerHTML = '';
        } else {
            detailLayer.classList.remove('work-detail--no-thumbs');
            renderDetailThumbs(slides, activeSlide);
        }

        updateWorkDetailHeroAdvanceState();

        setInPageDetailFooter(item, currentCategory);
        detailArtworkRevealTimeout = setTimeout(() => {
            detailArtworkRevealTimeout = null;
            revealInPageDetailFooter();
        }, 520);

        detailLayer.classList.add('active');
        detailLayer.setAttribute('aria-hidden', 'false');
        detailHero.classList.remove('detail-hero-grow', 'detail-hero-from-gallery');

        const narrowWorkUi = window.matchMedia('(max-width: 768px)').matches;
        if (narrowWorkUi) {
            /* Keep hero stable in layout — no scale-from-small entrance that reads as a jump */
            detailHero.classList.add('detail-hero-grow');
        } else if (fromGalleryImage) {
            detailHero.classList.add('detail-hero-from-gallery');
            requestAnimationFrame(() => {
                requestAnimationFrame(() => {
                    detailHero.classList.remove('detail-hero-from-gallery');
                    detailHero.classList.add('detail-hero-grow');
                });
            });
        } else {
            requestAnimationFrame(() => detailHero.classList.add('detail-hero-grow'));
        }
        detailOpen = true;
    }

    function closeDetailView(restorePrevious = true) {
        if (!detailOpen || !detailLayer) return;
        if (detailHero) {
            detailHero.classList.remove(
                'detail-hero-grow',
                'detail-hero-from-gallery',
                'detail-hero--advance'
            );
            detailHero.removeAttribute('role');
            detailHero.removeAttribute('tabindex');
            detailHero.removeAttribute('aria-label');
        }
        document.querySelector('.gallery-image-wrapper')?.classList.remove('gallery-img-zoom-open');
        clearInPageDetailFooter();
        detailLayer.classList.remove('active');
        detailLayer.classList.remove('work-detail--no-thumbs');
        detailLayer.setAttribute('aria-hidden', 'true');
        detailOpen = false;
        if (restorePrevious) updateGallery(previousWorkIndex);
    }

    function setMobileGalleryImgZoom(on) {
        const wrap = document.querySelector('.gallery-image-wrapper');
        if (!wrap || !window.matchMedia('(max-width: 768px)').matches) return;
        wrap.classList.toggle('gallery-img-zoom-open', on);
    }

    if (navWork) {
        navWork.addEventListener('click', () => {
            armSuppressMainGalleryClick();
            if (detailOpen) closeDetailView(false);
            if (projectOverlay) projectOverlay.classList.remove('active');
            setMobileGalleryImgZoom(false);
        });
    }

    if (logo) {
        logo.addEventListener('click', (e) => {
            e.preventDefault();
            if (detailOpen) closeDetailView(false);
            if (projectOverlay) projectOverlay.classList.remove('active');
            setMobileGalleryImgZoom(false);
            document.body.classList.remove('work-mode');
            document.body.classList.remove('about-mode');
            startIntroTypewriter();
            startHomeScatterStrands();
        });
    }

    window.addEventListener('pageshow', (ev) => {
        if (!ev.persisted) return;
        if (detailOpen) closeDetailView(false);
        if (projectOverlay) projectOverlay.classList.remove('active');
        setMobileGalleryImgZoom(false);
    });

    if (mainImg && projectOverlay) {
        mainImg.addEventListener('click', () => {
            if (isMainGalleryClickSuppressed()) return;
            const currentData = currentImages[currentGalleryIndex];
            if (overlayTitle) overlayTitle.innerText = currentData.title;
            projectOverlay.classList.add('active');
            setMobileGalleryImgZoom(true);
        });

        projectOverlay.addEventListener('click', (e) => {
            if (e.target === overlayLink) return;
            projectOverlay.classList.remove('active');
            setMobileGalleryImgZoom(false);
        });
    }

    if (overlayLink) {
        overlayLink.addEventListener('click', (e) => {
            e.preventDefault();
            if (projectOverlay) projectOverlay.classList.remove('active');
            setMobileGalleryImgZoom(false);
            openDetailView({ fromGalleryImage: true });
        });
    }

    if (detailLayer) {
        detailLayer.addEventListener('click', (e) => {
            const clickedImage = e.target.closest('#work-detail-hero, .work-detail-thumb, .work-detail-thumbs');
            const clickedHeading = e.target.closest('.work-detail-heading');
            const clickedTextBox = e.target.closest('.work-detail-meta');
            if (clickedImage || clickedHeading || clickedTextBox) return;
            closeDetailView();
        });
    }

});
