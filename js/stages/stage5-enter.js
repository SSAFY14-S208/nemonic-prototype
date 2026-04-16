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
        const vortexTransition = document.getElementById('vortex-transition');
        const vortexInner = vortexTransition.querySelector('.vortex-transition-inner');

        // 전환 오버레이 준비
        const whiteout = document.getElementById('whiteout');
        whiteout.style.background = '#ffffff';
        whiteout.classList.remove('hidden');
        whiteout.style.opacity = '0';
        vortexTransition.classList.remove('hidden');
        vortexTransition.style.opacity = '0';
        vortexInner.style.left = '50%';
        vortexInner.style.top = '50%';
        vortexInner.style.transform = 'translate(-50%, -50%) scale(0.12)';
        vortexInner.style.rotate = '0deg';

        // 슈우웅 소리
        this._playVortexSound();

        // 먼저 문 안쪽으로 빨려 들어가는 느낌을 만든 뒤,
        // 그 위치에서 소용돌이가 화면 전체를 덮게 한다.
        await new Promise(resolve => {
            const tl = gsap.timeline({ onComplete: resolve });
            tl.to(camera.position, {
                duration: 0.44,
                x: doorCenter.x * 0.55,
                y: doorCenter.y * 0.72,
                z: camera.position.z - 1.15,
                ease: 'power2.in',
                onUpdate: () => {
                    camera.lookAt(doorCenter.x, doorCenter.y, doorCenter.z);
                }
            }, 0)
            .to(camera, {
                duration: 0.44,
                fov: 56,
                ease: 'power2.in',
                onUpdate: () => camera.updateProjectionMatrix()
            }, 0)
            .add(() => {
                const projected = doorCenter.clone().project(camera);
                const startX = ((projected.x + 1) * 0.5) * window.innerWidth;
                const startY = ((1 - projected.y) * 0.5) * window.innerHeight;
                vortexInner.style.left = `${startX}px`;
                vortexInner.style.top = `${startY}px`;
                vortexInner.style.transform = 'translate(-50%, -50%) scale(0.26)';
            })
            .to(vortexTransition, {
                duration: 0.12,
                opacity: 1,
                ease: 'power1.out'
            })
            .to(vortexInner, {
                duration: 0.72,
                left: window.innerWidth * 0.5,
                top: window.innerHeight * 0.5,
                scale: 8.5,
                rotate: 260,
                ease: 'power4.in'
            }, '<')
            .to(whiteout, {
                duration: 0.18,
                opacity: 1,
                ease: 'power2.inOut'
            }, '-=0.08');
        });

        // 테마파크로 전환
        await Utils.delay(120);

        // 소용돌이 애니메이션 정리
        if (this.app._stage4) {
            this.app._stage4.stopEffects();
        }
        Utils.hide('vortex-transition');
        vortexInner.style.left = '50%';
        vortexInner.style.top = '50%';
        vortexInner.style.transform = 'translate(-50%, -50%) scale(0.2)';
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
