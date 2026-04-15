// ===== 춘식이 스타일 클릭 이동 캐릭터 컨트롤러 =====
class CharacterController {
    constructor(scene) {
        this.scene = scene;
        this.group = new THREE.Group();
        this.moveSpeed = 5;
        this.isActive = false;
        this.camera = null;

        // 클릭 이동
        this.targetPos = null;       // 이동 목표 위치
        this.isMoving = false;
        this.velocity = new THREE.Vector3();

        // 직교 카메라용 오프셋
        this.cameraHeight = 15;
        this.cameraDistance = 12;

        // 바닥 레이캐스팅용
        this.raycaster = new THREE.Raycaster();
        this.mouse = new THREE.Vector2();
        this.floorPlane = new THREE.Plane(new THREE.Vector3(0, 1, 0), 0);

        // 클릭 마커
        this.clickMarker = this._createClickMarker();
        this.scene.add(this.clickMarker);

        // 발자국 시스템
        this.footprints = [];
        this.lastFootprintPos = new THREE.Vector3();
        this.footprintSide = 0; // 좌우 교대
        this._footprintPool = this._createFootprintPool(30);

        // 모바일 조이스틱
        this.joystickInput = { x: 0, y: 0 };
        // 키보드도 보조로 지원
        this.keys = {};

        this._buildCharacter();
        this._bindInput();
    }

    _createFootprintPool(count) {
        const pool = [];
        const geo = new THREE.PlaneGeometry(0.15, 0.22);
        for (let i = 0; i < count; i++) {
            const mat = new THREE.MeshBasicMaterial({
                color: 0x88aa88, transparent: true, opacity: 0,
                side: THREE.DoubleSide, depthWrite: false
            });
            const mesh = new THREE.Mesh(geo, mat);
            mesh.rotation.x = -Math.PI / 2;
            mesh.position.y = 0.03;
            mesh.visible = false;
            this.scene.add(mesh);
            pool.push({ mesh, life: 0, active: false });
        }
        return pool;
    }

    _spawnFootprint(x, z, angle, side) {
        // 풀에서 비활성 발자국 찾기
        const fp = this._footprintPool.find(f => !f.active);
        if (!fp) return;

        const offsetX = Math.cos(angle + Math.PI / 2) * 0.12 * side;
        const offsetZ = Math.sin(angle + Math.PI / 2) * 0.12 * side;

        fp.mesh.position.set(x + offsetX, 0.03, z + offsetZ);
        fp.mesh.rotation.z = -angle + Math.PI / 2;
        fp.mesh.material.opacity = 0.35;
        fp.mesh.visible = true;
        fp.life = 1.0;
        fp.active = true;
    }

    _updateFootprints(dt) {
        this._footprintPool.forEach(fp => {
            if (!fp.active) return;
            fp.life -= dt * 0.6; // 약 1.7초간 유지
            fp.mesh.material.opacity = fp.life * 0.35;
            if (fp.life <= 0) {
                fp.active = false;
                fp.mesh.visible = false;
            }
        });
    }

    _createClickMarker() {
        const group = new THREE.Group();
        group.visible = false;

        // 외곽 원
        const ringGeo = new THREE.RingGeometry(0.25, 0.35, 24);
        const ringMat = new THREE.MeshBasicMaterial({
            color: 0x6366f1, transparent: true, opacity: 0.7,
            side: THREE.DoubleSide
        });
        const ring = new THREE.Mesh(ringGeo, ringMat);
        ring.rotation.x = -Math.PI / 2;
        ring.position.y = 0.05;
        group.add(ring);

        // 내부 점
        const dotGeo = new THREE.CircleGeometry(0.1, 12);
        const dotMat = new THREE.MeshBasicMaterial({
            color: 0x6366f1, transparent: true, opacity: 0.9,
            side: THREE.DoubleSide
        });
        const dot = new THREE.Mesh(dotGeo, dotMat);
        dot.rotation.x = -Math.PI / 2;
        dot.position.y = 0.06;
        group.add(dot);

        this._markerRing = ring;
        this._markerDot = dot;
        return group;
    }

