const pptxgen = require("pptxgenjs");
const pres = new pptxgen();
pres.layout = "LAYOUT_16x9";
pres.author = "네모닉월드 팀";
pres.title = "네모닉월드 중간발표";

// ===== 팔레트: Canva 템플릿 기반 (노란/오렌지) =====
const C = {
  bg: "FFF7E6", orange: "F27830", darkText: "2D2D2D", sub: "555555",
  white: "FFFFFF", card: "FFFFFF", border: "E8E0D0",
  indigo: "6366F1", mint: "10B981", coral: "F97066", gold: "FBBF24",
  blue: "3B82F6", purple: "A78BFA", dark: "1A1A2E",
};
const mkS = () => ({ type: "outer", color: "000000", blur: 5, offset: 2, angle: 135, opacity: 0.06 });

// 공통 상단 바 + 페이지 번호 + 로고
function frame(slide, num) {
  slide.background = { color: C.bg };
  slide.addShape(pres.shapes.RECTANGLE, { x: 0, y: 0, w: 10, h: 0.07, fill: { color: C.orange } });
  slide.addShape(pres.shapes.OVAL, { x: 0.3, y: 5.0, w: 0.42, h: 0.42, fill: { color: C.orange } });
  slide.addText(String(num).padStart(2, "0"), { x: 0.3, y: 5.0, w: 0.42, h: 0.42, fontSize: 10, fontFace: "Arial", color: C.white, bold: true, align: "center", valign: "middle" });
  slide.addText("MANGOSLAB", { x: 8.0, y: 5.15, w: 1.7, h: 0.25, fontSize: 9, fontFace: "Arial", color: C.sub, bold: true, align: "right", charSpacing: 3 });
}

// =====================================================
// 1. 표지
// =====================================================
let s = pres.addSlide();
s.background = { color: C.bg };
s.addShape(pres.shapes.RECTANGLE, { x: 0, y: 0, w: 10, h: 0.07, fill: { color: C.orange } });
s.addText("MANGOSLAB", { x: 0.5, y: 0.3, w: 2, h: 0.3, fontSize: 11, fontFace: "Arial", color: C.darkText, bold: true, charSpacing: 3 });

s.addText("상상을 출력하는 세계", { x: 0.5, y: 1.3, w: 6, h: 0.7, fontSize: 38, fontFace: "Arial Black", color: C.darkText, bold: true });
s.addText("네모닉월드", { x: 0.5, y: 2.0, w: 6, h: 0.9, fontSize: 52, fontFace: "Arial Black", color: C.orange, bold: true });

s.addShape(pres.shapes.RECTANGLE, { x: 0.5, y: 3.2, w: 5.5, h: 1.2, fill: { color: C.white }, shadow: mkS() });
s.addText("사용자가 직접 그리고, 출력하고, 붙이며\n그 결과물로 이루어진 세계를 체험하는\n인터랙티브 3D 웹 서비스", {
  x: 0.8, y: 3.3, w: 5, h: 1.0, fontSize: 14, fontFace: "Arial", color: C.sub, lineSpacingMultiple: 1.7
});

s.addShape(pres.shapes.RECTANGLE, { x: 7.0, y: 0.5, w: 2.8, h: 4.8, fill: { color: C.orange } });
s.addText("NEMONIC\nWORLD", { x: 7.0, y: 1.5, w: 2.8, h: 1.8, fontSize: 30, fontFace: "Arial Black", color: C.white, bold: true, align: "center", valign: "middle", lineSpacingMultiple: 1.3 });
s.addText("SSAFY 중간발표\n2026.04", { x: 7.0, y: 3.8, w: 2.8, h: 0.7, fontSize: 11, fontFace: "Arial", color: "FFD4A8", align: "center", lineSpacingMultiple: 1.4 });

s.addShape(pres.shapes.OVAL, { x: 0.3, y: 5.0, w: 0.42, h: 0.42, fill: { color: C.orange } });
s.addText("01", { x: 0.3, y: 5.0, w: 0.42, h: 0.42, fontSize: 10, fontFace: "Arial", color: C.white, bold: true, align: "center", valign: "middle" });
s.addText("MANGOSLAB", { x: 8.0, y: 5.15, w: 1.7, h: 0.25, fontSize: 9, fontFace: "Arial", color: C.sub, bold: true, align: "right", charSpacing: 3 });

// =====================================================
// 2. 목차
// =====================================================
s = pres.addSlide(); frame(s, 2);
s.addText("목차", { x: 0.5, y: 0.3, w: 4, h: 0.6, fontSize: 30, fontFace: "Arial Black", color: C.darkText, bold: true });

