// ===== Stage 4: 문 내부 전체를 채우는 소용돌이 + 오른쪽 경첩 문짝 =====
class Stage4Attach {
    constructor(app) {
        this.app = app;
        this.scene = app.nemonicScene;
        this._vortexMeshes = [];
        this._vortexLayers = [];
        this._vortexFrameId = null;
        this._portalReveal = 0;
        this._parts = null;
        this.app._stage4 = this;
    }

    async start(memo) {
        this._doorPos = this.app._doorPos;
        this._portalReveal = 0;
        await Utils.delay(120);
        const parts = await this._buildDoorFromMemo(memo);
        this._parts = parts;
        await Utils.delay(180);
        await this._openDoor(parts);
        await Utils.delay(1000);
        return memo;
    }

    _buildDoorFromMemo(memo) {
        return new Promise(resolve => {
            const img = new Image();
            img.onload = () => {
                const W = img.width;
                const H = img.height;
                const sample = document.createElement('canvas');
                sample.width = W;
                sample.height = H;
                const sctx = sample.getContext('2d');
                sctx.drawImage(img, 0, 0);
                const src = sctx.getImageData(0, 0, W, H).data;

                const isLine = (x, y) => {
                    if (x < 0 || x >= W || y < 0 || y >= H) return false;
                    const i = (y * W + x) * 4;
                    return (Math.abs(src[i] - 255) + Math.abs(src[i + 1] - 253) + Math.abs(src[i + 2] - 231)) > 50;
                };

                const outside = new Uint8Array(W * H);
                const queue = [];
                for (let x = 0; x < W; x++) {
                    if (!isLine(x, 0)) { outside[x] = 1; queue.push(x); }
                    const bottom = (H - 1) * W + x;
                    if (!isLine(x, H - 1)) { outside[bottom] = 1; queue.push(bottom); }
                }
                for (let y = 1; y < H - 1; y++) {
                    const left = y * W;
                    const right = y * W + (W - 1);
                    if (!isLine(0, y)) { outside[left] = 1; queue.push(left); }
                    if (!isLine(W - 1, y)) { outside[right] = 1; queue.push(right); }
                }

                let head = 0;
                while (head < queue.length) {
                    const idx = queue[head++];
                    const x = idx % W;
                    const y = (idx - x) / W;
                    for (const next of [idx - 1, idx + 1, idx - W, idx + W]) {
                        if (next < 0 || next >= W * H || outside[next]) continue;
                        const nx = next % W;
                        const ny = (next - nx) / W;
                        if (!isLine(nx, ny)) {
                            outside[next] = 1;
                            queue.push(next);
                        }
                    }
                }

                const inside = new Uint8Array(W * H);
                let minX = W, minY = H, maxX = 0, maxY = 0;
                for (let i = 0; i < W * H; i++) {
                    if (!outside[i]) {
                        inside[i] = 1;
                        const x = i % W;
                        const y = (i - x) / W;
                        if (x < minX) minX = x;
                        if (x > maxX) maxX = x;
                        if (y < minY) minY = y;
                        if (y > maxY) maxY = y;
                    }
                }

                const visited = new Uint8Array(W * H);
                const components = [];
                const analyzePixels = (pixels) => {
                    if (!pixels || !pixels.length) return null;
                    let cMinX = W, cMinY = H, cMaxX = 0, cMaxY = 0, sumX = 0, sumY = 0;
                    pixels.forEach((idx) => {
                        const x = idx % W;
                        const y = (idx - x) / W;
                        if (x < cMinX) cMinX = x;
                        if (x > cMaxX) cMaxX = x;
                        if (y < cMinY) cMinY = y;
                        if (y > cMaxY) cMaxY = y;
                        sumX += x;
                        sumY += y;
                    });
                    return {
                        pixels,
                        minX: cMinX,
                        minY: cMinY,
                        maxX: cMaxX,
                        maxY: cMaxY,
                        cx: sumX / pixels.length,
                        cy: sumY / pixels.length,
                        area: pixels.length
                    };
                };
                for (let i = 0; i < W * H; i++) {
                    if (!inside[i] || visited[i]) continue;
                    const pixels = [];
                    const stack = [i];
                    visited[i] = 1;
                    let cMinX = W, cMinY = H, cMaxX = 0, cMaxY = 0;
                    while (stack.length) {
                        const idx = stack.pop();
                        pixels.push(idx);
                        const x = idx % W;
                        const y = (idx - x) / W;
                        if (x < cMinX) cMinX = x;
                        if (x > cMaxX) cMaxX = x;
                        if (y < cMinY) cMinY = y;
                        if (y > cMaxY) cMaxY = y;
                        for (const next of [idx - 1, idx + 1, idx - W, idx + W]) {
                            if (next < 0 || next >= W * H || visited[next] || !inside[next]) continue;
                            visited[next] = 1;
                            stack.push(next);
                        }
                    }
                    components.push({
                        pixels,
                        minX: cMinX,
                        minY: cMinY,
                        maxX: cMaxX,
                        maxY: cMaxY,
                        cx: (cMinX + cMaxX) / 2,
                        area: pixels.length
                    });
                }

                const significant = components.filter((component) => component.area > Math.max(60, W * H * 0.002));
                const activeComponent = (significant.length ? significant : components)
                    .slice()
                    .sort((a, b) => b.area - a.area)[0];

                const dp = this._doorPos;
                const memoW = 0.85 * memo.scale.x;
                const memoH = 0.85 * memo.scale.y;
                const centerX = activeComponent ? (activeComponent.minX + activeComponent.maxX) / 2 : (minX + maxX) / 2;
                const centerY = activeComponent ? (activeComponent.minY + activeComponent.maxY) / 2 : (minY + maxY) / 2;
                const bounds = {
                    cx: centerX / W,
                    cy: centerY / H,
                    w: Math.max((activeComponent.maxX - activeComponent.minX) / W, 0.05),
                    h: Math.max((activeComponent.maxY - activeComponent.minY) / H, 0.05),
                    left: (activeComponent ? activeComponent.minX : minX) / W,
                    right: (activeComponent ? activeComponent.maxX : maxX) / W
                };
                bounds.portalWorldX = dp.x + (bounds.cx - 0.5) * memoW;
                bounds.portalWorldY = dp.y - (bounds.cy - 0.5) * memoH;
                bounds.portalWorldZ = dp.z + 0.001;

                const makeMaskCanvas = (component) => {
                    const canvas = document.createElement('canvas');
                    canvas.width = W;
                    canvas.height = H;
                    const ctx = canvas.getContext('2d');
                    const data = ctx.createImageData(W, H);
                    if (component) {
                        component.pixels.forEach((idx) => {
                            const i4 = idx * 4;
                            data.data[i4] = 255;
                            data.data[i4 + 1] = 255;
                            data.data[i4 + 2] = 255;
                            data.data[i4 + 3] = 255;
                        });
                    }
                    ctx.putImageData(data, 0, 0);
                    return canvas;
                };

                const fullMaskCanvas = makeMaskCanvas(activeComponent);

                const outlineCanvas = document.createElement('canvas');
                outlineCanvas.width = W;
                outlineCanvas.height = H;
                const octx = outlineCanvas.getContext('2d');
                const outlineData = octx.createImageData(W, H);
                for (let y = 0; y < H; y++) {
                    for (let x = 0; x < W; x++) {
                        if (!isLine(x, y)) continue;
                        const i = (y * W + x) * 4;
                        outlineData.data[i] = src[i];
                        outlineData.data[i + 1] = src[i + 1];
                        outlineData.data[i + 2] = src[i + 2];
                        outlineData.data[i + 3] = src[i + 3];
                    }
                }
                octx.putImageData(outlineData, 0, 0);

                const outlineTex = new THREE.Texture(outlineCanvas);
                outlineTex.minFilter = THREE.LinearFilter;
                outlineTex.magFilter = THREE.LinearFilter;
                outlineTex.needsUpdate = true;

                const frameMesh = new THREE.Mesh(
                    new THREE.PlaneGeometry(memoW, memoH),
                    new THREE.MeshBasicMaterial({
                        map: outlineTex,
                        transparent: true,
                        side: THREE.DoubleSide,
                        opacity: 0
                    })
                );
                frameMesh.renderOrder = 18;
                frameMesh.position.set(dp.x, dp.y, dp.z + 0.012);
                this.scene.scene.add(frameMesh);

                const doorMaskTex = new THREE.Texture(fullMaskCanvas);
                doorMaskTex.minFilter = THREE.LinearFilter;
                doorMaskTex.magFilter = THREE.LinearFilter;
                doorMaskTex.needsUpdate = true;

                const doorMesh = new THREE.Mesh(
                    new THREE.PlaneGeometry(memoW, memoH),
                    new THREE.MeshStandardMaterial({
                        color: 0xd8d2c4,
                        transparent: true,
                        alphaMap: doorMaskTex,
                        alphaTest: 0.5,
                        depthWrite: true,
                        side: THREE.DoubleSide,
                        roughness: 0.66,
                        metalness: 0.02
                    })
                );
                doorMesh.renderOrder = 16;

                const doorOutlineMesh = new THREE.Mesh(
                    new THREE.PlaneGeometry(memoW, memoH),
                    new THREE.MeshBasicMaterial({
                        map: outlineTex,
                        transparent: true,
                        alphaTest: 0.04,
                        side: THREE.DoubleSide
                    })
                );
                doorOutlineMesh.renderOrder = 17;

                const vortexLayers = this._createVortexLayers(bounds, memoW, memoH, dp, fullMaskCanvas);
                vortexLayers.forEach((mesh) => {
                    mesh.visible = false;
                });
                this.app._portalTarget = {
                    x: bounds.portalWorldX,
                    y: bounds.portalWorldY,
                    z: bounds.portalWorldZ
                };

                resolve({ bounds, memoW, memoH, dp, frameMesh, doorMesh, doorOutlineMesh, vortexLayers, sourceMemo: memo });
            };
            img.src = this.app._drawingDataURL;
        });
    }

