// ===== Stage 5: 소용돌이 속으로 빨려들어감 → 테마파크 =====
class Stage5Enter {
    constructor(app) {
        this.app = app;
        this.scene = app.nemonicScene;
    }

    async start(memo) {
        const camera = this.scene.camera;
        const dp = this.app._doorPos || { x: 0, y: 0.525, z: -4.25 };
        const doorCenter = new THREE.Vector3(dp.x, dp.y, dp.z);

        // 블랙아웃 오버레이 준비
        const whiteout = document.getElementById('whiteout');
        whiteout.style.background = '#ffffff';
        whiteout.classList.remove('hidden');
        whiteout.style.opacity = '0';

        // 슈우웅 소리
        this._playVortexSound();

        // 카메라가 소용돌이 속으로 빨려들어감
        await new Promise(resolve => {
            const tl = gsap.timeline({ onComplete: resolve });

            // 1단계: 카메라가 소용돌이 중심으로 빨려감 + 회전
            tl.to(camera.position, {
                duration: 2.0,
                x: doorCenter.x,
                y: doorCenter.y,
                z: doorCenter.z - 8,
                ease: 'power3.in',
                onUpdate: () => {
                    // 소용돌이 중심을 바라봄
                    camera.lookAt(doorCenter.x, doorCenter.y, doorCenter.z - 30);
                }
            })
            // FOV 넓어짐 (빨려드는 효과)
            .to(camera, {
                duration: 2.0,
                fov: 120,
                ease: 'power2.in',
                onUpdate: () => camera.updateProjectionMatrix()
            }, '<')
            // 카메라 살짝 회전 (소용돌이 느낌)
            .to(camera.rotation, {
                duration: 2.0,
                z: -0.5,
                ease: 'power2.in'
            }, '<')
            // 화이트아웃 (하늘색 소용돌이니까 밝게)
            .to(whiteout, {
                duration: 1.0,
                opacity: 1,
                ease: 'power2.in'
            }, '-=1.0');
        });

        // 테마파크로 전환
        await Utils.delay(300);

        // 소용돌이 애니메이션 정리
        if (this.app._stage4) {
            this.app._stage4.stopEffects();
        }

        // 밝아지면서 테마파크
        whiteout.style.background = '#ffffff';
        await new Promise(resolve => {
            gsap.to(whiteout, {
                duration: 1.2,
                opacity: 0,
                ease: 'power2.inOut',
                onComplete: () => {
                    Utils.hide('whiteout');
                    whiteout.style.background = '';
                    resolve();
                }
            });
        });
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