const toc = [
  "파트너사 소개 — 망고슬래브 & 네모닉",
  "프로젝트 배경 — 왜 3D 세계인가?",
  "우리의 접근법 — 캔버스를 넘어 세계로",
  "서비스 컨셉 — 핵심 경험 구조",
  "공간 구조 — 광장형 허브",
  "핵심 콘텐츠 3종",
  "기술 아키텍처",
  "기대 효과 & 로드맵",
];
toc.forEach((item, i) => {
  const y = 1.2 + i * 0.52;
  s.addShape(pres.shapes.RECTANGLE, { x: 0.5, y, w: 9, h: 0.42, fill: { color: i % 2 === 0 ? C.white : C.bg } });
  s.addText(String(i + 3).padStart(2, "0"), { x: 0.6, y, w: 0.5, h: 0.42, fontSize: 13, fontFace: "Arial", color: C.orange, bold: true, valign: "middle" });
  s.addText(item, { x: 1.3, y, w: 8, h: 0.42, fontSize: 13, fontFace: "Arial", color: C.darkText, valign: "middle" });
});

// =====================================================
// 3. 망고슬래브 소개
// =====================================================
s = pres.addSlide(); frame(s, 3);
s.addText("MANGOSLAB", { x: 0.5, y: 0.2, w: 3, h: 0.35, fontSize: 11, fontFace: "Arial", color: C.sub, bold: true, charSpacing: 3 });
s.addText("망고슬래브", { x: 0.5, y: 0.5, w: 6, h: 0.7, fontSize: 32, fontFace: "Arial Black", color: C.darkText, bold: true });

// 기업 정보 카드
s.addShape(pres.shapes.RECTANGLE, { x: 0.5, y: 1.3, w: 5.8, h: 1.8, fill: { color: C.white }, shadow: mkS() });
s.addShape(pres.shapes.RECTANGLE, { x: 0.5, y: 1.3, w: 0.06, h: 1.8, fill: { color: C.orange } });

const companyInfo = [
  { label: "설립", value: "2016년  |  삼성전자 C-Lab 스핀오프" },
  { label: "대표 제품", value: "네모닉(Nemonic) — 세상에 없던 데이터 출력기" },
  { label: "수상", value: "CES 2017 최고혁신상  |  레드닷 Winner  |  CES 2026 혁신상" },
  { label: "실적", value: "누적 24만 대 판매  |  누적 매출 250억원+" },
];
companyInfo.forEach((info, i) => {
  const y = 1.45 + i * 0.4;
  s.addText(info.label, { x: 0.8, y, w: 1.3, h: 0.35, fontSize: 10, fontFace: "Arial", color: C.orange, bold: true, valign: "middle" });
  s.addText(info.value, { x: 2.1, y, w: 4, h: 0.35, fontSize: 11, fontFace: "Arial", color: C.darkText, valign: "middle" });
});

// 핵심 한 줄
s.addShape(pres.shapes.RECTANGLE, { x: 0.5, y: 3.3, w: 5.8, h: 0.5, fill: { color: C.orange, transparency: 90 } });
s.addText("디지털 데이터를 물리적 점착 메모/라벨로 즉시 변환하는 Phygital(Physical+Digital) 기업", {
  x: 0.7, y: 3.3, w: 5.4, h: 0.5, fontSize: 11, fontFace: "Arial", color: C.orange, bold: true, valign: "middle"
});

// 오른쪽 오렌지 패널
s.addShape(pres.shapes.RECTANGLE, { x: 6.8, y: 0.5, w: 3, h: 4.5, fill: { color: C.orange } });
s.addText("[ 망고슬래브\n로고 & 사옥 이미지 ]", { x: 6.8, y: 1.5, w: 3, h: 2, fontSize: 12, fontFace: "Arial", color: "FFD4A8", align: "center", valign: "middle", lineSpacingMultiple: 1.4 });
s.addText("삼성전자 C-Lab에서 출발한\n글로벌 IoT 스타트업", { x: 6.9, y: 3.5, w: 2.8, h: 0.7, fontSize: 10, fontFace: "Arial", color: "FFD4A8", align: "center", lineSpacingMultiple: 1.4 });

// =====================================================
// 4. 네모닉 제품 소개
// =====================================================
s = pres.addSlide(); frame(s, 4);
s.addText("MANGOSLAB", { x: 0.5, y: 0.2, w: 3, h: 0.3, fontSize: 10, fontFace: "Arial", color: C.sub, bold: true, charSpacing: 3 });
s.addText("네모닉 (NEMONIC)", { x: 0.5, y: 0.45, w: 6, h: 0.7, fontSize: 32, fontFace: "Arial Black", color: C.darkText, bold: true });

// 3대 특징
s.addShape(pres.shapes.RECTANGLE, { x: 0.5, y: 1.3, w: 5.8, h: 2.8, fill: { color: C.white }, shadow: mkS() });

