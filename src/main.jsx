import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { createRoot } from 'react-dom/client';
import './style.css';

const TEMPLATE_1_BASE_SRC = '/templates/opening-coupon/coupon-template-1-base.png';
const TEMPLATE_1_REFERENCE_SRC = '/templates/opening-coupon/coupon-template-1-reference.png';
const TEMPLATE_2_BASE_SRC = '/templates/opening-coupon/coupon-template-2-base.png';
const TEMPLATE_2_REFERENCE_SRC = '/templates/opening-coupon/coupon-template-2-reference.png';
const TEMPLATE_3_BASE_SRC = '/templates/coupon 3/coupon-template-3-base.png';
const TEMPLATE_3_REFERENCE_SRC = '/templates/coupon 3/coupon-template-3-reference.png';
const TEMPLATE_4_BASE_SRC = '/templates/coupon 4/coupon-template-4-base.png';
const TEMPLATE_4_REFERENCE_SRC = '/templates/coupon 4/coupon-template-4-reference.png';

const TEMPLATE_PRESETS = {
  template1: {
    label: '1번 오프닝 쿠폰',
    baseSrc: TEMPLATE_1_BASE_SRC,
    referenceSrc: TEMPLATE_1_REFERENCE_SRC,
    bgColor: '#FE4900',
    title: '무신사 무진장 오프닝 쿠폰',
    date: '2026.06.16까지',
  },
  template2: {
    label: '2번 쇼핑 지원 쿠폰',
    baseSrc: TEMPLATE_2_BASE_SRC,
    referenceSrc: TEMPLATE_2_REFERENCE_SRC,
    bgColor: '#FFFFFF',
    title: '무진장 쇼핑 지원 쿠폰 12%',
    date: '무신사만의 쇼핑 혜택',
  },
  template3: {
    label: '3번 무신사 티켓 쿠폰',
    baseSrc: TEMPLATE_3_BASE_SRC,
    referenceSrc: TEMPLATE_3_REFERENCE_SRC,
    bgColor: '#FFFFFF',
    title: '쿠폰텍스트를입력해주세요18자',
    date: '쿠폰텍스트를입력해주세요18자',
  },
  template4: {
    label: '4번 무신사 티켓 쿠폰',
    baseSrc: TEMPLATE_4_BASE_SRC,
    referenceSrc: TEMPLATE_4_REFERENCE_SRC,
    bgColor: '#FFFFFF',
    title: '쿠폰명 공백 포함 최대 18자 이내',
    date: '5일 23:10:39 남음',
  },
};

function createTemplateConfig(preset) {
  return {
    bgColor: preset.bgColor,
    title: preset.title,
    date: preset.date,
    textBlocks: {
      main: {
        sourceWidth: 620,
        sourceHeight: 58,
        font: '600 42px Pretendard, Apple SD Gothic Neo, Noto Sans KR, Arial, sans-serif',
        paddingX: 10,
        paddingY: 8,
        corners: {
          topLeft: [217, 322],
          topRight: [754, 375],
          bottomRight: [747, 409],
          bottomLeft: [210, 355],
        },
      },
      sub: {
        sourceWidth: 620,
        sourceHeight: 44,
        font: '400 30px Pretendard, Apple SD Gothic Neo, Noto Sans KR, Arial, sans-serif',
        paddingX: 10,
        paddingY: 7,
        corners: {
          topLeft: [208, 365],
          topRight: [746, 419],
          bottomRight: [741, 447],
          bottomLeft: [203, 392],
        },
      },
    },
  };
}

const textBlockLabels = {
  main: '메인 문구',
  sub: '서브 문구',
};

const textBlockGuideColors = {
  main: '#FE4900',
  sub: '#0066FF',
};

const cornerLabels = {
  topLeft: '좌상단',
  topRight: '우상단',
  bottomRight: '우하단',
  bottomLeft: '좌하단',
};

function createFont(weight, size) {
  return `${weight} ${size}px Pretendard, Apple SD Gothic Neo, Noto Sans KR, Arial, sans-serif`;
}

function measureTextWidth(text, font) {
  const canvas = document.createElement('canvas');
  const ctx = canvas.getContext('2d');
  ctx.font = font;
  return ctx.measureText(text).width;
}

