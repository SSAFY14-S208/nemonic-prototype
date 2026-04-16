// ===== 춘식이 스타일 2.5D 테마파크 (최적화) =====
class ThemePark {
    constructor(scene, camera) {
        this.threeScene = scene;
        this.group = new THREE.Group();
        this.booths = [];
        this.nearbyBooth = null;
        this.isBoothOpen = false;
        this.decorObjects = [];
        this.camera = this._setupCamera(camera);
        this.textureLoader = new THREE.TextureLoader();
        this._previewTextureCache = new Map();
        this._build();
        this._bindBoothUI();
    }

    _setupCamera(camera) {
        const cam = camera || new THREE.PerspectiveCamera(
            50,
            window.innerWidth / window.innerHeight,
            0.1,
            1000
        );
        cam.fov = 50;
        cam.near = 0.1;
        cam.far = 1000;
        cam.position.set(0, 3, 18);
        cam.lookAt(0, 1.2, 10);
        cam.updateProjectionMatrix();

        if (!camera) {
            window.addEventListener('resize', () => {
                cam.aspect = window.innerWidth / window.innerHeight;
                cam.updateProjectionMatrix();
            });
        }
        return cam;
    }

    _build() {
        this.threeScene.background = new THREE.Color(0x88D4F4);
        this.threeScene.fog = null;

        // 렌더러 톤매핑 리셋 (인트로와 다르게 설정)
        const renderer = this.threeScene.getObjectByProperty && null;
        // 렌더러는 외부에서 접근 — _build 후 main.js에서 처리

        // 조명 (두두타 스타일: 따뜻하고 자연스러움)
        this.group.add(new THREE.AmbientLight(0xfff5e6, 0.7));
        const dir = new THREE.DirectionalLight(0xfff0dd, 0.8);
        dir.position.set(5, 12, 5);
        this.group.add(dir);
        const fillDir = new THREE.DirectionalLight(0xe8eeff, 0.25);
        fillDir.position.set(-5, 8, -3);
        this.group.add(fillDir);

        this._createTileFloor();
        this._createRoads();
        this._createBooths();
        this._createDecorations();
        this._createEntryArch();
        this.threeScene.add(this.group);
    }

    _createTileFloor() {
        // 두두타 스타일 잔디밭
        const c = document.createElement('canvas');
        c.width = 512; c.height = 512;
        const ctx = c.getContext('2d');

        // 기본 잔디색 (차분한 자연 녹색)
        ctx.fillStyle = '#5a9a50';
        ctx.fillRect(0, 0, 512, 512);

        // 어두운 패치
        for (let i = 0; i < 40; i++) {
            ctx.fillStyle = `rgba(55, 100, 45, ${0.12 + Math.random() * 0.12})`;
            ctx.beginPath();
            ctx.ellipse(
                Math.random() * 512, Math.random() * 512,
                20 + Math.random() * 40, 15 + Math.random() * 30,
                Math.random() * Math.PI, 0, Math.PI * 2
            );
            ctx.fill();
        }

        // 밝은 패치
        for (let i = 0; i < 30; i++) {
            ctx.fillStyle = `rgba(110, 170, 80, ${0.08 + Math.random() * 0.1})`;
            ctx.beginPath();
            ctx.ellipse(
                Math.random() * 512, Math.random() * 512,
                15 + Math.random() * 35, 10 + Math.random() * 25,
                Math.random() * Math.PI, 0, Math.PI * 2
            );
            ctx.fill();
        }

        // 잔디 잎 패턴
        const grassColors = ['#4a8840', '#6aaa58', '#528e48', '#72b260', '#3e7a35'];
        for (let i = 0; i < 2000; i++) {
            const x = Math.random() * 512;
            const y = Math.random() * 512;
            const h = 3 + Math.random() * 6;
            ctx.strokeStyle = grassColors[Math.floor(Math.random() * grassColors.length)];
            ctx.lineWidth = 1 + Math.random() * 1.5;
            ctx.beginPath();
            ctx.moveTo(x, y);
            ctx.lineTo(x + (Math.random() - 0.5) * 3, y - h);
            ctx.stroke();
        }

        const tex = new THREE.CanvasTexture(c);
        tex.wrapS = tex.wrapT = THREE.RepeatWrapping;
        tex.repeat.set(6, 6);
        tex.anisotropy = 4;

        const floor = new THREE.Mesh(
            new THREE.PlaneGeometry(50, 50),
            new THREE.MeshBasicMaterial({ map: tex })
        );
        floor.rotation.x = -Math.PI / 2;
        this.group.add(floor);
    }