    _createVortexLayers(bounds, memoW, memoH, dp, maskCanvas) {
        const layers = [];
        this._vortexLayers = [];
        const W = maskCanvas.width;
        const H = maskCanvas.height;
        const radius = Math.max(
            Math.max(bounds.w, bounds.h) * Math.max(W, H) * 1.35,
            Math.max(W, H) * 1.05
        );
        const maskTex = new THREE.CanvasTexture(maskCanvas);
        maskTex.minFilter = THREE.LinearFilter;
        maskTex.magFilter = THREE.LinearFilter;
        maskTex.needsUpdate = true;
        const portalCx = bounds.cx * W;
        const portalCy = bounds.cy * H;

        for (let layer = 0; layer < 4; layer++) {
            const canvas = document.createElement('canvas');
            canvas.width = W;
            canvas.height = H;
            const ctx = canvas.getContext('2d');
            const texture = new THREE.CanvasTexture(canvas);
            texture.minFilter = THREE.LinearFilter;
            texture.magFilter = THREE.LinearFilter;
            texture.center.set(0.5, 0.5);
            texture.needsUpdate = true;

            const info = { canvas, ctx, texture, radius, layer, cx: portalCx, cy: portalCy };
            this._vortexLayers.push(info);
            this._paintVortexLayer(info, 0);

            const baseOpacity = Math.max(0.82 - layer * 0.16, 0.28);

            const mesh = new THREE.Mesh(
                new THREE.PlaneGeometry(memoW, memoH),
                new THREE.MeshBasicMaterial({
                    map: texture,
                    alphaMap: maskTex,
                    transparent: true,
                    depthTest: false,
                    depthWrite: false,
                    polygonOffset: true,
                    polygonOffsetFactor: 1,
                    polygonOffsetUnits: 1,
                    side: THREE.DoubleSide,
                    opacity: 0
                })
            );
            mesh.userData.baseOpacity = baseOpacity;
            mesh.frustumCulled = false;
            mesh.renderOrder = 12 + layer;
            mesh.position.set(dp.x, dp.y, dp.z + 0.009 - layer * 0.0004);
            this.scene.scene.add(mesh);
            layers.push(mesh);
        }

        this._vortexMeshes = layers;
        return layers;
    }

