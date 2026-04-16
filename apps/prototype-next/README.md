# Frontend 컨벤션 가이드

## 기술 스택

| 분류 | 기술 |
|------|------|
| 프레임워크 | Next.js 16 (App Router) |
| 언어 | TypeScript |
| 스타일 | Tailwind CSS v4 |
| 3D | @react-three/fiber · @react-three/drei · @react-three/rapier |
| 상태 관리 | Zustand |
| HTTP 클라이언트 | ky |
| 데이터베이스 | Supabase (@supabase/supabase-js) |
| UI | shadcn/ui (style: base-nova, primitive: @base-ui/react) |
| 2D 캔버스 | konva · react-konva |
| 아이콘 | lucide-react |
| 애니메이션 | motion |
| 패키지 매니저 | pnpm |
| React Compiler | babel-plugin-react-compiler 활성화 |

---

## 폴더 구조

```
src/
├── app/                          # Next.js App Router — 라우팅 진입점만 담당
│   ├── layout.tsx
│   ├── page.tsx
│   └── share/
│       └── [id]/
│           └── page.tsx
│
├── worlds/
│   ├── WorldCanvas.tsx           # Canvas 진입점 ('use client' 선언)
│   ├── {scene}/
│   │   ├── index.ts
│   │   ├── {Scene}Scene.tsx      # 씬 루트 (메인 Canvas 컨텍스트)
│   │   ├── constants.ts
│   │   ├── GroundMesh.tsx        # (선택)
│   │   ├── use{Scene}Interaction.ts  # (선택)
│   │   └── objects/
│   │       └── {Name}Mesh.tsx
│   ├── _infra/
│   │   ├── SceneManager.tsx
│   │   ├── Lighting.tsx
│   │   └── Character.tsx
│   └── _shared/
│       └── mesh/
│           ├── index.ts
│           └── {Name}Mesh.tsx
│
├── features/
│   └── {feature-name}/
│       ├── index.ts
│       ├── {FeatureName}.tsx         # UI만 담당 — 로직은 훅/스토어로 분리
│       ├── use{FeatureName}.ts       # UI 컴포넌트가 참조하는 비즈니스 로직 훅
│       ├── {featureName}Store.ts     # feature 전용 Zustand store (선택)
│       ├── {FeatureName}Visual.tsx   # 독립 <Canvas> 필요 시
│       └── {Name}Mesh.tsx
│
├── shared/
│   ├── hooks/
│   │   ├── index.ts
│   │   └── use{Name}.ts
│   ├── store/
│   │   ├── index.ts
│   │   └── {name}Store.ts
│   ├── lib/
│   │   ├── index.ts
│   │   └── apiClient.ts
│   └── ui/
│       ├── index.ts
│       └── {name}.tsx
│
└── styles/
    ├── index.css
    └── shadcn.css
```

---

## 폴더 네이밍

| 위치 | 케이스 | 예시 |
|------|--------|------|
| 최상위 도메인 폴더 | `lowercase` | `worlds/`, `features/`, `shared/` |
| 씬 / 도메인 하위 | `lowercase` | `outside/`, `home/` |
| 도구 하위 | `lowercase` | `hooks/`, `store/`, `ui/`, `lib/`, `objects/` |
| feature 단위 | `kebab-case` | `drawing-canvas/`, `label-printer/` |
| 인프라 공유 | `_prefix` | `_infra/`, `_shared/` |

> `_infra/` — 월드 전체에 항상 존재하는 단일 주체 (SceneManager, Lighting, Character)  
> `_shared/` — 씬 안에 여러 개 배치 가능한 재사용 컴포넌트

---

## 파일 네이밍

| 종류 | 케이스 | 예시 |
|------|--------|------|
| React 컴포넌트 | `PascalCase.tsx` | `HomeScene.tsx`, `DrawingCanvas.tsx` |
| shadcn UI 프리미티브 | `lowercase.tsx` | `drawer.tsx`, `button.tsx` |
| 훅 | `camelCase.ts` | `useCharacterControls.ts` |
| 스토어 | `camelCase.ts` | `canvasStore.ts` |
| 상수 | `constants.ts` (고정) | `constants.ts` |
| 유틸 | `camelCase.ts` | `utils.ts` |
| 배럴 | `index.ts` (고정) | `index.ts` |

---

## 파일명 접미사 컨벤션