    _createRoads() {
        const c = document.createElement('canvas');
        c.width = 512;
        c.height = 512;
        const ctx = c.getContext('2d');

        ctx.fillStyle = '#b8b2a4';
        ctx.fillRect(0, 0, 512, 512);

        for (let i = 0; i < 36; i++) {
            const tone = Math.random() > 0.5 ? 255 : 110;
            const alpha = 0.025 + Math.random() * 0.035;
            ctx.fillStyle = tone === 255
                ? `rgba(210, 205, 196, ${alpha})`
                : `rgba(115, 108, 98, ${alpha})`;
            ctx.beginPath();
            ctx.ellipse(
                Math.random() * 512,
                Math.random() * 512,
                24 + Math.random() * 56,
                14 + Math.random() * 34,
                Math.random() * Math.PI,
                0,
                Math.PI * 2
            );
            ctx.fill();
        }

        for (let i = 0; i < 2400; i++) {
            const shade = 138 + Math.floor(Math.random() * 42);
            ctx.fillStyle = `rgba(${shade + 2}, ${shade + 1}, ${shade - 1}, ${0.05 + Math.random() * 0.05})`;
            ctx.beginPath();
            ctx.ellipse(
                Math.random() * 512,
                Math.random() * 512,
                0.6 + Math.random() * 1.8,
                0.6 + Math.random() * 1.4,
                Math.random() * Math.PI,
                0,
                Math.PI * 2
            );
            ctx.fill();
        }

        for (let i = 0; i < 140; i++) {
            const shade = 154 + Math.floor(Math.random() * 28);
            ctx.fillStyle = `rgba(${shade + 2}, ${shade + 1}, ${shade - 2}, ${0.09 + Math.random() * 0.08})`;
            ctx.beginPath();
            ctx.ellipse(
                Math.random() * 512,
                Math.random() * 512,
                1.4 + Math.random() * 4.4,
                1.4 + Math.random() * 3.8,
                Math.random() * Math.PI,
                0,
                Math.PI * 2
            );
            ctx.fill();
        }

        const edgeDark = ctx.createLinearGradient(0, 0, 512, 0);
        edgeDark.addColorStop(0, 'rgba(90,86,80,0.10)');
        edgeDark.addColorStop(0.12, 'rgba(90,86,80,0)');
        edgeDark.addColorStop(0.88, 'rgba(90,86,80,0)');
        edgeDark.addColorStop(1, 'rgba(90,86,80,0.10)');
        ctx.fillStyle = edgeDark;
        ctx.fillRect(0, 0, 512, 512);

        const roadTex = new THREE.CanvasTexture(c);
        roadTex.wrapS = roadTex.wrapT = THREE.RepeatWrapping;
        roadTex.anisotropy = 4;

        const makeRoadMaterial = (repeatX, repeatY) => {
            const map = roadTex.clone();
            map.wrapS = map.wrapT = THREE.RepeatWrapping;
            map.repeat.set(repeatX, repeatY);
            map.anisotropy = 4;
            return new THREE.MeshStandardMaterial({
                map,
                color: 0xddd8ce,
                roughness: 0.98,
                metalness: 0.0
            });
        };

        const verticalRoad = new THREE.Mesh(
            new THREE.PlaneGeometry(3, 30),
            makeRoadMaterial(2.2, 14)
        );
        verticalRoad.rotation.x = -Math.PI / 2;
        verticalRoad.position.set(0, 0.01, 0);
        this.group.add(verticalRoad);

        const leftRoad = new THREE.Mesh(
            new THREE.PlaneGeometry(13.5, 3),
            makeRoadMaterial(8.5, 2.2)
        );
        leftRoad.rotation.x = -Math.PI / 2;
        leftRoad.position.set(-8.25, 0.01, -2);
        this.group.add(leftRoad);

        const rightRoad = new THREE.Mesh(
            new THREE.PlaneGeometry(13.5, 3),
            makeRoadMaterial(8.5, 2.2)
        );
        rightRoad.rotation.x = -Math.PI / 2;
        rightRoad.position.set(8.25, 0.01, -2);
        this.group.add(rightRoad);

        const centerCap = new THREE.Mesh(
            new THREE.PlaneGeometry(3.04, 3.04),
            makeRoadMaterial(2.2, 2.2)
        );
        centerCap.rotation.x = -Math.PI / 2;
        centerCap.position.set(0, 0.012, -2);
        this.group.add(centerCap);
    }

    _createBooths() {
        const boothData = [
            { name: '커뮤니티 부스', icon: '👥', color: 0xff4040, roofColor: 0xe52525,
              position: new THREE.Vector3(-7, 0, -6), gameType: null,
              desc: '서로의 메모와 아이디어를 모아보는 커뮤니티 공간입니다.', action: '커뮤니티 보기',
              theme: 'community', previewImage: 'assets/community.png' },
            { name: '운세 부스', icon: '🔮', color: 0x2196F3, roofColor: 0x1565C0,
              position: new THREE.Vector3(7, 0, -6), gameType: null,
              desc: '오늘의 운세와 메시지를 가볍게 확인할 수 있는 공간입니다.', action: '운세 보기',
              theme: 'fortune', previewImage: 'assets/fortune-booth.png' },
            { name: '플립북 스튜디오', icon: '🎞️', color: 0x9C27B0, roofColor: 0x7B1FA2,
              position: new THREE.Vector3(-7, 0, 4), gameType: null,
              desc: '장면을 넘기며 움직임을 만드는 플립북 체험 공간입니다.', action: '플립북 보기',
              theme: 'flipbook', previewImage: 'assets/flipbook.png' },
            { name: '릴레이 드로잉', icon: '✏️', color: 0xFFB300, roofColor: 0xF57F17,
              position: new THREE.Vector3(7, 0, 4), gameType: null,
              desc: '차례대로 이어 그리며 하나의 그림을 완성하는 공간입니다.', action: '그림 이어보기',
              theme: 'relay', previewImage: 'assets/relay-drawing.png' }
        ];
        boothData.forEach(data => {
            const { shell, interior } = this._buildRoom(data);
            shell.visible = false;
            interior.visible = true;
            interior.scale.set(1, 1, 1);
            this.booths.push({ mesh: shell, interior, data, state: 'full', springT: 1 });
        });
    }

