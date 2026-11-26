/*
 * 작품 데이터 — 여기만 수정하면 사이트 전체에 반영됩니다.
 *
 * type     : 카테고리 — "video" | "image" | "aesthetic" | "design"
 *            (상세 화면 형태는 카테고리와 별개로 폴더 위치로 정해짐:
 *             ai work/Video/<작품명> = 영상 폼,
 *             ai work/Image · Aesthetic · Design/<작품명> = 이미지 폼)
 * thumb    : 목록/그리드용 작은 이미지 (가로 600px 정도 권장)
 * src      : 상세 화면용 큰 이미지
 * video    : (선택) type이 video일 때 재생할 mp4 경로. 없으면 이미지만 표시
 * images   : (선택) 상세 화면에 추가로 보여줄 이미지 배열
 * tools    : 사용한 AI 모델/툴
 * prompt   : (선택) 프롬프트 원문
 *
 * 로컬 파일을 쓰려면 assets/ 폴더에 넣고 "assets/파일명.jpg" 처럼 적으면 됩니다.
 */
const u = (id, w = 600) =>
  `https://images.unsplash.com/${id}?auto=format&fit=crop&w=${w}&q=80`;

const SAMPLE_VIDEO =
  "https://interactive-examples.mdn.mozilla.net/media/cc0-videos/flower.mp4";

/* ---------- 실제 작품 (ai work 폴더) ---------- */
const MY_WORKS = [
  {
    title: "Cow",
    type: "video",
    year: 2026,
    folder: "Video/Cow", // ai work/Video/Cow — 영상·이미지는 media.js에서 자동으로 가져옴 (원본 4K는 Cow.mp4)
    // 클릭 후 커버 화면 가운데에 보이는 설명 — 줄바꿈(\n)마다 문단이 나뉨
    intro:
      "예상치 못한 장면의 전환으로 선글라스의 디자인을 돋보이게 할 수 있는 광고 영상을 제작해 보았습니다.\n" +
      "가을에 어울리는 벼와 코트를 입은 인물과 베이지색 젖소와 신비로움을 자아내는 푸른 풀.\n" +
      "소비자가 영상을 시청할 때 뒤에 어떤 장면이 연출될지 궁금증을 자아낼 수 있는 시놉시스를 구성해 보았습니다.\n" +
      "이번 영상은 프리비즈를 사용하여 원하고자 하는 영상의 구도와 모션을 실현할 수 있도록 하였습니다.",
    introNote: "해당 영상은 AI로 제작하여 실존 인물이 아니며 의상도 AI 로 제작하였습니다.", // 커버 하단 작은 안내문
    tools: ["Dreamina", "Midjourney", "Photoshop", "Premiere Pro"],
    desc: "",
    // thumb: "ai work/Cow/thumb.jpg",  // 썸네일 이미지를 넣으면 여기에 (없으면 영상 첫 장면 사용)
  },
  {
    title: "Kangol Kids",
    type: "video",
    year: 2026,
    folder: "Video/Kangol Kids", // ai work/Video/Kangol Kids — 영상 + Image 폴더 이미지(오른쪽 패널, 숫자 오름차순)
    // 커버 설명 — 줄바꿈(\n)마다 문단이 나뉨
    intro:
      "사랑하는 아이에게 올 겨울 따뜻하고 포근한 설렘을 선물하세요.\n" +
      "캉골의 아기 캥거루를 캐릭터로 잡아 캉골 키드의 바라클라바, 가방을 선물받은 장면을 연출해보았습니다.\n" +
      "이번 작업에서는 공간, 캐릭터, 제품의 일관성을 유지하는 것을 목표로 진행하였습니다.",
    introNote: "이 영상은 포트폴리오를 위해 캉골 키즈의 로고, 상품을 사용하여 제작하였습니다.", // 커버 하단 작은 안내문
    tools: ["Dreamina", "Midjourney", "Photoshop", "Premiere Pro", "Suno"], // 커버 설명 아래·상세 Tools에 아이콘과 함께 표시
    desc: "",
  },

  /* ----- 이미지 폼 작품 (ai work/Image/<작품명>) -----
   * 폴더만 넣고 sync를 돌리면 자동으로 추가됩니다(제목 = 폴더명, 카테고리 Image).
   * 카테고리·제목·설명을 지정할 때는 아래처럼 적어주세요. */
  {
    title: "Product - Bottle",
    type: "image",
    year: 2026,
    folder: "Image/Product - Bottle",
    intro:
      "인스타 아이디인 N03VER의 문구가 적힌 공병과 자연물들의 자유로운 배치를 Midjourney 로 제작해보았습니다.\n" +
      "물성과 글씨 그리고 배치에 초점을 두어 작업했습니다.",
    introNote: "해당 사진은 AI를 통해 제작되었습니다.",
    tools: ["Midjourney"],
    desc: "",
  },
  {
    title: "Succulent plant",
    type: "aesthetic",
    year: 2026,
    folder: "Aesthetic/Succulent plant",
    intro: "다육 식물과 한국의 미, 도자기의 단아함과 고요함을 담아낸 Ai 비주얼 비디오입니다.",
    introNote: "해당 영상은 AI로 제작하여 실존 인물이 아니며 의상도 AI 로 제작하였습니다.",
    tools: ["Midjourney"],
    desc: "",
  },
];