const features = [
  { title: "감열식 출력", desc: "잉크/토너/리본 완전 불필요\n203dpi 해상도, 5초 출력\n자동 컷팅 · 유지비 제로", color: C.coral },
  { title: "독자적 폼팩터", desc: "점착 메모 ↔ 라벨 자유 전환\n4색 메모(백/황/핑/청)\n투명/방수/강접착 라벨", color: C.indigo },
  { title: "소프트웨어 생태계", desc: "Slack, MS Teams, Zapier\nUSB + 블루투스 무선 연결\nAI 오답노트 자동 출력(교육)", color: C.mint },
];
features.forEach((f, i) => {
  const x = 0.7 + i * 1.9;
  s.addShape(pres.shapes.RECTANGLE, { x, y: 1.45, w: 0.06, h: 2.3, fill: { color: f.color } });
  s.addText(f.title, { x: x + 0.2, y: 1.5, w: 1.5, h: 0.35, fontSize: 13, fontFace: "Arial", color: C.darkText, bold: true });
  s.addText(f.desc, { x: x + 0.2, y: 1.95, w: 1.5, h: 1.5, fontSize: 10, fontFace: "Arial", color: C.sub, lineSpacingMultiple: 1.7 });
});

// 제품 라인업
s.addText("제품 라인업", { x: 0.5, y: 4.2, w: 2, h: 0.3, fontSize: 11, fontFace: "Arial", color: C.darkText, bold: true });
const lineup = ["Nemonic AI (배터리 내장)", "Nemonic Label", "Nemonic Mini (휴대용)", "Nemonic Dot (AI 점자)"];
lineup.forEach((p, i) => {
  s.addShape(pres.shapes.RECTANGLE, { x: 0.5 + i * 1.5, y: 4.55, w: 1.35, h: 0.35, fill: { color: i === 0 ? C.orange : C.white }, shadow: mkS() });
  s.addText(p, { x: 0.5 + i * 1.5, y: 4.55, w: 1.35, h: 0.35, fontSize: 9, fontFace: "Arial", color: i === 0 ? C.white : C.sub, align: "center", valign: "middle", bold: i === 0 });
});

// 오른쪽 오렌지 패널
s.addShape(pres.shapes.RECTANGLE, { x: 6.8, y: 0.5, w: 3, h: 4.5, fill: { color: C.orange } });
s.addText("nemonic:", { x: 6.8, y: 1.0, w: 3, h: 0.5, fontSize: 22, fontFace: "Arial", color: C.white, bold: true, align: "center" });
s.addText("기록하고 출력하며\n붙이는, 똑똑한 프린터", { x: 6.9, y: 1.5, w: 2.8, h: 0.5, fontSize: 10, fontFace: "Arial", color: "FFD4A8", align: "center", lineSpacingMultiple: 1.4 });
s.addText("[ 네모닉 제품 이미지 ]", { x: 6.9, y: 2.3, w: 2.8, h: 1.3, fontSize: 11, fontFace: "Arial", color: "FFD4A8", align: "center", valign: "middle" });
s.addText("112 x 112 x 90mm\n한 손에 들어오는 크기", { x: 6.9, y: 3.6, w: 2.8, h: 0.5, fontSize: 9, fontFace: "Arial", color: "FFD4A8", align: "center", lineSpacingMultiple: 1.3 });

// =====================================================
// 5. 프로젝트 배경 — 왜 3D인가
// =====================================================
s = pres.addSlide(); frame(s, 5);
s.addText("프로젝트 배경", { x: 0.5, y: 0.3, w: 6, h: 0.6, fontSize: 30, fontFace: "Arial Black", color: C.darkText, bold: true });
s.addText("네모닉의 핵심 경험을 웹에서 어떻게 전달할 것인가?", { x: 0.5, y: 0.85, w: 8, h: 0.3, fontSize: 13, fontFace: "Arial", color: C.orange, bold: true });

// 기존 방식의 한계
const limits = [
  { icon: "📝", title: "텍스트 설명", desc: "물성 기반 경험\n전달에 한계", color: C.coral },
  { icon: "🎬", title: "영상 소개", desc: "직접 참여를\n유도하지 못함", color: C.gold },
  { icon: "🖥️", title: "정적 페이지", desc: "사용 동기\n형성에 제한적", color: C.blue },
];
limits.forEach((l, i) => {
  const x = 0.5 + i * 3.15;
  s.addShape(pres.shapes.RECTANGLE, { x, y: 1.4, w: 2.95, h: 1.8, fill: { color: C.white }, shadow: mkS() });
  s.addShape(pres.shapes.RECTANGLE, { x, y: 1.4, w: 2.95, h: 0.05, fill: { color: l.color } });
  s.addText(l.icon + "  " + l.title, { x: x + 0.15, y: 1.55, w: 2.65, h: 0.35, fontSize: 13, fontFace: "Arial", color: C.darkText, bold: true });
  s.addText(l.desc, { x: x + 0.15, y: 1.95, w: 2.65, h: 0.8, fontSize: 11, fontFace: "Arial", color: C.sub, lineSpacingMultiple: 1.5 });
});