| 접미사 | 의미 | 위치 |
|--------|------|------|
| `*Scene.tsx` | 씬 루트. 메인 `<Canvas>` 컨텍스트를 이어받음 | `worlds/{scene}/` |
| `*Mesh.tsx` | 3D 지오메트리 단위. `<Canvas>` 선언 없음 | `worlds/`, `features/` |
| `*Visual.tsx` | 독립 `<Canvas>`를 소유하는 3D 컴포넌트 | `features/` |
| `*Modal.tsx` | DOM 오버레이 모달 | `features/` |
| `*Canvas.tsx` | Konva 2D 캔버스 컴포넌트 | `features/` |
| `use*Interaction.ts` | 씬 상호작용 훅. 거리 감지 + 키 이벤트 처리 | `worlds/{scene}/` |
| `use*.ts` | 그 외 React 훅 | `features/`, `shared/hooks/` |

---

## UI / 비즈니스 로직 분리 규칙

**컴포넌트 파일(`*.tsx`)은 렌더링만 담당합니다.** 로직은 반드시 외부 훅 또는 스토어 파일로 분리합니다.

### 컴포넌트 안에 있어도 되는 것

- `isOpen`, `isHovered` 같은 순수 UI 상태 (`useState`)
- 버튼 클릭 → 모달 열기 같은 단순 UI 흐름

### 반드시 외부 파일로 분리해야 하는 것

| 로직 유형 | 분리 위치 |
|-----------|-----------|
| API 호출 | `use{FeatureName}.ts` |
| 데이터 변환 / 계산 | `use{FeatureName}.ts` 또는 `utils.ts` |
| 여러 컴포넌트에 영향을 주는 상태 | `{featureName}Store.ts` 또는 `shared/store/` |
| `useFrame` 기반 3D 로직 | `use{Name}.ts` |
| 게임 로직 (거리 감지, 충돌 판정) | `use{Scene}Interaction.ts` |

### 올바른 구조 예시

```tsx
// features/label-printer/LabelPrinter.tsx — UI만
export default function LabelPrinter() {
  const { labels, addLabel, removeLabel } = useLabelPrinter()  // 훅에서 로직 가져옴

  return (
    <div>
      {labels.map(label => <LabelItem key={label.id} {...label} />)}
      <button onClick={addLabel}>추가</button>
    </div>
  )
}

// features/label-printer/useLabelPrinter.ts — 로직만
export function useLabelPrinter() {
  const labels = useLabelPrinterStore(s => s.labels)
  const addLabel = async () => {
    const result = await api.post("/labels", { ... })
    // ...
  }
  return { labels, addLabel }
}
```

---

## 배럴 export (index.ts)

모든 폴더는 `index.ts`를 통해 외부에 단일 진입점을 제공합니다.

```ts
// 외부에서
import { useInteractiveObject, InteractionSheet } from "../features/interaction-sheet"

// 내부 경로 직접 참조 금지
// import { useInteractiveObject } from "../features/interaction-sheet/useInteractiveObject" // X
```

---

## 의존 방향 규칙

```
app → worlds · features → shared
```

- `features/` 간 직접 import 금지 → feature 간 공유 상태는 `shared/store/` 경유
- `worlds/`↔`features/` 간 컴포넌트/훅 직접 import 금지
- `shared/`는 어느 레이어에서도 참조 가능

### feature-level store 예외

씬의 근접 감지 결과처럼 특정 feature에만 해당하는 트리거 상태는 해당 `features/{feature}/` 안에 store를 두고, `worlds/{scene}/use*Interaction.ts`가 직접 write합니다.

```
worlds/home/useHomeInteraction.ts
  ├──write──▶ features/interaction-sheet/interactionSheetStore.ts
  └──write──▶ features/label-printer/labelPrinterStore.ts
```

- `use*Interaction.ts`의 feature store import는 예외적으로 허용
- 단, feature 컴포넌트/훅 import는 여전히 금지
- `active` false 시 store 값을 리셋해 씬 이탈 후 stale 상태 방지

---

## Next.js 서버/클라이언트 경계 규칙

### app/ 레이어 — 라우팅 진입점

`app/` 디렉토리 파일은 **라우팅 진입점과 메타데이터 선언만** 담당합니다.

```tsx
// app/page.tsx
import dynamic from "next/dynamic"

const WorldCanvas = dynamic(() => import("@/worlds/WorldCanvas"), { ssr: false })

export default function Page() {
  return <WorldCanvas />
}
```

