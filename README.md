# Nemonic Prototype

보통의 프로토타입 레포지토리처럼 버전별 앱을 `apps/` 아래에 정리한 구조입니다.

## 폴더 구조

```text
/Users/sondahyun/nemonic-prototype
├── apps
│   ├── prototype-html
│   └── prototype-next
├── docs
│   └── presentation
├── README.md
└── package.json
```

## 1. HTML 프로토타입

- 위치: `/Users/sondahyun/nemonic-prototype/apps/prototype-html`
- 진입 파일: `/Users/sondahyun/nemonic-prototype/apps/prototype-html/index.html`
- 관련 폴더:
  - `/Users/sondahyun/nemonic-prototype/apps/prototype-html/js`
  - `/Users/sondahyun/nemonic-prototype/apps/prototype-html/css`
  - `/Users/sondahyun/nemonic-prototype/apps/prototype-html/assets`

### 실행 방법

```bash
cd /Users/sondahyun/nemonic-prototype
npm run html
```

브라우저에서 `http://localhost:4173` 접속

## 2. Next.js 포트폴리오 버전

- 위치: `/Users/sondahyun/nemonic-prototype/apps/prototype-next`
- 프레임워크: Next.js
- 관련 폴더:
  - `/Users/sondahyun/nemonic-prototype/apps/prototype-next/src`
  - `/Users/sondahyun/nemonic-prototype/apps/prototype-next/public`

### 실행 방법

```bash
cd /Users/sondahyun/nemonic-prototype/apps/prototype-next
corepack enable
corepack prepare pnpm@latest --activate
pnpm install
pnpm dev
```

브라우저에서 `http://localhost:3000` 접속

## 빠른 구분

- `apps/prototype-html/` = HTML 프로토타입
- `apps/prototype-next/` = Next.js 포트폴리오
- `docs/presentation/` = 발표 자료

## 루트 스크립트

루트에서도 아래처럼 실행할 수 있습니다.

```bash
cd /Users/sondahyun/nemonic-prototype
npm run html
npm run next:install
npm run next:dev
```