// 핵심 질문
s.addShape(pres.shapes.RECTANGLE, { x: 0.5, y: 3.5, w: 9, h: 1.0, fill: { color: C.white }, shadow: mkS() });
s.addShape(pres.shapes.RECTANGLE, { x: 0.5, y: 3.5, w: 0.06, h: 1.0, fill: { color: C.orange } });
s.addText([
  { text: "핵심 질문\n", options: { fontSize: 10, color: C.orange, bold: true, breakLine: true } },
  { text: "\"네모닉의 Phygital 경험을 전달하려면, 출력이 의미를 갖는 '세계'가 있어야 한다\"\n", options: { fontSize: 14, color: C.darkText, bold: true, breakLine: true } },
  { text: "→ 평면 캔버스가 아닌, 사용자가 진입하고 참여하는 3D 공간으로 설계", options: { fontSize: 11, color: C.sub } },
], { x: 0.8, y: 3.55, w: 8.5, h: 0.9, fontFace: "Arial", valign: "middle" });

// =====================================================
// 6. 우리의 접근법
// =====================================================
s = pres.addSlide(); frame(s, 6);
s.addText("우리의 접근법", { x: 0.5, y: 0.3, w: 6, h: 0.6, fontSize: 30, fontFace: "Arial Black", color: C.darkText, bold: true });
s.addText("캔버스를 넘어 — 세계를 만든다", { x: 0.5, y: 0.85, w: 8, h: 0.3, fontSize: 13, fontFace: "Arial", color: C.sub });

// 3가지 전환
const trans = [
  { from: "기능 설명", to: "직접 체험", color: C.indigo },
  { from: "제품 시연", to: "상호작용", color: C.mint },
  { from: "개별 출력물", to: "공간의 일부", color: C.coral },
];
trans.forEach((t, i) => {
  const y = 1.4 + i * 1.0;
  s.addShape(pres.shapes.RECTANGLE, { x: 0.8, y, w: 3.0, h: 0.7, fill: { color: C.white }, shadow: mkS() });
  s.addText(t.from, { x: 0.8, y, w: 3.0, h: 0.7, fontSize: 15, fontFace: "Arial", color: C.sub, align: "center", valign: "middle" });
  s.addText("→", { x: 4.0, y, w: 0.6, h: 0.7, fontSize: 22, color: t.color, align: "center", valign: "middle", bold: true });
  s.addShape(pres.shapes.RECTANGLE, { x: 4.8, y, w: 3.5, h: 0.7, fill: { color: t.color }, shadow: mkS() });
  s.addText(t.to, { x: 4.8, y, w: 3.5, h: 0.7, fontSize: 16, fontFace: "Arial", color: C.white, align: "center", valign: "middle", bold: true });
});

// 핵심 메시지
s.addShape(pres.shapes.RECTANGLE, { x: 0.5, y: 4.5, w: 9, h: 0.6, fill: { color: C.orange } });
s.addText("\"내가 만든 출력물이 이 세계의 일부가 된다\"", {
  x: 0.5, y: 4.5, w: 9, h: 0.6, fontSize: 16, fontFace: "Arial", color: C.white, bold: true, align: "center", valign: "middle"
});

// =====================================================
// 7. 서비스 컨셉
// =====================================================
s = pres.addSlide(); frame(s, 7);
s.addText("서비스 컨셉", { x: 0.5, y: 0.3, w: 6, h: 0.6, fontSize: 30, fontFace: "Arial Black", color: C.darkText, bold: true });

// 세계관
s.addShape(pres.shapes.RECTANGLE, { x: 0.5, y: 1.0, w: 9, h: 0.6, fill: { color: C.orange, transparency: 92 } });
s.addShape(pres.shapes.RECTANGLE, { x: 0.5, y: 1.0, w: 0.05, h: 0.6, fill: { color: C.orange } });
s.addText("세계관  |  사용자는 관람자가 아닌 '진입자' — 문을 만들고, 출력하여, 세계에 들어가는 존재", {
  x: 0.8, y: 1.0, w: 8.5, h: 0.6, fontSize: 12, fontFace: "Arial", color: C.orange, valign: "middle", bold: true
});

// 핵심 경험 구조
s.addText("핵심 경험 구조", { x: 0.5, y: 1.8, w: 3, h: 0.35, fontSize: 14, fontFace: "Arial", color: C.darkText, bold: true });

