// ===== 춘식이 스타일 클릭 이동 캐릭터 컨트롤러 =====
class CharacterController {
    constructor(scene) {
        this.scene = scene;
        this.group = new THREE.Group();
        this.moveSpeed = 5;
        this.isActive = false;
        this.camera = null;
        this.moveAcceleration = 12;
        this.moveDeceleration = 10;
        this.turnResponsiveness = 10;
        this.minMoveSpeed = 0.05;

        // 클릭 이동
        this.targetPos = null;       // 이동 목표 위치
        this.isMoving = false;
        this.velocity = new THREE.Vector3();

        // 3인칭 추적 카메라 오프셋
        this.cameraHeight = 2.8;
        this.cameraDistance = 5.8;
        this.cameraSideOffset = 0;
        this.cameraLookHeight = 1.25;
        this.cameraLookAhead = 2.8;
        this.cameraLerp = 0.12;
        this.turnLerp = 0.24;

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
        this._footprintPool = this._createFootprintPool(60);
        this._groundAnchors = [];
        this._anchorGroundOffset = 0;
        this._groundProbe = new THREE.Vector3();

        // 모바일 조이스틱
        this.joystickInput = { x: 0, y: 0 };
        // 키보드도 보조로 지원
        this.keys = {};
        this.baseY = 0;
        this.modelRoot = null;
        this.shadow = null;
        this.mixer = null;
        this.animActions = {};
        this.currentAction = null;
        this.walkCycle = 0;

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

    _spawnFootprint(x, z, angle, side, forwardOffset = 0) {
        // 풀에서 비활성 발자국 찾기
        const fp = this._footprintPool.find(f => !f.active);
        if (!fp) return;

        const offsetX = Math.cos(angle + Math.PI / 2) * 0.12 * side;
        const offsetZ = Math.sin(angle + Math.PI / 2) * 0.12 * side;
        const stepOffsetX = Math.sin(angle) * forwardOffset;
        const stepOffsetZ = Math.cos(angle) * forwardOffset;

        fp.mesh.position.set(x + offsetX + stepOffsetX, 0.03, z + offsetZ + stepOffsetZ);
        fp.mesh.rotation.z = -angle + Math.PI / 2;
        fp.mesh.material.opacity = 0.35;
        fp.mesh.visible = true;
        fp.life = 1.0;
        fp.active = true;
    }

    _spawnFootprintPair(x, z, angle) {
        this._spawnFootprint(x, z, angle, -1, -0.05);
        this._spawnFootprint(x, z, angle, 1, 0.05);
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
        const shadowMat = new THREE.MeshBasicMaterial({
            color: 0x000000, transparent: true, opacity: 0.15
        });
        this.shadow = new THREE.Mesh(new THREE.CircleGeometry(0.52, 20), shadowMat);
        this.shadow.rotation.x = -Math.PI / 2;
        this.shadow.position.y = 0.02;
        this.group.add(this.shadow);

        this.modelRoot = new THREE.Group();
        this.modelRoot.position.y = 0;
        this.group.add(this.modelRoot);

        const loader = new THREE.GLTFLoader();
        this._loadNongDamGom(loader);
    }

    _loadNongDamGom(loader) {
        const mountCharacter = (gltf) => {
            this.modelRoot.clear();
            this.animActions = {};
            this.currentAction = null;
            this.mixer = null;
            this._groundAnchors = [];
            this._anchorGroundOffset = 0;

            const bear = gltf.scene;
            bear.position.set(0, 0, 0);
            bear.scale.setScalar(1);
            bear.traverse((obj) => {
                if (obj.isMesh) {
                    obj.castShadow = true;
                    obj.receiveShadow = true;
                }
            });

            const baseBox = new THREE.Box3().setFromObject(bear);
            const baseSize = new THREE.Vector3();
            baseBox.getSize(baseSize);

            const targetHeight = 1.3;
            const fittedScale = baseSize.y > 0 ? targetHeight / baseSize.y : 0.55;
            bear.scale.setScalar(fittedScale);

            const fittedBox = new THREE.Box3().setFromObject(bear);
            const fittedCenter = new THREE.Vector3();
            fittedBox.getCenter(fittedCenter);
            bear.position.x -= fittedCenter.x;
            bear.position.z -= fittedCenter.z;
            bear.position.y = -fittedBox.min.y;

            this.modelRoot.add(bear);
            this.modelRoot.position.y = 0;
            this._groundAnchors = this._findGroundAnchors(bear);
            this._captureGroundReference();
            this._groundModelToFloor();
            this._setupAnimations(gltf.animations);
        };

        const loadFromUrl = () => {
            loader.load(
                'assets/nong_dam_gom.glb',
                (gltf) => mountCharacter(gltf),
                undefined,
                (err) => {
                    console.error('GLB load error:', err);
                    this._buildFallbackCharacter();
                }
            );
        };

        if (!window.NONG_DAM_GOM_GLB_BASE64) {
            loadFromUrl();
            return;
        }

        try {
            const arrayBuffer = this._decodeBase64ToArrayBuffer(window.NONG_DAM_GOM_GLB_BASE64);
            loader.parse(
                arrayBuffer,
                window.location.href,
                (gltf) => mountCharacter(gltf),
                (err) => {
                    console.error('Embedded GLB parse error:', err);
                    loadFromUrl();
                }
            );
        } catch (err) {
            console.error('Embedded GLB decode error:', err);
            loadFromUrl();
        }
    }

    _buildFallbackCharacter() {
        this.modelRoot.clear();
        this.animActions = {};
        this.currentAction = null;
        this.mixer = null;
        this._groundAnchors = [];
        this._anchorGroundOffset = 0;

        const bodyMat = new THREE.MeshStandardMaterial({
            color: 0xf4f0e4, roughness: 0.55, metalness: 0.02
        });
        const bellyMat = new THREE.MeshStandardMaterial({
            color: 0xfffaf1, roughness: 0.5, metalness: 0.01
        });
        const earMat = new THREE.MeshStandardMaterial({
            color: 0xd9b98b, roughness: 0.6, metalness: 0.0
        });

        const body = new THREE.Mesh(new THREE.SphereGeometry(0.34, 18, 16), bodyMat);
        body.position.y = 0.72;
        this.modelRoot.add(body);

        const belly = new THREE.Mesh(new THREE.SphereGeometry(0.2, 16, 12), bellyMat);
        belly.position.set(0, 0.67, 0.19);
        belly.scale.set(1, 1.1, 0.7);
        this.modelRoot.add(belly);

        const head = new THREE.Mesh(new THREE.SphereGeometry(0.28, 18, 16), bodyMat);
        head.position.set(0, 1.12, 0.02);
        this.modelRoot.add(head);

        [-0.17, 0.17].forEach((x) => {
            const ear = new THREE.Mesh(new THREE.SphereGeometry(0.09, 12, 10), earMat);
            ear.position.set(x, 1.33, -0.03);
            this.modelRoot.add(ear);
        });

        [-0.09, 0.09].forEach((x) => {
            const eye = new THREE.Mesh(
                new THREE.SphereGeometry(0.022, 10, 10),
                new THREE.MeshBasicMaterial({ color: 0x111111 })
            );
            eye.position.set(x, 1.12, 0.24);
            this.modelRoot.add(eye);
        });

        const nose = new THREE.Mesh(
            new THREE.SphereGeometry(0.03, 10, 10),
            new THREE.MeshBasicMaterial({ color: 0x5c4632 })
        );
        nose.position.set(0, 1.02, 0.27);
        this.modelRoot.add(nose);

        this.modelRoot.scale.setScalar(1.28);
        this.modelRoot.position.y = 0;
    }

    _setupAnimations(animations) {
        if (!animations || !animations.length) return;
        this.mixer = new THREE.AnimationMixer(this.modelRoot);
        animations.forEach((clip) => {
            const key = clip.name.toLowerCase();
            const normalizedClip = this._normalizeAnimationClip(clip);
            this.animActions[key] = this.mixer.clipAction(normalizedClip);
        });
        this._playAnimationByHint('idle');
    }

    _findAnimationKey(hint) {
        const keys = Object.keys(this.animActions);
        return keys.find((key) => key.includes(hint)) || keys[0] || null;
    }

    _decodeBase64ToArrayBuffer(base64) {
        const binary = atob(base64);
        const bytes = new Uint8Array(binary.length);
        for (let i = 0; i < binary.length; i++) {
            bytes[i] = binary.charCodeAt(i);
        }
        return bytes.buffer;
    }

    _normalizeAnimationClip(clip) {
        const normalized = clip.clone();
        normalized.tracks.forEach((track) => {
            if (!/position$/i.test(track.name)) return;
            if (!/(hips|armature)/i.test(track.name)) return;
            if (!track.values || track.values.length < 3) return;

            const baseX = track.values[0];
            const baseY = track.values[1];
            const baseZ = track.values[2];
            for (let i = 0; i < track.values.length; i += 3) {
                track.values[i] = baseX;
                track.values[i + 1] = baseY;
                track.values[i + 2] = baseZ;
            }
        });
        return normalized;
    }

    _findGroundAnchors(root) {
        const names = ['LeftFoot_end', 'RightFoot_end', 'LeftFoot', 'RightFoot'];
        return names
            .map((name) => root.getObjectByName(name))
            .filter(Boolean);
    }

    _getAnchorMinY() {
        if (!this._groundAnchors || this._groundAnchors.length === 0) return null;

        let minY = Infinity;
        this._groundAnchors.forEach((anchor) => {
            anchor.getWorldPosition(this._groundProbe);
            minY = Math.min(minY, this._groundProbe.y);
        });

        return Number.isFinite(minY) ? minY : null;
    }

    _captureGroundReference() {
        if (!this.modelRoot || this.modelRoot.children.length === 0) return;

        this.group.updateMatrixWorld(true);
        this.modelRoot.updateMatrixWorld(true);

        const anchorMinY = this._getAnchorMinY();
        if (anchorMinY == null) {
            this._anchorGroundOffset = 0;
            return;
        }

        const box = new THREE.Box3().setFromObject(this.modelRoot);
        if (!Number.isFinite(box.min.y)) {
            this._anchorGroundOffset = 0;
            return;
        }

        this._anchorGroundOffset = box.min.y - anchorMinY;
    }

    _groundModelToFloor() {
        if (!this.modelRoot || this.modelRoot.children.length === 0) return;

        this.group.updateMatrixWorld(true);
        this.modelRoot.updateMatrixWorld(true);

        const desiredFloorY = this.group.position.y;
        let currentFloorY = null;

        const anchorMinY = this._getAnchorMinY();
        if (anchorMinY != null) {
            currentFloorY = anchorMinY + this._anchorGroundOffset;
        } else {
            const box = new THREE.Box3().setFromObject(this.modelRoot);
            if (!Number.isFinite(box.min.y) || !Number.isFinite(box.max.y)) return;
            currentFloorY = box.min.y;
        }

        const delta = currentFloorY - desiredFloorY;
        if (Math.abs(delta) < 0.0001) return;

        this.modelRoot.position.y -= delta;
    }

    _playAnimationByHint(hint) {
        const key = this._findAnimationKey(hint);
        if (!key) return;
        if (this.currentAction === key) return;

        const next = this.animActions[key];
        if (!next) return;
        if (this.currentAction && this.animActions[this.currentAction]) {
            this.animActions[this.currentAction].fadeOut(0.18);
        }
        next.reset();
        next.fadeIn(0.18);
        next.play();
        this.currentAction = key;
    }

    _bindInput() {
        // 키보드 (보조)
        window.addEventListener('keydown', (e) => {
            if (this._isMovementKey(e.code)) {
                e.preventDefault();
            }
            this.keys[e.code] = true;
        });
        window.addEventListener('keyup', (e) => {
            if (this._isMovementKey(e.code)) {
                e.preventDefault();
            }
            this.keys[e.code] = false;
        });
        window.addEventListener('blur', () => this._clearMovementInput());
        document.addEventListener('visibilitychange', () => {
            if (document.hidden) this._clearMovementInput();
        });

        // 조이스틱
        this._setupJoystick();
    }

    // 클릭 이동 활성화 (renderer 요소에 바인딩)
    enableClickMove(rendererDom) {
        rendererDom.style.touchAction = 'none';
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
        const { position, lookAt } = this._getCameraTargets();
        this.camera.position.copy(position);
        this.camera.lookAt(lookAt);
    }

    update(dt, time) {
        if (!this.isActive || !this.camera) return;
        this.baseY = this.group.position.y;

        let desiredMoveDir = null;
        let desiredSpeed = 0;

        // --- 1. 클릭 이동 ---
        if (this.isMoving && this.targetPos) {
            const dir = new THREE.Vector3().subVectors(this.targetPos, this.group.position);
            dir.y = 0;
            const dist = dir.length();

            if (dist > 0.08) {
                dir.normalize();
                desiredMoveDir = dir;
                desiredSpeed = this.moveSpeed * Math.min(1, Math.max(0.12, dist / 1.4));
                if (dist < 0.45) {
                    desiredSpeed *= dist / 0.45;
                }
            } else {
                // 도착
                this.isMoving = false;
                this.targetPos = null;
                this.clickMarker.visible = false;
                this.velocity.multiplyScalar(0.3);
            }
        }

        // --- 2. 키보드/조이스틱 이동 (보조) ---
        let inputX = 0;
        let inputForward = 0;
        if (this.keys['KeyA'] || this.keys['ArrowLeft']) inputX -= 1;
        if (this.keys['KeyD'] || this.keys['ArrowRight']) inputX += 1;
        if (this.keys['KeyW'] || this.keys['ArrowUp']) inputForward += 1;
        if (this.keys['KeyS'] || this.keys['ArrowDown']) inputForward -= 1;
        if (Math.abs(this.joystickInput.x) > 0.15) inputX = this.joystickInput.x;
        if (Math.abs(this.joystickInput.y) > 0.15) inputForward = -this.joystickInput.y;

        if (inputX !== 0 || inputForward !== 0) {
            // 키보드 입력 시 클릭 이동 취소
            this.isMoving = false;
            this.targetPos = null;
            this.clickMarker.visible = false;

            desiredMoveDir = this._getMoveDirectionFromInput(inputX, inputForward);
            desiredSpeed = this.moveSpeed;
        }

        const desiredVelocity = desiredMoveDir
            ? desiredMoveDir.clone().multiplyScalar(desiredSpeed)
            : new THREE.Vector3();
        const velocityLerp = 1 - Math.exp(-(desiredMoveDir ? this.moveAcceleration : this.moveDeceleration) * dt);
        this.velocity.lerp(desiredVelocity, velocityLerp);
        this.velocity.y = 0; // Y축 이동 방지
        if (!desiredMoveDir && this.velocity.lengthSq() < this.minMoveSpeed * this.minMoveSpeed) {
            this.velocity.set(0, 0, 0);
        }

        this.group.position.addScaledVector(this.velocity, dt);
        this.group.position.y = 0; // 항상 바닥에 고정

        const planarSpeed = Math.hypot(this.velocity.x, this.velocity.z);
        const isWalking = planarSpeed > 0.18;

        if (isWalking) {
            const targetAngle = Math.atan2(this.velocity.x, this.velocity.z);
            let diff = targetAngle - this.group.rotation.y;
            while (diff > Math.PI) diff -= Math.PI * 2;
            while (diff < -Math.PI) diff += Math.PI * 2;
            const rotationLerp = 1 - Math.exp(-this.turnResponsiveness * dt);
            this.group.rotation.y += diff * rotationLerp;
        }

        // 경계
        const clampedX = Math.max(-18, Math.min(18, this.group.position.x));
        const clampedZ = Math.max(-18, Math.min(18, this.group.position.z));
        if (clampedX !== this.group.position.x) this.velocity.x = 0;
        if (clampedZ !== this.group.position.z) this.velocity.z = 0;
        this.group.position.x = clampedX;
        this.group.position.z = clampedZ;

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
                    this.velocity.set(0, 0, 0);

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
            this.walkCycle += dt * 8;
            this.group.position.y = 0;
            if (this.modelRoot) {
                this.modelRoot.rotation.z = Math.sin(this.walkCycle) * 0.04;
            }
            this._playAnimationByHint('walk');
        } else {
            this.group.position.y = 0;
            if (this.modelRoot) {
                this.modelRoot.rotation.z *= 0.82;
            }
            this._playAnimationByHint('idle');
        }

        // 발자국
        if (isWalking) {
            const distFromLast = this.group.position.distanceTo(this.lastFootprintPos);
            if (distFromLast > 0.6) {
                const angle = this.group.rotation.y;
                this._spawnFootprintPair(
                    this.group.position.x, this.group.position.z,
                    angle
                );
                this.lastFootprintPos.copy(this.group.position);
            }
        }
        this._updateFootprints(dt);

        if (this.mixer) {
            this.mixer.update(dt);
        }

        this._groundModelToFloor();

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
        const { position, lookAt } = this._getCameraTargets();

        this.camera.position.x += (position.x - this.camera.position.x) * this.cameraLerp;
        this.camera.position.y += (position.y - this.camera.position.y) * this.cameraLerp;
        this.camera.position.z += (position.z - this.camera.position.z) * this.cameraLerp;
        this.camera.lookAt(lookAt);
    }

