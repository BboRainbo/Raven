'use client'

import dynamic from 'next/dynamic'
import { useRef, useState } from 'react'

const TreeClient = dynamic(() => import('@/components/TreeClient'), { ssr: false })

export default function PromptPage() {
  const [prompt, setPrompt] = useState('')
  const [aiResponse, setAiResponse] = useState('')
//1025
const [selectedNodeName, setSelectedNodeName] = useState('');

  const [discussionPrompt, setDiscussionPrompt] = useState('');
const [discussionResponse, setDiscussionResponse] = useState('');
const [discussionOptions, setDiscussionOptions] = useState<string[]>([]);
const [selectedOptions, setSelectedOptions] = useState<string[]>([]);
{/* 1025 */}


  const containerRef = useRef(null)

  const sendPrompt = async () => {
    const res = await fetch('/api/gemini', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ prompt }),
    })
    const data = await res.json()
    if (data.candidates && data.candidates[0]?.content?.parts[0]?.text) {
      setAiResponse(data.candidates[0].content.parts[0].text)
    } else {
      setAiResponse(data.error || 'AI 無回應')
    }
  }
{/* 1025 */}

const sendDiscussionPrompt = async () => {
  const promptText = `請根據節點「${selectedNodeName}」任務，給我 3~5 個子任務建議，以選項清單回覆格式呈現：
- 子任務一
- 子任務二
...`;

  const res = await fetch('/api/gemini', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ prompt: promptText }),
  });
  const data = await res.json();
  const text = data?.candidates?.[0]?.content?.parts?.[0]?.text || '無回應';
  setDiscussionResponse(text);

  // 將 Gemini 回應轉為選項陣列
  const options = text
    .split('\n')
    .filter(line => line.trim().startsWith('-'))
    .map(line => line.replace(/^-\s*/, '').trim());

  setDiscussionOptions(options);
};
const [treeData, setTreeData] = useState([
  {
    name: "主任務",
    children: [
      { name: "子任務 1" },
      { name: "子任務 2" }
    ]
  }
]);

{/* 1025 */}

  return (
    <div className="flex w-full h-screen">
      
      {/* Left Panel */}
{/* 1025 */}

      {selectedNodeName && (
  <div className="mt-6 border-t pt-4">
    <h3 className="text-md font-semibold text-yellow-600 mb-2">
      與節點「{selectedNodeName}」討論子任務
    </h3>
    <button
      onClick={sendDiscussionPrompt}
      className="px-3 py-1 bg-purple-600 text-white rounded"
    >
      與 AI 討論子任務建議
    </button>

    <div className="mt-4 whitespace-pre-wrap text-sm">{discussionResponse}</div>

    {discussionOptions.length > 0 && (
      <div className="mt-4">
        <h4 className="text-sm font-semibold">選擇子任務加入：</h4>
        {discussionOptions.map((opt, idx) => (
          <div key={idx}>
            <label className="inline-flex items-center">
              <input
                type="checkbox"
                className="mr-2"
                value={opt}
                checked={selectedOptions.includes(opt)}
                onChange={(e) => {
                  const checked = e.target.checked;
                  setSelectedOptions((prev) =>
                    checked
                      ? [...prev, opt]
                      : prev.filter((item) => item !== opt)
                  );
                }}
              />
              {opt}
            </label>
          </div>
        ))}
        <button
          className="mt-2 px-4 py-1 bg-green-600 text-white rounded"
          onClick={() => {
            // 👉 呼叫右邊 TreeClient 的新增子節點方法（下一步處理）
            if (window.dispatchEvent) {
              window.dispatchEvent(new CustomEvent('add-subtasks', {
                detail: { parent: selectedNodeName, tasks: selectedOptions }
              }));
            }
            setSelectedOptions([]);
          }}
        >
          加入子任務
        </button>
      </div>
    )}
  </div>
)}

      {/* 1025 */}



      {/* Right Panel */}
      <div ref={containerRef} className="w-1/2 p-4 h-full overflow-hidden">
<TreeClient
  data={treeData}
  onNodeSelect={(nodeName) => {
    console.log("選到節點：", nodeName);
    setSelectedNodeName(nodeName);
  }}
/>


      </div>
    </div>
  )
}