function createFittedFont(text, weight, targetWidth, targetHeight, maxSize) {
  let low = 8;
  let high = maxSize;
  let best = low;

  for (let step = 0; step < 18; step++) {
    const size = (low + high) / 2;
    const font = createFont(weight, size);
    const measuredWidth = measureTextWidth(text, font);
    const fitsWidth = measuredWidth <= targetWidth;
    const fitsHeight = size <= targetHeight;

    if (fitsWidth && fitsHeight) {
      best = size;
      low = size;
    } else {
      high = size;
    }
  }

  return createFont(weight, Math.round(best * 10) / 10);
}

function loadImage(src) {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => resolve(img);
    img.onerror = reject;
    img.src = src;
  });
}

function getImagePixels(image) {
  const width = image.naturalWidth || image.width;
  const height = image.naturalHeight || image.height;
  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext('2d');
  ctx.drawImage(image, 0, 0, width, height);
  return ctx.getImageData(0, 0, width, height).data;
}

function makeTextMask(baseImage, referenceImage) {
  const width = baseImage.naturalWidth || baseImage.width;
  const height = baseImage.naturalHeight || baseImage.height;
  const referenceWidth = referenceImage.naturalWidth || referenceImage.width;
  const referenceHeight = referenceImage.naturalHeight || referenceImage.height;

  if (width !== referenceWidth || height !== referenceHeight) {
    throw new Error('두 이미지 크기가 다릅니다. 같은 크기의 텍스트 없는 이미지와 텍스트 있는 이미지를 사용해주세요.');
  }

  const base = getImagePixels(baseImage);
  const reference = getImagePixels(referenceImage);
  const mask = new Uint8Array(width * height);

  for (let index = 0; index < width * height; index++) {
    const offset = index * 4;
    const br = base[offset];
    const bg = base[offset + 1];
    const bb = base[offset + 2];
    const rr = reference[offset];
    const rg = reference[offset + 1];
    const rb = reference[offset + 2];
    const baseLuma = br * 0.299 + bg * 0.587 + bb * 0.114;
    const refLuma = rr * 0.299 + rg * 0.587 + rb * 0.114;
    const colorDiff = Math.abs(br - rr) + Math.abs(bg - rg) + Math.abs(bb - rb);

    if (colorDiff > 42 && refLuma < 205 && baseLuma - refLuma > 18) {
      mask[index] = 1;
    }
  }

  return { mask, width, height };
}

function getOrientedBox(points, paddingX = 12, paddingY = 9) {
  const count = points.length;
  const mean = points.reduce(([sx, sy], [x, y]) => [sx + x, sy + y], [0, 0]).map((value) => value / count);

  let covXX = 0;
  let covXY = 0;
  let covYY = 0;
  points.forEach(([x, y]) => {
    const dx = x - mean[0];
    const dy = y - mean[1];
    covXX += dx * dx;
    covXY += dx * dy;
    covYY += dy * dy;
  });

  let angle = 0.5 * Math.atan2(2 * covXY, covXX - covYY);
  if (Math.cos(angle) < 0) angle += Math.PI;

  const axisX = [Math.cos(angle), Math.sin(angle)];
  const axisY = [-Math.sin(angle), Math.cos(angle)];
  let minX = Infinity;
  let maxX = -Infinity;
  let minY = Infinity;
  let maxY = -Infinity;

  points.forEach(([x, y]) => {
    const dx = x - mean[0];
    const dy = y - mean[1];
    const projectedX = dx * axisX[0] + dy * axisX[1];
    const projectedY = dx * axisY[0] + dy * axisY[1];
    minX = Math.min(minX, projectedX);
    maxX = Math.max(maxX, projectedX);
    minY = Math.min(minY, projectedY);
    maxY = Math.max(maxY, projectedY);
  });

  minX -= paddingX;
  maxX += paddingX;
  minY -= paddingY;
  maxY += paddingY;

  const toPoint = (projectedX, projectedY) => ([
    Math.round(mean[0] + axisX[0] * projectedX + axisY[0] * projectedY),
    Math.round(mean[1] + axisX[1] * projectedX + axisY[1] * projectedY),
  ]);

  const corners = {
    topLeft: toPoint(minX, minY),
    topRight: toPoint(maxX, minY),
    bottomRight: toPoint(maxX, maxY),
    bottomLeft: toPoint(minX, maxY),
  };

  return {
    corners,
    width: Math.max(40, Math.round(maxX - minX)),
    height: Math.max(24, Math.round(maxY - minY)),
    centerY: mean[1],
    area: points.length,
  };
}

