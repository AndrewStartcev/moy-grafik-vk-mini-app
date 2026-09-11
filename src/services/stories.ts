import vkBridge from '@vkontakte/vk-bridge';
import { PRESET_LABELS } from '../domain/schedule/presets';
import type { ScheduleConfigV1 } from '../domain/schedule/types';

const APP_URL = 'https://vk.ru/app54765581';
const STORY_WIDTH = 720;
const STORY_HEIGHT = 1280;

export type StoryOpenResult = 'opened' | 'unavailable' | 'failed';

function roundRect(
  context: CanvasRenderingContext2D,
  x: number,
  y: number,
  width: number,
  height: number,
  radius: number,
): void {
  const r = Math.min(radius, width / 2, height / 2);
  context.beginPath();
  context.moveTo(x + r, y);
  context.arcTo(x + width, y, x + width, y + height, r);
  context.arcTo(x + width, y + height, x, y + height, r);
  context.arcTo(x, y + height, x, y, r);
  context.arcTo(x, y, x + width, y, r);
  context.closePath();
}

function drawSun(context: CanvasRenderingContext2D, x: number, y: number, size: number): void {
  context.save();
  context.translate(x, y);
  context.strokeStyle = '#ffffff';
  context.fillStyle = '#ffffff';
  context.lineWidth = 7;
  context.lineCap = 'round';
  context.beginPath();
  context.arc(0, 0, size * 0.2, 0, Math.PI * 2);
  context.fill();
  for (let index = 0; index < 8; index += 1) {
    const angle = (Math.PI * 2 * index) / 8;
    context.beginPath();
    context.moveTo(Math.cos(angle) * size * 0.31, Math.sin(angle) * size * 0.31);
    context.lineTo(Math.cos(angle) * size * 0.47, Math.sin(angle) * size * 0.47);
    context.stroke();
  }
  context.restore();
}

function drawMoon(context: CanvasRenderingContext2D, x: number, y: number, size: number): void {
  context.save();
  context.fillStyle = '#ffffff';
  context.beginPath();
  context.arc(x, y, size * 0.35, 0, Math.PI * 2);
  context.fill();
  context.globalCompositeOperation = 'destination-out';
  context.beginPath();
  context.arc(x + size * 0.16, y - size * 0.1, size * 0.34, 0, Math.PI * 2);
  context.fill();
  context.restore();
}

