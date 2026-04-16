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
        this._hideLoadingScreen();
        this._animate();
        this._setupSkipButton();
        this._runStages();
    }

    _setupSkipButton() {
        Utils.show('skip-btn');
        document.getElementById('skip-btn').addEventListener('click', () => {
            if (this.isThemeParkMode) return;
            // 먼저 기존 인트로 연출만 정리
            gsap.globalTimeline.clear();
            ['phone-overlay', 'start-btn-container', 'drawing-overlay',
             'print-overlay', 'attach-guide', 'vortex-transition', 'skip-btn'].forEach(id => Utils.hide(id));
            const whiteout = document.getElementById('whiteout');
            whiteout.classList.add('hidden');
            whiteout.style.opacity = '0';

            // 그 다음 테마파크 시작
            this._startThemePark();
        });
    }

    _hideLoadingScreen() {
        const loading = document.getElementById('loading-screen');
        if (!loading) return;
        loading.classList.add('hidden');
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
        this.character.group.position.set(0, 5.5, 12);
        this.nemonicScene.scene.add(this.character.group);
        this.character.activate(this.activeCamera);
        this.character.enableClickMove(this.nemonicScene.renderer.domElement);

        } catch(e) { console.error('THEMEPARK INIT ERROR:', e); }

        // 부스는 이제 이미지 팝업만 하므로 이동 충돌은 두지 않음
        this.character.collisionBoxes = [];

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

        this._playThemeParkArrival();
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

    _playThemeParkArrival() {
        const whiteout = document.getElementById('whiteout');
        const whiteoutText = whiteout.querySelector('.whiteout-text');
        whiteout.classList.remove('hidden');
        whiteout.style.background = '#000000';
        whiteout.style.opacity = '1';
        if (whiteoutText) {
            whiteoutText.textContent = 'Nemonic World';
            whiteoutText.style.opacity = '1';
            whiteoutText.style.transform = 'translateY(0)';
        }

        if (this.character) {
            this.character.isActive = false;
        }

        if (this.activeCamera) {
            this.activeCamera.position.set(0, 21, 17);
            this.activeCamera.lookAt(0, 4.5, 12);
        }

        gsap.timeline({
            onComplete: () => {
                if (this.character) {
                    this.character.isActive = true;
                }
                Utils.hide('whiteout');
                whiteout.style.background = '';
                if (whiteoutText) {
                    whiteoutText.style.opacity = '0';
                    whiteoutText.style.transform = 'translateY(14px)';
                }
            }
        })
            .to(whiteoutText, {
                duration: 0.28,
                opacity: 0,
                y: -10,
                ease: 'power2.in'
            }, 0.2)
            .to(whiteout, {
                duration: 0.55,
                opacity: 0,
                ease: 'power2.out'
            }, 0.45)
            .to(this.character.group.position, {
                duration: 0.9,
                y: 0,
                ease: 'bounce.out'
            }, 0.18)
            .to(this.activeCamera.position, {
                duration: 1.0,
                y: 15,
                z: 12,
                ease: 'power2.out',
                onUpdate: () => {
                    this.activeCamera.lookAt(
                        this.character.group.position.x,
                        this.character.group.position.y + 1.2,
                        this.character.group.position.z
                    );
                }
            }, 0.18);
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
