export const formatDuration = (totalSec: number): string => {
  const safe = Math.max(0, Math.round(totalSec));
  const min = Math.floor(safe / 60);
  const sec = safe % 60;
  return `${min}m ${sec.toString().padStart(2, '0')}s`;
};

export const formatChineseDuration = (totalSec: number): string => {
  const safe = Math.max(0, Math.round(totalSec));
  const min = Math.floor(safe / 60);
  const sec = safe % 60;
  return `${min.toString().padStart(2, '0')}分 ${sec.toString().padStart(2, '0')}秒`;
};

export const formatClock = (valueSec: number): string => {
  const safe = Math.max(0, Math.round(valueSec));
  const min = Math.floor(safe / 60);
  const sec = safe % 60;
  return `${min}:${sec.toString().padStart(2, '0')}`;
};

export const formatClockFixed = (valueSec: number): string => {
  const safe = Math.max(0, Math.round(valueSec));
  const min = Math.floor(safe / 60);
  const sec = safe % 60;
  return `${min.toString().padStart(2, '0')}:${sec.toString().padStart(2, '0')}`;
};

export const formatDateTime = (iso: string): string => {
  const date = new Date(iso);
  return date.toLocaleString();
};
