// ===== 메인 앱 (게임 루프 & 스테이지 관리) =====
class NemonicTourApp {
    constructor() {
        this.nemonicScene = null;
        this.character = null;
        this.themePark = null;
        this.particleSystems = [];
        this.clock = new THREE.Clock();
        this.currentStage = 0;
        this.isThemeParkMode = false;

        this._init();
    }

    async _init() {
        this.nemonicScene = new NemonicScene();
        await this._fakeLoading();
        this._animate();
        this._setupSkipButton();
        this._runStages();
    }

    _setupSkipButton() {
        Utils.show('skip-btn');
        document.getElementById('skip-btn').addEventListener('click', () => {
            if (this.isThemeParkMode) return;
            // 먼저 테마파크 시작 (isThemeParkMode = true로 설정됨)
            this._startThemePark();
            // 그 다음 UI 정리 & GSAP kill
            ['phone-overlay', 'start-btn-container', 'drawing-overlay',
             'print-overlay', 'attach-guide', 'whiteout', 'skip-btn'].forEach(id => Utils.hide(id));
            gsap.globalTimeline.clear();
        });
    }

    async _fakeLoading() {
        const bar = document.querySelector('.loading-bar');
        for (let i = 0; i <= 100; i += 5) {
            bar.style.width = i + '%';
            await Utils.delay(50);
        }
        await Utils.delay(300);
        document.getElementById('loading-screen').classList.add('fade-out');
        await Utils.delay(800);
        document.getElementById('loading-screen').classList.add('hidden');
    }

    async _runStages() {
        try {
            // Stage 1
            this.currentStage = 1;
            await new Stage1Intro(this).start();
            if (this.isThemeParkMode) return;

            // Stage 2
            this.currentStage = 2;
            const stage2 = new Stage2Drawing(this);
            const drawingData = await stage2.start();
            if (this.isThemeParkMode) return;

            // Stage 3
            this.currentStage = 3;
            const memo = await new Stage3Print(this).start(drawingData);
            if (this.isThemeParkMode) return;

            // Stage 4
            this.currentStage = 4;
            await new Stage4Attach(this).start(memo);
            if (this.isThemeParkMode) return;

            // Stage 5
            this.currentStage = 5;
            await new Stage5Enter(this).start(memo);
            if (this.isThemeParkMode) return;

            // Stage 6
            this.currentStage = 6;
            this._startThemePark();
        } catch (e) {
            // 스킵으로 인한 에러 무시
            if (!this.isThemeParkMode) {
                console.error('Stage error:', e);
            }
        }
    }

    _startThemePark() {
        if (this.isThemeParkMode) return;
        this.isThemeParkMode = true;
        this.currentStage = 6;
        Utils.hide('skip-btn');

        try {
        // OrbitControls 비활성화
        if (this.nemonicScene.controls) {
            this.nemonicScene.controls.enabled = false;
            this.nemonicScene.controls.dispose();
        }

        // 기존 인트로 씬 정리
        this._clearIntroScene();

        // 렌더러 톤매핑 조정 (테마파크용 — 두두타 스타일)
        this.nemonicScene.renderer.toneMapping = THREE.LinearToneMapping;
        this.nemonicScene.renderer.toneMappingExposure = 1.0;

        // 테마파크 생성
        this.themePark = new ThemePark(
            this.nemonicScene.scene,
            this.nemonicScene.camera
        );

        // 직교 카메라로 교체 (춘식이 스타일)
        this.activeCamera = this.themePark.getCamera();

        // 캐릭터 생성
        this.character = new CharacterController(this.nemonicScene.scene);
        this.character.group.position.set(0, 0, 12);
        this.nemonicScene.scene.add(this.character.group);
        this.character.activate(this.activeCamera);
        this.character.enableClickMove(this.nemonicScene.renderer.domElement);

        } catch(e) { console.error('THEMEPARK INIT ERROR:', e); }

        // 충돌 박스 전달
        this.character.collisionBoxes = this.themePark.booths.map(b => {
            const p = b.data.position;
            const hs = 1.9; // 방 크기의 절반
            return { minX: p.x - hs, maxX: p.x + hs, minZ: p.z - hs, maxZ: p.z + hs };
        });

        // UI
        Utils.show('themepark-ui');
        if ('ontouchstart' in window) {
            document.getElementById('mobile-joystick').classList.remove('hidden');
        }

        // 부스 인터랙션
        window.addEventListener('keydown', (e) => {
            if (e.code === 'KeyE' && this.themePark) this.themePark.interact();
            if (e.code === 'Escape' && this.themePark) this.themePark.closeBooth();
        });
    }

    _clearIntroScene() {
        const scene = this.nemonicScene.scene;
        // 인트로 씬 오브젝트 + 조명 전부 제거 (테마파크가 자체 조명 사용)
        const toRemove = [];
        scene.children.forEach(obj => {
            toRemove.push(obj);
        });
        toRemove.forEach(obj => scene.remove(obj));
    }

    addParticleSystem(ps) {
        this.particleSystems.push(ps);
    }

    _animate() {
        requestAnimationFrame(() => this._animate());
        const dt = this.clock.getDelta();
        const time = this.clock.getElapsedTime();

        if (!this.isThemeParkMode && this.nemonicScene) {
            this.nemonicScene.animateStars(time);
        }

        this.particleSystems = this.particleSystems.filter(ps =>
            Utils.updateParticles(ps, dt)
        );

        if (this.isThemeParkMode && this.character) {
            this.character.update(dt, time);
            if (this.themePark) {
                this.themePark.update(this.character.getPosition());
                this.themePark.renderMinimap(this.character.getPosition());
            }
        }

        // 활성 카메라로 렌더
        if (this.activeCamera) {
            this.nemonicScene.renderer.render(this.nemonicScene.scene, this.activeCamera);
        } else {
            this.nemonicScene.render();
        }
    }
}

window.addEventListener('DOMContentLoaded', () => {
    new NemonicTourApp();
});
