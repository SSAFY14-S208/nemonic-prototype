// ===== 양세찬 게임 =====
// 카테고리별 키워드 → 히든 메모 출력 → 탭해서 공개
class YangGame {
    constructor() {
        this.categories = {
            '연예인': {
                easy: ['아이유', 'BTS', '유재석', '김연아', '손흥민', '블랙핑크', '박서준', '수지', '이광수', '전지현'],
                medium: ['마동석', '송강호', '하정우', '류준열', '김태리', '이도현', '안유진', '카리나', '차은우', '공유'],
                hard: ['김충재', '코드쿤스트', '사이먼 도미닉', '이상순', '육준서', '존박', '딘딘', '하하', '데프콘', '양세형']
            },
            '음식': {
                easy: ['치킨', '피자', '라면', '김밥', '떡볶이', '삼겹살', '비빔밥', '짜장면', '초밥', '햄버거'],
                medium: ['갈비찜', '순대국밥', '감자탕', '칼국수', '냉면', '잡채', '해물파전', '된장찌개', '보쌈', '족발'],
                hard: ['수비드 스테이크', '트러플 파스타', '에그 베네딕트', '까르보나라', '부야베스', '리소토', '바게트', '크루아상', '마카롱', '갈릭 브레드']
            },
            '동물': {
                easy: ['강아지', '고양이', '토끼', '햄스터', '코끼리', '사자', '원숭이', '펭귄', '기린', '돌고래'],
                medium: ['치타', '오랑우탄', '수달', '카피바라', '알파카', '미어캣', '플라밍고', '해마', '문어', '북극곰'],
                hard: ['아홀로틀', '쿼카', '오카피', '판골린', '딕딕', '나르왈', '맨드릴', '킨카주', '픽시프로그', '블루링옥토퍼스']
            },
            '영화/드라마': {
                easy: ['기생충', '아이언맨', '겨울왕국', '해리포터', '타이타닉', '스파이더맨', '어벤져스', '알라딘', '토이스토리', '인터스텔라'],
                medium: ['올드보이', '괴물', '부산행', '택시운전사', '이터널 선샤인', '인셉션', '쇼생크 탈출', '다크나이트', '라라랜드', '위플래쉬'],
                hard: ['그랜드 부다페스트 호텔', '멀홀랜드 드라이브', '블레이드 러너 2049', '시계태엽 오렌지', '아메리칸 뷰티', '노인을 위한 나라는 없다', '버드맨', '문라이트', '헤레디터리', '미드소마']
            },
            '직업': {
                easy: ['의사', '선생님', '경찰', '소방관', '요리사', '가수', '배우', '축구선수', '간호사', '군인'],
                medium: ['바리스타', '웹툰작가', '유튜버', 'DJ', '수의사', '파일럿', '통역사', '큐레이터', '기상캐스터', '아나운서'],
                hard: ['소믈리에', '조향사', '법의학자', '천문학자', '고고학자', '음향엔지니어', '특수분장사', '드론파일럿', '데이터사이언티스트', '블록체인개발자']
            }
        };

        this.currentKeyword = null;
        this.memoCards = [];
        this.gameState = 'select'; // select, playing, reveal
    }

    render(container) {
        this.container = container;
        this._showCategorySelect();
    }

    _showCategorySelect() {
        this.gameState = 'select';
        const cats = Object.keys(this.categories);
        this.container.innerHTML = `
            <div class="yang-game">
                <div class="yang-header">
                    <div class="yang-emoji">🎮</div>
                    <div class="yang-title-text">양세찬 게임</div>
                    <div class="yang-subtitle">카테고리를 선택하면 히든 메모가 출력됩니다!<br>메모를 탭하면 키워드가 공개돼요</div>
                </div>
                <div class="yang-section-label">카테고리 선택</div>
                <div class="yang-categories">
                    ${cats.map(c => `<button class="yang-cat-btn" data-cat="${c}">${this._getCatEmoji(c)} ${c}</button>`).join('')}
                </div>
                <div class="yang-section-label">난이도</div>
                <div class="yang-difficulty">
                    <button class="yang-diff-btn active" data-diff="easy">😊 쉬움</button>
                    <button class="yang-diff-btn" data-diff="medium">🤔 보통</button>
                    <button class="yang-diff-btn" data-diff="hard">🤯 어려움</button>
                </div>
                <div class="yang-section-label">메모 수</div>
                <div class="yang-count">
                    <button class="yang-count-btn" data-count="3">3장</button>
                    <button class="yang-count-btn active" data-count="5">5장</button>
                    <button class="yang-count-btn" data-count="8">8장</button>
                </div>
                <button class="yang-start-btn">🖨️ 메모 출력하기</button>
            </div>
        `;

        this._selectedCat = cats[0];
        this._selectedDiff = 'easy';
        this._selectedCount = 5;

        // 카테고리 선택
        this.container.querySelectorAll('.yang-cat-btn').forEach(btn => {
            btn.addEventListener('click', () => {
                this.container.querySelectorAll('.yang-cat-btn').forEach(b => b.classList.remove('active'));
                btn.classList.add('active');
                this._selectedCat = btn.dataset.cat;
            });
        });
        // 첫 번째 카테고리 활성화
        this.container.querySelector('.yang-cat-btn').classList.add('active');

        // 난이도 선택
        this.container.querySelectorAll('.yang-diff-btn').forEach(btn => {
            btn.addEventListener('click', () => {
                this.container.querySelectorAll('.yang-diff-btn').forEach(b => b.classList.remove('active'));
                btn.classList.add('active');
                this._selectedDiff = btn.dataset.diff;
            });
        });

        // 메모 수 선택
        this.container.querySelectorAll('.yang-count-btn').forEach(btn => {
            btn.addEventListener('click', () => {
                this.container.querySelectorAll('.yang-count-btn').forEach(b => b.classList.remove('active'));
                btn.classList.add('active');
                this._selectedCount = parseInt(btn.dataset.count);
            });
        });

        // 시작
        this.container.querySelector('.yang-start-btn').addEventListener('click', () => {
            this._startGame();
        });
    }

