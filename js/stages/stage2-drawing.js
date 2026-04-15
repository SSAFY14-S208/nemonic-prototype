// ===== Stage 2: 캔버스 문 드로잉 =====
class Stage2Drawing {
    constructor(app) {
        this.app = app;
        this.canvas = null;
        this.ctx = null;
        this.isDrawing = false;
        this.color = '#333333';
        this.brushSize = 5;
        this.drawingData = null;
    }

    async start() {
        return new Promise(resolve => {
            this._initCanvas();
            this._bindEvents(resolve);
            Utils.show('drawing-overlay');

            // 등장 애니메이션
            gsap.from('.drawing-container', {
                duration: 0.5,
                scale: 0.8,
                opacity: 0,
                ease: 'back.out(1.5)'
            });
        });
    }

    _initCanvas() {
        this.canvas = document.getElementById('drawing-canvas');
        this.ctx = this.canvas.getContext('2d');

        // 캔버스 크기 조정
        const size = Math.min(400, window.innerWidth - 60);
        this.canvas.width = size;
        this.canvas.height = size;
        this.canvas.style.width = size + 'px';
        this.canvas.style.height = size + 'px';

        // 기본 배경
        this.ctx.fillStyle = '#fffde7';
        this.ctx.fillRect(0, 0, size, size);

        // 가이드 텍스트 (배경색과 거의 같게 - 출력물에 안 보이도록)
        this.ctx.fillStyle = 'rgba(255,253,231,0.7)';
        this.ctx.font = `${size * 0.06}px "Apple SD Gothic Neo", sans-serif`;
        this.ctx.textAlign = 'center';
        this.ctx.fillText('여기에 문을 그려주세요', size / 2, size / 2);
    }

    _bindEvents(resolve) {
        const canvas = this.canvas;

        // 드로잉 이벤트
        const getPos = (e) => {
            const rect = canvas.getBoundingClientRect();
            const scaleX = canvas.width / rect.width;
            const scaleY = canvas.height / rect.height;
            if (e.touches) {
                return {
                    x: (e.touches[0].clientX - rect.left) * scaleX,
                    y: (e.touches[0].clientY - rect.top) * scaleY
                };
            }
            return {
                x: (e.clientX - rect.left) * scaleX,
                y: (e.clientY - rect.top) * scaleY
            };
        };

        const startDraw = (e) => {
            e.preventDefault();
            this.isDrawing = true;
            const pos = getPos(e);
            this.ctx.beginPath();
            this.ctx.moveTo(pos.x, pos.y);
        };

        const draw = (e) => {
            if (!this.isDrawing) return;
            e.preventDefault();
            const pos = getPos(e);
            this.ctx.lineTo(pos.x, pos.y);
            this.ctx.strokeStyle = this.color;
            this.ctx.lineWidth = this.brushSize;
            this.ctx.lineCap = 'round';
            this.ctx.lineJoin = 'round';
            this.ctx.stroke();
        };

        const endDraw = () => { this.isDrawing = false; };

        canvas.addEventListener('mousedown', startDraw);
        canvas.addEventListener('mousemove', draw);
        canvas.addEventListener('mouseup', endDraw);
        canvas.addEventListener('mouseleave', endDraw);
        canvas.addEventListener('touchstart', startDraw, { passive: false });
        canvas.addEventListener('touchmove', draw, { passive: false });
        canvas.addEventListener('touchend', endDraw);

        // 색상 선택
        document.querySelectorAll('.color-swatch').forEach(swatch => {
            swatch.addEventListener('click', () => {
                document.querySelectorAll('.color-swatch').forEach(s => s.classList.remove('active'));
                swatch.classList.add('active');
                this.color = swatch.dataset.color;
            });
        });

        // 브러시 크기
        document.getElementById('brush-size').addEventListener('input', (e) => {
            this.brushSize = parseInt(e.target.value);
        });

        // 지우기
        document.getElementById('clear-drawing').addEventListener('click', () => {
            this._initCanvas();
        });

        // 완료
        document.getElementById('done-drawing').addEventListener('click', () => {
            this.drawingData = this.canvas.toDataURL('image/png');

            gsap.to('.drawing-container', {
                duration: 0.4,
                scale: 0.8, opacity: 0,
                ease: 'power2.in',
                onComplete: () => {
                    Utils.hide('drawing-overlay');
                    resolve(this.drawingData);
                }
            });
        });
    }

    getDrawingData() {
        return this.drawingData;
    }
}
