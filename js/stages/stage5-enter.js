// ===== Stage 5: 안으로 슈우웅 빨려들어감 → 바로 테마파크 =====
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
        whiteout.style.background = '#000000';
        whiteout.classList.remove('hidden');
        whiteout.style.opacity = '0';

        // 슈우웅 소리
        this._playWhooshSound();

        // 카메라가 문 안으로 빨려들어감 + 동시에 블랙아웃
        await new Promise(resolve => {
            const tl = gsap.timeline({ onComplete: resolve });

            tl.to(camera.position, {
                duration: 1.5,
                x: doorCenter.x,
                y: doorCenter.y,
                z: doorCenter.z - 12,
                ease: 'power3.in',
                onUpdate: () => camera.lookAt(doorCenter.x, doorCenter.y, doorCenter.z - 30)
            })
            .to(camera, {
                duration: 1.5,
                fov: 100,
                ease: 'power2.in',
                onUpdate: () => camera.updateProjectionMatrix()
            }, '<')
            // 블랙아웃
            .to(whiteout, {
                duration: 0.8,
                opacity: 1,
                ease: 'power2.in'
            }, '-=0.8');
        });

        // 바로 테마파크로
        await Utils.delay(200);

        // 밝아지면서 전환
        whiteout.style.background = '#ffffff';
        await new Promise(resolve => {
            gsap.to(whiteout, {
                duration: 1.0,
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

    _playWhooshSound() {
        try {
            const ac = new (window.AudioContext || window.webkitAudioContext)();
            const dur = 1.5, sr = ac.sampleRate;
            const buf = ac.createBuffer(1, sr * dur, sr);
            const d = buf.getChannelData(0);
            for (let i = 0; i < d.length; i++) {
                const t = i / sr;
                const sweep = Math.sin(2 * Math.PI * (200 + t * 400) * t) * 0.25;
                const wind = (Math.random() - 0.5) * 0.12 * (t / dur);
                const env = Math.min(t * 3, 1) * Math.pow(Math.max(0, 1 - t / dur), 0.5);
                d[i] = (sweep + wind) * env;
            }
            const s = ac.createBufferSource(); s.buffer = buf; s.connect(ac.destination); s.start();
        } catch (e) {}
    }
}