    // === 에셋 카드형 부스 빌더 ===
    _buildRoom(data) {
        const shell = new THREE.Group();
        shell.position.copy(data.position);
        this.group.add(shell);

        // Interior: 잔디밭 위에 세워진 에셋 패널
        const interior = new THREE.Group();
        interior.position.copy(data.position);

        if (data.previewImage) {
            const previewSize = this._getPreviewSize(data.previewImage);
            const preview = this._createPreviewPlane(data.previewImage, previewSize.width, previewSize.height, {
                y: 0.08,
                z: 0,
                rotateX: 0,
                shadowOpacity: 0.18,
                standing: true,
                depth: previewSize.depth,
                accentColor: data.color,
                roofColor: data.roofColor
            });
            interior.add(preview);
        }

        this.group.add(interior);
        return { shell, interior };
    }

    _getPreviewTexture(path) {
        if (!path) return null;
        if (!this._previewTextureCache.has(path)) {
            const tex = this.textureLoader.load(encodeURI(path));
            tex.encoding = THREE.sRGBEncoding;
            tex.anisotropy = 4;
            this._previewTextureCache.set(path, tex);
        }
        return this._previewTextureCache.get(path);
    }

    _getPreviewSize(path) {
        const sizes = {
            'assets/community.png': { width: 6.4, height: 4.08, depth: 3.8 },
            'assets/fortune-booth.png': { width: 6.4, height: 4.8, depth: 4.0 },
            'assets/flipbook.png': { width: 6.4, height: 4.8, depth: 3.9 },
            'assets/relay-drawing.png': { width: 6.9, height: 4.01, depth: 3.8 }
        };
        return sizes[path] || { width: 6.4, height: 4.2, depth: 3.8 };
    }

    _createPreviewPlane(path, width, height, options = {}) {
        const group = new THREE.Group();
        const texture = this._getPreviewTexture(path);
        const depth = options.depth || Math.max(width * 0.55, 3.4);

        if (options.standing) {
            const groundShadow = new THREE.Mesh(
                new THREE.PlaneGeometry(width * 0.96, depth * 0.76),
                new THREE.MeshBasicMaterial({
                    color: 0x1b3a20,
                    transparent: true,
                    opacity: options.shadowOpacity || 0.18
                })
            );
            groundShadow.rotation.x = -Math.PI / 2;
            groundShadow.position.set(0, 0.03, depth * 0.16);
            group.add(groundShadow);

            const base = new THREE.Mesh(
                new THREE.BoxGeometry(width * 1.02, 0.18, depth),
                new THREE.MeshStandardMaterial({
                    color: 0xeee8dd,
                    roughness: 0.95,
                    metalness: 0.0
                })
            );
            base.position.set(0, 0.09, 0);
            group.add(base);

            const leftWall = new THREE.Mesh(
                new THREE.BoxGeometry(0.16, height * 0.92, depth * 0.82),
                new THREE.MeshStandardMaterial({
                    color: 0xf7f2e8,
                    roughness: 0.92,
                    metalness: 0.0
                })
            );
            leftWall.position.set(-width * 0.49, height * 0.46, -depth * 0.06);
            group.add(leftWall);

            const rightWall = leftWall.clone();
            rightWall.position.x = width * 0.49;
            group.add(rightWall);

            const backWall = new THREE.Mesh(
                new THREE.BoxGeometry(width * 0.98, height * 0.92, 0.16),
                new THREE.MeshStandardMaterial({
                    color: 0xf8f4ec,
                    roughness: 0.92,
                    metalness: 0.0
                })
            );
            backWall.position.set(0, height * 0.46, -depth * 0.46);
            group.add(backWall);

            const fascia = new THREE.Mesh(
                new THREE.BoxGeometry(width * 1.04, 0.24, 0.44),
                new THREE.MeshStandardMaterial({
                    color: options.roofColor || options.accentColor || 0x7b6cff,
                    roughness: 0.55,
                    metalness: 0.04
                })
            );
            fascia.position.set(0, height * 0.95, depth * 0.18);
            group.add(fascia);
        }

        const image = new THREE.Mesh(
            new THREE.PlaneGeometry(width, height),
            new THREE.MeshBasicMaterial({
                map: texture,
                color: 0xffffff,
                transparent: true,
                alphaTest: 0.04,
                side: THREE.DoubleSide
            })
        );

        if (options.standing) {
            image.position.set(0, height * 0.5 + 0.12, depth * 0.34);
        } else {
            image.position.z = 0.01;
        }
        group.add(image);

        group.position.set(0, options.y || 0, options.z || 0);
        group.rotation.x = options.rotateX || 0;

        return group;
    }