    _buildCharacter() {
        const bodyMat = new THREE.MeshStandardMaterial({
            color: 0x6366f1, roughness: 0.3, metalness: 0.4
        });

        // 몸통
        const torso = new THREE.Mesh(
            new THREE.CylinderGeometry(0.32, 0.28, 0.65, 16), bodyMat
        );
        torso.position.y = 0.75;
        torso.castShadow = true;
        this.group.add(torso);

        // 상단 반구
        const topHalf = new THREE.Mesh(
            new THREE.SphereGeometry(0.32, 16, 8, 0, Math.PI * 2, 0, Math.PI / 2), bodyMat
        );
        topHalf.position.y = 1.08;
        this.group.add(topHalf);

        // 하단 반구
        const botHalf = new THREE.Mesh(
            new THREE.SphereGeometry(0.28, 16, 8, 0, Math.PI * 2, Math.PI / 2, Math.PI / 2), bodyMat
        );
        botHalf.position.y = 0.42;
        this.group.add(botHalf);

        // 머리
        const headMat = new THREE.MeshStandardMaterial({
            color: 0xf5f5f5, roughness: 0.2, metalness: 0.3
        });
        const head = new THREE.Mesh(new THREE.SphereGeometry(0.3, 16, 16), headMat);
        head.position.y = 1.55;
        head.castShadow = true;
        this.group.add(head);

        // 눈
        const eyeMat = new THREE.MeshBasicMaterial({ color: 0x111111 });
        this.leftEye = new THREE.Mesh(new THREE.SphereGeometry(0.055, 8, 8), eyeMat);
        this.leftEye.position.set(-0.1, 1.6, 0.24);
        this.group.add(this.leftEye);
        this.rightEye = new THREE.Mesh(new THREE.SphereGeometry(0.055, 8, 8), eyeMat);
        this.rightEye.position.set(0.1, 1.6, 0.24);
        this.group.add(this.rightEye);

        // 입
        const smile = new THREE.Mesh(
            new THREE.BoxGeometry(0.1, 0.02, 0.02),
            new THREE.MeshBasicMaterial({ color: 0xe74c3c })
        );
        smile.position.set(0, 1.48, 0.28);
        this.group.add(smile);

        // 안테나
        const antMat = new THREE.MeshStandardMaterial({ color: 0xffd54f });
        const antenna = new THREE.Mesh(new THREE.CylinderGeometry(0.02, 0.02, 0.25, 8), antMat);
        antenna.position.set(0, 1.95, 0);
        this.group.add(antenna);
        this.antennaTip = new THREE.Mesh(
            new THREE.SphereGeometry(0.06, 8, 8),
            new THREE.MeshBasicMaterial({ color: 0xffd54f })
        );
        this.antennaTip.position.set(0, 2.1, 0);
        this.group.add(this.antennaTip);

        // 팔
        const armMat = new THREE.MeshStandardMaterial({ color: 0x5558e8 });
        this.leftArm = new THREE.Mesh(new THREE.BoxGeometry(0.1, 0.32, 0.1), armMat);
        this.leftArm.position.set(-0.42, 0.72, 0);
        this.group.add(this.leftArm);
        this.rightArm = new THREE.Mesh(new THREE.BoxGeometry(0.1, 0.32, 0.1), armMat);
        this.rightArm.position.set(0.42, 0.72, 0);
        this.group.add(this.rightArm);

        // 다리
        const legMat = new THREE.MeshStandardMaterial({ color: 0x333366 });
        this.leftLeg = new THREE.Mesh(new THREE.BoxGeometry(0.12, 0.3, 0.12), legMat);
        this.leftLeg.position.set(-0.13, 0.15, 0);
        this.group.add(this.leftLeg);
        this.rightLeg = new THREE.Mesh(new THREE.BoxGeometry(0.12, 0.3, 0.12), legMat);
        this.rightLeg.position.set(0.13, 0.15, 0);
        this.group.add(this.rightLeg);

        // 바닥 그림자
        const shadowMat = new THREE.MeshBasicMaterial({
            color: 0x000000, transparent: true, opacity: 0.15
        });
        const shadow = new THREE.Mesh(new THREE.CircleGeometry(0.45, 16), shadowMat);
        shadow.rotation.x = -Math.PI / 2;
        shadow.position.y = 0.02;
        this.group.add(shadow);
    }

    _bindInput() {
        // 키보드 (보조)
        window.addEventListener('keydown', e => { this.keys[e.code] = true; });
        window.addEventListener('keyup', e => { this.keys[e.code] = false; });

        // 조이스틱
        this._setupJoystick();
    }

