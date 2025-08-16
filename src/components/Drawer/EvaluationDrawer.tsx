'use client';
import { useState } from 'react';
import SideDrawer from '../Drawer/ui/SideDrawer';

export default function EvaluationDrawer({ open, onClose, onSubmit }) {
  const [evalText, setEvalText] = useState('');
  const [evalCode, setEvalCode] = useState('');

  return (
    <SideDrawer
      open={open}
      onClose={onClose}
      title="作業評分"
      initialWidth={0.5}
      resizable
    >
      <div className="p-4 flex flex-col gap-4">
        <textarea
          value={evalText}
          onChange={(e) => setEvalText(e.target.value)}
          placeholder="輸入文字說明"
          className="border rounded p-2 w-full h-24"
        />
        <textarea
          value={evalCode}
          onChange={(e) => setEvalCode(e.target.value)}
          placeholder="貼上程式碼"
          className="border rounded p-2 w-full h-48 font-mono"
        />
        <button
          className="bg-green-600 text-white px-4 py-2 rounded"
          onClick={() => {
            onSubmit(evalText, evalCode);
            setEvalText('');
            setEvalCode('');
            onClose();
          }}
        >
          提交評分
        </button>
      </div>
    </SideDrawer>
  );
}