    _paintVortexLayer(layerInfo, time) {
        const { ctx, canvas, radius, layer, texture, cx, cy } = layerInfo;
        ctx.clearRect(0, 0, canvas.width, canvas.height);

        const bg = ctx.createRadialGradient(cx, cy, radius * 0.03, cx, cy, radius);
        bg.addColorStop(0, 'rgba(6,4,18,1)');
        bg.addColorStop(0.18, 'rgba(22,14,62,0.98)');
        bg.addColorStop(0.44, 'rgba(58,36,132,0.94)');
        bg.addColorStop(0.72, 'rgba(102,74,178,0.82)');
        bg.addColorStop(1, 'rgba(34,18,82,0.24)');
        ctx.fillStyle = bg;
        ctx.beginPath();
        ctx.arc(cx, cy, radius, 0, Math.PI * 2);
        ctx.fill();

        const arms = 8;
        const offsetSpin = time * (0.46 + layer * 0.12) * (layer % 2 === 0 ? 1 : -1);
        for (let arm = 0; arm < arms; arm++) {
            const offset = (arm / arms) * Math.PI * 2 + offsetSpin + layer * 0.12;
            ctx.beginPath();
            for (let t = 0; t <= 1; t += 0.003) {
                const angle = offset + t * Math.PI * (4.5 + layer * 0.18);
                const r = 2 + Math.pow(t, 0.9) * radius;
                const x = cx + Math.cos(angle) * r;
                const y = cy + Math.sin(angle) * r;
                if (t === 0) ctx.moveTo(x, y);
                else ctx.lineTo(x, y);
            }
            ctx.strokeStyle = layer % 2 === 0
                ? `rgba(228,214,255,${0.52 - layer * 0.08})`
                : `rgba(143,108,255,${0.34 - layer * 0.06})`;
            ctx.lineWidth = 18 - layer * 1.6;
            ctx.lineCap = 'round';
            ctx.stroke();
        }

        const innerGlow = ctx.createRadialGradient(cx, cy, 0, cx, cy, radius * 0.5);
        innerGlow.addColorStop(0, 'rgba(255,255,255,0.05)');
        innerGlow.addColorStop(0.34, 'rgba(182,148,255,0.2)');
        innerGlow.addColorStop(0.72, 'rgba(75,40,154,0.08)');
        innerGlow.addColorStop(1, 'rgba(75,40,154,0)');
        ctx.fillStyle = innerGlow;
        ctx.beginPath();
        ctx.arc(cx, cy, radius * 0.9, 0, Math.PI * 2);
        ctx.fill();

        const core = ctx.createRadialGradient(cx, cy, 0, cx, cy, radius * 0.28);
        core.addColorStop(0, 'rgba(3,2,10,1)');
        core.addColorStop(0.44, 'rgba(10,6,28,0.95)');
        core.addColorStop(1, 'rgba(10,6,28,0)');
        ctx.fillStyle = core;
        ctx.beginPath();
        ctx.arc(cx, cy, radius * 0.34, 0, Math.PI * 2);
        ctx.fill();

        const rim = ctx.createRadialGradient(cx, cy, radius * 0.74, cx, cy, radius);
        rim.addColorStop(0, 'rgba(0,0,0,0)');
        rim.addColorStop(0.6, 'rgba(180,150,255,0.12)');
        rim.addColorStop(1, 'rgba(236,225,255,0.46)');
        ctx.strokeStyle = rim;
        ctx.lineWidth = 10 - layer;
        ctx.beginPath();
        ctx.arc(cx, cy, radius * 0.92, 0, Math.PI * 2);
        ctx.stroke();

        texture.needsUpdate = true;
    }

