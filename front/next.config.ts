import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // 브라우저 자동 실행 비활성화
  experimental: {
    // 개발 모드에서 브라우저 자동 실행 안함
    // 이 설정은 환경 변수로도 제어 가능: BROWSER=none
  },
  
  // 개발 서버 설정
  async rewrites() {
    return [];
  },
};

// 개발 모드에서 브라우저 자동 실행 비활성화
if (process.env.NODE_ENV === 'development') {
  process.env.BROWSER = 'none';
}

export default nextConfig;