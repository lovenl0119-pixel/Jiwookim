# Jiwoo Kim 포트폴리오 사이트 — 작업 안내

AI 사진·영상·디자인 작품 아카이브. 빌드 도구 없는 정적 사이트(HTML/CSS/JS)이고, 사용자는 한국어로 요청한다. 답변도 한국어로, 코드 용어 없이 쉽게 설명한다.

- 배포: GitHub `lovenl0119-pixel/Jiwookim`의 **main**에 push하면 Vercel이 https://jiwookimworks.vercel.app 에 자동 배포한다(약 1분).
- 사용자가 "깃허브에 올려줘"라고 하면 main에 commit + push하고, 사이트 HTML에 새 `?v=` 숫자가 보일 때까지 확인한 뒤 알려준다.
- 웹(claude.ai/code)에서 작업할 때 브랜치/PR로 올렸다면, 사용자가 원하면 main에 merge까지 해야 사이트에 반영된다는 점을 꼭 안내한다.
- 커밋 작성자 이메일은 `lovenl0119-pixel@users.noreply.github.com`을 쓴다. 개인 이메일을 커밋이나 외부 서비스에 넣지 않는다.

## 파일 구조

| 파일 | 역할 |
| --- | --- |
| `index.html` | 화면 뼈대. CSS/JS를 `?v=숫자`로 불러온다 |
| `styles.css` | 전체 스타일. 반응형은 파일 끝의 `@media`(860px 태블릿 / 640px 모바일 / 560px) |
| `script.js` | 동작 전부(그리드·갤러리 보기, 확대 전환, 커버, 상세, 라이트박스, 커서, 첫 화면 명함) |
| `works.js` | 작품 정보(`MY_WORKS`), 툴 아이콘(`TOOL_ICONS`), About 정보(`PROFILE`) |
| `media.js` | 작품별 영상·썸네일·사진 경로 목록 |
| `ai work/<카테고리>/<작품명>/` | 작품 원본과 웹용 파일 |
| `assets/icons/` | 툴 아이콘 |
| `tools/sync-media.ps1` | (Windows 전용) `ai work`를 읽어 웹용 파일과 `media.js`를 자동 생성 |
| `tools/serve.ps1` | (Windows 전용) 로컬 미리보기 서버 http://127.0.0.1:4173 |

## 수정할 때마다 지킬 것

1. CSS/JS를 고치면 `index.html`의 `?v=` 숫자를 **4곳 모두** 1 올린다. 브라우저 캐시를 막기 위해서다.
2. "모바일만"이라고 하면 `@media (max-width: 640px)` 안에서만 고친다. 컴퓨터 화면은 건드리지 않는다.
3. 커버 설명(`intro`)은 문장 끝 온점(.)마다 `\n`으로 문단을 나눈다. 문장 중간에서는 줄을 바꾸지 않는다.
4. 툴은 `tools: ["Midjourney", "Photoshop"]`처럼 배열로 적는다. 화면에는 아이콘과 이름이 쉼표 없이 띄어쓰기로만 나온다. 새 툴이면 `assets/icons/`에 아이콘을 넣고 `TOOL_ICONS`에 추가한다.
5. 테스트용 임시 파일은 `zz-test*.html`로 만들고(gitignore됨), 끝나면 지운다.

## 작품 추가·수정

**카테고리(메뉴)**는 Video / Image / Aesthetic / Design이다. `works.js`의 `type`은 `"video"`, `"image"`, `"aesthetic"`, `"design"` 중 하나다.

**상세 화면 형태**는 폴더 위치로 정해진다.
- `ai work/Video/<작품명>/` → **영상 폼**: 메인 영상과 오른쪽 사진 목록. 사진을 누르면 크게 보기, 다시 누르면 확대, 끌어서 이동.
  - 폴더에는 메인 mp4(`_web.mp4`가 있으면 그것을 씀), `thumb.png`, `Image/1.png, 2.png…`를 넣는다.
