// ===== Stage 5: 소용돌이 속으로 빨려들어감 → 테마파크 =====
class Stage5Enter {
    constructor(app) {
        this.app = app;
        this.scene = app.nemonicScene;
    }

    async start(memo) {
        const camera = this.scene.camera;
        const portal = this.app._portalTarget || this.app._doorPos || { x: 0, y: 0.525, z: -4.25 };
        const doorCenter = new THREE.Vector3(portal.x, portal.y, portal.z);
        const startPos = camera.position.clone();
        const travelDir = new THREE.Vector3().subVectors(doorCenter, startPos).normalize();
        const enterPoint = doorCenter.clone().add(travelDir.clone().multiplyScalar(0.28));
        const insidePoint = doorCenter.clone().add(travelDir.clone().multiplyScalar(1.15));

        const whiteout = document.getElementById('whiteout');
        whiteout.style.background = '#ffffff';
        whiteout.classList.remove('hidden');
        whiteout.style.opacity = '0';

        // 슈우웅 소리
        this._playVortexSound();

        // 문 안 소용돌이로 실제로 빨려 들어가며 점점 커 보이게 한다.
        await new Promise(resolve => {
            const tl = gsap.timeline({ onComplete: resolve });
            tl.to(camera.position, {
                duration: 0.48,
                x: enterPoint.x,
                y: enterPoint.y,
                z: enterPoint.z,
                ease: 'power2.in',
                onUpdate: () => {
                    camera.lookAt(doorCenter.x, doorCenter.y, doorCenter.z);
                }
            }, 0)
            .to(camera.position, {
                duration: 0.42,
                x: insidePoint.x,
                y: insidePoint.y,
                z: insidePoint.z,
                ease: 'power4.in',
                onUpdate: () => {
                    const lookAhead = insidePoint.clone().add(travelDir.clone().multiplyScalar(1.8));
                    camera.lookAt(lookAhead.x, lookAhead.y, lookAhead.z);
                }
            }, 0.48)
            .to(camera, {
                duration: 0.9,
                fov: 28,
                ease: 'power3.in',
                onUpdate: () => camera.updateProjectionMatrix()
            }, 0)
            .to(whiteout, {
                duration: 0.12,
                opacity: 1,
                ease: 'power2.inOut'
            }, 0.82);
        });

        // 테마파크로 전환
        await Utils.delay(120);

        // 소용돌이 애니메이션 정리
        if (this.app._stage4) {
            this.app._stage4.stopEffects();
        }
    }

    _playVortexSound() {
        try {
            const ac = new (window.AudioContext || window.webkitAudioContext)();
            const dur = 2.5, sr = ac.sampleRate;
            const buf = ac.createBuffer(1, sr * dur, sr);
            const d = buf.getChannelData(0);
            for (let i = 0; i < d.length; i++) {
                const t = i / sr;
                // 상승하는 주파수 (빨려드는 느낌)
                const sweep = Math.sin(2 * Math.PI * (200 + t * t * 300) * t) * 0.2;
                // 바람 소리
                const wind = (Math.random() - 0.5) * 0.15 * Math.pow(t / dur, 1.5);
                // 소용돌이 펄스
                const pulse = Math.sin(2 * Math.PI * 3 * t) * 0.05;
                const env = Math.min(t * 2, 1) * Math.pow(Math.max(0, 1 - t / dur), 0.3);
                d[i] = (sweep + wind + pulse) * env;
            }
            const s = ac.createBufferSource(); s.buffer = buf; s.connect(ac.destination); s.start();
        } catch (e) {}
    }
}
