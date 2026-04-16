// ===== 네모닉 프린터 3D 모델 =====
// 순백 큐브, 상단 슬릿에서 용지가 뒤로 기울어지며 출력
class NemonicDevice {
    constructor() {
        this.group = new THREE.Group();
        this.ledLight = null;
        this.paperSlot = null;
        this.printedMemo = null;
        this.wallSurface = null;
        this._build();
    }

    _build() {
        const bodyW = 1.26, bodyD = 1.26, bodyH = 1.08;
        const bodyMat = new THREE.MeshStandardMaterial({
            color: 0xd8d2c4, roughness: 0.66, metalness: 0.02
        });
        const trimMat = new THREE.MeshStandardMaterial({
            color: 0xe0dad0, roughness: 0.68, metalness: 0.01
        });
        const baseMat = new THREE.MeshStandardMaterial({
            color: 0xcec6b8, roughness: 0.78, metalness: 0.0
        });

        // === 메인 바디 ===
        const bodyGeo = new THREE.BoxGeometry(bodyW, bodyH, bodyD);
        const body = new THREE.Mesh(bodyGeo, bodyMat.clone());
        body.position.y = bodyH / 2;
        body.castShadow = true;
        body.receiveShadow = true;
        this.group.add(body);

        // 하단 베이스로 실루엣만 살짝 분리
        const baseGeo = new THREE.BoxGeometry(bodyW * 1.01, 0.09, bodyD * 1.01);
        const base = new THREE.Mesh(baseGeo, baseMat);
        base.position.set(0, 0.045, 0);
        this.group.add(base);

        // 상단 미세한 테두리 (뚜껑 느낌)
        const lidGeo = new THREE.BoxGeometry(bodyW + 0.01, 0.03, bodyD + 0.01);
        const lid = new THREE.Mesh(lidGeo, trimMat);
        lid.position.y = bodyH;
        this.group.add(lid);

        // 실제 제품처럼 대각선 윗면 골
        const ribMat = new THREE.MeshStandardMaterial({
            color: 0xd4cdc0,
            roughness: 0.82,
            metalness: 0.0
        });
        const ribCount = 13;
        for (let i = 0; i < ribCount; i++) {
            const x = -bodyW * 0.34 + i * 0.06;
            const z = -0.03;
            if (x > 0.02 && x < bodyW * 0.3) continue;
            const rib = new THREE.Mesh(
                new THREE.BoxGeometry(0.028, 0.012, bodyD * 1.05),
                ribMat
            );
            rib.rotation.y = Math.PI / 4;
            rib.position.set(x, bodyH + 0.022, z);
            this.group.add(rib);
        }

        // 슬롯 아래 상판 그림자톤으로 윗면 날아감을 줄임
        const topPanelGeo = new THREE.PlaneGeometry(bodyW * 0.92, bodyD * 0.84);
        const topPanelMat = new THREE.MeshStandardMaterial({
            color: 0xd2cbbe,
            roughness: 0.74,
            metalness: 0.0,
            transparent: true,
            opacity: 0.28,
            side: THREE.DoubleSide
        });
        const topPanel = new THREE.Mesh(topPanelGeo, topPanelMat);
        topPanel.rotation.x = -Math.PI / 2;
        topPanel.position.set(0, bodyH + 0.016, 0.02);
        this.group.add(topPanel);

        // === 상단 용지 출력 슬릿 (앞쪽에 위치) ===
        const topY = bodyH + 0.015;
        const slitGeo = new THREE.BoxGeometry(bodyW * 0.34, 0.003, 0.018);
        const slitMat = new THREE.MeshStandardMaterial({ color: 0x7a7c7f, roughness: 0.48, metalness: 0.22 });
        this.paperSlot = new THREE.Mesh(slitGeo, slitMat);
        this.paperSlot.rotation.y = -0.38;
        this.paperSlot.position.set(bodyW * 0.08, topY, bodyD * 0.14);
        this.group.add(this.paperSlot);

        // LED 표시등 2개 (전면 오른쪽 하단)
        for (let i = 0; i < 2; i++) {
            const ledGeo = new THREE.CircleGeometry(0.012, 10);
            const ledMat = new THREE.MeshBasicMaterial({ color: 0x444444 });
            const led = new THREE.Mesh(ledGeo, ledMat);
            led.position.set(bodyW / 2 - 0.12 - i * 0.07, bodyH * 0.12, bodyD / 2 + 0.006);
            this.group.add(led);
            if (i === 0) this.ledMesh = led;
        }

        this.ledLight = new THREE.PointLight(0x00ff88, 0.1, 1);
        this.ledLight.position.set(bodyW / 2 - 0.15, bodyH * 0.12, bodyD / 2 + 0.1);
        this.group.add(this.ledLight);

        // 측면 로고 느낌 (작은 C 홈)
        const logoMat = new THREE.MeshStandardMaterial({
            color: 0xbcb4a6,
            roughness: 0.9,
            metalness: 0.0
        });
        const logoOuter = new THREE.Mesh(
            new THREE.TorusGeometry(0.08, 0.012, 10, 24, Math.PI * 1.45),
            logoMat
        );
        logoOuter.rotation.set(Math.PI / 2, 0, Math.PI * 0.22);
        logoOuter.position.set(-bodyW / 2 - 0.002, bodyH * 0.55, 0.04);
        this.group.add(logoOuter);

        // === 벽면 (메모 점착 타겟 - 보이지 않음) ===
        this.wallSurface = new THREE.Object3D();
        this.wallSurface.position.set(0, 1.5, -0.8);
        this.wallSurface.name = 'wall-surface';
        this.group.add(this.wallSurface);

        // 기기 높이 저장
        this._bodyH = bodyH;
        this._topY = topY;
    }