s.addShape(pres.shapes.RECTANGLE, { x: 0.5, y: 2.2, w: 9, h: 0.8, fill: { color: C.white }, shadow: mkS() });
const flow = [
  { step: "생성", icon: "✏️", color: C.indigo },
  { step: "출력", icon: "🖨️", color: C.orange },
  { step: "부착", icon: "📌", color: C.mint },
  { step: "결과", icon: "👁️", color: C.gold },
  { step: "잔존", icon: "✨", color: C.coral },
];
flow.forEach((f, i) => {
  const x = 0.7 + i * 1.75;
  s.addText(f.icon + " " + f.step, { x, y: 2.3, w: 1.3, h: 0.6, fontSize: 14, fontFace: "Arial", color: f.color, bold: true, align: "center", valign: "middle" });
  if (i < flow.length - 1) s.addText("→", { x: x + 1.2, y: 2.3, w: 0.4, h: 0.6, fontSize: 14, color: C.sub, align: "center", valign: "middle" });
});

s.addText("모든 콘텐츠가 이 구조를 동일하게 따름 → 통일된 '네모닉 경험'", {
  x: 0.5, y: 3.1, w: 9, h: 0.35, fontSize: 11, fontFace: "Arial", color: C.sub, align: "center"
});

// 인트로 시퀀스
s.addText("인트로 시퀀스 (30초)", { x: 0.5, y: 3.6, w: 4, h: 0.35, fontSize: 14, fontFace: "Arial", color: C.darkText, bold: true });

const introSteps = ["카메라\n오프닝", "사용자\n스폰", "가이드\n안내", "문\n드로잉", "네모닉\n출력", "벽면\n부착", "문 개방\n→ 진입"];
introSteps.forEach((step, i) => {
  const x = 0.5 + i * 1.3;
  s.addShape(pres.shapes.RECTANGLE, { x, y: 4.0, w: 1.15, h: 0.9, fill: { color: C.white }, shadow: mkS() });
  s.addShape(pres.shapes.OVAL, { x: x + 0.02, y: 4.05, w: 0.25, h: 0.25, fill: { color: C.orange } });
  s.addText(String(i + 1), { x: x + 0.02, y: 4.05, w: 0.25, h: 0.25, fontSize: 9, fontFace: "Arial", color: C.white, bold: true, align: "center", valign: "middle" });
  s.addText(step, { x: x + 0.05, y: 4.32, w: 1.05, h: 0.55, fontSize: 9, fontFace: "Arial", color: C.darkText, align: "center", valign: "middle", lineSpacingMultiple: 1.2 });
});

// =====================================================
// 8. 공간 구조
// =====================================================
s = pres.addSlide(); frame(s, 8);
s.addText("공간 구조", { x: 0.5, y: 0.3, w: 6, h: 0.6, fontSize: 30, fontFace: "Arial Black", color: C.darkText, bold: true });
s.addText("광장형 허브 — 한눈에 파악, 언제든 복귀", { x: 0.5, y: 0.85, w: 8, h: 0.3, fontSize: 13, fontFace: "Arial", color: C.sub });

// 왼쪽: 흐름
s.addShape(pres.shapes.RECTANGLE, { x: 0.5, y: 1.4, w: 2.2, h: 0.6, fill: { color: C.white }, shadow: mkS() });
s.addText("🚪 인트로 공간", { x: 0.5, y: 1.4, w: 2.2, h: 0.6, fontSize: 11, fontFace: "Arial", color: C.darkText, align: "center", valign: "middle" });

s.addText("↓", { x: 1.3, y: 2.0, w: 0.6, h: 0.3, fontSize: 14, color: C.sub, align: "center" });

s.addShape(pres.shapes.RECTANGLE, { x: 0.5, y: 2.3, w: 2.2, h: 0.6, fill: { color: C.white }, shadow: mkS() });
s.addText("🧱 문 부착 벽", { x: 0.5, y: 2.3, w: 2.2, h: 0.6, fontSize: 11, fontFace: "Arial", color: C.darkText, align: "center", valign: "middle" });

s.addText("↓", { x: 1.3, y: 2.9, w: 0.6, h: 0.3, fontSize: 14, color: C.sub, align: "center" });

// 중앙 광장
s.addShape(pres.shapes.RECTANGLE, { x: 3.2, y: 1.4, w: 3.2, h: 2.0, fill: { color: C.orange, transparency: 88 }, shadow: mkS() });
s.addShape(pres.shapes.RECTANGLE, { x: 3.2, y: 1.4, w: 3.2, h: 0.05, fill: { color: C.orange } });
s.addText("🏛️ 중앙 광장", { x: 3.2, y: 1.6, w: 3.2, h: 0.4, fontSize: 16, fontFace: "Arial", color: C.darkText, bold: true, align: "center" });
s.addText("서비스 허브\n안내 · 추천 결과물 · 이벤트 노출\n모든 콘텐츠의 접근 중심점", {
  x: 3.4, y: 2.1, w: 2.8, h: 1.0, fontSize: 10, fontFace: "Arial", color: C.sub, align: "center", lineSpacingMultiple: 1.5
});