    _getCatEmoji(cat) {
        const map = { '연예인': '⭐', '음식': '🍔', '동물': '🐶', '영화/드라마': '🎬', '직업': '💼' };
        return map[cat] || '📌';
    }

    _startGame() {
        this.gameState = 'playing';
        const pool = this.categories[this._selectedCat][this._selectedDiff];
        // 랜덤 키워드 선택 (중복 없이)
        const shuffled = [...pool].sort(() => Math.random() - 0.5);
        this.memoCards = shuffled.slice(0, this._selectedCount).map((word, i) => ({
            word,
            revealed: false,
            index: i
        }));

        this._renderPlayingState();
    }

    _renderPlayingState() {
        const revealed = this.memoCards.filter(c => c.revealed).length;
        const total = this.memoCards.length;

        this.container.innerHTML = `
            <div class="yang-game">
                <div class="yang-play-header">
                    <span class="yang-play-cat">${this._getCatEmoji(this._selectedCat)} ${this._selectedCat}</span>
                    <span class="yang-play-diff">${this._selectedDiff === 'easy' ? '😊 쉬움' : this._selectedDiff === 'medium' ? '🤔 보통' : '🤯 어려움'}</span>
                    <span class="yang-play-count">${revealed}/${total} 공개</span>
                </div>
                <div class="yang-memo-grid">
                    ${this.memoCards.map((card, i) => `
                        <div class="yang-memo-card ${card.revealed ? 'revealed' : ''}" data-index="${i}">
                            <div class="yang-memo-front">
                                <div class="yang-memo-number">#${i + 1}</div>
                                <div class="yang-memo-q">?</div>
                                <div class="yang-memo-tap">탭하여 공개</div>
                            </div>
                            <div class="yang-memo-back">
                                <div class="yang-memo-number">#${i + 1}</div>
                                <div class="yang-memo-word">${card.word}</div>
                            </div>
                        </div>
                    `).join('')}
                </div>
                <div class="yang-actions">
                    <button class="yang-reset-btn">🔄 다시 뽑기</button>
                    <button class="yang-back-btn">← 카테고리 변경</button>
                </div>
            </div>
        `;

        // 카드 클릭 이벤트
        this.container.querySelectorAll('.yang-memo-card:not(.revealed)').forEach(card => {
            card.addEventListener('click', () => {
                const idx = parseInt(card.dataset.index);
                if (!this.memoCards[idx].revealed) {
                    this.memoCards[idx].revealed = true;
                    card.classList.add('revealed');
                    // 진동 피드백
                    Utils.vibrate([20]);
                    // 카운터 업데이트
                    const r = this.memoCards.filter(c => c.revealed).length;
                    const countEl = this.container.querySelector('.yang-play-count');
                    if (countEl) countEl.textContent = `${r}/${total} 공개`;

                    // 전부 공개 시
                    if (r === total) {
                        setTimeout(() => this._showComplete(), 500);
                    }
                }
            });
        });

        // 다시 뽑기
        this.container.querySelector('.yang-reset-btn').addEventListener('click', () => {
            this._startGame();
        });

        // 카테고리 변경
        this.container.querySelector('.yang-back-btn').addEventListener('click', () => {
            this._showCategorySelect();
        });
    }

    _showComplete() {
        const confetti = '🎉';
        const completeDiv = document.createElement('div');
        completeDiv.className = 'yang-complete';
        completeDiv.innerHTML = `
            <div class="yang-complete-text">${confetti} 모든 메모 공개 완료! ${confetti}</div>
            <button class="yang-again-btn">한 판 더!</button>
        `;
        this.container.querySelector('.yang-game').appendChild(completeDiv);

        completeDiv.querySelector('.yang-again-btn').addEventListener('click', () => {
            this._showCategorySelect();
        });
    }
}