    // ========== 방 꾸미기 ==========

    _room_home(r, hs, wh) {
        // 소파
        const sofaMat = new THREE.MeshStandardMaterial({ color: 0x5566cc, roughness: 0.6 });
        const sofaBase = new THREE.Mesh(new THREE.BoxGeometry(0.5, 0.35, 1.4), sofaMat);
        sofaBase.position.set(-hs + 0.35, 0.18, 0);
        r.add(sofaBase);
        const sofaBack = new THREE.Mesh(new THREE.BoxGeometry(0.12, 0.6, 1.4), sofaMat);
        sofaBack.position.set(-hs + 0.15, 0.3, 0);
        r.add(sofaBack);
        // 쿠션
        [0xffd54f, 0xff9999].forEach((c, i) => {
            const cush = new THREE.Mesh(new THREE.BoxGeometry(0.18, 0.18, 0.18),
                new THREE.MeshStandardMaterial({ color: c }));
            cush.position.set(-hs + 0.35, 0.44, -0.4 + i * 0.8);
            cush.rotation.z = 0.15 * (i === 0 ? 1 : -1);
            r.add(cush);
        });

        // TV (뒷벽)
        const tv = new THREE.Mesh(new THREE.BoxGeometry(1.2, 0.7, 0.06),
            new THREE.MeshStandardMaterial({ color: 0x222222 }));
        tv.position.set(0.3, wh * 0.5, -hs + 0.04);
        r.add(tv);
        const scr = new THREE.Mesh(new THREE.PlaneGeometry(1.05, 0.55),
            new THREE.MeshBasicMaterial({ color: 0x3366aa }));
        scr.position.set(0.3, wh * 0.5, -hs + 0.08);
        r.add(scr);

        // 커피 테이블
        this._addTable(r, 0.3, 0, 0, 0.8, 0.3, 0.5);

        // 커피컵
        this._addCup(r, 0.15, 0.32, 0.05, 0xfff8dc);

        // 화분
        this._addPlant(r, hs - 0.4, 0, -hs + 0.4);

        // 벽시계
        this._addWallClock(r, -hs + 0.04, wh * 0.7, -0.5);

        // 액자
        this._addFrame(r, 0, wh * 0.75, -hs + 0.04, 0.6, 0.45, 0xe8d4b8);

        // 램프 (코너)
        this._addFloorLamp(r, hs - 0.4, 0, hs - 0.5);
    }

    _room_office(r, hs, wh) {
        // L자 책상
        const deskMat = new THREE.MeshStandardMaterial({ color: 0xc0c0c0, roughness: 0.4 });
        const desk1 = new THREE.Mesh(new THREE.BoxGeometry(1.8, 0.06, 0.7), deskMat);
        desk1.position.set(0, 0.72, -hs + 0.45);
        r.add(desk1);
        const desk2 = new THREE.Mesh(new THREE.BoxGeometry(0.7, 0.06, 1.2), deskMat);
        desk2.position.set(-hs + 0.45, 0.72, -hs + 0.9);
        r.add(desk2);
        // 책상 다리
        [[-0.7, -hs+0.2], [0.7, -hs+0.2], [-0.7, -hs+0.65], [0.7, -hs+0.65]].forEach(([x,z]) => {
            const leg = new THREE.Mesh(new THREE.CylinderGeometry(0.025, 0.025, 0.72, 6),
                new THREE.MeshStandardMaterial({ color: 0x888888 }));
            leg.position.set(x, 0.36, z);
            r.add(leg);
        });

        // 모니터 2대
        [-0.3, 0.5].forEach(x => {
            const mon = new THREE.Mesh(new THREE.BoxGeometry(0.55, 0.4, 0.04),
                new THREE.MeshStandardMaterial({ color: 0x222222 }));
            mon.position.set(x, 1.1, -hs + 0.35);
            r.add(mon);
            const scr = new THREE.Mesh(new THREE.PlaneGeometry(0.48, 0.33),
                new THREE.MeshBasicMaterial({ color: 0x2255aa }));
            scr.position.set(x, 1.1, -hs + 0.38);
            r.add(scr);
        });

        // 의자
        this._addChair(r, 0.2, 0, -hs + 1.0, 0x333333);

        // 화이트보드 (왼벽)
        const wb = new THREE.Mesh(new THREE.PlaneGeometry(1.5, 1.0),
            new THREE.MeshStandardMaterial({ color: 0xffffff }));
        wb.rotation.y = Math.PI / 2;
        wb.position.set(-hs + 0.04, wh * 0.55, 0.3);
        r.add(wb);

        // 화분
        this._addPlant(r, hs - 0.4, 0, hs - 0.4);

        // 커피컵
        this._addCup(r, -hs + 0.5, 0.75, -hs + 0.5, 0xffffff);
    }

