/**
 * 루트 레이아웃 컴포넌트
 * 
 * Next.js App Router의 루트 레이아웃을 정의합니다.
 * - 전체 애플리케이션의 HTML 구조
 * - 메타데이터 설정 (제목, 설명 등)
 * - 전역 스타일 적용
 * - 다국어 설정 (한국어)
 */

import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "AI 챗봇 비교 플랫폼",
  description: "AI 모델들의 응답을 비교해보세요",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="ko">
      <body>{children}</body>
    </html>
  );
}