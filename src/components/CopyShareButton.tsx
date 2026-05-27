import { useState } from 'react';

interface Props {
  text: string;
  label?: string;
}

export default function CopyShareButton({ text, label = '텍스트로 복사' }: Props) {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    try {
      if (navigator.clipboard && window.isSecureContext) {
        await navigator.clipboard.writeText(text);
      } else {
        const ta = document.createElement('textarea');
        ta.value = text;
        ta.style.position = 'fixed';
        ta.style.opacity = '0';
        document.body.appendChild(ta);
        ta.select();
        document.execCommand('copy');
        document.body.removeChild(ta);
      }
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch {
      alert('복사에 실패했습니다. 수동으로 선택해 복사해 주세요.');
    }
  };

  return (
    <button
      type="button"
      onClick={handleCopy}
      disabled={!text}
      className="min-h-11 w-full rounded-lg bg-amber-400 px-4 py-3 text-sm font-bold text-stone-800 shadow-sm hover:bg-amber-500 disabled:opacity-40"
    >
      {copied ? '✅ 복사 완료!' : `📋 ${label}`}
    </button>
  );
}
