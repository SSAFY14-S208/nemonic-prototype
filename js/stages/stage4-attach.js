// ===== Stage 4: 고정된 문구멍 뒤의 원형 소용돌이 + 오른쪽 경첩 문짝 =====
class Stage4Attach {
    constructor(app) {
        this.app = app;
        this.scene = app.nemonicScene;
        this._vortexMeshes = [];
        this._vortexLayers = [];
        this._vortexFrameId = null;
        this._parts = null;
        this.app._stage4 = this;
    }

    async start(memo) {
        this._doorPos = this.app._doorPos;
        if (memo) memo.visible = false;
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

                const sortedByX = components.slice().sort((a, b) => a.cx - b.cx);
                const portalComponent = sortedByX[0] || null;
                const doorComponent = sortedByX[sortedByX.length - 1] || portalComponent;

                const dp = this._doorPos;
                const memoW = 0.85 * memo.scale.x;
                const memoH = 0.85 * memo.scale.y;
                const activePortal = portalComponent || doorComponent;
                const bounds = {
                    cx: (activePortal.minX + activePortal.maxX) / 2 / W,
                    cy: (activePortal.minY + activePortal.maxY) / 2 / H,
                    w: Math.max((activePortal.maxX - activePortal.minX) / W, 0.05),
                    h: Math.max((activePortal.maxY - activePortal.minY) / H, 0.05),
                    left: (doorComponent ? doorComponent.minX : minX) / W,
                    right: (doorComponent ? doorComponent.maxX : maxX) / W
                };
                bounds.portalWorldX = dp.x + (bounds.cx - 0.5) * memoW;
                bounds.portalWorldY = dp.y - (bounds.cy - 0.5) * memoH;
                bounds.portalWorldZ = dp.z - 0.09;

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

                const portalMaskCanvas = makeMaskCanvas(portalComponent);
                const doorMaskCanvas = makeMaskCanvas(doorComponent);

                const outlineCanvas = document.createElement('canvas');
                outlineCanvas.width = W;
                outlineCanvas.height = H;
                const octx = outlineCanvas.getContext('2d');
                const outlineData = octx.createImageData(W, H);
                for (let y = 0; y < H; y++) {
                    for (let x = 0; x < W; x++) {
                        let hit = false;
                        for (let dy = -2; dy <= 2 && !hit; dy++) {
                            for (let dx = -2; dx <= 2 && !hit; dx++) {
                                if (isLine(x + dx, y + dy)) hit = true;
                            }
                        }
                        if (!hit) continue;
                        const i = (y * W + x) * 4;
                        outlineData.data[i] = 16;
                        outlineData.data[i + 1] = 16;
                        outlineData.data[i + 2] = 16;
                        outlineData.data[i + 3] = 255;
                    }
                }
                octx.putImageData(outlineData, 0, 0);

                if (memo.parent) memo.parent.remove(memo);
                else this.scene.scene.remove(memo);
                memo.material.dispose();

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
                        opacity: 1
                    })
                );
                frameMesh.position.set(dp.x, dp.y, dp.z + 0.012);
                this.scene.scene.add(frameMesh);

                const doorCanvas = document.createElement('canvas');
                doorCanvas.width = W;
                doorCanvas.height = H;
                const dctx = doorCanvas.getContext('2d');
                dctx.fillStyle = '#e8e4d8';
                dctx.fillRect(0, 0, W, H);
                dctx.globalCompositeOperation = 'destination-in';
                dctx.drawImage(doorMaskCanvas, 0, 0);
                dctx.globalCompositeOperation = 'source-over';
                dctx.drawImage(outlineCanvas, 0, 0);

                const doorTex = new THREE.Texture(doorCanvas);
                doorTex.minFilter = THREE.LinearFilter;
                doorTex.magFilter = THREE.LinearFilter;
                doorTex.needsUpdate = true;

                const doorMesh = new THREE.Mesh(
                    new THREE.PlaneGeometry(memoW, memoH),
                    new THREE.MeshStandardMaterial({
                        map: doorTex,
                        color: 0xe8e4d8,
                        transparent: true,
                        side: THREE.DoubleSide,
                        roughness: 0.4,
                        metalness: 0.0
                    })
                );

                const vortexLayers = this._createVortexLayers(bounds, memoW, memoH, dp, portalMaskCanvas);
                vortexLayers.forEach((mesh) => {
                    mesh.visible = false;
                });
                this.app._portalTarget = {
                    x: bounds.portalWorldX,
                    y: bounds.portalWorldY,
                    z: bounds.portalWorldZ
                };

                resolve({ bounds, memoW, memoH, dp, frameMesh, doorMesh, vortexLayers });
            };
            img.src = this.app._drawingDataURL;
        });
    }

    _createVortexLayers(bounds, memoW, memoH, dp, maskCanvas) {
        const layers = [];
        this._vortexLayers = [];
        const W = maskCanvas.width;
        const H = maskCanvas.height;
        const radius = Math.max(Math.max(bounds.w, bounds.h) * Math.max(W, H) * 1.05, Math.max(W, H) * 0.8);
        const maskTex = new THREE.Texture(maskCanvas);
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
            const texture = new THREE.Texture(canvas);
            texture.minFilter = THREE.LinearFilter;
            texture.magFilter = THREE.LinearFilter;
            texture.center.set(0.5, 0.5);
            texture.needsUpdate = true;

            const info = { canvas, ctx, texture, radius, layer, cx: portalCx, cy: portalCy };
            this._vortexLayers.push(info);
            this._paintVortexLayer(info, 0);

            const mesh = new THREE.Mesh(
                new THREE.PlaneGeometry(memoW, memoH),
                new THREE.MeshBasicMaterial({
                    map: texture,
                    alphaMap: maskTex,
                    transparent: true,
                    depthWrite: false,
                    side: THREE.DoubleSide,
                    opacity: layer === 0 ? 1 : 0.74 - layer * 0.12
                })
            );
            mesh.position.set(dp.x, dp.y, dp.z - 0.08 - layer * 0.008);
            this.scene.scene.add(mesh);
            layers.push(mesh);
        }

        this._vortexMeshes = layers;
        return layers;
    }

    _paintVortexLayer(layerInfo, time) {
        const { ctx, canvas, radius, layer, texture, cx, cy } = layerInfo;
        ctx.clearRect(0, 0, canvas.width, canvas.height);

        const bg = ctx.createRadialGradient(cx, cy, 6, cx, cy, radius);
        bg.addColorStop(0, 'rgba(255,255,255,1)');
        bg.addColorStop(0.16, 'rgba(214,240,255,0.98)');
        bg.addColorStop(0.45, 'rgba(110,190,250,0.96)');
        bg.addColorStop(0.8, 'rgba(34,127,220,0.92)');
        bg.addColorStop(1, 'rgba(17,90,173,0.85)');
        ctx.fillStyle = bg;
        ctx.beginPath();
        ctx.arc(cx, cy, radius, 0, Math.PI * 2);
        ctx.fill();

        const arms = 7;
        const offsetSpin = time * (0.55 + layer * 0.16) * (layer % 2 === 0 ? 1 : -1);
        for (let arm = 0; arm < arms; arm++) {
            const offset = (arm / arms) * Math.PI * 2 + offsetSpin + layer * 0.12;
            ctx.beginPath();
            for (let t = 0; t <= 1; t += 0.003) {
                const angle = offset + t * Math.PI * (5.1 + layer * 0.22);
                const r = 2 + t * radius;
                const x = cx + Math.cos(angle) * r;
                const y = cy + Math.sin(angle) * r;
                if (t === 0) ctx.moveTo(x, y);
                else ctx.lineTo(x, y);
            }
            ctx.strokeStyle = layer % 2 === 0
                ? `rgba(255,255,255,${0.93 - layer * 0.12})`
                : `rgba(51,145,228,${0.88 - layer * 0.11})`;
            ctx.lineWidth = 26 - layer * 3;
            ctx.lineCap = 'round';
            ctx.stroke();
        }

        const glow = ctx.createRadialGradient(cx, cy, 0, cx, cy, radius * 0.82);
        glow.addColorStop(0, 'rgba(255,255,255,0.98)');
        glow.addColorStop(0.35, 'rgba(189,232,255,0.9)');
        glow.addColorStop(0.7, 'rgba(67,157,235,0.3)');
        glow.addColorStop(1, 'rgba(67,157,235,0)');
        ctx.fillStyle = glow;
        ctx.beginPath();
        ctx.arc(cx, cy, radius, 0, Math.PI * 2);
        ctx.fill();

        texture.needsUpdate = true;
    }

    async _openDoor(parts) {
        this._playDoorCreakSound();
        const { doorMesh, bounds, memoW, memoH, dp } = parts;
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
            gsap.timeline({ onComplete: resolve })
                .set(this._vortexMeshes, { visible: true }, 0.08)
                .to(hingePivot.rotation, {
                    duration: 1.7,
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
                mesh.material.opacity = 0.56 + Math.sin(time * 3 + index) * 0.06;
            });
        };
        tick();
    }

    stopEffects() {
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
