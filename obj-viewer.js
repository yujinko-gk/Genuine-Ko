/**
 * Inline Three.js OBJ viewer for project detail (scroll article).
 * Expects global THREE and THREE.OBJLoader (legacy scripts).
 */
(function () {
    const IDLE_MS = 1500;
    const AUTO_ROT_Y = 0.0025;
    const DRAG_ROT = 0.008;
    const WHEEL_SCALE = 1.06;
    const MIN_SCALE = 0.2;
    const MAX_SCALE = 8;

    function disposeViewer(wrap) {
        const d = wrap.__objViewerDispose;
        if (typeof d === "function") {
            d();
            delete wrap.__objViewerDispose;
        }
        wrap.removeAttribute("data-obj-initialized");
    }

    window.destroyPortfolioObjViewers = function (root) {
        const scope = root && root.querySelectorAll ? root : document;
        scope.querySelectorAll(".work-detail-obj-viewer-wrap[data-obj-initialized]").forEach(disposeViewer);
    };

    function initOne(wrap) {
        if (wrap.dataset.objInitialized === "1") return;
        const src = wrap.getAttribute("data-obj-src");
        if (!src || typeof THREE === "undefined") return;

        const LoaderCtor = THREE.OBJLoader;
        if (typeof LoaderCtor !== "function") {
            console.warn("OBJViewer: THREE.OBJLoader not available");
            return;
        }

        const stage = wrap.querySelector(".work-detail-obj-viewer__stage");
        if (!stage) return;

        let resolvedSrc = src;
        try {
            resolvedSrc = new URL(src, window.location.href).href;
        } catch (err) {
            console.warn("OBJViewer: could not resolve model URL", src, err);
        }

        const width = Math.max(1, stage.clientWidth || wrap.clientWidth || 640);
        const height = 600;
        console.log(
            "[OBJ viewer] stage offsetWidth/offsetHeight before setSize:",
            stage.offsetWidth,
            stage.offsetHeight,
            "| resolved URL:",
            resolvedSrc
        );

        const scene = new THREE.Scene();
        const camera = new THREE.PerspectiveCamera(45, width / height, 0.01, 5000);
        const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
        renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
        renderer.setSize(width, height);
        renderer.setClearColor(0x000000, 0);
        stage.appendChild(renderer.domElement);

        scene.add(new THREE.AmbientLight(0xffffff, 0.7));
        const dir = new THREE.DirectionalLight(0xffffff, 1.2);
        dir.position.set(1.2, 1.5, 0.9);
        scene.add(dir);

        const rootGroup = new THREE.Group();
        scene.add(rootGroup);

        let meshRoot = null;
        let lastInteract = performance.now();
        let dragging = false;
        let lx = 0;
        let ly = 0;
        let raf = 0;
        let running = true;

        const loader = new LoaderCtor();
        loader.load(
            src,
            function (object) {
                object.traverse(function (child) {
                    if (child.isMesh) {
                        const mat = new THREE.MeshStandardMaterial({
                            color: 0xd8d8d8,
                            metalness: 0.15,
                            roughness: 0.55,
                        });
                        child.material = mat;
                    }
                });

                const box = new THREE.Box3().setFromObject(object);
                const center = box.getCenter(new THREE.Vector3());
                const size = box.getSize(new THREE.Vector3());
                object.position.sub(center);

                const maxDim = Math.max(size.x, size.y, size.z, 0.001);
                const fov = (camera.fov * Math.PI) / 180;
                let dist = maxDim / (2 * Math.tan(fov / 2));
                dist *= 1.35;
                camera.position.set(dist * 0.55, dist * 0.35, dist);
                camera.lookAt(0, 0, 0);

                meshRoot = object;
                rootGroup.add(object);
            },
            undefined,
            function (err) {
                console.error(
                    "[OBJ viewer] Failed to load model. If you opened the site via file://, use a local server (e.g. python -m http.server). Error:",
                    err
                );
            }
        );

        function onResize() {
            const w = Math.max(1, stage.clientWidth || wrap.clientWidth || width);
            const h = height;
            camera.aspect = w / h;
            camera.updateProjectionMatrix();
            renderer.setSize(w, h);
        }

        const resizeObs =
            typeof ResizeObserver !== "undefined"
                ? new ResizeObserver(function () {
                      onResize();
                  })
                : null;
        if (resizeObs) resizeObs.observe(stage);
        window.addEventListener("resize", onResize);

        function tick() {
            if (!running) return;
            raf = requestAnimationFrame(tick);
            if (meshRoot && !dragging && performance.now() - lastInteract > IDLE_MS) {
                meshRoot.rotation.y += AUTO_ROT_Y;
            }
            renderer.render(scene, camera);
        }
        tick();

        function setInteract() {
            lastInteract = performance.now();
        }

        const canvas = renderer.domElement;

        canvas.addEventListener("pointerdown", function (e) {
            if (e.button !== 0) return;
            dragging = true;
            lx = e.clientX;
            ly = e.clientY;
            setInteract();
            try {
                canvas.setPointerCapture(e.pointerId);
            } catch (_) {
                /* ignore */
            }
        });

        canvas.addEventListener("pointermove", function (e) {
            if (!dragging || !meshRoot) return;
            const dx = e.clientX - lx;
            const dy = e.clientY - ly;
            meshRoot.rotation.y += dx * DRAG_ROT;
            meshRoot.rotation.x += dy * DRAG_ROT;
            lx = e.clientX;
            ly = e.clientY;
            setInteract();
        });

        function endDrag(e) {
            dragging = false;
            try {
                if (e.pointerId != null) canvas.releasePointerCapture(e.pointerId);
            } catch (_) {
                /* ignore */
            }
        }
        canvas.addEventListener("pointerup", endDrag);
        canvas.addEventListener("pointercancel", endDrag);
        canvas.addEventListener(
            "wheel",
            function (e) {
                if (!meshRoot) return;
                e.preventDefault();
                setInteract();
                const up = e.deltaY < 0;
                const factor = up ? WHEEL_SCALE : 1 / WHEEL_SCALE;
                let s = meshRoot.scale.x * factor;
                s = Math.max(MIN_SCALE, Math.min(MAX_SCALE, s));
                meshRoot.scale.setScalar(s);
            },
            { passive: false }
        );

        wrap.dataset.objInitialized = "1";
        wrap.__objViewerDispose = function () {
            running = false;
            cancelAnimationFrame(raf);
            window.removeEventListener("resize", onResize);
            if (resizeObs) resizeObs.disconnect();
            if (meshRoot) {
                meshRoot.traverse(function (c) {
                    if (c.geometry) c.geometry.dispose();
                    if (c.material) {
                        const m = c.material;
                        if (Array.isArray(m)) m.forEach(function (x) { x.dispose(); });
                        else m.dispose();
                    }
                });
                rootGroup.remove(meshRoot);
            }
            renderer.dispose();
            if (renderer.domElement && renderer.domElement.parentNode) {
                renderer.domElement.parentNode.removeChild(renderer.domElement);
            }
        };
    }

    window.initPortfolioObjViewers = function (root) {
        console.log("[OBJ viewer] typeof THREE.OBJLoader:", typeof THREE !== "undefined" ? typeof THREE.OBJLoader : "undefined (THREE missing)");
        if (!root || typeof THREE === "undefined") {
            console.warn("[OBJ viewer] init skipped: root missing or THREE not loaded (check script order / CDN).");
            return;
        }
        if (typeof THREE.OBJLoader !== "function") {
            console.warn(
                "[OBJ viewer] THREE.OBJLoader is not a function — ensure OBJLoader.js loads after three.min.js and before obj-viewer.js."
            );
            return;
        }
        root.querySelectorAll(".work-detail-obj-viewer-wrap").forEach(initOne);
    };
})();