```tsx
// app/share/[id]/page.tsx
export async function generateMetadata({ params }) {
  const result = await getResult(params.id)
  return {
    openGraph: {
      title: `${result.name}의 결과`,
      images: [result.imageUrl],
    },
  }
}

export default function SharePage({ params }) {
  return <ShareFeature id={params.id} />
}
```

### worlds/ 레이어 — 전체 클라이언트

- `WorldCanvas.tsx`에 `'use client'` 선언 — 하위 파일은 자동으로 클라이언트 컨텍스트 전파됨
- `worlds/` 하위에서 `<Canvas>` 선언 금지 — `WorldCanvas.tsx`에만 존재
- `worlds/` 하위 파일에 `'use client'` 중복 선언 불필요

### features/ 레이어

- 3D가 필요한 feature: `*Visual.tsx`가 독립 `<Canvas>` 소유 + `'use client'` 선언
- 순수 UI feature: 서버 컴포넌트로 유지 가능 (필요 시 클라이언트 컴포넌트로 분리)

---

## API 클라이언트 (ky)

`shared/lib/apiClient.ts`에 단일 클라이언트를 정의하고 프로젝트 전체에서 사용합니다.

```ts
// shared/lib/apiClient.ts
import ky from "ky"

const client = ky.create({
  prefixUrl: process.env.NEXT_PUBLIC_API_URL,
  hooks: {
    beforeRequest: [
      (request) => {
        const token = getToken()
        if (token) request.headers.set("Authorization", `Bearer ${token}`)
      },
    ],
    afterResponse: [
      async (_request, _options, response) => {
        if (response.status === 401) {
          // 인증 만료 처리
        }
        return response
      },
    ],
  },
})

export const api = {
  get: <T>(path: string) => client.get(path).json<T>(),
  post: <T>(path: string, body: unknown) =>
    client.post(path, { json: body }).json<T>(),
  put: <T>(path: string, body: unknown) =>
    client.put(path, { json: body }).json<T>(),
  delete: <T>(path: string) => client.delete(path).json<T>(),
}
```

- 모든 API 호출은 `api.get()`, `api.post()` 등을 통해서만 진행
- 서버 컴포넌트에서 Next.js 캐싱(`next: { revalidate }`)이 필요한 경우에만 native `fetch` 직접 사용 허용

---

## 라이브러리별 사용 규칙

### shadcn/ui

- style: `base-nova` (primitive: `@base-ui/react`, Radix UI 미사용)
- 컴포넌트 추가는 `pnpm dlx shadcn@latest add {component}` 로만 진행
- 설치된 컴포넌트는 `shared/ui/`에 위치, `shared/ui/index.ts` 배럴로 재export
- 아이콘은 `lucide-react` 사용

### motion

- DOM 요소 애니메이션에 사용 (`motion.div`, `AnimatePresence` 등)
- R3F `<Canvas>` 내부에서 `motion.*` 사용 금지

### konva / react-konva

- 2D 캔버스 기능에만 사용, `features/` 하위에 `*Canvas.tsx` 파일로 배치
- `Stage > Layer > Shape` 구조 준수

### CSS 파일 구조

- 프로젝트 전역 스타일은 `index.css`에 추가
- `shadcn.css`는 shadcn CLI가 관리하는 영역이므로 직접 수정 지양

---

## 핵심 금지사항

- `worlds/` 하위에서 `<Canvas>` 선언 금지 (WorldCanvas.tsx에만 존재)
- `_infra/`에 재사용 가능한 메시 추가 금지 → `_shared/mesh/`로
- `_shared/mesh/`에 단일 주체 컴포넌트 추가 금지 → `_infra/`로
- `index.ts` 배럴을 우회한 직접 경로 import 금지
- `features/` 간 직접 import 금지
- `worlds/`↔`features/` 컴포넌트/훅 직접 import 금지
- `useFrame` 안에 무거운 연산 배치 금지
- R3F `<Canvas>` 내부에서 `motion.*` 사용 금지
- `*.tsx` 컴포넌트 파일에 API 호출, 데이터 변환, 게임 로직 직접 작성 금지 → 훅/스토어로 분리
- 서버 컴포넌트 파일에 `'use client'` 선언 금지 (필요 시 별도 파일로 분리)
