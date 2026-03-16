import { STATUS_TYPES } from '../constants/status';

export const mockPublicInstitutions = [
  {
    id: 'public-1',
    name: '강남구립도서관',
    category: '도서관',
    address: '서울시 강남구 삼성로 123',
    status: STATUS_TYPES.CONGESTION.NORMAL,
    estimatedWaitTime: '0분',
    businessHours: '09:00 - 22:00',
    lastStatusUpdate: '5분 전',
    favorites: 1045,
    lat: 37.511234,
    lng: 127.051234,
    hourlyCongestion: [
      { time: '09:00', level: 10 },
      { time: '12:00', level: 40 },
      { time: '15:00', level: 80 },
      { time: '18:00', level: 60 },
      { time: '21:00', level: 20 },
    ]
  },
  {
    id: 'public-2',
    name: '서초1동 주민센터',
    category: '주민센터',
    address: '서울시 서초구 서초대로 321',
    status: STATUS_TYPES.CONGESTION.BUSY,
    estimatedWaitTime: '15분',
    businessHours: '09:00 - 18:00',
    lastStatusUpdate: '방금 전',
    favorites: 231,
    lat: 37.491234,
    lng: 127.011234,
    hourlyCongestion: [
      { time: '09:00', level: 20 },
      { time: '11:00', level: 90 },
      { time: '14:00', level: 70 },
      { time: '16:00', level: 40 },
      { time: '18:00', level: 10 },
    ]
  },
  {
    id: 'public-3',
    name: '역삼 체육문화센터',
    category: '공공체육시설',
    address: '서울시 강남구 역삼로 456',
    status: STATUS_TYPES.CONGESTION.RELAXED,
    estimatedWaitTime: '0분',
    businessHours: '06:00 - 22:00',
    lastStatusUpdate: '10분 전',
    favorites: 856,
    lat: 37.498765,
    lng: 127.038765,
    hourlyCongestion: [
      { time: '07:00', level: 60 },
      { time: '10:00', level: 20 },
      { time: '14:00', level: 30 },
      { time: '19:00', level: 85 },
      { time: '21:00', level: 40 },
    ]
  },
  {
    id: 'public-4',
    name: '강남구 보건소',
    category: '보건소',
    address: '서울시 강남구 선릉로 789',
    status: STATUS_TYPES.CONGESTION.VERY_BUSY,
    estimatedWaitTime: '40분',
    businessHours: '09:00 - 18:00',
    lastStatusUpdate: '1분 전',
    favorites: 412,
    lat: 37.515678,
    lng: 127.045678,
    hourlyCongestion: [
      { time: '09:00', level: 95 },
      { time: '11:00', level: 85 },
      { time: '14:00', level: 90 },
      { time: '16:00', level: 60 },
      { time: '18:00', level: 20 },
    ]
  }
];
