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
        const enterPoint = doorCenter.clone().add(travelDir.clone().multiplyScalar(-0.58));
        const portalPoint = doorCenter.clone().add(travelDir.clone().multiplyScalar(-0.16));

        const whiteout = document.getElementById('whiteout');
        const whiteoutText = whiteout.querySelector('.whiteout-text');
        whiteout.style.background = '#000000';
        whiteout.classList.remove('hidden');
        whiteout.style.opacity = '0';
        if (whiteoutText) {
            whiteoutText.textContent = 'Nemonic World';
            whiteoutText.style.opacity = '0';
            whiteoutText.style.transform = 'translateY(14px)';
        }

        // 슈우웅 소리
        this._playVortexSound();

        // 문 안으로 숙 빨려 들어간 뒤, 검정 전환 + 월드 타이틀 카드
        await new Promise(resolve => {
            const tl = gsap.timeline({ onComplete: resolve });
            tl.to(camera.position, {
                duration: 0.44,
                x: enterPoint.x,
                y: enterPoint.y,
                z: enterPoint.z,
                ease: 'power2.in',
                onUpdate: () => {
                    camera.lookAt(doorCenter.x, doorCenter.y, doorCenter.z);
                }
            }, 0)
            .to(camera.position, {
                duration: 0.28,
                x: portalPoint.x,
                y: portalPoint.y,
                z: portalPoint.z,
                ease: 'power3.inOut',
                onUpdate: () => {
                    camera.lookAt(doorCenter.x, doorCenter.y, doorCenter.z);
                }
            }, 0.44)
            .to(camera, {
                duration: 0.72,
                fov: 16,
                ease: 'power3.in',
                onUpdate: () => camera.updateProjectionMatrix()
            }, 0)
            .to(whiteout, {
                duration: 0.18,
                opacity: 1,
                ease: 'power2.inOut'
            }, 0.58)
            .to(whiteoutText, {
                duration: 0.3,
                opacity: 1,
                y: 0,
                ease: 'power2.out'
            }, 0.76);
        });

        await Utils.delay(520);

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
