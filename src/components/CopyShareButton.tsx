import { useState } from 'react';

interface Props {
  text: string;
  label?: string;
}

export default function CopyShareButton({ text, label = '카톡 공유 텍스트 복사' }: Props) {
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
    <div className="space-y-2">
      <button
        type="button"
        onClick={handleCopy}
        disabled={!text}
        className="w-full rounded-lg bg-yellow-300 px-4 py-3 text-sm font-bold text-stone-800 shadow-sm hover:bg-yellow-400 disabled:opacity-40"
      >
        {copied ? '✅ 복사 완료!' : `📋 ${label}`}
      </button>
      <details className="rounded-lg border border-stone-200 bg-stone-50 p-2">
        <summary className="cursor-pointer text-xs text-stone-500">
          공유 텍스트 미리보기
        </summary>
        <pre className="mt-2 whitespace-pre-wrap break-all text-[11px] text-stone-700">
          {text || '— 입력 데이터가 없습니다 —'}
        </pre>
      </details>
    </div>
  );
}