    // 클릭 이동 활성화 (renderer 요소에 바인딩)
    enableClickMove(rendererDom) {
        const onClick = (e) => {
            if (!this.isActive) return;
            // UI 위 클릭은 무시
            if (e.target !== rendererDom) return;

            const rect = rendererDom.getBoundingClientRect();
            const clientX = e.clientX || (e.touches && e.touches[0].clientX);
            const clientY = e.clientY || (e.touches && e.touches[0].clientY);

            this.mouse.x = ((clientX - rect.left) / rect.width) * 2 - 1;
            this.mouse.y = -((clientY - rect.top) / rect.height) * 2 + 1;

            this.raycaster.setFromCamera(this.mouse, this.camera);

            // 바닥 평면(y=0)과 교차
            const intersection = new THREE.Vector3();
            if (this.raycaster.ray.intersectPlane(this.floorPlane, intersection)) {
                // 경계 내인지 확인
                if (Math.abs(intersection.x) < 18 && Math.abs(intersection.z) < 18) {
                    this.targetPos = intersection.clone();
                    this.targetPos.y = 0;
                    this.isMoving = true;

                    // 클릭 마커 표시
                    this._showClickMarker(intersection);
                }
            }
        };

        rendererDom.addEventListener('click', onClick);
        rendererDom.addEventListener('touchend', (e) => {
            // 조이스틱 영역이면 무시
            if (e.target.closest('#mobile-joystick')) return;
            if (e.changedTouches && e.changedTouches.length > 0) {
                const touch = e.changedTouches[0];
                onClick({ clientX: touch.clientX, clientY: touch.clientY, target: rendererDom });
            }
        });

        // 우클릭도 이동 (게더타운 스타일)
        rendererDom.addEventListener('contextmenu', (e) => {
            e.preventDefault();
            onClick(e);
        });
    }

    _showClickMarker(pos) {
        this.clickMarker.position.set(pos.x, 0, pos.z);
        this.clickMarker.visible = true;
        this._markerScale = 1.5;

        // 마커 애니메이션 (축소되면서 사라짐)
        if (this._markerTimeout) clearTimeout(this._markerTimeout);
        this._markerTimeout = setTimeout(() => {
            this.clickMarker.visible = false;
        }, 1500);
    }

    _setupJoystick() {
        const base = document.querySelector('.joystick-base');
        const stick = document.querySelector('.joystick-stick');
        if (!base || !stick) return;

        let dragging = false;
        const onStart = (e) => { dragging = true; e.preventDefault(); e.stopPropagation(); };
        const onMove = (e) => {
            if (!dragging) return;
            e.preventDefault();
            const rect = base.getBoundingClientRect();
            const cx = rect.left + rect.width / 2;
            const cy = rect.top + rect.height / 2;
            const clientX = e.touches ? e.touches[0].clientX : e.clientX;
            const clientY = e.touches ? e.touches[0].clientY : e.clientY;
            let dx = (clientX - cx) / (rect.width / 2);
            let dy = (clientY - cy) / (rect.height / 2);
            const len = Math.sqrt(dx * dx + dy * dy);
            if (len > 1) { dx /= len; dy /= len; }
            stick.style.transform = `translate(${dx * 20}px, ${dy * 20}px)`;
            this.joystickInput.x = dx;
            this.joystickInput.y = dy;
        };
        const onEnd = () => {
            dragging = false;
            stick.style.transform = '';
            this.joystickInput.x = 0;
            this.joystickInput.y = 0;
        };

        base.addEventListener('touchstart', onStart, { passive: false });
        base.addEventListener('touchmove', onMove, { passive: false });
        base.addEventListener('touchend', onEnd);
        base.addEventListener('mousedown', onStart);
        window.addEventListener('mousemove', onMove);
        window.addEventListener('mouseup', onEnd);
    }

    activate(camera) {
        this.isActive = true;
        this.camera = camera;
        this._snapCamera();
    }

    deactivate() { this.isActive = false; }

    _snapCamera() {
        const p = this.group.position;
        this.camera.position.set(p.x, p.y + this.cameraHeight, p.z + this.cameraDistance);
        this.camera.lookAt(p.x, 0, p.z);
    }