    _room_bowling(r, hs, wh) {
        // 볼링 레인 (바닥)
        const laneMat = new THREE.MeshStandardMaterial({ color: 0xf5deb3, roughness: 0.4 });
        const lane = new THREE.Mesh(new THREE.PlaneGeometry(1.2, S_VAL(hs)), laneMat);
        lane.rotation.x = -Math.PI / 2;
        lane.position.set(0.3, 0.04, 0);
        r.add(lane);
        // 가터 라인
        [-0.3, 0.9].forEach(x => {
            const gutter = new THREE.Mesh(new THREE.PlaneGeometry(0.05, 3),
                new THREE.MeshStandardMaterial({ color: 0x333333 }));
            gutter.rotation.x = -Math.PI / 2;
            gutter.position.set(x, 0.045, 0);
            r.add(gutter);
        });

        // 볼링 핀 세트
        const pinMat = new THREE.MeshStandardMaterial({ color: 0xffffff, roughness: 0.3 });
        const pinPositions = [[0,0],[-.12,.2],[.12,.2],[-.24,.4],[0,.4],[.24,.4]];
        pinPositions.forEach(([px,pz]) => {
            const pin = new THREE.Mesh(new THREE.CylinderGeometry(0.03, 0.04, 0.18, 6), pinMat);
            pin.position.set(0.3 + px, 0.09, -hs + 0.5 + pz);
            r.add(pin);
        });

        // 볼링 공
        const ball = new THREE.Mesh(new THREE.SphereGeometry(0.1, 10, 10),
            new THREE.MeshStandardMaterial({ color: 0xe74c3c, roughness: 0.2, metalness: 0.3 }));
        ball.position.set(0.3, 0.1, hs - 0.6);
        r.add(ball);

        // 벤치
        const bench = new THREE.Mesh(new THREE.BoxGeometry(1.0, 0.06, 0.4),
            new THREE.MeshStandardMaterial({ color: 0xff8866 }));
        bench.position.set(-hs + 0.6, 0.38, 0.5);
        r.add(bench);

        // 점수판 (뒷벽)
        const board = new THREE.Mesh(new THREE.PlaneGeometry(1.2, 0.6),
            new THREE.MeshStandardMaterial({ color: 0x111133 }));
        board.position.set(0.3, wh * 0.7, -hs + 0.04);
        r.add(board);
        const boardTxt = new THREE.Mesh(new THREE.PlaneGeometry(1.0, 0.4),
            new THREE.MeshBasicMaterial({ color: 0x00ff66 }));
        boardTxt.position.set(0.3, wh * 0.7, -hs + 0.06);
        r.add(boardTxt);

        // 신발장 (왼벽)
        const shoes = new THREE.Mesh(new THREE.BoxGeometry(0.3, 0.8, 1.0),
            new THREE.MeshStandardMaterial({ color: 0x8b7355 }));
        shoes.position.set(-hs + 0.2, 0.4, -0.3);
        r.add(shoes);
    }

    _room_pcroom(r, hs, wh) {
        // 어두운 분위기 - PC방 특유 RGB 조명
        const rgbLight = new THREE.PointLight(0x6366f1, 0.3, 4);
        rgbLight.position.set(0, 1.5, 0);
        r.add(rgbLight);

        // PC 좌석 3개 (일렬)
        [-1.0, 0, 1.0].forEach((z, i) => {
            // 책상
            const desk = new THREE.Mesh(new THREE.BoxGeometry(0.8, 0.06, 0.5),
                new THREE.MeshStandardMaterial({ color: 0x333333, roughness: 0.3 }));
            desk.position.set(-hs + 0.5, 0.65, z);
            r.add(desk);
            // 모니터
            const mon = new THREE.Mesh(new THREE.BoxGeometry(0.5, 0.35, 0.04),
                new THREE.MeshStandardMaterial({ color: 0x111111 }));
            mon.position.set(-hs + 0.35, 1.0, z);
            r.add(mon);
            // 화면 (RGB 색상)
            const colors = [0xff4444, 0x44ff44, 0x4444ff];
            const scr = new THREE.Mesh(new THREE.PlaneGeometry(0.43, 0.28),
                new THREE.MeshBasicMaterial({ color: colors[i] }));
            scr.position.set(-hs + 0.33, 1.0, z);
            scr.rotation.y = Math.PI;
            r.add(scr);
            // 의자
            this._addChair(r, -hs + 0.8, 0, z, 0x222222);
            // 키보드
            const kb = new THREE.Mesh(new THREE.BoxGeometry(0.3, 0.02, 0.1),
                new THREE.MeshStandardMaterial({ color: 0x444444 }));
            kb.position.set(-hs + 0.55, 0.68, z);
            r.add(kb);
        });

        // 음료 자판기 (뒷벽)
        const vending = new THREE.Mesh(new THREE.BoxGeometry(0.5, 1.3, 0.4),
            new THREE.MeshStandardMaterial({ color: 0xcc3333 }));
        vending.position.set(hs - 0.4, 0.65, -hs + 0.3);
        r.add(vending);

        // 네온사인 (뒷벽)
        const neon = new THREE.Mesh(new THREE.PlaneGeometry(1.2, 0.35),
            new THREE.MeshBasicMaterial({ color: 0xff00ff }));
        neon.position.set(0, wh * 0.75, -hs + 0.04);
        r.add(neon);
    }

