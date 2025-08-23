/**
 * 채팅 응답 로딩 스켈레톤 애니메이션
 * 
 * AI 응답을 기다리는 동안 표시되는 스켈레톤 UI입니다.
 * - 기본모델/고급모델 스타일에 맞춘 배경색
 * - 3개의 줄로 구성된 텍스트 플레이스홀더
 * - 부드러운 펄스 애니메이션
 */

interface ChatSkeletonProps {
  variant?: 'basic' | 'advanced';
}

export function ChatSkeleton({ variant = 'basic' }: ChatSkeletonProps) {
  const isAdvanced = variant === 'advanced';

  return (
    <div className="flex justify-start mb-8">
      <div className="relative max-w-[80%] group flex items-end gap-1">
        <div
          className={`p-3 rounded-lg relative animate-pulse ${
            isAdvanced
              ? "bg-purple-100 border border-purple-200"
              : "bg-blue-50 border border-blue-200"
          } ${
            !isAdvanced 
              ? "before:content-[''] before:absolute before:left-[-8px] before:top-4 before:w-0 before:h-0 before:border-[8px] before:border-transparent before:border-r-blue-50"
              : ""
          }`}
        >
          <div className="space-y-2">
            {/* First line - longer */}
            <div className={`h-4 rounded ${
              isAdvanced ? "bg-purple-200" : "bg-blue-200"
            } w-48`}></div>
            
            {/* Second line - medium */}
            <div className={`h-4 rounded ${
              isAdvanced ? "bg-purple-200" : "bg-blue-200"
            } w-36`}></div>
            
            {/* Third line - shorter */}
            <div className={`h-4 rounded ${
              isAdvanced ? "bg-purple-200" : "bg-blue-200"
            } w-24`}></div>
          </div>
        </div>
        
        {/* Loading indicator */}
        <div className="h-6 w-6 bg-background border shadow-sm rounded flex items-center justify-center opacity-60">
          <div className={`w-2 h-2 rounded-full animate-pulse ${
            isAdvanced ? "bg-purple-400" : "bg-blue-400"
          }`}></div>
        </div>
        
        {/* Bottom info skeleton */}
        <div className="absolute -bottom-6 left-3 right-3 flex items-center justify-between text-xs">
          <div className="flex items-center gap-1">
            <div className="w-3 h-3 bg-gray-300 rounded animate-pulse"></div>
            <div className="w-12 h-3 bg-gray-300 rounded animate-pulse"></div>
          </div>
          <div className="w-16 h-4 bg-gray-300 rounded animate-pulse"></div>
        </div>
      </div>
    </div>
  );
}