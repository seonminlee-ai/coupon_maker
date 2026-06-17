# 쿠폰 목업 생성기 MVP - 빠른 실행 버전

React + Canvas로 만든 원근 왜곡 쿠폰 목업 생성기입니다. OpenCV.js 외부 로딩 없이 바로 실행됩니다.

## 실행 방법

1. Node.js 설치
2. 이 폴더에서 터미널 열기
3. 아래 명령어 실행

```bash
npm install
npm run dev
```

브라우저에 뜨는 주소로 접속하면 됩니다.

- 일반 사용자 화면: `/`
- 관리자 좌표 조정 화면: `/admin`

## 사용 방법

1. 쿠폰 템플릿을 선택합니다.
2. 배경색, 메인 문구, 날짜 문구를 입력합니다.
3. `PNG 다운로드`를 누릅니다.

관리자 화면(`/admin`)에서는 목업 이미지 업로드, 자동 인식, 원근 좌표 조정이 가능합니다.

## 배포 방법

Vercel 또는 Netlify 무료 플랜으로 배포할 수 있습니다.

### Vercel

1. 이 폴더를 GitHub 저장소로 올립니다.
2. Vercel에서 `New Project`를 누르고 저장소를 선택합니다.
3. Build Command는 `npm run build`로 둡니다.
4. Output Directory는 `dist`로 둡니다.
5. 배포 후 생성된 링크를 공유합니다.

### Netlify

1. 이 폴더를 GitHub 저장소로 올립니다.
2. Netlify에서 `Add new site`를 누르고 저장소를 선택합니다.
3. Build Command는 `npm run build`로 둡니다.
4. Publish Directory는 `dist`로 둡니다.
5. 배포 후 생성된 링크를 공유합니다.

## 주의

1번 오프닝 쿠폰과 2번 쇼핑 지원 쿠폰 템플릿이 기본 이미지로 포함되어 있습니다. 자동 인식은 텍스트 없는 이미지와 텍스트 있는 이미지가 같은 크기일 때 가장 정확합니다.

## 구조

- `src/main.jsx`: 화면, Canvas 렌더링, 원근 왜곡 로직
- `src/style.css`: 스타일
- `public/templates/opening-coupon/sample-base.jpg`: 샘플 목업 이미지
