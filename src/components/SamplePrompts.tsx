/**
 * 샘플 프롬프트 컴포넌트
 * 
 * 미리 정의된 질문들을 버튼 형태로 제공하여 빠른 테스트를 가능하게 합니다.
 * - 클릭 시 해당 프롬프트가 메시지 입력으로 전달됨
 * - 로딩 상태일 때 비활성화
 * - 반응형 디자인으로 다양한 화면 크기 지원
 */

import { Button } from "@/components/ui/button";
import { SAMPLE_PROMPTS } from "@/constants/prompts";

interface SamplePromptsProps {
  onSelectPrompt: (prompt: string) => void;
  disabled?: boolean;
}

export function SamplePrompts({ onSelectPrompt, disabled = false }: SamplePromptsProps) {
  return (
    <div className="mb-4">
      <div className="flex flex-col gap-2 max-w-md mx-auto">
        {SAMPLE_PROMPTS.map((prompt, idx) => (
          <Button
            key={idx}
            variant="outline"
            size="sm"
            onClick={() => onSelectPrompt(prompt)}
            disabled={disabled}
            className="text-sm text-left justify-start"
          >
            {prompt}
          </Button>
        ))}
      </div>
    </div>
  );
}