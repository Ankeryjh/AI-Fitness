import {Exercise, Session} from '../types/models';

const focusLabels: Record<string, string> = {
  chest: '胸部',
  back: '背部',
  legs: '腿部',
  shoulders: '肩部',
  arms: '手臂',
  core: '核心',
};

const focusKeywords: Array<{key: string; keywords: string[]}> = [
  {key: 'chest', keywords: ['胸', '卧推', '飞鸟', 'bench', 'chest', 'incline']},
  {key: 'back', keywords: ['背', '下拉', '划船', '引体', 'pull', 'row', 'lat']},
  {key: 'legs', keywords: ['腿', '深蹲', '腿举', '弓步', 'squat', 'leg', 'lunge']},
  {key: 'shoulders', keywords: ['肩', '推举', '侧平举', 'press', 'shoulder', 'raise']},
  {key: 'arms', keywords: ['臂', '弯举', '三头', '臂屈伸', 'curl', 'triceps', 'biceps']},
  {key: 'core', keywords: ['核心', '卷腹', '平板', 'crunch', 'core', 'plank', 'abs']},
];

const resolveFocusByNames = (names: string[]): string | undefined => {
  const normalized = names.join(' ').toLowerCase();
  if (!normalized) {
    return undefined;
  }

  for (const item of focusKeywords) {
    if (item.keywords.some(keyword => normalized.includes(keyword))) {
      return item.key;
    }
  }

  return undefined;
};

export const getFocusLabel = (focusKey?: string): string =>
  (focusKey && focusLabels[focusKey]) || '综合';

export const getSessionFocusKey = (session: Session, exercises: Exercise[]): string => {
  if (session.focusArea && focusLabels[session.focusArea]) {
    return session.focusArea;
  }

  const names = session.items.map(item => {
    const custom = item.customName?.trim();
    if (custom) {
      return custom;
    }
    return exercises.find(entry => entry.id === item.exerciseId)?.name ?? '';
  });

  return resolveFocusByNames(names) ?? 'mixed';
};

export const getSessionTitle = (session: Session, exercises: Exercise[]): string =>
  `${getFocusLabel(getSessionFocusKey(session, exercises))}训练`;
