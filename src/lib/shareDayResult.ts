import type { DayMood } from '../../electron/types';
import { getZoneColor } from './calculations';
import { formatInvestedDuration, formatPercentDelta } from './dayClose';

export interface ShareDayResultInput {
  percent: number;
  mood: DayMood;
  investedMinutes: number;
  streak: number;
  percentDelta: number | null;
  goalReached?: boolean;
  dailyGoalPercent?: number;
  dateKey: string;
}

const CARD_WIDTH = 640;
const CARD_HEIGHT = 400;

function formatShareDate(dateKey: string): string {
  const [y, m, d] = dateKey.split('-').map(Number);
  return new Date(y, m - 1, d).toLocaleDateString('ru-RU', {
    day: 'numeric',
    month: 'long',
  });
}

function darken(hex: string, amount: number): string {
  const n = hex.replace('#', '');
  const r = Math.max(0, parseInt(n.slice(0, 2), 16) - amount);
  const g = Math.max(0, parseInt(n.slice(2, 4), 16) - amount);
  const b = Math.max(0, parseInt(n.slice(4, 6), 16) - amount);
  return `rgb(${r}, ${g}, ${b})`;
}

function roundRect(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  w: number,
  h: number,
  r: number,
): void {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.arcTo(x + w, y, x + w, y + h, r);
  ctx.arcTo(x + w, y + h, x, y + h, r);
  ctx.arcTo(x, y + h, x, y, r);
  ctx.arcTo(x, y, x + w, y, r);
  ctx.closePath();
}

export function renderShareDayResultCanvas(input: ShareDayResultInput): HTMLCanvasElement {
  const canvas = document.createElement('canvas');
  canvas.width = CARD_WIDTH;
  canvas.height = CARD_HEIGHT;
  const ctx = canvas.getContext('2d');
  if (!ctx) throw new Error('Canvas not supported');

  const zone = getZoneColor(input.percent);
  const gradient = ctx.createLinearGradient(0, 0, 0, CARD_HEIGHT);
  gradient.addColorStop(0, zone);
  gradient.addColorStop(1, darken(zone, 35));

  roundRect(ctx, 0, 0, CARD_WIDTH, CARD_HEIGHT, 24);
  ctx.fillStyle = gradient;
  ctx.fill();

  ctx.fillStyle = 'rgba(255, 255, 255, 0.92)';
  ctx.font = '600 18px "Segoe UI", system-ui, sans-serif';
  ctx.textAlign = 'center';
  ctx.fillText(formatShareDate(input.dateKey), CARD_WIDTH / 2, 52);

  ctx.font = '700 96px "Segoe UI", system-ui, sans-serif';
  ctx.fillText(`${Math.round(input.percent)}%`, CARD_WIDTH / 2, 188);

  const invested = formatInvestedDuration(input.investedMinutes);
  const parts: string[] = [invested];
  if (input.streak > 0) parts.push(`${input.streak} дн. подряд`);
  if (input.goalReached && input.dailyGoalPercent != null) {
    parts.push(`цель ${input.dailyGoalPercent}%`);
  }

  ctx.font = '600 22px "Segoe UI", system-ui, sans-serif';
  ctx.fillStyle = 'rgba(255, 255, 255, 0.95)';
  ctx.fillText(parts.join(' · '), CARD_WIDTH / 2, 248);

  const delta = formatPercentDelta(input.percentDelta);
  if (delta) {
    ctx.font = '500 18px "Segoe UI", system-ui, sans-serif';
    ctx.fillStyle = 'rgba(255, 255, 255, 0.82)';
    ctx.fillText(delta, CARD_WIDTH / 2, 286);
  }

  ctx.font = '600 15px "Segoe UI", system-ui, sans-serif';
  ctx.fillStyle = 'rgba(255, 255, 255, 0.75)';
  ctx.fillText('Rocket Shift', CARD_WIDTH / 2, CARD_HEIGHT - 36);

  return canvas;
}

export function shareDayResultToDataUrl(input: ShareDayResultInput): string {
  return renderShareDayResultCanvas(input).toDataURL('image/png');
}

export function shareDayResultDefaultFilename(dateKey: string): string {
  return `rocket-shift-${dateKey}.png`;
}