function findTextComponents(mask, width, height) {
  const visited = new Uint8Array(width * height);
  const components = [];

  for (let index = 0; index < mask.length; index++) {
    if (!mask[index] || visited[index]) continue;

    const stack = [index];
    const points = [];
    let minX = width;
    let maxX = 0;
    let minY = height;
    let maxY = 0;
    visited[index] = 1;

    while (stack.length) {
      const current = stack.pop();
      const x = current % width;
      const y = Math.floor(current / width);
      points.push([x, y]);
      minX = Math.min(minX, x);
      maxX = Math.max(maxX, x);
      minY = Math.min(minY, y);
      maxY = Math.max(maxY, y);

      for (let nextY = y - 1; nextY <= y + 1; nextY++) {
        for (let nextX = x - 1; nextX <= x + 1; nextX++) {
          if (nextX === x && nextY === y) continue;
          if (nextX < 0 || nextX >= width || nextY < 0 || nextY >= height) continue;

          const nextIndex = nextY * width + nextX;
          if (!mask[nextIndex] || visited[nextIndex]) continue;
          visited[nextIndex] = 1;
          stack.push(nextIndex);
        }
      }
    }

    if (points.length > 4 && maxX - minX > 1 && maxY - minY > 1) {
      components.push({
        points,
        area: points.length,
        minX,
        maxX,
        minY,
        maxY,
      });
    }
  }

  return components;
}

function keepLargestHorizontalCluster(components) {
  const clusters = [];
  let current = [];
  let currentMaxX = null;

  components
    .slice()
    .sort((a, b) => a.minX - b.minX)
    .forEach((component) => {
      if (currentMaxX !== null && component.minX - currentMaxX > 45) {
        clusters.push(current);
        current = [];
      }

      current.push(component);
      currentMaxX = Math.max(currentMaxX ?? component.maxX, component.maxX);
    });

  if (current.length) clusters.push(current);
  return clusters.sort((a, b) => (
    b.reduce((sum, component) => sum + component.area, 0) -
    a.reduce((sum, component) => sum + component.area, 0)
  ))[0] ?? [];
}

function splitComponentsIntoTextLines(components, width) {
  const leftTextComponents = components.filter((component) => {
    const centerX = (component.minX + component.maxX) / 2;
    return centerX < width * 0.55;
  });
  const usableComponents = leftTextComponents.length >= 2 ? leftTextComponents : components;

  if (usableComponents.length < 2) return [];

  const sortedY = usableComponents.map((component) => component.minY).sort((a, b) => a - b);
  let largestGap = 0;
  let splitY = sortedY[0];

  for (let index = 0; index < sortedY.length - 1; index++) {
    const gap = sortedY[index + 1] - sortedY[index];
    if (gap > largestGap) {
      largestGap = gap;
      splitY = (sortedY[index] + sortedY[index + 1]) / 2;
    }
  }

  return [
    keepLargestHorizontalCluster(usableComponents.filter((component) => component.minY < splitY)),
    keepLargestHorizontalCluster(usableComponents.filter((component) => component.minY >= splitY)),
  ]
    .map((lineComponents) => lineComponents.flatMap((component) => component.points))
    .filter((points) => points.length > 80)
    .sort((a, b) => (
      a.reduce((sum, [, y]) => sum + y, 0) / a.length -
      b.reduce((sum, [, y]) => sum + y, 0) / b.length
    ));
}

function detectTextBlocks(baseImage, referenceImage) {
  const { mask, width, height } = makeTextMask(baseImage, referenceImage);
  const components = findTextComponents(mask, width, height);
  const boxes = splitComponentsIntoTextLines(components, width)
    .map((points) => getOrientedBox(points))
    .filter((box) => box.width > 90 && box.height > 20)
    .sort((a, b) => a.centerY - b.centerY);

  if (boxes.length < 2) {
    throw new Error('메인/서브 문구를 찾지 못했습니다. 두 이미지가 같은 템플릿인지 확인해주세요.');
  }

  const [mainBox, subBox] = boxes;
  return {
    main: mainBox,
    sub: subBox,
  };
}