function createStoryImage(config: ScheduleConfigV1): string {
  const canvas = document.createElement('canvas');
  canvas.width = STORY_WIDTH;
  canvas.height = STORY_HEIGHT;
  const context = canvas.getContext('2d');
  if (!context) throw new Error('story_canvas_unavailable');

  const gradient = context.createLinearGradient(0, 0, STORY_WIDTH, STORY_HEIGHT);
  gradient.addColorStop(0, '#55b8ff');
  gradient.addColorStop(0.48, '#2688eb');
  gradient.addColorStop(1, '#145dcc');
  context.fillStyle = gradient;
  context.fillRect(0, 0, STORY_WIDTH, STORY_HEIGHT);

  context.fillStyle = 'rgba(255, 255, 255, 0.12)';
  context.beginPath();
  context.arc(660, 130, 250, 0, Math.PI * 2);
  context.fill();
  context.beginPath();
  context.arc(60, 1180, 300, 0, Math.PI * 2);
  context.fill();

  context.fillStyle = '#ffffff';
  context.font = '700 34px -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif';
  context.fillText('Мой график', 64, 112);

  context.font = '800 62px -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif';
  context.fillText('Мой график:', 64, 240);

  const presetLabel = PRESET_LABELS[config.preset];
  context.font = '800 76px -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif';
  const maxLabelWidth = STORY_WIDTH - 128;
  if (context.measureText(presetLabel).width <= maxLabelWidth) {
    context.fillText(presetLabel, 64, 330);
  } else {
    context.font = '800 54px -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif';
    const words = presetLabel.split(' ');
    let first = '';
    let second = '';
    for (const word of words) {
      const candidate = first ? `${first} ${word}` : word;
      if (!second && context.measureText(candidate).width <= maxLabelWidth) first = candidate;
      else second = second ? `${second} ${word}` : word;
    }
    context.fillText(first, 64, 320);
    if (second) context.fillText(second, 64, 385);
  }

  context.fillStyle = 'rgba(255,255,255,0.86)';
  context.font = '500 30px -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif';
  context.fillText('Считай смены и выходные внутри VK', 64, 445);

  const cardX = 64;
  const cardY = 530;
  const cardW = STORY_WIDTH - 128;
  const cardH = 430;
  context.fillStyle = 'rgba(255,255,255,0.96)';
  roundRect(context, cardX, cardY, cardW, cardH, 42);
  context.fill();

  context.fillStyle = '#0d223f';
  context.font = '700 34px -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif';
  context.fillText('Цикл смен', cardX + 42, cardY + 70);

  const cellSize = 92;
  const gap = 18;
  const cycle = config.cycle.slice(0, 8);
  const columns = 4;
  cycle.forEach((shift, index) => {
    const col = index % columns;
    const row = Math.floor(index / columns);
    const x = cardX + 42 + col * (cellSize + gap);
    const y = cardY + 110 + row * (cellSize + gap);

    let background = '#edf0f4';
    if (shift === 'day') background = '#3ba8f7';
    if (shift === 'night') background = '#284e9f';
    if (shift === 'full_day') background = '#1f8ae8';

    context.fillStyle = background;
    roundRect(context, x, y, cellSize, cellSize, 24);
    context.fill();

    if (shift === 'day') drawSun(context, x + cellSize / 2, y + cellSize / 2, 44);
    if (shift === 'night') drawMoon(context, x + cellSize / 2, y + cellSize / 2, 58);
    if (shift === 'full_day') {
      context.fillStyle = '#ffffff';
      context.font = '800 28px -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif';
      context.textAlign = 'center';
      context.fillText('24', x + cellSize / 2, y + 57);
      context.textAlign = 'start';
    }
    if (shift === 'off') {
      context.fillStyle = '#9aa7b5';
      context.beginPath();
      context.arc(x + cellSize / 2, y + cellSize / 2, 9, 0, Math.PI * 2);
      context.fill();
    }
  });

  if (config.cycle.length > 8) {
    context.fillStyle = '#818c99';
    context.font = '600 24px -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif';
    context.fillText(`+ ещё ${config.cycle.length - 8}`, cardX + 42, cardY + cardH - 40);
  }

  context.fillStyle = '#ffffff';
  context.font = '700 34px -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif';
  context.fillText('Открой «Мой график»', 64, 1082);
  context.fillStyle = 'rgba(255,255,255,0.82)';
  context.font = '500 26px -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif';
  context.fillText('и настрой свой рабочий цикл', 64, 1124);

  return canvas.toDataURL('image/jpeg', 0.9);
}

async function isAvailable(): Promise<boolean> {
  if (!vkBridge.isEmbedded()) return false;
  try {
    return await vkBridge.supportsAsync('VKWebAppShowStoryBox');
  } catch {
    return false;
  }
}

async function openScheduleStory(config: ScheduleConfigV1): Promise<StoryOpenResult> {
  if (!(await isAvailable())) return 'unavailable';

  let blob: string;
  try {
    blob = createStoryImage(config);
  } catch {
    return 'failed';
  }

  try {
    // Do not await the editor result: some VK Web/MobileWeb clients may not resolve
    // the Bridge promise when the user closes the story editor.
    void vkBridge.send('VKWebAppShowStoryBox', {
      background_type: 'image',
      blob,
      locked: true,
      attachment: {
        text: 'open',
        type: 'url',
        url: APP_URL,
      },
    }).catch(() => undefined);
    return 'opened';
  } catch {
    return 'failed';
  }
}

export const stories = {
  isAvailable,
  openScheduleStory,
};
