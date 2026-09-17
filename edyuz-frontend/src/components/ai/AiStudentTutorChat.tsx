'use client';

import { useState, useRef, useEffect } from 'react';
import { Bot, Send, Sparkles, User, Loader2 } from 'lucide-react';
import { api } from '@/lib/api';

interface Message {
  sender: 'ai' | 'user';
  text: string;
  time: string;
}

interface AiStudentTutorChatProps {
  studentName?: string;
  topic?: string;
}

export default function AiStudentTutorChat({ studentName = 'O‘quvchi', topic }: AiStudentTutorChatProps) {
  const [messages, setMessages] = useState<Message[]>([
    {
      sender: 'ai',
      text: `Salom, ${studentName}! 😊 Men sizning EduYuz AI Repetitoringizman. Bugungi mavzu yoki darslaringiz bo‘yicha qanday savolingiz bor? Qayerini tushunmadingiz, bemalol so‘rang! 🚀`,
      time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    },
  ]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    scrollRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, loading]);

  const quickPrompts = [
    '🪙 Qanday qilib EduCoin yutib olsam bo‘ladi?',
    '🎮 Mavzu bo‘yicha o‘yin qanday o‘ynaladi?',
    '💡 Bugungi mavzuni eng sodda qilib tushuntirib bering',
  ];

  const handleSend = async (customText?: string) => {
    const textToSend = customText || input;
    if (!textToSend.trim() || loading) return;

    const userMsg: Message = {
      sender: 'user',
      text: textToSend,
      time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    };

    setMessages((prev) => [...prev, userMsg]);
    setInput('');
    setLoading(true);

    try {
      const res = await api.post('/ai/chat', {
        message: textToSend,
        studentName,
        topic,
      });

      const aiMsg: Message = {
        sender: 'ai',
        text: res.data?.reply || 'Kechirasiz, savolingizni qayta yozib yuboring.',
        time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      };
      setMessages((prev) => [...prev, aiMsg]);
    } catch (err) {
      setMessages((prev) => [
        ...prev,
        {
          sender: 'ai',
          text: 'Internet bilan aloqa uzildi. Iltimos birozdan so‘ng yana urinib ko‘ring.',
          time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        },
      ]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex flex-col h-[520px] bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden shadow-xl">
      {/* Header */}
      <div className="p-4 bg-gradient-to-r from-blue-900/60 to-indigo-900/60 border-b border-slate-800 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-blue-600 flex items-center justify-center text-white shadow-md shadow-blue-500/20">
            <Bot className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-white flex items-center gap-2">
              EduYuz AI Repetitor
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping"></span>
            </h3>
            <p className="text-xs text-blue-200">24/7 Shaxsiy o‘quv yordamchisi</p>
          </div>
        </div>
        <span className="text-[11px] font-medium px-2.5 py-1 rounded-full bg-blue-500/20 text-blue-300 border border-blue-500/30">
          Smart AI
        </span>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.map((m, idx) => (
          <div
            key={idx}
            className={`flex gap-3 ${m.sender === 'user' ? 'justify-end' : 'justify-start'}`}
          >
            {m.sender === 'ai' && (
              <div className="w-8 h-8 rounded-lg bg-blue-600/30 border border-blue-500/40 text-blue-400 flex items-center justify-center shrink-0">
                <Sparkles className="w-4 h-4" />
              </div>
            )}
            <div
              className={`max-w-[80%] rounded-2xl px-4 py-3 text-xs leading-relaxed space-y-1 shadow-sm ${
                m.sender === 'user'
                  ? 'bg-blue-600 text-white rounded-tr-none'
                  : 'bg-slate-800/90 text-slate-200 border border-slate-700/60 rounded-tl-none whitespace-pre-wrap font-sans'
              }`}
            >
              <div>{m.text}</div>
              <div className={`text-[10px] ${m.sender === 'user' ? 'text-blue-200' : 'text-slate-500'} text-right`}>
                {m.time}
              </div>
            </div>
            {m.sender === 'user' && (
              <div className="w-8 h-8 rounded-lg bg-slate-700 text-slate-300 flex items-center justify-center shrink-0">
                <User className="w-4 h-4" />
              </div>
            )}
          </div>
        ))}

        {loading && (
          <div className="flex items-center gap-2 text-slate-400 text-xs pl-11">
            <Loader2 className="w-4 h-4 animate-spin text-blue-400" />
            <span>AI javob yozmoqda...</span>
          </div>
        )}
        <div ref={scrollRef} />
      </div>

      {/* Quick Prompts */}
      <div className="px-4 py-2 bg-slate-900/80 border-t border-slate-800/60 flex items-center gap-2 overflow-x-auto text-xs">
        {quickPrompts.map((p, i) => (
          <button
            key={i}
            onClick={() => handleSend(p)}
            className="whitespace-nowrap px-3 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700/60 text-[11px] transition"
          >
            {p}
          </button>
        ))}
      </div>

      {/* Input */}
      <div className="p-3 bg-slate-900 border-t border-slate-800 flex items-center gap-2">
        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && handleSend()}
          placeholder="Savolingizni yozing..."
          className="flex-1 bg-slate-800 border border-slate-700 text-white px-4 py-2.5 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
        <button
          onClick={() => handleSend()}
          disabled={!input.trim() || loading}
          className="p-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 disabled:opacity-40 text-white shadow-md transition"
        >
          <Send className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
}
