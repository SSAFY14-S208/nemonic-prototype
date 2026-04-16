// ===== Stage 4: 문 안쪽에만 보이는 원형 소용돌이 =====
class Stage4Attach {
    constructor(app) {
        this.app = app;
        this.scene = app.nemonicScene;
        this._vortexMeshes = [];
        this._vortexFrameId = null;
        this._parts = null;
        this.app._stage4 = this;
    }

    async start(memo) {
        this._doorPos = this.app._doorPos;
        if (memo) {
            memo.visible = false;
        }
        await Utils.delay(120);
        const parts = await this._buildDoorFromMemo(memo);
        this._parts = parts;
        await Utils.delay(220);
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
                const canvas = document.createElement('canvas');
                canvas.width = W;
                canvas.height = H;
                const ctx = canvas.getContext('2d');
                ctx.drawImage(img, 0, 0);
                const src = ctx.getImageData(0, 0, W, H).data;

                const isLine = (x, y) => {
                    if (x < 0 || x >= W || y < 0 || y >= H) return false;
                    const i = (y * W + x) * 4;
                    return (Math.abs(src[i] - 255) + Math.abs(src[i + 1] - 253) + Math.abs(src[i + 2] - 231)) > 50;
                };

                const outside = new Uint8Array(W * H);
                const queue = [];
                for (let x = 0; x < W; x++) {
                    if (!isLine(x, 0)) { outside[x] = 1; queue.push(x); }
                    const b = (H - 1) * W + x;
                    if (!isLine(x, H - 1)) { outside[b] = 1; queue.push(b); }
                }
                for (let y = 1; y < H - 1; y++) {
                    const l = y * W;
                    const r = y * W + (W - 1);
                    if (!isLine(0, y)) { outside[l] = 1; queue.push(l); }
                    if (!isLine(W - 1, y)) { outside[r] = 1; queue.push(r); }
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

                const memoW = 0.85 * memo.scale.x;
                const memoH = 0.85 * memo.scale.y;
                const dp = this._doorPos;

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
                        if (hit) {
                            const i = (y * W + x) * 4;
                            outlineData.data[i] = 16;
                            outlineData.data[i + 1] = 16;
                            outlineData.data[i + 2] = 16;
                            outlineData.data[i + 3] = 255;
                        }
                    }
                }
                octx.putImageData(outlineData, 0, 0);

                const fillMaskCanvas = document.createElement('canvas');
                fillMaskCanvas.width = W;
                fillMaskCanvas.height = H;
                const mctx = fillMaskCanvas.getContext('2d');
                const maskData = mctx.createImageData(W, H);
                for (let i = 0; i < W * H; i++) {
                    if (!inside[i]) continue;
                    const i4 = i * 4;
                    maskData.data[i4] = 255;
                    maskData.data[i4 + 1] = 255;
                    maskData.data[i4 + 2] = 255;
                    maskData.data[i4 + 3] = 255;
                }
                mctx.putImageData(maskData, 0, 0);

                if (memo.parent) memo.parent.remove(memo);
                else this.scene.scene.remove(memo);
                memo.material.dispose();

                const bounds = {
                    cx: (minX + maxX) / 2 / W,
                    cy: (minY + maxY) / 2 / H,
                    w: (maxX - minX) / W,
                    h: (maxY - minY) / H,
                    left: minX / W,
                    right: maxX / W
                };

                const outlineTex = new THREE.Texture(outlineCanvas);
                outlineTex.minFilter = THREE.LinearFilter;
                outlineTex.magFilter = THREE.LinearFilter;
                outlineTex.needsUpdate = true;

                const doorLeafCanvas = document.createElement('canvas');
                doorLeafCanvas.width = W;
                doorLeafCanvas.height = H;
                const leafCtx = doorLeafCanvas.getContext('2d');
                leafCtx.fillStyle = '#e8e4d8';
                leafCtx.fillRect(0, 0, W, H);
                leafCtx.globalCompositeOperation = 'destination-in';
                leafCtx.drawImage(fillMaskCanvas, 0, 0);
                leafCtx.globalCompositeOperation = 'source-over';
                leafCtx.drawImage(outlineCanvas, 0, 0);

                const doorLeafTex = new THREE.Texture(doorLeafCanvas);
                doorLeafTex.minFilter = THREE.LinearFilter;
                doorLeafTex.magFilter = THREE.LinearFilter;
                doorLeafTex.needsUpdate = true;

                const doorMesh = new THREE.Mesh(
                    new THREE.PlaneGeometry(memoW, memoH),
                    new THREE.MeshStandardMaterial({
                        map: doorLeafTex,
                        transparent: true,
                        side: THREE.DoubleSide,
                        roughness: 0.4,
                        metalness: 0.0
                    })
                );

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

                const vortexLayers = this._createVortexLayers(bounds, memoW, memoH, dp, fillMaskCanvas);