    _room_cafe(r, hs, wh) {
        // 카운터
        const counterMat = new THREE.MeshStandardMaterial({ color: 0x8b6914, roughness: 0.6 });
        const counter = new THREE.Mesh(new THREE.BoxGeometry(2.0, 0.9, 0.5), counterMat);
        counter.position.set(0, 0.45, -hs + 0.35);
        r.add(counter);
        // 카운터 탑
        const ctop = new THREE.Mesh(new THREE.BoxGeometry(2.1, 0.05, 0.55),
            new THREE.MeshStandardMaterial({ color: 0xd4a76a }));
        ctop.position.set(0, 0.91, -hs + 0.35);
        r.add(ctop);

        // 커피 머신
        const machine = new THREE.Mesh(new THREE.BoxGeometry(0.3, 0.4, 0.25),
            new THREE.MeshStandardMaterial({ color: 0xc0c0c0, metalness: 0.4 }));
        machine.position.set(-0.5, 1.12, -hs + 0.35);
        r.add(machine);

        // 메뉴판 (뒷벽)
        const menu = new THREE.Mesh(new THREE.PlaneGeometry(1.4, 0.8),
            new THREE.MeshStandardMaterial({ color: 0x2c2c2c }));
        menu.position.set(0, wh * 0.7, -hs + 0.04);
        r.add(menu);
        const menuTxt = new THREE.Mesh(new THREE.PlaneGeometry(1.2, 0.6),
            new THREE.MeshBasicMaterial({ color: 0xfff8dc }));
        menuTxt.position.set(0, wh * 0.7, -hs + 0.06);
        r.add(menuTxt);

        // 테이블 + 의자 세트 2개
        [[0.5, 0.8], [-0.5, 0.8]].forEach(([x, z]) => {
            this._addTable(r, x, 0, z, 0.6, 0.25, 0.6);
            this._addChair(r, x - 0.25, 0, z + 0.35, 0x8b6914);
            this._addChair(r, x + 0.25, 0, z - 0.35, 0x8b6914);
            this._addCup(r, x, 0.28, z, 0xffffff);
        });

        // 화분
        this._addPlant(r, hs - 0.4, 0, hs - 0.4);
        this._addPlant(r, -hs + 0.4, 0, hs - 0.4);

        // 펜던트 조명
        const pendant = new THREE.Mesh(new THREE.CylinderGeometry(0.15, 0.2, 0.12, 8),
            new THREE.MeshStandardMaterial({ color: 0xffd54f }));
        pendant.position.set(0, wh - 0.2, 0.5);
        r.add(pendant);
    }

    // ========== 공통 소품 헬퍼 ==========
    _addTable(r, x, y, z, w, h, d) {
        const top = new THREE.Mesh(new THREE.BoxGeometry(w, 0.05, d),
            new THREE.MeshStandardMaterial({ color: 0xd4a76a, roughness: 0.7 }));
        top.position.set(x, y + h, z);
        r.add(top);
        const legMat = new THREE.MeshStandardMaterial({ color: 0xc49a6c });
        const hw = w / 2 - 0.05, hd = d / 2 - 0.05;
        [[-hw, -hd], [-hw, hd], [hw, -hd], [hw, hd]].forEach(([lx, lz]) => {
            const leg = new THREE.Mesh(new THREE.CylinderGeometry(0.02, 0.02, h, 6), legMat);
            leg.position.set(x + lx, y + h / 2, z + lz);
            r.add(leg);
        });
    }

    _addChair(r, x, y, z, color) {
        const mat = new THREE.MeshStandardMaterial({ color, roughness: 0.6 });
        const seat = new THREE.Mesh(new THREE.BoxGeometry(0.3, 0.04, 0.3), mat);
        seat.position.set(x, y + 0.38, z);
        r.add(seat);
        const back = new THREE.Mesh(new THREE.BoxGeometry(0.3, 0.3, 0.04), mat);
        back.position.set(x, y + 0.55, z - 0.13);
        r.add(back);
    }

    _addPlant(r, x, y, z) {
        const pot = new THREE.Mesh(new THREE.CylinderGeometry(0.13, 0.1, 0.2, 8),
            new THREE.MeshStandardMaterial({ color: 0xcc7755 }));
        pot.position.set(x, y + 0.1, z);
        r.add(pot);
        const leaf = new THREE.Mesh(new THREE.SphereGeometry(0.18, 8, 6),
            new THREE.MeshStandardMaterial({ color: 0x4CAF50, roughness: 0.8 }));
        leaf.position.set(x, y + 0.3, z);
        r.add(leaf);
    }