    update(dt, time) {
        if (!this.isActive || !this.camera) return;

        let isWalking = false;

        // --- 1. 클릭 이동 ---
        if (this.isMoving && this.targetPos) {
            const dir = new THREE.Vector3().subVectors(this.targetPos, this.group.position);
            dir.y = 0;
            const dist = dir.length();

            if (dist > 0.2) {
                dir.normalize();
                const step = Math.min(this.moveSpeed * dt, dist);
                this.group.position.addScaledVector(dir, step);
                isWalking = true;

                // 회전
                const targetAngle = Math.atan2(dir.x, dir.z);
                let diff = targetAngle - this.group.rotation.y;
                while (diff > Math.PI) diff -= Math.PI * 2;
                while (diff < -Math.PI) diff += Math.PI * 2;
                this.group.rotation.y += diff * 0.2;
            } else {
                // 도착
                this.isMoving = false;
                this.targetPos = null;
                this.clickMarker.visible = false;
            }
        }

        // --- 2. 키보드/조이스틱 이동 (보조) ---
        let inputX = 0, inputZ = 0;
        if (this.keys['KeyA'] || this.keys['ArrowLeft']) inputX = -1;
        if (this.keys['KeyD'] || this.keys['ArrowRight']) inputX = 1;
        if (this.keys['KeyW'] || this.keys['ArrowUp']) inputZ = -1;
        if (this.keys['KeyS'] || this.keys['ArrowDown']) inputZ = 1;
        if (Math.abs(this.joystickInput.x) > 0.15) inputX = this.joystickInput.x;
        if (Math.abs(this.joystickInput.y) > 0.15) inputZ = this.joystickInput.y;

        if (inputX !== 0 || inputZ !== 0) {
            // 키보드 입력 시 클릭 이동 취소
            this.isMoving = false;
            this.targetPos = null;
            this.clickMarker.visible = false;

            const moveDir = new THREE.Vector3(inputX, 0, inputZ).normalize();
            this.group.position.addScaledVector(moveDir, this.moveSpeed * dt);
            isWalking = true;

            const targetAngle = Math.atan2(moveDir.x, moveDir.z);
            let diff = targetAngle - this.group.rotation.y;
            while (diff > Math.PI) diff -= Math.PI * 2;
            while (diff < -Math.PI) diff += Math.PI * 2;
            this.group.rotation.y += diff * 0.2;
        }

        // 경계
        this.group.position.x = Math.max(-18, Math.min(18, this.group.position.x));
        this.group.position.z = Math.max(-18, Math.min(18, this.group.position.z));

        // 부스 충돌 체크 (벽 통과 방지)
        if (this.collisionBoxes) {
            this.collisionBoxes.forEach(box => {
                const px = this.group.position.x;
                const pz = this.group.position.z;
                const r = 0.5; // 캐릭터 반경
                if (px + r > box.minX && px - r < box.maxX &&
                    pz + r > box.minZ && pz - r < box.maxZ) {
                    // 가장 가까운 면으로 밀어냄
                    const dLeft = Math.abs(px + r - box.minX);
                    const dRight = Math.abs(px - r - box.maxX);
                    const dBack = Math.abs(pz + r - box.minZ);
                    const dFront = Math.abs(pz - r - box.maxZ);
                    const min = Math.min(dLeft, dRight, dBack, dFront);
                    if (min === dLeft) this.group.position.x = box.minX - r;
                    else if (min === dRight) this.group.position.x = box.maxX + r;
                    else if (min === dBack) this.group.position.z = box.minZ - r;
                    else this.group.position.z = box.maxZ + r;

                    // 클릭 이동 중이면 취소
                    if (this.isMoving) {
                        this.isMoving = false;
                        this.targetPos = null;
                        this.clickMarker.visible = false;
                    }
                }
            });
        }

        // --- 걸음 애니메이션 ---
        if (isWalking) {
            const walkFreq = 10;
            const walkAmp = 0.25;
            this.leftLeg.rotation.x = Math.sin(time * walkFreq) * walkAmp;
            this.rightLeg.rotation.x = -Math.sin(time * walkFreq) * walkAmp;
            this.leftArm.rotation.x = -Math.sin(time * walkFreq) * walkAmp * 0.6;
            this.rightArm.rotation.x = Math.sin(time * walkFreq) * walkAmp * 0.6;
            this.group.position.y = Math.abs(Math.sin(time * walkFreq)) * 0.04;
        } else {
            this.leftLeg.rotation.x *= 0.85;
            this.rightLeg.rotation.x *= 0.85;
            this.leftArm.rotation.x *= 0.85;
            this.rightArm.rotation.x *= 0.85;
            this.group.position.y *= 0.9;
        }

        // 발자국
        if (isWalking) {
            const distFromLast = this.group.position.distanceTo(this.lastFootprintPos);
            if (distFromLast > 0.6) {
                this.footprintSide *= -1;
                const angle = this.group.rotation.y;
                this._spawnFootprint(
                    this.group.position.x, this.group.position.z,
                    angle, this.footprintSide
                );
                this.lastFootprintPos.copy(this.group.position);
            }
        }
        this._updateFootprints(dt);

        // 안테나 흔들림
        if (this.antennaTip) {
            this.antennaTip.position.x = Math.sin(time * 3) * 0.04;
        }

        // 클릭 마커 펄스 애니메이션
        if (this.clickMarker.visible && this._markerRing) {
            const pulse = 0.9 + Math.sin(time * 6) * 0.15;
            this._markerRing.scale.set(pulse, pulse, 1);
            this._markerRing.material.opacity = 0.4 + Math.sin(time * 4) * 0.3;
        }

        // --- 카메라 추적 ---
        this._updateCamera(dt);
    }

    _updateCamera(dt) {
        const p = this.group.position;
        const targetX = p.x;
        const targetY = p.y + this.cameraHeight;
        const targetZ = p.z + this.cameraDistance;

        this.camera.position.x += (targetX - this.camera.position.x) * 0.08;
        this.camera.position.y += (targetY - this.camera.position.y) * 0.08;
        this.camera.position.z += (targetZ - this.camera.position.z) * 0.08;
        this.camera.lookAt(p.x, 0.5, p.z - 1);
    }

    getPosition() {
        return this.group.position;
    }
}