                resolve({ frameMesh, doorMesh, vortexLayers, bounds, memoW, memoH, dp });
            };
            img.src = this.app._drawingDataURL;
        });
    }

    _createVortexLayers(bounds, memoW, memoH, dp, fillMaskCanvas) {
        const layers = [];
        const maskTex = new THREE.Texture(fillMaskCanvas);
        maskTex.minFilter = THREE.LinearFilter;
        maskTex.magFilter = THREE.LinearFilter;
        maskTex.needsUpdate = true;
        const W = fillMaskCanvas.width;
        const H = fillMaskCanvas.height;
        const cx = bounds.cx * W;
        const cy = bounds.cy * H;
        const doorPx = Math.max(bounds.w * W, bounds.h * H);
        const maxR = Math.max(doorPx * 0.9, 48);

        for (let layer = 0; layer < 5; layer++) {
            const canvas = document.createElement('canvas');
            canvas.width = W;
            canvas.height = H;
            const ctx = canvas.getContext('2d');

            ctx.clearRect(0, 0, W, H);

            const bg = ctx.createRadialGradient(cx, cy, 6, cx, cy, maxR);
            bg.addColorStop(0, 'rgba(255,255,255,0.98)');
            bg.addColorStop(0.18, 'rgba(191,234,255,0.95)');
            bg.addColorStop(0.58, 'rgba(94,180,245,0.9)');
            bg.addColorStop(1, 'rgba(16,89,168,0)');
            ctx.fillStyle = bg;
            ctx.beginPath();
            ctx.arc(cx, cy, maxR, 0, Math.PI * 2);
            ctx.fill();

            const arms = 6;
            for (let arm = 0; arm < arms; arm++) {
                const offset = (arm / arms) * Math.PI * 2 + layer * 0.18;
                ctx.beginPath();
                for (let t = 0; t <= 1; t += 0.003) {
                    const angle = offset + t * Math.PI * (4.8 + layer * 0.25);
                    const radius = 4 + t * maxR;
                    const x = cx + Math.cos(angle) * radius;
                    const y = cy + Math.sin(angle) * radius;
                    if (t === 0) ctx.moveTo(x, y);
                    else ctx.lineTo(x, y);
                }
                ctx.strokeStyle = layer % 2 === 0
                    ? `rgba(255,255,255,${0.9 - layer * 0.1})`
                    : `rgba(49,149,228,${0.85 - layer * 0.1})`;
                ctx.lineWidth = 22 - layer * 2.5;
                ctx.lineCap = 'round';
                ctx.stroke();
            }

            const glow = ctx.createRadialGradient(cx, cy, 0, cx, cy, maxR * 0.46);
            glow.addColorStop(0, 'rgba(255,255,255,1)');
            glow.addColorStop(0.42, 'rgba(171,225,255,0.82)');
            glow.addColorStop(0.8, 'rgba(31,121,214,0.14)');
            glow.addColorStop(1, 'rgba(31,121,214,0)');
            ctx.fillStyle = glow;
            ctx.beginPath();
            ctx.arc(cx, cy, maxR * 0.68, 0, Math.PI * 2);
            ctx.fill();

            const tex = new THREE.Texture(canvas);
            tex.minFilter = THREE.LinearFilter;
            tex.magFilter = THREE.LinearFilter;
            tex.needsUpdate = true;

            const mesh = new THREE.Mesh(
                new THREE.PlaneGeometry(memoW, memoH),
                new THREE.MeshBasicMaterial({
                    map: tex,
                    alphaMap: maskTex,
                    transparent: true,
                    depthWrite: false,
                    side: THREE.DoubleSide,
                    opacity: layer === 0 ? 1 : 0.72 - layer * 0.09
                })
            );
            mesh.position.set(dp.x, dp.y, dp.z - 0.08 - layer * 0.01);
            this.scene.scene.add(mesh);
            layers.push(mesh);
        }

        this._vortexMeshes = layers;
        return layers;
    }

    async _openDoor(parts) {
        this._playDoorCreakSound();
        const { doorMesh, bounds, memoW, memoH, dp } = parts;

        const doorRightX = (bounds.right - 0.5) * memoW;
        const doorCenterX = (bounds.cx - 0.5) * memoW;
        const doorCenterY = -(bounds.cy - 0.5) * memoH;
        const doorHeight = bounds.h * memoH;

        const hingePivot = new THREE.Group();
        hingePivot.position.set(dp.x + doorRightX, dp.y, dp.z + 0.004);
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
            const y = doorCenterY + doorHeight * (0.22 + i * 0.28) - doorHeight / 2;
            hinge.position.set(0, y, 0.01);
            hingePivot.add(hinge);
        }

        const portalLight = new THREE.PointLight(0xbbe9ff, 1.2, 3.5);
        portalLight.position.set(dp.x + doorCenterX, dp.y + doorCenterY, dp.z + 0.45);
        this.scene.scene.add(portalLight);
        this._parts.portalLight = portalLight;

        this._startSpin();

        return new Promise(resolve => {
            gsap.timeline({ onComplete: resolve })
                .to(portalLight, {
                    duration: 0.45,
                    intensity: 2.6,
                    ease: 'power2.out'
                }, 0)
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
                mesh.rotation.z = time * (0.52 + index * 0.18) * (index % 2 === 0 ? 1 : -1);
                mesh.material.opacity = 0.52 + Math.sin(time * 3 + index) * 0.08;
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
