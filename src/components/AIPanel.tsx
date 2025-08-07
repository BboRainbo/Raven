'use client'
import { useState } from 'react'

interface AIPanelProps {
  selectedNodeName: string;
  onAddSubtasks: (tasks: string[]) => void;  // ✅ 這個 call back props 會回傳AI產生的選項回去給控制台
}


export default function AIPanel({ selectedNodeName, onAddSubtasks }: AIPanelProps) {
  const [discussionResponse, setDiscussionResponse] = useState('')
  const [discussionOptions, setDiscussionOptions] = useState<string[]>([])
  const [selectedOptions, setSelectedOptions] = useState<string[]>([])

  const sendDiscussionPrompt = async () => {
    const promptText = `請根據節點「${selectedNodeName}」任務，給我 3~5 個子任務建議，以選項清單回覆格式呈現：
- 子任務一
- 子任務二
...`

    const res = await fetch('/api/gemini', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ prompt: promptText }),
    })

    const data = await res.json()
    const text = data?.candidates?.[0]?.content?.parts?.[0]?.text || '無回應'
    setDiscussionResponse(text)

    const options = text
      .split('\n')
      .filter(line => line.trim().startsWith('-'))
      .map(line => line.replace(/^-\s*/, '').trim())

    setDiscussionOptions(options)
  }

  return (
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
                    const checked = e.target.checked
                    setSelectedOptions((prev) =>
                      checked
                        ? [...prev, opt]
                        : prev.filter((item) => item !== opt)
                    )
                  }}
                />
                {opt}
              </label>
            </div>
          ))}
          <button
            className="mt-2 px-4 py-1 bg-green-600 text-white rounded"
            onClick={() => {
              onAddSubtasks(selectedOptions)
              setSelectedOptions([])
            }}
          >
            加入子任務
          </button>
        </div>
      )}
    </div>
  )
}
