// App constants
export const APP_CONSTANTS = {
  // Image upload limits
  MAX_IMAGE_SIZE: 5 * 1024 * 1024, // 5MB
  MAX_IMAGE_WIDTH: 1024,
  MAX_IMAGE_HEIGHT: 1024,
  
  // Pagination
  POSTS_PER_PAGE: 10,
  COMMENTS_PER_PAGE: 20,
  
  // Validation
  MIN_PASSWORD_LENGTH: 6,
  MAX_POST_TITLE_LENGTH: 100,
  MAX_POST_CONTENT_LENGTH: 2000,
  MAX_COMMENT_LENGTH: 500,
  
  // Firebase collections
  COLLECTIONS: {
    USERS: 'users',
    POSTS: 'posts',
    COMMENTS: 'comments',
  },
  
  // Storage paths
  STORAGE_PATHS: {
    POST_IMAGES: 'posts',
    USER_AVATARS: 'avatars',
  },
};

// Error messages
export const ERROR_MESSAGES = {
  NETWORK_ERROR: '네트워크 연결을 확인해주세요.',
  AUTH_INVALID_EMAIL: '유효하지 않은 이메일 주소입니다.',
  AUTH_WEAK_PASSWORD: '비밀번호는 최소 6자 이상이어야 합니다.',
  AUTH_EMAIL_ALREADY_IN_USE: '이미 사용 중인 이메일 주소입니다.',
  AUTH_USER_NOT_FOUND: '사용자를 찾을 수 없습니다.',
  AUTH_WRONG_PASSWORD: '비밀번호가 올바르지 않습니다.',
  VALIDATION_REQUIRED_FIELD: '필수 입력 항목입니다.',
  VALIDATION_TITLE_TOO_LONG: '제목이 너무 깁니다.',
  VALIDATION_CONTENT_TOO_LONG: '내용이 너무 깁니다.',
  IMAGE_TOO_LARGE: '이미지 크기가 너무 큽니다. (최대 5MB)',
  UNKNOWN_ERROR: '알 수 없는 오류가 발생했습니다.',
};