// 툴 이름 → 아이콘 (assets/icons). 새 툴을 쓰면 아이콘 파일을 넣고 여기에 한 줄 추가
window.TOOL_ICONS = {
  Dreamina: "assets/icons/dreamina.png",
  Midjourney: "assets/icons/midjourney.png",
  Photoshop: "assets/icons/photoshop.svg",
  "Premiere Pro": "assets/icons/premiere-pro.svg",
  Suno: "assets/icons/suno.png",
};

// true로 바꾸면 아래 샘플 작품도 함께 보입니다 (레이아웃 확인용)
const SHOW_SAMPLES = false;

/* ---------- 샘플 작품 (Unsplash) ---------- */
const SAMPLE_WORKS = [
  { title: "A Study in Light", type: "photo", year: 2026, id: "photo-1506794778202-cad84cf45f1d", tools: ["Midjourney v7", "Photoshop"], prompt: "monochrome portrait, single window light, film grain, 85mm", desc: "빛 하나로만 인물의 구조를 드러내는 흑백 초상 시리즈." },
  { title: "Synthetic Eden", type: "photo", year: 2025, id: "photo-1497436072909-f5e4be1717c0", tools: ["Flux 1.1 Pro"], prompt: "dreamlike alpine lake at dawn, mist, medium format", desc: "존재하지 않는 고산 호수를 위한 풍경 연작." },
  { title: "After Image", type: "video", year: 2026, id: "photo-1500530855697-b586d89ba3ee", video: SAMPLE_VIDEO, tools: ["Runway Gen-4", "After Effects"], desc: "사막 위 잔상을 따라가는 12초 루프 영상." },
  { title: "New Mythologies", type: "design", year: 2025, id: "photo-1470770841072-f978cf4d019e", tools: ["Midjourney", "Figma"], desc: "가상의 신화를 위한 포스터 & 키비주얼 시스템." },
  { title: "Soft Machines", type: "photo", year: 2025, id: "photo-1531123414780-f74242c2b052", tools: ["Midjourney v7"], prompt: "editorial fashion portrait, soft chrome accessories, studio", desc: "패션 매거진 에디토리얼을 위한 AI 인물 화보." },
  { title: "The Near Future", type: "video", year: 2026, id: "photo-1462331940025-496dfbfc7564", video: SAMPLE_VIDEO, tools: ["Kling 2.1", "Premiere Pro"], desc: "성운을 통과하는 카메라 무빙 실험." },
  { title: "Quiet Hours", type: "photo", year: 2026, id: "photo-1500648767791-00dcc994a43e", tools: ["Flux 1.1 Pro"], desc: "새벽 4시의 얼굴들." },
  { title: "Bloom Index", type: "design", year: 2026, id: "photo-1557672172-298e090bd0f1", tools: ["Stable Diffusion XL", "Illustrator"], desc: "그라디언트 생성 이미지를 기반으로 한 브랜드 아이덴티티." },
  { title: "Paper Saints", type: "photo", year: 2025, id: "photo-1494790108377-be9c29b29330", tools: ["Midjourney v6.1"], desc: "종이 질감 위의 성화(聖畫) 같은 초상." },
  { title: "Low Tide", type: "video", year: 2025, id: "photo-1469474968028-56623f02e42e", video: SAMPLE_VIDEO, tools: ["Sora", "DaVinci Resolve"], desc: "썰물의 시간을 압축한 타임랩스." },
  { title: "Chromatic Field", type: "design", year: 2025, id: "photo-1550684848-fac1c5b4e853", tools: ["Midjourney", "Figma"], desc: "음반 커버 시리즈 — 색이 소리를 대신할 때." },
  { title: "Understory", type: "photo", year: 2026, id: "photo-1441974231531-c6227db76b6e", tools: ["Flux Dev", "Lightroom"], desc: "숲의 가장 낮은 층위를 기록하는 가상 다큐멘터리." },
  { title: "Self, Rendered", type: "photo", year: 2026, id: "photo-1507003211169-0a1dd7228f2d", tools: ["Midjourney v7"], desc: "렌더링된 자화상 연작." },
  { title: "Liquid Type", type: "design", year: 2026, id: "photo-1618005182384-a83a8bd57fbe", tools: ["Blender", "Stable Diffusion"], desc: "액체처럼 흐르는 3D 타이포그래피 실험." },
  { title: "Summit Signal", type: "video", year: 2026, id: "photo-1506905925346-21bda4d32df4", video: SAMPLE_VIDEO, tools: ["Veo 3"], desc: "산 정상에서 송출되는 가상의 신호를 따라가는 영상." },
  { title: "Gradient Weather", type: "design", year: 2025, id: "photo-1579546929518-9e396f3cc809", tools: ["Figma", "Midjourney"], desc: "날씨 앱을 위한 생성형 배경 시스템." },
  { title: "Glass Garden", type: "photo", year: 2025, id: "photo-1544005313-94ddf0286df2", tools: ["Flux 1.1 Pro"], desc: "유리 온실 속 인물 시리즈." },
  { title: "Pigment Study 04", type: "design", year: 2025, id: "photo-1541701494587-cb58502866ab", tools: ["Stable Diffusion XL"], desc: "물감의 번짐을 학습시킨 텍스처 라이브러리." },
  { title: "Velvet Static", type: "video", year: 2025, id: "photo-1558591710-4b4a1ae0f04d", video: SAMPLE_VIDEO, tools: ["Runway Gen-3", "After Effects"], desc: "아날로그 노이즈를 닮은 뮤직비디오 인서트." },
  { title: "Portrait No. 9", type: "photo", year: 2026, id: "photo-1517841905240-472988babdf9", tools: ["Midjourney v7"], desc: "아홉 번째 가상 인물." },
  { title: "Soft Geometry", type: "design", year: 2026, id: "photo-1620641788421-7a1c342ea42e", tools: ["Blender", "Midjourney"], desc: "부드러운 입체 오브젝트로 만든 전시 그래픽." },
  { title: "Field Notes", type: "photo", year: 2025, id: "photo-1438761681033-6461ffad8d80", tools: ["Flux Dev"], desc: "어디에도 없는 사람들의 현장 기록." },
  { title: "Inner Orbit", type: "design", year: 2026, id: "photo-1604076913837-52ab5629fba9", tools: ["Midjourney", "Photoshop"], desc: "천체를 모티프로 한 패키지 디자인." },
  { title: "Second Skin", type: "photo", year: 2026, id: "photo-1529626455594-4ff0802cfb7e", tools: ["Midjourney v7", "Magnific"], desc: "합성 소재로 만든 의상 룩북." },
];

