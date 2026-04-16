// ===== 3D 씬 구성 =====
class NemonicScene {
    constructor() {
        this.scene = new THREE.Scene();
        this.camera = new THREE.PerspectiveCamera(50, window.innerWidth / window.innerHeight, 0.1, 1000);
        this.renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
        this.nemonicDevice = null;
        this.controls = null;
        this.raycaster = new THREE.Raycaster();
        this.mouse = new THREE.Vector2();

        this._setup();
    }

    _setup() {
        // 렌더러
        this.renderer.setSize(window.innerWidth, window.innerHeight);
        this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
        this.renderer.shadowMap.enabled = false;
        this.renderer.toneMapping = THREE.LinearToneMapping;
        this.renderer.toneMappingExposure = 0.85;
        this.renderer.localClippingEnabled = true;
        document.getElementById('canvas-container').appendChild(this.renderer.domElement);

        // 배경 (두두타 스타일 맑은 하늘)
        this.scene.background = new THREE.Color(0x6EC8F0);
        this.scene.fog = new THREE.Fog(0x6EC8F0, 40, 100);

        // 조명
        this._setupLights();

        // 바닥
        this._createFloor();

        // 길
        this._createPath();

        // 네모닉 기기
        this.nemonicDevice = new NemonicDevice();
        this.nemonicDevice.group.position.set(0, 0, -5);
        this.scene.add(this.nemonicDevice.group);

        // 주변 장식
        this._createDecorations();

        // 카메라 초기 위치
        this.camera.position.set(0, 2.5, 12);
        this.camera.lookAt(0, 0.8, -5);

        // OrbitControls (마우스 드래그로 시점 회전)
        this.controls = new THREE.OrbitControls(this.camera, this.renderer.domElement);
        this.controls.target.set(0, 0.8, -5);
        this.controls.enableDamping = true;
        this.controls.dampingFactor = 0.08;
        this.controls.enableZoom = true;
        this.controls.minDistance = 3;
        this.controls.maxDistance = 20;
        this.controls.maxPolarAngle = Math.PI / 2.1; // 바닥 아래로 못 가게
        this.controls.enabled = false; // 인트로 끝나면 활성화

        // 리사이즈
        window.addEventListener('resize', () => this._onResize());
    }

    _setupLights() {
        // 앰비언트 (따뜻한 톤)
        const ambient = new THREE.AmbientLight(0xfff8f0, 0.6);
        this.scene.add(ambient);

        // 메인 디렉셔널 (따뜻한 햇빛)
        const dirLight = new THREE.DirectionalLight(0xfff5e6, 0.8);
        dirLight.position.set(5, 10, 5);
        dirLight.castShadow = false;
        this.scene.add(dirLight);

        // 네모닉 기기 스포트라이트
        const spot = new THREE.SpotLight(0x64c8ff, 1.5, 15, Math.PI / 6, 0.5);
        spot.position.set(0, 6, -3);
        spot.target.position.set(0, 0, -5);
        this.scene.add(spot);
        this.scene.add(spot.target);

        // 보조 포인트 라이트
        const fillLight = new THREE.PointLight(0xfff8f0, 0.3, 15);
        fillLight.position.set(-3, 3, 0);
        this.scene.add(fillLight);
    }

    _createFloor() {
        // 두두타 스타일 잔디밭 텍스처
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

        const floorGeo = new THREE.PlaneGeometry(50, 50);
        const floorMat = new THREE.MeshStandardMaterial({
            map: tex,
            roughness: 0.9,
            metalness: 0.0
        });
        const floor = new THREE.Mesh(floorGeo, floorMat);
        floor.rotation.x = -Math.PI / 2;
        floor.receiveShadow = true;
        this.scene.add(floor);
    }

    _createPath() {
        // 밝은 돌길 (유저 → 네모닉)
        const pathPoints = [];
        for (let i = 0; i <= 20; i++) {
            pathPoints.push(new THREE.Vector3(0, 0.02, 8 - i * 0.65));
        }

        for (let i = 0; i < pathPoints.length; i++) {
            const tileGeo = new THREE.PlaneGeometry(0.8, 0.5);
            const tileMat = new THREE.MeshStandardMaterial({
                color: 0xD4A868,
                roughness: 0.7,
                metalness: 0.0
            });
            const tile = new THREE.Mesh(tileGeo, tileMat);
            tile.rotation.x = -Math.PI / 2;
            tile.position.copy(pathPoints[i]);
            tile.name = `path-tile-${i}`;
            this.scene.add(tile);
        }
    }

    _createDecorations() {
        // 구름 파티클 (하얀 점)
        const particleCount = 100;
        const positions = new Float32Array(particleCount * 3);
        for (let i = 0; i < particleCount; i++) {
            positions[i * 3] = (Math.random() - 0.5) * 40;
            positions[i * 3 + 1] = Math.random() * 5 + 6;
            positions[i * 3 + 2] = (Math.random() - 0.5) * 40 - 5;
        }
        const cloudGeo = new THREE.BufferGeometry();
        cloudGeo.setAttribute('position', new THREE.BufferAttribute(positions, 3));
        const cloudMat = new THREE.PointsMaterial({
            color: 0xffffff,
            size: 0.25,
            transparent: true,
            opacity: 0.7
        });
        this.stars = new THREE.Points(cloudGeo, cloudMat);
        this.scene.add(this.stars);

        // 꽃 장식 (기기 주변에서 충분히 먼 곳에만)
        const flowerColors = [0xFF69B4, 0xFFEB3B, 0xFF5722, 0x9C27B0, 0xE91E63];
        for (let i = 0; i < 25; i++) {
            const fGeo = new THREE.SphereGeometry(0.08, 8, 8);
            const fMat = new THREE.MeshStandardMaterial({
                color: flowerColors[Math.floor(Math.random() * flowerColors.length)],
                roughness: 0.8
            });
            const flower = new THREE.Mesh(fGeo, fMat);
            const fx = (Math.random() > 0.5 ? 1 : -1) * (3 + Math.random() * 7);
            const fz = (Math.random() - 0.5) * 24;
            flower.position.set(fx, 0.05, fz);
            this.scene.add(flower);
        }
    }

    // 별 애니메이션
    animateStars(time) {
        if (this.stars) {
            const pos = this.stars.geometry.attributes.position;
            for (let i = 0; i < pos.count; i++) {
                pos.array[i * 3 + 1] += Math.sin(time * 0.5 + i) * 0.001;
            }
            pos.needsUpdate = true;
        }
    }

    _onResize() {
        this.camera.aspect = window.innerWidth / window.innerHeight;
        this.camera.updateProjectionMatrix();
        this.renderer.setSize(window.innerWidth, window.innerHeight);
    }

    render() {
        if (this.controls && this.controls.enabled) {
            this.controls.update();
        }
        this.renderer.render(this.scene, this.camera);
    }
}
