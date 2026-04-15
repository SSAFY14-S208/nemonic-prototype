// ===== Stage 4: 테두리 즉시 사라짐 → 문이 안으로 들어가서 오른쪽 뒤로 쓱 밀림 =====
class Stage4Attach {
    constructor(app) {
        this.app = app;
        this.scene = app.nemonicScene;
    }

    async start(memo) {
        this._doorPos = this.app._doorPos;

        await Utils.delay(500);

        // 1. 포스트잇 배경 사라지고 그린 선만 남음
        await this._fadeBackground(memo);

        // 2. 문 라인 빛남
        await this._glowLines(memo);

        // 3. 문이 안으로 들어가며 오른쪽으로 밀림 (이때 동굴 등장)
        await this._slideIntoWall(memo);

        // 4. 열린 동굴 잠깐 보여줌
        await Utils.delay(800);

        return memo;
    }

    // 배경 투명 + 문 테두리만 검정으로 유지
    _fadeBackground(memo) {
        return new Promise(resolve => {
            const img = new Image();
            img.onload = () => {
                const c = document.createElement('canvas');
                c.width = img.width; c.height = img.height;
                const ctx = c.getContext('2d');
                ctx.drawImage(img, 0, 0);
                const imageData = ctx.getImageData(0, 0, c.width, c.height);
                const px = imageData.data;

                for (let i = 0; i < px.length; i += 4) {
                    const r = px[i], g = px[i+1], b = px[i+2];
                    const dist = Math.abs(r - 255) + Math.abs(g - 253) + Math.abs(b - 231);
                    if (dist < 60) {
                        // 배경 → 투명
                        px[i+3] = 0;
                    } else {
                        // 문 테두리 → 검정 유지
                        px[i] = Math.min(r, 50);
                        px[i+1] = Math.min(g, 50);
                        px[i+2] = Math.min(b, 50);
                        px[i+3] = 255;
                    }
                }
                ctx.putImageData(imageData, 0, 0);

                const linesTex = new THREE.Texture(c);
                linesTex.minFilter = THREE.LinearFilter;
                linesTex.magFilter = THREE.LinearFilter;
                linesTex.needsUpdate = true;

                const oldMat = memo.material;
                memo.material = new THREE.MeshStandardMaterial({
                    map: linesTex,
                    transparent: true,
                    side: THREE.DoubleSide,
                    roughness: 0.8,
                    emissive: new THREE.Color(0x000000),
                    emissiveIntensity: 0
                });
                oldMat.dispose();
                resolve();
            };
            img.src = this.app._drawingDataURL;
        });
    }


    _glowLines(memo) {
        // 글로우 없이 검정 라인 유지, 잠시 대기만
        return Utils.delay(600);
    }

    async _slideIntoWall(memo) {
        this._playSlideSound();
        const doorWidth = 0.85 * memo.scale.x;
        const dp = this._doorPos;

        // 문 뒤에 3D 동굴 터널 생성
        this._createCaveTunnel(dp, doorWidth, 0.85 * memo.scale.y);

        // 문 모양 포탈 생성 (드로잉 안쪽만)
        const doorTex = await this._createDoorShapeTexture(this.app._drawingDataURL);
        const holeW = 0.85 * memo.scale.x;
        const holeH = 0.85 * memo.scale.y;
        const holeGeo = new THREE.PlaneGeometry(holeW, holeH);
        const holeMat = new THREE.MeshBasicMaterial({
            map: doorTex, side: THREE.DoubleSide,
            transparent: true, opacity: 0
        });
        const hole = new THREE.Mesh(holeGeo, holeMat);
        hole.position.set(dp.x, dp.y, dp.z - 0.01);
        this.scene.scene.add(hole);

        // 기기 오른쪽 끝 x 계산 (기기 밖으로 안 나가게)
        const devicePos = this.scene.nemonicDevice.group.position;
        const deviceHalfW = 0.65; // 기기 너비/2

        // 문 라인을 기기 벽 안으로 클리핑 (오른쪽 끝에서 잘림)
        const clipRight = new THREE.Plane(new THREE.Vector3(-1, 0, 0), devicePos.x + deviceHalfW);
        memo.material.clippingPlanes = [clipRight];

        return new Promise(resolve => {
            const tl = gsap.timeline({ onComplete: resolve });

            // 뒤로 두둥 (벽 안으로)
            tl.to(memo.position, {
                duration: 0.4, z: memo.position.z - 0.15, ease: 'power2.in'
            })
            // 오른쪽으로 드르륵 (기기 벽 안에서 밀림)
            .to(memo.position, {
                duration: 1.5, x: memo.position.x + doorWidth * 1.2, ease: 'power2.inOut'
            })
            // 문 모양 포탈 등장
            .to(holeMat, {
                duration: 0.8, opacity: 1, ease: 'power2.in'
            }, '<0.2');
        });
    }