// 오른쪽: 4개 존
const zones = [
  { icon: "📝", name: "커뮤니티 캔버스", tag: "핵심 대표", color: C.mint },
  { icon: "🎨", name: "릴레이 드로잉", tag: "핵심 협동", color: C.coral },
  { icon: "🔮", name: "포춘 메모", tag: "보조 핵심", color: C.indigo },
  { icon: "📖", name: "확장 콘텐츠", tag: "2차 이후", color: C.gold },
];
zones.forEach((z, i) => {
  const col = i % 2;
  const row = Math.floor(i / 2);
  const x = 6.8 + col * 1.6;
  const y = 1.4 + row * 1.5;
  s.addShape(pres.shapes.RECTANGLE, { x, y, w: 1.45, h: 1.2, fill: { color: C.white }, shadow: mkS() });
  s.addShape(pres.shapes.RECTANGLE, { x, y, w: 1.45, h: 0.04, fill: { color: z.color } });
  s.addText(z.icon, { x, y: y + 0.1, w: 1.45, h: 0.3, fontSize: 16, align: "center" });
  s.addText(z.name, { x: x + 0.05, y: y + 0.4, w: 1.35, h: 0.3, fontSize: 9, fontFace: "Arial", color: C.darkText, bold: true, align: "center" });
  s.addShape(pres.shapes.RECTANGLE, { x: x + 0.2, y: y + 0.75, w: 1.05, h: 0.22, fill: { color: z.color, transparency: 85 } });
  s.addText(z.tag, { x: x + 0.2, y: y + 0.75, w: 1.05, h: 0.22, fontSize: 8, fontFace: "Arial", color: z.color, bold: true, align: "center", valign: "middle" });
});

// 하단: 공간 원칙
s.addShape(pres.shapes.RECTANGLE, { x: 0.5, y: 4.5, w: 9, h: 0.5, fill: { color: C.white }, shadow: mkS() });
const princ = ["중앙 광장 기준 분기 구조", "언제든 광장 복귀 가능", "존별 역할 중복 없음", "이벤트는 광장 중심 노출"];
princ.forEach((p, i) => {
  s.addText("✓  " + p, { x: 0.5 + i * 2.25, y: 4.5, w: 2.25, h: 0.5, fontSize: 9, fontFace: "Arial", color: C.darkText, align: "center", valign: "middle" });
});

// =====================================================
// 9. 핵심 콘텐츠 3종
// =====================================================
s = pres.addSlide(); frame(s, 9);
s.addText("핵심 콘텐츠", { x: 0.5, y: 0.3, w: 6, h: 0.6, fontSize: 30, fontFace: "Arial Black", color: C.darkText, bold: true });

const contents = [
  {
    icon: "📝", title: "커뮤니티 캔버스", tag: "핵심 대표", color: C.mint,
    bullets: [
      "대형 캔버스에 메모 자유 부착",
      "내 메모: 이동/꾸미기/삭제 가능",
      "남의 메모: '팔락' 모션 인터랙션",
      "벽 자체가 전시 공간",
      "축적감 → 살아있는 커뮤니티",
    ]
  },
  {
    icon: "🎨", title: "우당탕 릴레이 드로잉", tag: "핵심 협동", color: C.coral,
    bullets: [
      "머리/몸통/다리 분할 드로잉",
      "여러 유저가 하나의 캐릭터 완성",
      "예상 불가능한 결과 → 웃음",
      "강한 결과 공개 연출",
      "완성작 네모닉 출력",
    ]
  },
  {
    icon: "🔮", title: "포춘 메모", tag: "보조 핵심", color: C.indigo,
    bullets: [
      "가장 낮은 진입 장벽",
      "즉시 결과 제공 (빠른 출력 경험)",
      "시즌/이벤트 문구 교체 용이",
      "재방문 유도에 최적화",
      "개인 소비 or 공간에 남기기",
    ]
  },
];
contents.forEach((c, i) => {
  const x = 0.5 + i * 3.15;
  s.addShape(pres.shapes.RECTANGLE, { x, y: 1.1, w: 2.95, h: 3.8, fill: { color: C.white }, shadow: mkS() });
  s.addShape(pres.shapes.RECTANGLE, { x, y: 1.1, w: 2.95, h: 0.05, fill: { color: c.color } });
  // 태그
  s.addShape(pres.shapes.RECTANGLE, { x: x + 0.1, y: 1.25, w: 0.9, h: 0.22, fill: { color: c.color, transparency: 85 } });
  s.addText(c.tag, { x: x + 0.1, y: 1.25, w: 0.9, h: 0.22, fontSize: 8, fontFace: "Arial", color: c.color, bold: true, align: "center", valign: "middle" });
  // 아이콘 + 타이틀
  s.addText(c.icon, { x, y: 1.6, w: 2.95, h: 0.4, fontSize: 22, align: "center" });
  s.addText(c.title, { x: x + 0.1, y: 2.05, w: 2.75, h: 0.35, fontSize: 14, fontFace: "Arial", color: C.darkText, bold: true, align: "center" });
  // 불릿
  const bulletText = c.bullets.map((b, bi) => ({
    text: b, options: { bullet: true, breakLine: bi < c.bullets.length - 1, fontSize: 10 }
  }));
  s.addText(bulletText, { x: x + 0.2, y: 2.5, w: 2.55, h: 2.0, fontFace: "Arial", color: C.sub, paraSpaceAfter: 4 });
});