- `ai work/Image|Aesthetic|Design/<작품명>/` → **이미지 폼**: 왼쪽 큰 사진과 오른쪽 썸네일 격자. 방향키나 스와이프로 넘긴다.
  - 폴더에는 사진(또는 mp4)들과 `thumb.png`를 넣는다.

### Windows 데스크톱에서
`powershell -ExecutionPolicy Bypass -File tools\sync-media.ps1`을 실행하면 웹용 JPG와 `media.js`가 자동으로 만들어진다.

### 웹/다른 기기(Linux 등)에서 — sync-media.ps1을 못 쓸 때
`media.js`를 **직접 수정**한다. 파일 머리의 "직접 수정하지 마세요"는 데스크톱용 안내이니 무시해도 된다.
1. 사용자가 GitHub 웹(Add file → Upload files)이나 채팅 첨부로 올린 파일 위치를 확인한다.
2. 사진이 너무 크면(한 장 1MB 이상) 가능한 도구로 긴 변 2000px 안팎의 JPG로 줄여 `_web/` 폴더(영상 폼은 `Image_web/`)에 저장한다. 도구가 없으면 원본 경로를 그대로 써도 된다. 100MB가 넘는 파일은 GitHub에 올라가지 않는다.
3. `media.js`에 항목을 추가한다. 키는 `"<카테고리 폴더>/<작품명>"`이다.
   ```js
   "Design/포스터": {
     kind: "image",            // 영상 폼이면 "video"
     video: "",                // 영상 폼이면 메인 mp4 경로
     thumb: "ai work/Design/포스터/thumb.png",
     gallery: [
       "ai work/Design/포스터/1.jpg",
       "ai work/Design/포스터/2.jpg"
     ],
   },
   ```
4. 제목·설명·툴을 정하려면 `works.js`의 `MY_WORKS`에 항목을 추가한다. `folder`가 위 키와 같아야 한다. 항목이 없으면 폴더명을 제목으로 자동 추가된다.
   ```js
   {
     title: "포스터",
     type: "design",
     year: 2026,
     folder: "Design/포스터",
     intro: "첫 문장입니다.\n두 번째 문장입니다.", // 커버 가운데 설명
     introNote: "해당 이미지는 AI를 통해 제작되었습니다.", // 커버 하단 작은 안내문
     tools: ["Midjourney"],
     desc: "",
   },
   ```

## 확인 방법

- 웹 환경에서는 `python3 -m http.server`나 `npx serve` 등으로 띄워서 확인할 수 있으면 확인한다.
- 모바일은 390px 폭으로 본다. headless Chrome은 창 최소 폭이 약 500px라 모바일 크기가 그대로 나오지 않는다. 폭 390px짜리 iframe에 넣어서 찍는다.
- 로컬에서 확인할 수 없으면 PR의 Vercel 미리보기 주소나 배포 후 실제 사이트로 확인하도록 안내한다.

## 사용자의 디자인 취향 (지금까지 정해진 것)

- 깔끔하고 에디토리얼한 디자이너 아카이브 느낌이다. 폰트는 Instrument Serif(제목), IBM Plex Mono(작은 라벨), Pretendard(본문)를 쓴다.
- **멀미 나는 움직임은 금지.** 스크롤에 따라 사진이 흔들리거나 일렁이는 효과를 쓰지 않는다.
- 작품을 열 때는 썸네일이 은은하게 화면 가득 커지는 전환을 쓴다. 물방울·블라인드·문·커튼 같은 화려한 전환은 모두 거절됐다.
- 첫 화면은 명함 디자인이고, 클릭하면 명함이 왼쪽 위 모서리를 축으로 위로 돌아가며 사라진다.
- 커서는 작은 원이다. 콘텐츠 위에서는 40px 검은 원 안에 View / Next / Zoom / Drag / Close가 표시된다.
- About: JIWOO KIM / "AI작업을 통한 작업을 진행합니다." / 990day@naver.com / Instagram N03VER만 표시한다.