    getPosition() {
        return this.group.position;
    }

    _getCameraTargets() {
        const p = this.group.position;
        const anchor = new THREE.Vector3(p.x, 0, p.z);
        const forward = new THREE.Vector3(
            Math.sin(this.group.rotation.y),
            0,
            Math.cos(this.group.rotation.y)
        ).normalize();
        const side = new THREE.Vector3(forward.z, 0, -forward.x);

        const position = anchor.clone()
            .addScaledVector(forward, -this.cameraDistance)
            .addScaledVector(side, this.cameraSideOffset);
        position.y = this.cameraHeight;

        const lookAt = anchor.clone()
            .addScaledVector(forward, this.cameraLookAhead)
            .addScaledVector(side, this.cameraSideOffset * 0.2);
        lookAt.y = this.cameraLookHeight;

        return { position, lookAt };
    }

    _isMovementKey(code) {
        return code === 'KeyW' ||
            code === 'KeyA' ||
            code === 'KeyS' ||
            code === 'KeyD' ||
            code === 'ArrowUp' ||
            code === 'ArrowDown' ||
            code === 'ArrowLeft' ||
            code === 'ArrowRight' ||
            code === 'Space';
    }

    _clearMovementInput() {
        this.keys = {};
        this.joystickInput.x = 0;
        this.joystickInput.y = 0;
        const stick = document.querySelector('.joystick-stick');
        if (stick) stick.style.transform = '';
    }

    _getMoveDirectionFromInput(inputX, inputForward) {
        const cameraForward = new THREE.Vector3();
        this.camera.getWorldDirection(cameraForward);
        cameraForward.y = 0;

        if (cameraForward.lengthSq() < 1e-6) {
            cameraForward.set(0, 0, -1);
        } else {
            cameraForward.normalize();
        }

        const cameraRight = new THREE.Vector3(cameraForward.z, 0, -cameraForward.x).normalize();
        const moveDir = new THREE.Vector3()
            .addScaledVector(cameraRight, inputX)
            .addScaledVector(cameraForward, inputForward);

        if (moveDir.lengthSq() < 1e-6) {
            return cameraForward.clone();
        }

        return moveDir.normalize();
    }
}