    async _openDoor(parts) {
        this._playDoorCreakSound();
        const { doorMesh, doorOutlineMesh, bounds, memoW, memoH, dp, sourceMemo } = parts;
        const doorRightX = (bounds.right - 0.5) * memoW;
        const doorCenterY = -(bounds.cy - 0.5) * memoH;
        const doorHeight = bounds.h * memoH;

        const hingePivot = new THREE.Group();
        hingePivot.position.set(dp.x + doorRightX, dp.y, dp.z + 0.005);
        this.scene.scene.add(hingePivot);
        this._parts.hingePivot = hingePivot;

        hingePivot.add(doorMesh);
        doorMesh.position.set(-doorRightX, 0, 0);
        doorMesh.rotation.set(0, 0, 0);

        hingePivot.add(doorOutlineMesh);
        doorOutlineMesh.position.set(-doorRightX, 0, 0.003);
        doorOutlineMesh.rotation.set(0, 0, 0);

        if (sourceMemo) {
            sourceMemo.visible = false;
            if (sourceMemo.parent) sourceMemo.parent.remove(sourceMemo);
            else this.scene.scene.remove(sourceMemo);
            if (sourceMemo.material) {
                sourceMemo.material.dispose();
            }
        }

        const hingeMat = new THREE.MeshStandardMaterial({
            color: 0x8d8d8d,
            roughness: 0.35,
            metalness: 0.85
        });
        const hingeGeo = new THREE.CylinderGeometry(0.01, 0.01, 0.06, 10);
        for (let i = 0; i < 3; i++) {
            const hinge = new THREE.Mesh(hingeGeo, hingeMat);
            const y = doorCenterY + doorHeight * (0.2 + i * 0.3) - doorHeight / 2;
            hinge.position.set(0, y, 0.01);
            hingePivot.add(hinge);
        }

        this._startSpin();

        return new Promise(resolve => {
            const revealState = { amount: 0 };
            gsap.timeline({
                onComplete: () => {
                    this._portalReveal = 1;
                    resolve();
                }
            })
                .set(this._vortexMeshes, { visible: true }, 0.1)
                .to(revealState, {
                    duration: 0.42,
                    amount: 1,
                    ease: 'power2.out',
                    onUpdate: () => {
                        this._portalReveal = revealState.amount;
                    }
                }, 0.16)
                .to(hingePivot.rotation, {
                    duration: 1.55,
                    y: Math.PI * 2 / 3,
                    ease: 'power2.inOut'
                }, 0);
        });
    }