    blinkLED(on = true) {
        if (on) {
            this._ledInterval = setInterval(() => {
                const isOn = this.ledMesh.material.color.getHex() === 0x00ff88;
                this.ledMesh.material.color.setHex(isOn ? 0x004422 : 0x00ff88);
                this.ledLight.intensity = isOn ? 0.02 : 0.1;
            }, 300);
        } else {
            clearInterval(this._ledInterval);
            this.ledMesh.material.color.setHex(0x333333);
            this.ledLight.intensity = 0;
        }
    }

    // 메모지 출력 (클리핑으로 실제 뽑히는 효과)
    createPrintingMemo(texture) {
        texture.minFilter = THREE.LinearFilter;
        texture.magFilter = THREE.LinearFilter;
        texture.anisotropy = 4;

        const memoGeo = new THREE.PlaneGeometry(0.85, 0.85);

        // 클리핑 플레인: 기기 상단 아래를 잘라냄
        const topY = this._topY || 1.065;
        const deviceWorldY = this.group.position.y;
        const clipY = deviceWorldY + topY;
        this._clipPlane = new THREE.Plane(new THREE.Vector3(0, 1, 0), -clipY);

        const memoMat = new THREE.MeshStandardMaterial({
            map: texture,
            color: 0xe8e4d8,
            side: THREE.DoubleSide,
            roughness: 0.92,
            metalness: 0.0,
            clippingPlanes: [this._clipPlane]
        });

        this.printedMemo = new THREE.Mesh(memoGeo, memoMat);
        this.printedMemo.castShadow = true;

        // 처음엔 기기 내부에 숨겨진 상태 (종이가 아래에 있음)
        this.printedMemo.position.set(bodyW * 0.08, topY - 0.4, bodyD * 0.14);
        this.printedMemo.rotation.x = -0.55; // 실제 네모닉처럼 뒤로 기울어짐 (~30도)
        this.printedMemo.name = 'printed-memo';

        this.group.add(this.printedMemo);
        return this.printedMemo;
    }

    getPosition() {
        return this.group.position;
    }
}