// 공백·한글이 들어간 파일 경로를 브라우저용으로 변환
const path = (p) => (p && !/^https?:/.test(p) ? encodeURI(p) : p);

// folder가 지정된 작품은 media.js(자동 생성)의 영상·이미지를 사용
const withMedia = (w) => {
  const m = (w.folder && (window.MEDIA || {})[w.folder]) || {};
  return {
    ...w,
    video: w.video || m.video || undefined,
    thumb: w.thumb || m.thumb || undefined,
    gallery: w.gallery || m.gallery || [],
    form: m.kind || undefined, // "video" | "image" — 상세 화면 형태
    // 이미지 작품: 첫 번째 이미지를 상세 화면 큰 이미지로
    src: w.src || (m.kind === "image" ? (m.gallery || [])[0] : undefined),
  };
};

// media.js에는 있지만 MY_WORKS에 적지 않은 폴더 → 자동으로 작품 추가
const listed = new Set(MY_WORKS.map((w) => w.folder));
const AUTO_WORKS = Object.entries(window.MEDIA || {})
  .filter(([key]) => !listed.has(key))
  .map(([key, m]) => ({
    title: key.split("/").pop(),
    // 카테고리 = 넣은 폴더 (Video / Image / Aesthetic / Design)
    type: key.split("/")[0].toLowerCase(),
    year: new Date().getFullYear(),
    folder: key,
    tools: [],
    desc: "",
  }));

window.WORKS = [...MY_WORKS, ...AUTO_WORKS, ...(SHOW_SAMPLES ? SAMPLE_WORKS : [])].map(withMedia).map((w, i) => ({
  ...w,
  no: String(i + 1).padStart(3, "0"),
  video: path(w.video),
  thumb: path(w.thumb) || (w.id ? u(w.id, 600) : ""),
  src: path(w.src) || (w.id ? u(w.id, 2000) : path(w.thumb) || ""),
  images: (w.images || []).map(path),
  gallery: (w.gallery || []).map(path),
}));

window.PROFILE = {
  name: "JIWOO KIM",
  role: "AI Photo · Video · Design",
  bio: "AI작업을 통한 작업을 진행합니다.",
  email: "990day@naver.com",
  links: [
    { label: "Instagram", href: "https://www.instagram.com/n03ver/" }, // 인스타그램 계정 N03VER
  ],
};