// =====================================================
// 10. 기술 아키텍처
// =====================================================
s = pres.addSlide(); frame(s, 10);
s.addText("기술 아키텍처", { x: 0.5, y: 0.3, w: 6, h: 0.6, fontSize: 30, fontFace: "Arial Black", color: C.darkText, bold: true });

const tech = [
  { cat: "Frontend", items: "Next.js (React)\nR3F (Three.js)\nKonva.js · GSAP\nWeb Audio API", icon: "🎨", color: C.indigo },
  { cat: "Backend", items: "FastAPI / NestJS\nSocket.io\nLangChain\nFirestore", icon: "⚙️", color: C.mint },
  { cat: "AI", items: "OpenAI / Gemini\nVision API\nPrompt Engineering\nJSON 구조화", icon: "🤖", color: C.coral },
  { cat: "Infra", items: "Docker\nGCP Cloud Run\nGitHub Actions\nCI/CD Pipeline", icon: "☁️", color: C.blue },
];
tech.forEach((t, i) => {
  const x = 0.5 + i * 2.35;
  s.addShape(pres.shapes.RECTANGLE, { x, y: 1.1, w: 2.15, h: 2.4, fill: { color: C.white }, shadow: mkS() });
  s.addShape(pres.shapes.RECTANGLE, { x, y: 1.1, w: 2.15, h: 0.05, fill: { color: t.color } });
  s.addText(t.icon + "  " + t.cat, { x: x + 0.1, y: 1.2, w: 1.95, h: 0.4, fontSize: 13, fontFace: "Arial", color: t.color, bold: true, align: "center" });
  s.addText(t.items, { x: x + 0.15, y: 1.7, w: 1.85, h: 1.5, fontSize: 10, fontFace: "Arial", color: C.sub, align: "center", lineSpacingMultiple: 1.7 });
});

// 핵심 기술 도전
s.addText("핵심 기술 도전", { x: 0.5, y: 3.7, w: 3, h: 0.3, fontSize: 12, fontFace: "Arial", color: C.darkText, bold: true });
const challenges = [
  { title: "3D ↔ 2D 전환", desc: "3D 공간과 2D 캔버스 간\n인터랙션 레이어 전환" },
  { title: "실시간 동기화", desc: "Socket.io 기반\n멀티플레이 상태 동기화" },
  { title: "AI → 메모 렌더링", desc: "AI 응답을 정형화된\n메모 템플릿으로 변환" },
];
challenges.forEach((c, i) => {
  const x = 0.5 + i * 3.15;
  s.addShape(pres.shapes.RECTANGLE, { x, y: 4.05, w: 2.95, h: 0.8, fill: { color: C.white }, shadow: mkS() });
  s.addShape(pres.shapes.RECTANGLE, { x, y: 4.05, w: 0.05, h: 0.8, fill: { color: C.orange } });
  s.addText(c.title, { x: x + 0.15, y: 4.1, w: 2.7, h: 0.3, fontSize: 11, fontFace: "Arial", color: C.darkText, bold: true });
  s.addText(c.desc, { x: x + 0.15, y: 4.4, w: 2.7, h: 0.4, fontSize: 9, fontFace: "Arial", color: C.sub, lineSpacingMultiple: 1.4 });
});

// =====================================================
// 11. 기대 효과 & 로드맵
// =====================================================
s = pres.addSlide(); frame(s, 11);
s.addText("기대 효과 & 로드맵", { x: 0.5, y: 0.3, w: 8, h: 0.6, fontSize: 30, fontFace: "Arial Black", color: C.darkText, bold: true });

// 기대 효과 3종
const effects = [
  { icon: "🎯", title: "브랜드", desc: "네모닉을 정보가 아닌\n'경험'으로 기억하게 한다", color: C.indigo },
  { icon: "🔄", title: "바이럴", desc: "내 창작물이 3D 공간에 남아\n스크린샷 공유 + 재방문", color: C.mint },
  { icon: "🚀", title: "확장성", desc: "세계관 기반이므로\n콘텐츠 추가 = 세계가 풍성", color: C.coral },
];
effects.forEach((e, i) => {
  const x = 0.5 + i * 3.15;
  s.addShape(pres.shapes.RECTANGLE, { x, y: 1.1, w: 2.95, h: 1.6, fill: { color: C.white }, shadow: mkS() });
  s.addShape(pres.shapes.RECTANGLE, { x, y: 1.1, w: 2.95, h: 0.05, fill: { color: e.color } });
  s.addText(e.icon + "  " + e.title, { x: x + 0.1, y: 1.2, w: 2.75, h: 0.35, fontSize: 14, fontFace: "Arial", color: e.color, bold: true });
  s.addText(e.desc, { x: x + 0.1, y: 1.6, w: 2.75, h: 0.8, fontSize: 11, fontFace: "Arial", color: C.sub, lineSpacingMultiple: 1.5 });
});

