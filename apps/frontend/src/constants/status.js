export const STATUS_TYPES = {
  STORE: {
    OPEN: 'OPEN',
    BREAK: 'BREAK',
    CLOSED: 'CLOSED',
    TEMP_CLOSED: 'TEMP_CLOSED',
    EARLY_CLOSE: 'EARLY_CLOSE',
    PREPARING: 'PREPARING',
  },
  CONGESTION: {
    RELAXED: 'RELAXED',
    NORMAL: 'NORMAL',
    BUSY: 'BUSY',
    VERY_BUSY: 'VERY_BUSY',
  }
};

export const STATUS_UI = {
  STORE: {
    [STATUS_TYPES.STORE.OPEN]: { label: '영업중', colorVar: 'var(--color-status-green)' },
    [STATUS_TYPES.STORE.BREAK]: { label: '브레이크타임', colorVar: 'var(--color-status-yellow)' },
    [STATUS_TYPES.STORE.CLOSED]: { label: '영업종료', colorVar: 'var(--color-status-gray)' },
    [STATUS_TYPES.STORE.TEMP_CLOSED]: { label: '임시휴무', colorVar: 'var(--color-status-red)' },
    [STATUS_TYPES.STORE.EARLY_CLOSE]: { label: '조기마감', colorVar: 'var(--color-status-orange)' },
    [STATUS_TYPES.STORE.PREPARING]: { label: '준비중', colorVar: 'var(--color-status-blue)' },
  },
  CONGESTION: {
    [STATUS_TYPES.CONGESTION.RELAXED]: { label: '여유', colorVar: 'var(--color-status-green)' },
    [STATUS_TYPES.CONGESTION.NORMAL]: { label: '보통', colorVar: 'var(--color-status-yellow)' },
    [STATUS_TYPES.CONGESTION.BUSY]: { label: '혼잡', colorVar: 'var(--color-status-orange)' },
    [STATUS_TYPES.CONGESTION.VERY_BUSY]: { label: '매우 혼잡', colorVar: 'var(--color-status-red)' },
  }
};

export const CATEGORIES = {
  STORE: ['식당', '카페', '베이커리', '주점', '소매점', '병원', '기타'],
  PUBLIC: ['도서관', '주민센터', '공공체육시설', '보건소', '기타']
};
