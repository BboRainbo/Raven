// AIDiscussionPanel.tsx
'use client';
import React, { useEffect, useState } from 'react';

export default function AIDiscussionPanel({
  selectedNodeName,
  onAddSubtasks,
}: {
  selectedNodeName: string;
  onAddSubtasks: (subtasks: string[]) => void;
}) {
  const [prompt, setPrompt] = useState(
    `請幫我針對「${selectedNodeName}」這個任務，提出幾個可執行的子任務。請用條列方式回覆。`
  );
  const [aiResponse, setAiResponse] = useState('');
  const [options, setOptions] = useState<string[]>([]);
  const [selectedOptions, setSelectedOptions] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setPrompt(
      `請幫我針對「${selectedNodeName}」這個任務，提出幾個可執行的子任務。請用條列方式回覆。`
    );
  }, [selectedNodeName]);

  const sendPrompt = async () => {
    try {
      setLoading(true);
      setError(null);
      setAiResponse('');
      setOptions([]);
      setSelectedOptions([]);

      const res = await fetch('/api/gemini', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ prompt }),
      });

      if (!res.ok) {
        throw new Error(`Fetch failed: ${res.status}`);
      }

      const data = await res.json();
      console.log('API raw response:', JSON.stringify(data, null, 2));

      const text =
        data?.candidates?.[0]?.content?.parts?.[0]?.text ??
        data?.text ??
        '';

      if (!text.trim()) {
        setError('⚠️ AI 沒有回應任何內容，請重新送出或檢查 Prompt。');
        return;
      }

      const lines = text
        .split('\n')
        .map(line => line.trim().replace(/^[-*•0-9.\s]+/, ''))
        .filter(line => line.length > 0);

      if (lines.length === 0) {
        setError('⚠️ 回傳格式無法解析，請嘗試調整 Prompt。');
        return;
      }

      setAiResponse(text);
      setOptions(lines);
    } catch (err) {
      console.error('Error while sending prompt:', err);
      setError('⚠️ 無法取得 AI 回應，請稍後再試');
    } finally {
      setLoading(false);
    }
  };

  const handleAdd = () => {
    if (selectedOptions.length > 0) {
      onAddSubtasks(selectedOptions);
      setSelectedOptions([]);
      setOptions([]);
      setAiResponse('');
    }
  };

  return (
    <div className="p-4 space-y-4">
      <div>
        <label className="font-semibold">Prompt：</label>
        <textarea
          className="w-full p-2 border border-gray-300 rounded bg-black text-white"
          rows={3}
          value={prompt}
          onChange={(e) => setPrompt(e.target.value)}
        />
        <button
          className="mt-2 px-4 py-2 bg-blue-500 text-white rounded disabled:opacity-50"
          onClick={sendPrompt}
          disabled={loading}
        >
          {loading ? '請稍候...' : '送出給 AI'}
        </button>
      </div>

      {error && (
        <div className="text-red-500 font-semibold">{error}</div>
      )}

      {aiResponse && !error && (
        <div>
          <label className="font-semibold">AI 回應：</label>
          <pre className="whitespace-pre-wrap bg-gray-800 text-white p-2 rounded border border-gray-300">
            {aiResponse}
          </pre>

          {options.length > 0 && (
            <>
              <label className="block mt-2 font-semibold">請選擇要加入的子任務：</label>
              <ul className="list-disc pl-6">
                {options.map((opt, idx) => (
                  <li key={idx}>
                    <label>
                      <input
                        type="checkbox"
                        className="mr-2"
                        checked={selectedOptions.includes(opt)}
                        onChange={() => {
                          setSelectedOptions(prev =>
                            prev.includes(opt)
                              ? prev.filter(item => item !== opt)
                              : [...prev, opt]
                          );
                        }}
                      />
                      {opt}
                    </label>
                  </li>
                ))}
              </ul>
              <button
                className="mt-2 px-4 py-2 bg-green-600 text-white rounded disabled:opacity-50"
                onClick={handleAdd}
                disabled={selectedOptions.length === 0}
              >
                加入子節點
              </button>
            </>
          )}
        </div>
      )}
    </div>
  );
}