function makeTextCanvas({ text, width, height, font, paddingX = 0, paddingY = 0 }) {
  const textCanvas = document.createElement('canvas');
  textCanvas.width = width;
  textCanvas.height = height;
  const ctx = textCanvas.getContext('2d');
  ctx.clearRect(0, 0, width, height);

  ctx.fillStyle = '#111111';
  ctx.textBaseline = 'top';
  ctx.font = font;
  ctx.fillText(text, paddingX, paddingY);

  return textCanvas;
}

function bilinear(corners, u, v) {
  const [tl, tr, br, bl] = corners;
  const x =
    (1 - u) * (1 - v) * tl[0] +
    u * (1 - v) * tr[0] +
    u * v * br[0] +
    (1 - u) * v * bl[0];
  const y =
    (1 - u) * (1 - v) * tl[1] +
    u * (1 - v) * tr[1] +
    u * v * br[1] +
    (1 - u) * v * bl[1];
  return [x, y];
}

function drawTriangleImage(ctx, img, s0, s1, s2, d0, d1, d2) {
  const [x0, y0] = s0;
  const [x1, y1] = s1;
  const [x2, y2] = s2;
  const [u0, v0] = d0;
  const [u1, v1] = d1;
  const [u2, v2] = d2;
  const denom = x0 * (y1 - y2) + x1 * (y2 - y0) + x2 * (y0 - y1);
  if (Math.abs(denom) < 0.0001) return;

  const a = (u0 * (y1 - y2) + u1 * (y2 - y0) + u2 * (y0 - y1)) / denom;
  const c = (u0 * (x2 - x1) + u1 * (x0 - x2) + u2 * (x1 - x0)) / denom;
  const e = (u0 * (x1 * y2 - x2 * y1) + u1 * (x2 * y0 - x0 * y2) + u2 * (x0 * y1 - x1 * y0)) / denom;

  const b = (v0 * (y1 - y2) + v1 * (y2 - y0) + v2 * (y0 - y1)) / denom;
  const d = (v0 * (x2 - x1) + v1 * (x0 - x2) + v2 * (x1 - x0)) / denom;
  const f = (v0 * (x1 * y2 - x2 * y1) + v1 * (x2 * y0 - x0 * y2) + v2 * (x0 * y1 - x1 * y0)) / denom;

  ctx.save();
  ctx.beginPath();
  ctx.moveTo(u0, v0);
  ctx.lineTo(u1, v1);
  ctx.lineTo(u2, v2);
  ctx.closePath();
  ctx.clip();
  ctx.setTransform(a, b, c, d, e, f);
  ctx.drawImage(img, 0, 0);
  ctx.restore();
}

function drawWarpedCanvas(ctx, srcCanvas, corners, steps = 32) {
  const sw = srcCanvas.width;
  const sh = srcCanvas.height;
  for (let row = 0; row < steps; row++) {
    for (let col = 0; col < steps; col++) {
      const u0 = col / steps;
      const u1 = (col + 1) / steps;
      const v0 = row / steps;
      const v1 = (row + 1) / steps;

      const sTL = [u0 * sw, v0 * sh];
      const sTR = [u1 * sw, v0 * sh];
      const sBR = [u1 * sw, v1 * sh];
      const sBL = [u0 * sw, v1 * sh];

      const dTL = bilinear(corners, u0, v0);
      const dTR = bilinear(corners, u1, v0);
      const dBR = bilinear(corners, u1, v1);
      const dBL = bilinear(corners, u0, v1);

      drawTriangleImage(ctx, srcCanvas, sTL, sTR, sBR, dTL, dTR, dBR);
      drawTriangleImage(ctx, srcCanvas, sTL, sBR, sBL, dTL, dBR, dBL);
    }
  }
}

function getCornersArray(corners) {
  return [
    corners.topLeft,
    corners.topRight,
    corners.bottomRight,
    corners.bottomLeft,
  ];
}