    _addCup(r, x, y, z, color) {
        const cup = new THREE.Mesh(new THREE.CylinderGeometry(0.04, 0.035, 0.08, 8),
            new THREE.MeshStandardMaterial({ color: color || 0xfff8dc, roughness: 0.3 }));
        cup.position.set(x, y + 0.04, z);
        r.add(cup);
    }

    _addFloorLamp(r, x, y, z) {
        const shade = new THREE.Mesh(new THREE.CylinderGeometry(0.2, 0.12, 0.2, 8),
            new THREE.MeshStandardMaterial({ color: 0xfff5cc }));
        shade.position.set(x, y + 1.25, z);
        r.add(shade);
    }

    _addWallClock(r, x, y, z) {
        const clock = new THREE.Mesh(new THREE.CircleGeometry(0.2, 16),
            new THREE.MeshStandardMaterial({ color: 0xffffff }));
        clock.position.set(x, y, z);
        clock.rotation.y = Math.PI / 2;
        r.add(clock);
        const rim = new THREE.Mesh(new THREE.RingGeometry(0.18, 0.21, 16),
            new THREE.MeshStandardMaterial({ color: 0x333333, side: THREE.DoubleSide }));
        rim.position.set(x + 0.01, y, z);
        rim.rotation.y = Math.PI / 2;
        r.add(rim);
    }

    _addFrame(r, x, y, z, w, h, color) {
        const frame = new THREE.Mesh(new THREE.BoxGeometry(w + 0.08, h + 0.08, 0.03),
            new THREE.MeshStandardMaterial({ color: 0x8b7355 }));
        frame.position.set(x, y, z);
        r.add(frame);
        const canvas = new THREE.Mesh(new THREE.PlaneGeometry(w, h),
            new THREE.MeshStandardMaterial({ color }));
        canvas.position.set(x, y, z + 0.02);
        r.add(canvas);
    }

    // ========== 장식 ==========
    _createDecorations() {
        // 나무 (수 줄임: 8개)
        const treePos = [[-10,-4],[10,-4],[-10,8],[10,8],[-4,-12],[4,-12],[-12,2],[12,2]];
        const trunkGeo = new THREE.CylinderGeometry(0.12, 0.18, 1.0, 6);
        const leafGeo = new THREE.SphereGeometry(0.7, 8, 6);
        treePos.forEach(([x, z]) => {
            const tree = new THREE.Group();
            const trunk = new THREE.Mesh(trunkGeo, new THREE.MeshStandardMaterial({ color: 0x8D6E63 }));
            trunk.position.y = 0.5;
            tree.add(trunk);
            const colors = [0x4A8B4A, 0x5AA05A, 0x3A7A3A];
            const leaf = new THREE.Mesh(leafGeo, new THREE.MeshStandardMaterial({ color: colors[Math.floor(Math.random()*3)] }));
            leaf.position.y = 1.5;
            leaf.scale.set(1, 0.85, 1);
            tree.add(leaf);
            tree.position.set(x, 0, z);
            tree.scale.setScalar(0.7 + Math.random() * 0.3);
            this.group.add(tree);
        });

    }

    _createEntryArch() {
        const mat = new THREE.MeshStandardMaterial({ color: 0xffffff, roughness: 0.3 });
        [-1.8, 1.8].forEach(x => {
            const p = new THREE.Mesh(new THREE.CylinderGeometry(0.15, 0.15, 3.5, 10), mat);
            p.position.set(x, 1.75, 12);
            this.group.add(p);
        });
        const top = new THREE.Mesh(new THREE.BoxGeometry(4.2, 0.5, 0.4),
            new THREE.MeshStandardMaterial({ color: 0x3525B0, roughness: 0.4 }));
        top.position.set(0, 3.6, 12);
        this.group.add(top);
        const tc = document.createElement('canvas');
        tc.width = 512; tc.height = 64;
        const t = tc.getContext('2d');
        t.fillStyle = '#fff';
        t.font = 'bold 48px Arial';
        t.textAlign = 'center';
        t.fillText('NEMONIC WORLD', 256, 50);
        const tm = new THREE.Mesh(new THREE.PlaneGeometry(3.5, 0.45),
            new THREE.MeshBasicMaterial({ map: new THREE.CanvasTexture(tc), transparent: true }));
        tm.position.set(0, 3.6, 12.21);
        this.group.add(tm);
    }

    _bindBoothUI() {
        document.getElementById('booth-close').addEventListener('click', () => this.closeBooth());
    }

    getCamera() { return this.camera; }

    update(characterPos) {
        if (this.isBoothOpen) return;
        let nearest = null, nearestDist = Infinity;

        this.booths.forEach(booth => {
            const dist = characterPos.distanceTo(booth.data.position);
            if (dist < nearestDist) { nearestDist = dist; nearest = booth; }
            if (booth.state === 'full') {
                const idle = 1 + Math.sin(Date.now() * 0.002) * 0.006;
                booth.interior.scale.set(idle, idle, idle);
            }
        });

        if (nearestDist < 3.5) {
            this.nearbyBooth = nearest;
            document.getElementById('interaction-prompt').classList.remove('hidden');
        } else {
            this.nearbyBooth = null;
            document.getElementById('interaction-prompt').classList.add('hidden');
        }
    }

