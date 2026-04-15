// ===== Stage 3: 지이잉 출력 → 팔랑팔랑 벽면에 착 =====
class Stage3Print {
    constructor(app) {
        this.app = app;
        this.scene = app.nemonicScene;
    }

    async start(drawingDataURL) {
        const camera = this.scene.camera;
        const device = this.scene.nemonicDevice;
        const devicePos = device.group.position;

        if (this.scene.controls) this.scene.controls.enabled = false;
        this.app._drawingDataURL = drawingDataURL;

        await this._moveCameraToDevice(camera, devicePos);

        device.blinkLED(true);
        Utils.show('print-overlay');
        this._playPrintSound();

        const texture = await this._createTexture(drawingDataURL);
        const memo = device.createPrintingMemo(texture);
        await this._animatePrinting(memo);

        device.blinkLED(false);
        Utils.hide('print-overlay');

        // 출력 직후 바로 팔랑팔랑 벽면으로
        await this._flyToWallAndStick(memo, camera, device);

        return memo;
    }

    _moveCameraToDevice(camera, target) {
        return new Promise(resolve => {
            gsap.to(camera.position, {
                duration: 1.5,
                x: 1.0, y: 1.5, z: target.z + 2.5,
                ease: 'power2.inOut',
                onUpdate: () => camera.lookAt(target.x, 0.6, target.z),
                onComplete: resolve
            });
        });
    }

    _playPrintSound() {
        try {
            const ac = new (window.AudioContext || window.webkitAudioContext)();
            const dur = 2.5, sr = ac.sampleRate;
            const buf = ac.createBuffer(1, sr * dur, sr);
            const d = buf.getChannelData(0);
            for (let i = 0; i < d.length; i++) {
                const t = i / sr;
                const motor = Math.sin(2 * Math.PI * 120 * t) * 0.15;
                const freq = 800 + Math.sin(t * 4) * 200;
                const thermal = Math.sin(2 * Math.PI * freq * t) * 0.08;
                const noise = (Math.random() - 0.5) * 0.04;
                const env = Math.min(t * 4, 1) * Math.min((dur - t) * 4, 1);
                d[i] = (motor + thermal + noise) * env;
            }
            const s = ac.createBufferSource(); s.buffer = buf; s.connect(ac.destination); s.start();
        } catch (e) {}
    }

    _createTexture(dataURL) {
        return new Promise(resolve => {
            const img = new Image();
            img.onload = () => {
                const tex = new THREE.Texture(img);
                tex.needsUpdate = true;
                resolve(tex);
            };
            img.src = dataURL;
        });
    }

    _animatePrinting(memo) {
        return new Promise(resolve => {
            const tl = gsap.timeline({ onComplete: resolve });
            // 클리핑으로 아래서 위로 뽑혀 올라옴
            tl.to(memo.position, { duration: 2.2, y: memo.position.y + 0.85, ease: 'none' })
              .to(memo.position, { duration: 0.04, x: '+=0.002', repeat: 50, yoyo: true, ease: 'none' }, 0);
        });
    }

    _flyToWallAndStick(memo, camera, device) {
        const devicePos = device.group.position;

        // 월드 좌표 얻기
        const worldPos = new THREE.Vector3();
        memo.getWorldPosition(worldPos);

        // 기기 그룹에서 제거 후 씬에 추가
        device.group.remove(memo);
        this.scene.scene.add(memo);
        memo.position.copy(worldPos);
        memo.rotation.set(-0.25, 0, 0);

        // 클리핑 해제 - 새 material로 교체 (확실하게)
        const oldTex = memo.material.map;
        memo.material.dispose();
        memo.material = new THREE.MeshStandardMaterial({
            map: oldTex,
            side: THREE.DoubleSide,
            roughness: 0.92,
            metalness: 0.0
        });

        // 기기 전면에 착 붙음
        const targetX = devicePos.x;
        const targetY = devicePos.y + 0.525;
        const targetZ = devicePos.z + 0.75;

        this.app._doorPos = { x: targetX, y: targetY, z: targetZ };

        return new Promise(resolve => {
            const tl = gsap.timeline({ onComplete: resolve });

            // 1단계: 위로 올라감 (기기 위로 벗어남) + 세워짐
            tl.to(memo.position, { duration: 0.5, y: devicePos.y + 2.0, z: devicePos.z + 0.5, ease: 'power2.out' })
              .to(memo.rotation, { duration: 0.5, x: 0, y: 0, z: 0, ease: 'power2.out' }, '<')
              // 2단계: 앞으로 내려오면서 기기 전면에 착 (호 경로)
              .to(memo.position, { duration: 0.7, x: targetX, y: targetY, z: targetZ, ease: 'power2.inOut' })
              // 팔랑팔랑
              .to(memo.rotation, { duration: 0.08, z: 0.06, repeat: 7, yoyo: true, ease: 'sine.inOut' }, '<')
              // 크기 맞춤
              .to(memo.scale, { duration: 0.7, x: 1.3, y: 1.1, ease: 'power2.inOut' }, '<')
              // 착!
              .to(memo.rotation, { duration: 0.1, z: 0, ease: 'power3.out' })
              .to(memo.scale, { duration: 0.06, x: 1.35, y: 1.15, ease: 'power2.out' })
              .to(memo.scale, { duration: 0.12, x: 1.3, y: 1.1, ease: 'elastic.out(1, 0.5)' });

            // 카메라 정면
            gsap.to(camera.position, {
                duration: 1.2, x: 0, y: targetY, z: devicePos.z + 3,
                ease: 'power2.inOut',
                onUpdate: () => camera.lookAt(targetX, targetY, targetZ)
            });

            // 착 소리
            setTimeout(() => {
                try {
                    const ac = new (window.AudioContext || window.webkitAudioContext)();
                    const b = ac.createBuffer(1, ac.sampleRate * 0.1, ac.sampleRate);
                    const dd = b.getChannelData(0);
                    for (let i = 0; i < dd.length; i++) { const t = i / ac.sampleRate; dd[i] = Math.sin(2*Math.PI*250*t)*Math.exp(-t*50)*0.4; }
                    const s = ac.createBufferSource(); s.buffer = b; s.connect(ac.destination); s.start();
                } catch(e){}
                Utils.vibrate([40, 15, 40]);
            }, 800);
        });
    }
}
