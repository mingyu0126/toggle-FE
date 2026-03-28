export const mockUser = {
  id: 'user-123',
  username: 'toggle_user_1',
  nickname: '토글러',
  isLoggedIn: false, // 개발중엔 이걸 true로 바꾸면서 테스트 가능
  favorites: {
    stores: ['store-1', 'store-3'],
    publics: ['public-1', 'public-3']
  },
  myMapSettings: {
    isPublic: true,
  }
};