    interact() {
        if (!this.nearbyBooth || this.isBoothOpen) return;
        this.openBooth(this.nearbyBooth.data);
    }

    openBooth(data) {
        this.isBoothOpen = true;
        document.getElementById('booth-title').textContent = data.icon + ' ' + data.name;
        const body = document.getElementById('booth-body');
        if (data.gameType === 'yang') {
            new YangGame().render(body);
        } else {
            const preview = data.previewImage
                ? '<img src="' + encodeURI(data.previewImage) + '" alt="' + data.name + '" style="display:block;width:100%;max-width:340px;margin:0 auto 18px;border-radius:16px;background:#fff;box-shadow:0 10px 30px rgba(0,0,0,0.22);">'
                : '';
            body.innerHTML = preview + '<div class="booth-icon">' + data.icon + '</div><div class="booth-desc">' + data.desc + '</div><button class="booth-action-btn">' + data.action + '</button>';
            body.querySelector('.booth-action-btn')?.addEventListener('click', () => {
                alert('[프로토타입] "' + data.name + '" 기능은 추후 AI API 연동으로 구현됩니다.');
            });
        }
        Utils.show('booth-overlay');
        document.getElementById('interaction-prompt').classList.add('hidden');
    }

    closeBooth() {
        this.isBoothOpen = false;
        Utils.hide('booth-overlay');
    }

    _worldToMinimap(x, z, w, h, padding = 14) {
        const bounds = {
            minX: -16,
            maxX: 16,
            minZ: -12,
            maxZ: 14
        };
        const usableW = w - padding * 2;
        const usableH = h - padding * 2;
        const nx = (x - bounds.minX) / (bounds.maxX - bounds.minX);
        const nz = (z - bounds.minZ) / (bounds.maxZ - bounds.minZ);
        return {
            x: padding + nx * usableW,
            y: padding + nz * usableH
        };
    }

    _drawMinimapRoad(ctx, x, z, width, depth, canvasW, canvasH) {
        const topLeft = this._worldToMinimap(x - width / 2, z - depth / 2, canvasW, canvasH);
        const bottomRight = this._worldToMinimap(x + width / 2, z + depth / 2, canvasW, canvasH);
        const left = Math.min(topLeft.x, bottomRight.x);
        const top = Math.min(topLeft.y, bottomRight.y);
        const rectW = Math.abs(bottomRight.x - topLeft.x);
        const rectH = Math.abs(bottomRight.y - topLeft.y);

        ctx.fillStyle = 'rgba(235, 224, 205, 0.95)';
        ctx.fillRect(left, top, rectW, rectH);
    }

    renderMinimap(characterPos) {
        const canvas = document.getElementById('minimap-canvas');
        if (!canvas) return;
        const ctx = canvas.getContext('2d');
        const w = canvas.width;
        const h = canvas.height;
        ctx.clearRect(0, 0, w, h);

        ctx.fillStyle = 'rgba(245,243,239,0.94)';
        ctx.beginPath();
        ctx.roundRect(0, 0, w, h, 18);
        ctx.fill();

        this._drawMinimapRoad(ctx, 0, 0, 3, 30, w, h);
        this._drawMinimapRoad(ctx, -8.25, -2, 13.5, 3, w, h);
        this._drawMinimapRoad(ctx, 8.25, -2, 13.5, 3, w, h);
        this._drawMinimapRoad(ctx, 0, -2, 3.04, 3.04, w, h);

        const entryLeft = this._worldToMinimap(-2.1, 12, w, h);
        const entryRight = this._worldToMinimap(2.1, 12, w, h);
        ctx.strokeStyle = 'rgba(53, 37, 176, 0.95)';
        ctx.lineWidth = 3;
        ctx.beginPath();
        ctx.moveTo(entryLeft.x, entryLeft.y);
        ctx.lineTo(entryRight.x, entryRight.y);
        ctx.stroke();

        this.booths.forEach(b => {
            const pos = this._worldToMinimap(b.data.position.x, b.data.position.z, w, h);
            ctx.fillStyle = '#' + b.data.color.toString(16).padStart(6, '0');
            ctx.strokeStyle = 'rgba(255,255,255,0.95)';
            ctx.lineWidth = 2;
            ctx.beginPath();
            ctx.arc(pos.x, pos.y, 7, 0, Math.PI * 2);
            ctx.fill();
            ctx.stroke();
        });

        const cpos = this._worldToMinimap(characterPos.x, characterPos.z, w, h);
        ctx.fillStyle = '#6366f1';
        ctx.beginPath();
        ctx.arc(cpos.x, cpos.y, 5, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = '#fff';
        ctx.beginPath();
        ctx.arc(cpos.x, cpos.y, 2.5, 0, Math.PI * 2);
        ctx.fill();
    }
}

// 볼링장에서 사용하는 헬퍼
function S_VAL(hs) { return hs * 2 - 0.5; }