    // 동굴 터널 (문 뒤로 깊이감)
    _createCaveTunnel(doorPos, w, h) {
        const tunnelDepth = 8;
        const tunnelW = w * 0.7;
        const tunnelH = h * 0.7;

        // 터널 벽면 material (어두운 남색/보라)
        const caveMat = new THREE.MeshStandardMaterial({
            color: 0x151025,
            roughness: 0.95,
            metalness: 0.0,
            side: THREE.BackSide
        });

        // 터널 박스 (안쪽에서 보이도록 BackSide)
        const tunnelGeo = new THREE.BoxGeometry(tunnelW, tunnelH, tunnelDepth);
        const tunnel = new THREE.Mesh(tunnelGeo, caveMat);
        tunnel.position.set(doorPos.x, doorPos.y, doorPos.z - tunnelDepth / 2 - 0.1);
        this.scene.scene.add(tunnel);

        // 터널 안쪽 조명 (은은한 보라)
        const caveLight1 = new THREE.PointLight(0x6644aa, 0.5, 6);
        caveLight1.position.set(doorPos.x, doorPos.y, doorPos.z - 2);
        this.scene.scene.add(caveLight1);

        const caveLight2 = new THREE.PointLight(0x4422aa, 0.3, 8);
        caveLight2.position.set(doorPos.x, doorPos.y, doorPos.z - 5);
        this.scene.scene.add(caveLight2);

        // 터널 끝 빛 (저 멀리 밝은 빛)
        const endLight = new THREE.PointLight(0xffffff, 0.8, 10);
        endLight.position.set(doorPos.x, doorPos.y, doorPos.z - tunnelDepth);
        this.scene.scene.add(endLight);
    }

