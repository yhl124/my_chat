/**
 * 메시지 입력 컴포넌트
 * 
 * 사용자가 메시지를 입력하고 전송할 수 있는 인터페이스를 제공합니다.
 * - 자동 높이 조절 텍스트 에리어
 * - 키보드 단축키: Enter (전송), Shift+Enter (줄바꿈)
 * - 전송 버튼: 메시지가 있을 때만 활성화
 * - 로딩 상태 처리
 */

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Send } from "lucide-react";
import { PLACEHOLDER_TEXT } from "@/constants/prompts";

interface MessageInputProps {
  onSendMessage: (message: string) => void;
  disabled?: boolean;
}

export function MessageInput({ onSendMessage, disabled = false }: MessageInputProps) {
  const [message, setMessage] = useState("");

  const handleSend = () => {
    if (!message.trim() || disabled) return;
    onSendMessage(message);
    setMessage("");
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && e.shiftKey) {
      e.preventDefault();
      setMessage(message + "\n");
    } else if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const handleInput = (e: React.FormEvent<HTMLTextAreaElement>) => {
    const target = e.target as HTMLTextAreaElement;
    target.style.height = "auto";
    target.style.height = Math.min(target.scrollHeight, 200) + "px";
  };

  return (
    <div className="flex gap-2 items-end">
      <Textarea
        value={message}
        onChange={(e) => setMessage(e.target.value)}
        onKeyDown={handleKeyDown}
        onInput={handleInput}
        placeholder={PLACEHOLDER_TEXT}
        disabled={disabled}
        className="flex-1 resize-none min-h-[40px] max-h-[200px]"
        style={{
          height: "auto",
          minHeight: "40px",
        }}
      />
      <Button 
        onClick={handleSend} 
        size="icon" 
        className="h-10 w-10"
        disabled={disabled || !message.trim()}
      >
        <Send className="h-4 w-4" />
      </Button>
    </div>
  );
}