// 로드맵
s.addText("확장 로드맵", { x: 0.5, y: 3.0, w: 3, h: 0.35, fontSize: 13, fontFace: "Arial", color: C.darkText, bold: true });
const roadmap = [
  { phase: "1차 MVP", items: "인트로 · 커뮤니티 · 릴레이 · 포춘 · 운영", color: C.orange },
  { phase: "2차 확장", items: "플립북 · 시즌 운영 · 커뮤니티 확장", color: C.indigo },
  { phase: "3차 확장", items: "AI 보조 생성 · 퍼즐 · 마이룸 · 통계 고도화", color: C.mint },
];
roadmap.forEach((r, i) => {
  const x = 0.5 + i * 3.15;
  s.addShape(pres.shapes.RECTANGLE, { x, y: 3.4, w: 2.95, h: 1.1, fill: { color: C.white }, shadow: mkS() });
  s.addShape(pres.shapes.RECTANGLE, { x, y: 3.4, w: 2.95, h: 0.35, fill: { color: r.color } });
  s.addText(r.phase, { x, y: 3.4, w: 2.95, h: 0.35, fontSize: 12, fontFace: "Arial", color: C.white, bold: true, align: "center", valign: "middle" });
  s.addText(r.items, { x: x + 0.1, y: 3.8, w: 2.75, h: 0.6, fontSize: 10, fontFace: "Arial", color: C.sub, valign: "middle", lineSpacingMultiple: 1.4 });
});

s.addText("확장 원칙:  기능 수 확대가 아닌 '출력 기반 창작 경험 강화' 기준으로 확장", {
  x: 0.5, y: 4.7, w: 9, h: 0.3, fontSize: 10, fontFace: "Arial", color: C.sub, italic: true, align: "center"
});

// =====================================================
// 12. Q&A
// =====================================================
s = pres.addSlide();
s.background = { color: C.bg };
s.addShape(pres.shapes.RECTANGLE, { x: 0, y: 0, w: 10, h: 0.07, fill: { color: C.orange } });

s.addShape(pres.shapes.RECTANGLE, { x: 6.5, y: 0.5, w: 3.3, h: 4.8, fill: { color: C.orange } });
s.addText("NEMONIC\nWORLD", { x: 6.5, y: 1.5, w: 3.3, h: 1.5, fontSize: 32, fontFace: "Arial Black", color: C.white, bold: true, align: "center", valign: "middle", lineSpacingMultiple: 1.3 });
s.addText("상상을 출력하는 세계", { x: 6.5, y: 3.2, w: 3.3, h: 0.5, fontSize: 13, fontFace: "Arial", color: "FFD4A8", align: "center" });

s.addText("Q&A", { x: 0.5, y: 1.2, w: 5, h: 1.2, fontSize: 56, fontFace: "Arial Black", color: C.darkText, bold: true });
s.addShape(pres.shapes.RECTANGLE, { x: 0.5, y: 2.5, w: 2.5, h: 0.05, fill: { color: C.orange } });
s.addText("이상으로 네모닉월드 중간발표를\n마치겠습니다. 감사합니다.", {
  x: 0.5, y: 2.8, w: 5, h: 0.7, fontSize: 15, fontFace: "Arial", color: C.sub, lineSpacingMultiple: 1.6
});
s.addText("SSAFY 중간발표  |  2026.04", { x: 0.5, y: 4.0, w: 4, h: 0.3, fontSize: 11, fontFace: "Arial", color: C.sub });

s.addShape(pres.shapes.OVAL, { x: 0.3, y: 5.0, w: 0.42, h: 0.42, fill: { color: C.orange } });
s.addText("12", { x: 0.3, y: 5.0, w: 0.42, h: 0.42, fontSize: 10, fontFace: "Arial", color: C.white, bold: true, align: "center", valign: "middle" });
s.addText("MANGOSLAB", { x: 8.0, y: 5.15, w: 1.7, h: 0.25, fontSize: 9, fontFace: "Arial", color: C.sub, bold: true, align: "right", charSpacing: 3 });

// ===== 저장 =====
pres.writeFile({ fileName: "/Users/sondahyun/망고슬레브 프로토타입/presentation/네모닉월드_중간발표_v4.pptx" })
  .then(() => console.log("PPTX v4 created!"))
  .catch(err => console.error("Error:", err));