    _startSpin() {
        let time = 0;
        const tick = () => {
            this._vortexFrameId = requestAnimationFrame(tick);
            time += 0.016;
            this._vortexMeshes.forEach((mesh, index) => {
                if (this._vortexLayers[index]) {
                    this._paintVortexLayer(this._vortexLayers[index], time);
                }
                const baseOpacity = mesh.userData.baseOpacity || 0.5;
                mesh.material.opacity = baseOpacity * this._portalReveal * (0.94 + Math.sin(time * 2.3 + index) * 0.04);
            });
            if (this._parts?.frameMesh?.material) {
                this._parts.frameMesh.material.opacity = this._portalReveal;
            }
        };
        tick();
    }

    stopEffects() {
        this._portalReveal = 0;
        if (this._vortexFrameId) {
            cancelAnimationFrame(this._vortexFrameId);
            this._vortexFrameId = null;
        }
    }

    _playDoorCreakSound() {
        try {
            const ac = new (window.AudioContext || window.webkitAudioContext)();
            const dur = 1.8;
            const sr = ac.sampleRate;
            const buf = ac.createBuffer(1, sr * dur, sr);
            const d = buf.getChannelData(0);
            for (let i = 0; i < d.length; i++) {
                const t = i / sr;
                d[i] = (Math.sin(2 * Math.PI * (260 + Math.sin(t * 8) * 120) * t) * 0.08
                    + (Math.random() - 0.5) * 0.03)
                    * Math.min(t * 3, 1)
                    * Math.min((dur - t) * 2, 1);
            }
            const s = ac.createBufferSource();
            s.buffer = buf;
            s.connect(ac.destination);
            s.start();
        } catch (e) {}
    }
}
