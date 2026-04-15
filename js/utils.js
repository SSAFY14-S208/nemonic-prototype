// ===== 유틸리티 함수 =====
const Utils = {
    // 타이핑 효과
    typeText(element, text, speed = 40) {
        return new Promise(resolve => {
            let i = 0;
            element.innerHTML = '<span class="cursor"></span>';
            const interval = setInterval(() => {
                if (i < text.length) {
                    element.innerHTML = text.substring(0, i + 1) + '<span class="cursor"></span>';
                    i++;
                } else {
                    clearInterval(interval);
                    setTimeout(() => {
                        element.innerHTML = text;
                        resolve();
                    }, 500);
                }
            }, speed);
        });
    },

    // 순차 텍스트 표시
    async showTextsSequential(element, texts, speed = 40, delayBetween = 1000) {
        for (const text of texts) {
            await this.typeText(element, text, speed);
            await this.delay(delayBetween);
        }
    },

    // 딜레이
    delay(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    },

    // DOM 요소 표시/숨기기
    show(id) {
        document.getElementById(id)?.classList.remove('hidden');
    },
    hide(id) {
        document.getElementById(id)?.classList.add('hidden');
    },

    // 프린터 소음 생성 (Web Audio API)
    createPrinterSound(audioCtx) {
        const duration = 2.5;
        const sampleRate = audioCtx.sampleRate;
        const buffer = audioCtx.createBuffer(1, sampleRate * duration, sampleRate);
        const data = buffer.getChannelData(0);

        for (let i = 0; i < data.length; i++) {
            const t = i / sampleRate;
            // 모터 소음 (저주파 험)
            const motor = Math.sin(2 * Math.PI * 60 * t) * 0.05;
            // 용지 마찰 (노이즈)
            const friction = (Math.random() - 0.5) * 0.03;
            // 간헐적 딸깍 소리
            const click = (Math.sin(2 * Math.PI * 8 * t) > 0.95) ? Math.random() * 0.1 : 0;
            // 엔벨로프
            const env = Math.min(t / 0.2, 1) * Math.min((duration - t) / 0.3, 1);
            data[i] = (motor + friction + click) * env;
        }
        return buffer;
    },

    // 점착 소리
    createStickSound(audioCtx) {
        const duration = 0.15;
        const sampleRate = audioCtx.sampleRate;
        const buffer = audioCtx.createBuffer(1, sampleRate * duration, sampleRate);
        const data = buffer.getChannelData(0);
        for (let i = 0; i < data.length; i++) {
            const t = i / sampleRate;
            const env = Math.exp(-t * 30);
            data[i] = (Math.random() - 0.5) * env * 0.5;
        }
        return buffer;
    },

    playBuffer(audioCtx, buffer) {
        const source = audioCtx.createBufferSource();
        source.buffer = buffer;
        source.connect(audioCtx.destination);
        source.start();
        return source;
    },

    // 햅틱 진동 (모바일)
    vibrate(pattern = [50]) {
        if (navigator.vibrate) navigator.vibrate(pattern);
    },

    // 파티클 이펙트 생성
    createParticles(scene, position, color = 0xffd54f, count = 20) {
        const geometry = new THREE.BufferGeometry();
        const positions = new Float32Array(count * 3);
        const velocities = [];

        for (let i = 0; i < count; i++) {
            positions[i * 3] = position.x;
            positions[i * 3 + 1] = position.y;
            positions[i * 3 + 2] = position.z;
            velocities.push(new THREE.Vector3(
                (Math.random() - 0.5) * 0.1,
                Math.random() * 0.08,
                (Math.random() - 0.5) * 0.1
            ));
        }
        geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));

        const material = new THREE.PointsMaterial({
            color, size: 0.05, transparent: true, opacity: 1
        });
        const points = new THREE.Points(geometry, material);
        scene.add(points);

        return { points, velocities, life: 1.0 };
    },

    updateParticles(particleSystem, dt) {
        if (!particleSystem || particleSystem.life <= 0) return false;
        const pos = particleSystem.points.geometry.attributes.position;
        for (let i = 0; i < particleSystem.velocities.length; i++) {
            pos.array[i * 3] += particleSystem.velocities[i].x;
            pos.array[i * 3 + 1] += particleSystem.velocities[i].y;
            pos.array[i * 3 + 2] += particleSystem.velocities[i].z;
            particleSystem.velocities[i].y -= 0.002; // gravity
        }
        pos.needsUpdate = true;
        particleSystem.life -= dt * 0.8;
        particleSystem.points.material.opacity = particleSystem.life;
        if (particleSystem.life <= 0) {
            particleSystem.points.parent?.remove(particleSystem.points);
        }
        return particleSystem.life > 0;
    }
};