function drawGuide(ctx, cornersArray, label, color) {
  ctx.save();
  ctx.lineWidth = 3;
  ctx.strokeStyle = color;
  ctx.setLineDash([8, 6]);
  ctx.beginPath();
  cornersArray.forEach(([x, y], index) => {
    if (index === 0) ctx.moveTo(x, y);
    else ctx.lineTo(x, y);
  });
  ctx.closePath();
  ctx.stroke();
  ctx.setLineDash([]);
  ctx.font = '700 20px Pretendard, Apple SD Gothic Neo, Noto Sans KR, Arial, sans-serif';
  ctx.textBaseline = 'bottom';
  ctx.fillStyle = color;
  ctx.fillText(label, cornersArray[0][0], cornersArray[0][1] - 12);
  cornersArray.forEach(([x, y]) => {
    ctx.fillStyle = '#ffffff';
    ctx.strokeStyle = color;
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.arc(x, y, 10, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();
  });
  ctx.restore();
}

function App() {
  const previewRef = useRef(null);
  const fileInputRef = useRef(null);
  const referenceInputRef = useRef(null);
  const autoDetectDoneRef = useRef(false);
  const isAdmin = window.location.pathname === '/admin';
  const [selectedTemplateId, setSelectedTemplateId] = useState('template1');
  const [baseSrc, setBaseSrc] = useState(TEMPLATE_PRESETS.template1.baseSrc);
  const [referenceSrc, setReferenceSrc] = useState(TEMPLATE_PRESETS.template1.referenceSrc);
  const [baseImageState, setBaseImageState] = useState(null);
  const [referenceImageState, setReferenceImageState] = useState(null);
  const [template, setTemplate] = useState(() => createTemplateConfig(TEMPLATE_PRESETS.template1));
  const [draggingCorner, setDraggingCorner] = useState(null);
  const [status, setStatus] = useState('1번 쿠폰 템플릿 준비 완료');

  useEffect(() => {
    let canceled = false;
    setBaseImageState(null);
    loadImage(baseSrc)
      .then((image) => {
        if (!canceled) setBaseImageState({ src: baseSrc, image });
      })
      .catch(() => {
        if (!canceled) setStatus('이미지를 불러오지 못했습니다.');
      });

    return () => {
      canceled = true;
    };
  }, [baseSrc]);

  useEffect(() => {
    let canceled = false;
    if (!referenceSrc) {
      setReferenceImageState(null);
      return;
    }

    setReferenceImageState(null);
    loadImage(referenceSrc)
      .then((image) => {
        if (!canceled) setReferenceImageState({ src: referenceSrc, image });
      })
      .catch(() => {
        if (!canceled) setStatus('텍스트 있는 이미지를 불러오지 못했습니다.');
      });

    return () => {
      canceled = true;
    };
  }, [referenceSrc]);

  const baseImage = baseImageState?.src === baseSrc ? baseImageState.image : null;
  const referenceImage = referenceImageState?.src === referenceSrc ? referenceImageState.image : null;

  const applyAutoDetect = useCallback(() => {
    if (!baseImage || !referenceImage) return;

    try {
      const detected = detectTextBlocks(baseImage, referenceImage);
      const mainPadding = { x: 12, y: 9 };
      const subPadding = { x: 10, y: 8 };
      setTemplate((prev) => ({
        ...prev,
        textBlocks: {
          main: {
            ...prev.textBlocks.main,
            sourceWidth: detected.main.width,
            sourceHeight: detected.main.height,
            paddingX: mainPadding.x,
            paddingY: mainPadding.y,
            font: createFittedFont(
              prev.title,
              '600',
              detected.main.width - mainPadding.x,
              detected.main.height - mainPadding.y * 1.2,
              Math.max(24, detected.main.height * 0.9),
            ),
            corners: detected.main.corners,
          },
          sub: {
            ...prev.textBlocks.sub,
            sourceWidth: detected.sub.width,
            sourceHeight: detected.sub.height,
            paddingX: subPadding.x,
            paddingY: subPadding.y,
            font: createFittedFont(
              prev.date,
              '400',
              detected.sub.width - subPadding.x,
              detected.sub.height - subPadding.y * 1.2,
              Math.max(18, detected.sub.height * 0.9),
            ),
            corners: detected.sub.corners,
          },
        },
      }));
      autoDetectDoneRef.current = true;
      setStatus('텍스트 위치 자동 인식 완료');
    } catch (error) {
      autoDetectDoneRef.current = false;
      setStatus(error.message);
    }
  }, [baseImage, referenceImage]);

  useEffect(() => {
    if (!baseImage || !referenceImage || autoDetectDoneRef.current) return;
    applyAutoDetect();
  }, [applyAutoDetect, baseImage, referenceImage]);

  const textLayers = useMemo(() => ([
    { key: 'main', text: template.title, label: textBlockLabels.main },
    { key: 'sub', text: template.date, label: textBlockLabels.sub },
  ]), [template.title, template.date]);

  const drawFinal = useCallback((canvas, showGuide = true) => {
    if (!canvas || !baseImage) return;

    const width = baseImage.naturalWidth || baseImage.width;
    const height = baseImage.naturalHeight || baseImage.height;
    canvas.width = width;
    canvas.height = height;
    const ctx = canvas.getContext('2d');

    ctx.setTransform(1, 0, 0, 1, 0, 0);
    ctx.clearRect(0, 0, width, height);
    ctx.fillStyle = template.bgColor;
    ctx.fillRect(0, 0, width, height);
    ctx.drawImage(baseImage, 0, 0, width, height);

    textLayers.forEach(({ key, text, label }) => {
      const block = template.textBlocks[key];
      const textCanvas = makeTextCanvas({
        text,
        width: block.sourceWidth,
        height: block.sourceHeight,
        font: block.font,
        paddingX: block.paddingX,
        paddingY: block.paddingY,
      });
      const cornersArray = getCornersArray(block.corners);

      drawWarpedCanvas(ctx, textCanvas, cornersArray, 24);
      if (showGuide) drawGuide(ctx, cornersArray, label, textBlockGuideColors[key]);
    });
  }, [baseImage, template, textLayers]);

  useEffect(() => {
    drawFinal(previewRef.current, isAdmin);
  }, [drawFinal, isAdmin]);

  const updateCorner = (blockKey, cornerKey, index, value) => {
    setTemplate((prev) => ({
      ...prev,
      textBlocks: {
        ...prev.textBlocks,
        [blockKey]: {
          ...prev.textBlocks[blockKey],
          corners: {
            ...prev.textBlocks[blockKey].corners,
            [cornerKey]: index === 0
              ? [Number(value), prev.textBlocks[blockKey].corners[cornerKey][1]]
              : [prev.textBlocks[blockKey].corners[cornerKey][0], Number(value)],
          },
        },
      },
    }));
  };

  const getCanvasPoint = (event) => {
    const canvas = previewRef.current;
    const rect = canvas.getBoundingClientRect();
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;
    return [
      Math.round((event.clientX - rect.left) * scaleX),
      Math.round((event.clientY - rect.top) * scaleY),
    ];
  };

  const handlePointerDown = (event) => {
    if (!isAdmin) return;
    const [mx, my] = getCanvasPoint(event);
    const hits = Object.entries(template.textBlocks).flatMap(([blockKey, block]) => (
      Object.entries(block.corners).map(([cornerKey, [x, y]]) => ({
        blockKey,
        cornerKey,
        distance: Math.hypot(mx - x, my - y),
      }))
    ));
    const hit = hits
      .filter(({ distance }) => distance < 24)
      .sort((a, b) => a.distance - b.distance)[0];
    if (hit) setDraggingCorner({ blockKey: hit.blockKey, cornerKey: hit.cornerKey });
  };

  const handlePointerMove = (event) => {
    if (!isAdmin || !draggingCorner) return;
    const [x, y] = getCanvasPoint(event);
    setTemplate((prev) => ({
      ...prev,
      textBlocks: {
        ...prev.textBlocks,
        [draggingCorner.blockKey]: {
          ...prev.textBlocks[draggingCorner.blockKey],
          corners: {
            ...prev.textBlocks[draggingCorner.blockKey].corners,
            [draggingCorner.cornerKey]: [x, y],
          },
        },
      },
    }));
  };

  const handlePointerUp = () => setDraggingCorner(null);

  const downloadImage = () => {
    const temp = document.createElement('canvas');
    drawFinal(temp, false);
    const link = document.createElement('a');
    link.download = 'coupon-mockup.png';
    link.href = temp.toDataURL('image/png');
    link.click();
  };

  const handleUpload = (event) => {
    const file = event.target.files?.[0];
    if (!file) return;
    const url = URL.createObjectURL(file);
    autoDetectDoneRef.current = false;
    setBaseImageState(null);
    setBaseSrc(url);
  };

  const handleReferenceUpload = (event) => {
    const file = event.target.files?.[0];
    if (!file) return;
    const url = URL.createObjectURL(file);
    autoDetectDoneRef.current = false;
    setReferenceImageState(null);
    setReferenceSrc(url);
  };

  const handleTemplateChange = (event) => {
    const nextTemplateId = event.target.value;
    const preset = TEMPLATE_PRESETS[nextTemplateId];

    autoDetectDoneRef.current = false;
    setBaseImageState(null);
    setReferenceImageState(null);
    setSelectedTemplateId(nextTemplateId);
    setBaseSrc(preset.baseSrc);
    setReferenceSrc(preset.referenceSrc);
    setTemplate(createTemplateConfig(preset));
    setStatus(`${preset.label} 불러오는 중`);
  };

  return (
    <main className="app">
      <aside className="panel">
        <h1>쿠폰 목업 생성기</h1>
        {isAdmin && <p className="adminBadge">관리자</p>}
        <p className="status">{status}</p>

        <section>
          <h2>1. 템플릿</h2>
          <label>쿠폰 템플릿</label>
          <select value={selectedTemplateId} onChange={handleTemplateChange}>
            {Object.entries(TEMPLATE_PRESETS).map(([key, preset]) => (
              <option key={key} value={key}>{preset.label}</option>
            ))}
          </select>
        </section>

        {isAdmin && (
          <section>
            <h2>2. 목업 이미지</h2>
            <button onClick={() => fileInputRef.current?.click()}>텍스트 없는 PNG 업로드</button>
            <input ref={fileInputRef} type="file" accept="image/*" onChange={handleUpload} hidden />
            <button className="secondary" onClick={() => referenceInputRef.current?.click()}>텍스트 있는 PNG로 자동 인식</button>
            <input ref={referenceInputRef} type="file" accept="image/*" onChange={handleReferenceUpload} hidden />
            <button className="secondary" onClick={applyAutoDetect} disabled={!baseImage || !referenceImage}>현재 이미지로 다시 인식</button>
            <p className="hint">같은 크기의 텍스트 없는 이미지와 텍스트 있는 이미지를 넣으면 글자 위치를 자동으로 잡습니다.</p>
          </section>
        )}

        <section>
          <h2>{isAdmin ? '3. 내용 변경' : '2. 내용 변경'}</h2>
          <label>배경색</label>
          <div className="row">
            <input type="color" value={template.bgColor} onChange={(e) => setTemplate({ ...template, bgColor: e.target.value })} />
            <input value={template.bgColor} onChange={(e) => setTemplate({ ...template, bgColor: e.target.value })} />
          </div>

          <label>메인 문구</label>
          <input value={template.title} onChange={(e) => setTemplate({ ...template, title: e.target.value })} />

          <label>날짜 문구</label>
          <input value={template.date} onChange={(e) => setTemplate({ ...template, date: e.target.value })} />
        </section>

        {isAdmin && (
          <section>
            <h2>4. 원근 좌표</h2>
            <p className="hint">미리보기의 흰색 점을 드래그하면 메인/서브 문구 위치를 각각 조정할 수 있습니다.</p>
            {Object.entries(template.textBlocks).map(([blockKey, block]) => (
              <div className="coordGroup" key={blockKey}>
                <h3 style={{ color: textBlockGuideColors[blockKey] }}>{textBlockLabels[blockKey]}</h3>
                {Object.entries(block.corners).map(([cornerKey, value]) => (
                  <div className="corner" key={cornerKey}>
                    <strong>{cornerLabels[cornerKey]}</strong>
                    <input type="number" value={value[0]} onChange={(e) => updateCorner(blockKey, cornerKey, 0, e.target.value)} />
                    <input type="number" value={value[1]} onChange={(e) => updateCorner(blockKey, cornerKey, 1, e.target.value)} />
                  </div>
                ))}
              </div>
            ))}
          </section>
        )}

        <button className="download" onClick={downloadImage} disabled={!baseImage}>PNG 다운로드</button>
      </aside>

      <section className="previewWrap">
        <canvas
          ref={previewRef}
          onPointerDown={handlePointerDown}
          onPointerMove={handlePointerMove}
          onPointerUp={handlePointerUp}
          onPointerLeave={handlePointerUp}
          data-admin={isAdmin ? 'true' : 'false'}
        />
      </section>
    </main>
  );
}

createRoot(document.getElementById('root')).render(<App />);
