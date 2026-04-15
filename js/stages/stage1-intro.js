// ===== Stage 1: 인트로 =====
class Stage1Intro {
    constructor(app) {
        this.app = app;
        this.scene = app.nemonicScene;
    }

    async start() {
        const camera = this.scene.camera;
        const devicePos = this.scene.nemonicDevice.group.position;

        // 카메라 시작 위치 (멀리서)
        camera.position.set(0, 2.5, 12);
        camera.lookAt(devicePos.x, 0.8, devicePos.z);

        // 기기 앞까지 쭉 다가감
        await this._cinematicIntro(camera, devicePos);
    }

    async _cinematicIntro(camera, target) {
        const controls = this.scene.controls;

        return new Promise(resolve => {
            const tl = gsap.timeline({
                onUpdate: () => {
                    // 인트로 중 controls target도 같이 이동
                    controls.target.set(target.x, 0.7, target.z);
                    controls.update();
                },
                onComplete: () => {
                    // 인트로 끝나면 OrbitControls 활성화
                    controls.target.set(target.x, 0.7, target.z);
                    controls.enabled = true;
                    resolve();
                }
            });

            // 쭉 접근
            tl.to(camera.position, {
                duration: 2.5,
                x: 0,
                y: 1.5,
                z: 1,
                ease: 'power2.inOut'
            });
        });
    }

    async _showPhoneGuide() {
        Utils.show('phone-overlay');
        const phoneFrame = document.querySelector('.phone-frame');
        const phoneText = document.getElementById('phone-text');

        // 폰 올라오는 애니메이션
        gsap.to(phoneFrame, {
            duration: 0.6,
            y: 0, opacity: 1,
            ease: 'back.out(1.7)'
        });

        await Utils.delay(400);

        // 안내 텍스트 순차 표시
        const messages = [
            '안녕하세요 사용자님.\n네모닉투어에 오신것을 환영합니다.',
            '네모닉은 내가 그리고, 적는\n모든 상상을 출력할 수 있는 기기입니다.',
            '나만의 문을 그려서\n네모닉 세상에 들어가 볼까요?'
        ];

        await Utils.showTextsSequential(phoneText, messages, 35, 1200);
        await Utils.delay(500);

        // 폰 사라짐
        gsap.to(phoneFrame, {
            duration: 0.5,
            y: 100, opacity: 0,
            ease: 'power2.in',
            onComplete: () => Utils.hide('phone-overlay')
        });
    }

    async _showStartButton() {
        Utils.show('start-btn-container');

        return new Promise(resolve => {
            document.getElementById('start-btn').addEventListener('click', () => {
                Utils.hide('start-btn-container');
                resolve();
            }, { once: true });
        });
    }
}