    // 드로잉 안쪽만 어두운색, 바깥은 투명 (고해상도 + 부드러운 가장자리)
    _createDoorShapeTexture(dataURL) {
        return new Promise(resolve => {
            const img = new Image();
            img.onload = () => {
                // 고해상도로 업스케일 (부드러운 가장자리)
                const SCALE = 2;
                const c = document.createElement('canvas');
                const W = img.width * SCALE, H = img.height * SCALE;
                c.width = W; c.height = H;
                const ctx = c.getContext('2d');
                ctx.imageSmoothingEnabled = true;
                ctx.imageSmoothingQuality = 'high';
                ctx.drawImage(img, 0, 0, W, H);
                const srcData = ctx.getImageData(0, 0, W, H);
                const src = srcData.data;

                // 선인지 판별
                const isLine = (x, y) => {
                    const i = (y * W + x) * 4;
                    const r = src[i], g = src[i+1], b = src[i+2];
                    return (Math.abs(r-255) + Math.abs(g-253) + Math.abs(b-231)) > 50;
                };

                // 바깥쪽을 flood fill (가장자리에서, queue 기반)
                const outside = new Uint8Array(W * H);
                // 초기 시드: 가장자리 배경 픽셀
                let queue = [];
                for (let x = 0; x < W; x++) {
                    if (!isLine(x, 0)) { outside[x] = 1; queue.push(x); }
                    const bIdx = (H-1)*W+x;
                    if (!isLine(x, H-1)) { outside[bIdx] = 1; queue.push(bIdx); }
                }
                for (let y = 1; y < H-1; y++) {
                    const lIdx = y*W;
                    if (!isLine(0, y)) { outside[lIdx] = 1; queue.push(lIdx); }
                    const rIdx = y*W+(W-1);
                    if (!isLine(W-1, y)) { outside[rIdx] = 1; queue.push(rIdx); }
                }

                // BFS
                let head = 0;
                while (head < queue.length) {
                    const idx = queue[head++];
                    const x = idx % W, y = (idx - x) / W;
                    const neighbors = [];
                    if (x > 0) neighbors.push(idx - 1);
                    if (x < W-1) neighbors.push(idx + 1);
                    if (y > 0) neighbors.push(idx - W);
                    if (y < H-1) neighbors.push(idx + W);
                    for (const n of neighbors) {
                        if (!outside[n]) {
                            const nx = n % W, ny = (n - nx) / W;
                            if (!isLine(nx, ny)) {
                                outside[n] = 1;
                                queue.push(n);
                            }
                        }
                    }
                }

                // 결과 텍스처: 안쪽→검정, 바깥→투명
                const out = ctx.createImageData(W, H);
                for (let i = 0; i < W * H; i++) {
                    const i4 = i * 4;
                    if (outside[i]) {
                        out.data[i4+3] = 0; // 바깥 투명
                    } else {
                        // 안쪽: 중앙으로 갈수록 어두운 그라데이션 (동굴 깊이감)
                        const ix = i % W, iy = Math.floor(i / W);
                        const cx = W/2, cy = H/2;
                        const dist = Math.sqrt((ix-cx)*(ix-cx) + (iy-cy)*(iy-cy));
                        const maxDist = Math.sqrt(cx*cx + cy*cy);
                        const t = Math.min(dist / maxDist, 1);
                        // 중앙: 어두운 남색, 가장자리: 짙은 보라
                        out.data[i4] = Math.floor(15 + t * 25);
                        out.data[i4+1] = Math.floor(10 + t * 15);
                        out.data[i4+2] = Math.floor(35 + t * 30);
                        out.data[i4+3] = 255;
                    }
                }
                ctx.putImageData(out, 0, 0);

                // 가장자리 부드럽게 (멀티패스 블러)
                // 결과를 임시 캔버스에 그린 뒤 블러 적용
                const blurC = document.createElement('canvas');
                blurC.width = W; blurC.height = H;
                const blurCtx = blurC.getContext('2d');
                blurCtx.putImageData(out, 0, 0);

                // 블러된 버전으로 다시 그리기 (가장자리만 부드럽게)
                ctx.clearRect(0, 0, W, H);
                ctx.filter = 'blur(3px)';
                ctx.drawImage(blurC, 0, 0);
                ctx.filter = 'none';

                const tex = new THREE.Texture(c);
                tex.minFilter = THREE.LinearFilter;
                tex.magFilter = THREE.LinearFilter;
                tex.needsUpdate = true;
                resolve(tex);
            };
            img.src = dataURL;
        });
    }

    _playSlideSound() {
        try {
            const ac = new (window.AudioContext || window.webkitAudioContext)();
            const dur = 1.5, sr = ac.sampleRate;
            const buf = ac.createBuffer(1, sr * dur, sr);
            const d = buf.getChannelData(0);
            for (let i = 0; i < d.length; i++) {
                const t = i / sr;
                const rumble = Math.sin(2 * Math.PI * 60 * t) * 0.1;
                const friction = (Math.random() - 0.5) * 0.05 * Math.sin(2 * Math.PI * 15 * t);
                const env = Math.min(t * 5, 1) * Math.min((dur - t) * 3, 1);
                d[i] = (rumble + friction) * env;
            }
            const s = ac.createBufferSource(); s.buffer = buf; s.connect(ac.destination); s.start();
        } catch (e) {}
    }
}
