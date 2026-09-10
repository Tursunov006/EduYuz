'use client';

import { useState, useEffect } from 'react';
import axios from 'axios';
import { 
  BookOpen, 
  Video, 
  FileText, 
  Plus, 
  CheckCircle2, 
  Clock, 
  Trash2, 
  ChevronDown, 
  ChevronUp, 
  ExternalLink,
  Award,
  Send,
  MessageSquare,
  Sparkles,
  Gamepad2
} from 'lucide-react';
import Link from 'next/link';
import AiTeacherAssistantModal from '@/components/ai/AiTeacherAssistantModal';

interface LmsViewProps {
  groupId: string;
  groupName?: string;
  students?: any[];
}

export default function LmsView({ groupId, groupName, students = [] }: LmsViewProps) {
  const [lessons, setLessons] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [expandedLessonId, setExpandedLessonId] = useState<string | null>(null);

  // Modallar
  const [isAddLessonOpen, setIsAddLessonOpen] = useState(false);
  const [isAddHomeworkOpen, setIsAddHomeworkOpen] = useState(false);
  const [selectedLessonForHw, setSelectedLessonForHw] = useState<string>('');

  const [isSubmitModalOpen, setIsSubmitModalOpen] = useState(false);
  const [selectedHomeworkForSubmit, setSelectedHomeworkForSubmit] = useState<any>(null);

  const [isReviewModalOpen, setIsReviewModalOpen] = useState(false);
  const [selectedHomeworkForReview, setSelectedHomeworkForReview] = useState<any>(null);
  const [submissions, setSubmissions] = useState<any[]>([]);

  const [isAiModalOpen, setIsAiModalOpen] = useState(false);

  const handleApplyAiLesson = (aiData: any) => {
    let combinedContent = `${aiData.summary || ''}\n\n`;
    if (aiData.sections) {
      aiData.sections.forEach((s: any) => {
        combinedContent += `### ${s.title}\n${s.content}\n\n`;
      });
    }

    setLessonForm({
      title: aiData.topic || 'Yangi Dars',
      content: combinedContent.trim(),
      videoUrl: '',
      fileUrl: '',
      orderIndex: lessons.length + 1,
    });

    if (aiData.homework) {
      setHwForm({
        title: aiData.homework.title || 'Uyga vazifa',
        description: aiData.homework.description || '',
        deadline: '',
        maxScore: aiData.homework.maxScore || 100,
      });
    }

    setIsAddLessonOpen(true);
  };

  // Dars qo'shish formasi
  const [lessonForm, setLessonForm] = useState({
    title: '',
    content: '',
    videoUrl: '',
    fileUrl: '',
    orderIndex: 1,
  });

  // Vazifa qo'shish formasi
  const [hwForm, setHwForm] = useState({
    title: '',
    description: '',
    deadline: '',
    maxScore: 100,
  });

  // Vazifa topshirish formasi
  const [submitForm, setSubmitForm] = useState({
    studentId: '',
    content: '',
    fileUrl: '',
  });

  // Baholash formasi
  const [gradingState, setGradingState] = useState<{ [key: string]: { score: number; feedback: string } }>({});

  const getHeaders = () => {
    const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null;
    return token ? { Authorization: `Bearer ${token}` } : {};
  };

  async function fetchLessons() {
    try {
      setLoading(true);
      const res = await axios.get(`http://localhost:3000/api/v1/lms/groups/${groupId}/lessons`, {
        headers: getHeaders(),
      });
      setLessons(res.data || []);
      if (res.data && res.data.length > 0 && !expandedLessonId) {
        setExpandedLessonId(res.data[0].id);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    if (groupId) fetchLessons();
  }, [groupId]);

  // Yangi dars yaratish
  async function handleCreateLesson(e: React.FormEvent) {
    e.preventDefault();
    try {
      await axios.post(
        'http://localhost:3000/api/v1/lms/lessons',
        { ...lessonForm, groupId, orderIndex: Number(lessonForm.orderIndex) },
        { headers: getHeaders() }
      );
      setIsAddLessonOpen(false);
      setLessonForm({ title: '', content: '', videoUrl: '', fileUrl: '', orderIndex: lessons.length + 2 });
      fetchLessons();
    } catch (err: any) {
      alert(err.response?.data?.message || 'Dars yaratishda xatolik');
    }
  }

  // Darsni o'chirish
  async function handleDeleteLesson(id: string, title: string) {
    if (!confirm(`"${title}" darsini va unga tegishli vazifalarni o'chirmoqchimisiz?`)) return;
    try {
      await axios.delete(`http://localhost:3000/api/v1/lms/lessons/${id}`, {
        headers: getHeaders(),
      });
      fetchLessons();
    } catch (err: any) {
      alert(err.response?.data?.message || 'Xatolik');
    }
  }

  // Vazifa yaratish
  async function handleCreateHomework(e: React.FormEvent) {
    e.preventDefault();
    try {
      await axios.post(
        'http://localhost:3000/api/v1/lms/homeworks',
        {
          lessonId: selectedLessonForHw,
          title: hwForm.title,
          description: hwForm.description,
          deadline: hwForm.deadline ? new Date(hwForm.deadline).toISOString() : undefined,
          maxScore: Number(hwForm.maxScore),
        },
        { headers: getHeaders() }
      );
      setIsAddHomeworkOpen(false);
      setHwForm({ title: '', description: '', deadline: '', maxScore: 100 });
      fetchLessons();
    } catch (err: any) {
      alert(err.response?.data?.message || 'Vazifa yaratishda xatolik');
    }
  }

  // Vazifa topshirish
  async function handleSubmitHomework(e: React.FormEvent) {
    e.preventDefault();
    if (!submitForm.studentId) return alert('O\'quvchini tanlang!');
    try {
      await axios.post(
        'http://localhost:3000/api/v1/lms/homeworks/submit',
        {
          homeworkId: selectedHomeworkForSubmit.id,
          studentId: submitForm.studentId,
          content: submitForm.content,
          fileUrl: submitForm.fileUrl || undefined,
        },
        { headers: getHeaders() }
      );
      alert('Vazifa muvaffaqiyatli topshirildi!');
      setIsSubmitModalOpen(false);
      setSubmitForm({ studentId: '', content: '', fileUrl: '' });
      fetchLessons();
    } catch (err: any) {
      alert(err.response?.data?.message || 'Vazifa topshirishda xatolik');
    }
  }

  // Topshirilgan vazifalarni ko'rish
  async function handleOpenReview(hw: any) {
    setSelectedHomeworkForReview(hw);
    setIsReviewModalOpen(true);
    try {
      const res = await axios.get(
        `http://localhost:3000/api/v1/lms/homeworks/${hw.id}/submissions`,
        { headers: getHeaders() }
      );
      setSubmissions(res.data || []);
      const initialGrading: any = {};
      (res.data || []).forEach((sub: any) => {
        initialGrading[sub.id] = {
          score: sub.score !== null ? sub.score : hw.maxScore,
          feedback: sub.feedback || '',
        };
      });
      setGradingState(initialGrading);
    } catch (err) {
      console.error(err);
    }
  }

  // Vazifani baholash
  async function handleGrade(submissionId: string) {
    const data = gradingState[submissionId];
    if (!data) return;
    try {
      await axios.post(
        `http://localhost:3000/api/v1/lms/homeworks/grade/${submissionId}`,
        {
          score: Number(data.score),
          feedback: data.feedback,
        },
        { headers: getHeaders() }
      );
      alert('Baho va izoh saqlandi!');
      handleOpenReview(selectedHomeworkForReview);
      fetchLessons();
    } catch (err: any) {
      alert('Baholashda xatolik: ' + (err.response?.data?.message || err.message));
    }
  }

  // YouTube havolasini embed formatga o'tkazish
  function getEmbedUrl(url?: string) {
    if (!url) return null;
    try {
      if (url.includes('youtube.com/watch?v=')) {
        const videoId = url.split('v=')[1]?.split('&')[0];
        return `https://www.youtube.com/embed/${videoId}`;
      }
      if (url.includes('youtu.be/')) {
        const videoId = url.split('youtu.be/')[1]?.split('?')[0];
        return `https://www.youtube.com/embed/${videoId}`;
      }
      return url;
    } catch {
      return url;
    }
  }

  return (
    <div className="space-y-6">
      {/* Yuqori boshqaruv paneli */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-sm">
        <div>
          <h2 className="text-xl font-bold text-white flex items-center gap-2.5">
            <BookOpen className="text-indigo-400" size={22} />
            LMS — O'quv Darslari va Uyga Vazifalar
          </h2>
          <p className="text-xs text-slate-400 mt-1">
            Guruh: <span className="text-indigo-300 font-semibold">{groupName || 'Tanlangan guruh'}</span> — jami {lessons.length} ta dars mavjud
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={() => setIsAiModalOpen(true)}
            className="flex items-center gap-2 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white px-4 py-2.5 rounded-xl text-sm font-medium transition shadow-lg shadow-blue-600/20"
          >
            <Sparkles size={16} /> AI Dars & Test Generatori
          </button>
          <button
            onClick={() => {
              setLessonForm({ ...lessonForm, orderIndex: lessons.length + 1 });
              setIsAddLessonOpen(true);
            }}
            className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2.5 rounded-xl text-sm font-medium transition shadow-lg shadow-indigo-600/20"
          >
            <Plus size={16} /> Yangi Dars Qo'shish
          </button>
        </div>
      </div>

      {/* Darslar ro'yxati */}
      {loading ? (
        <div className="p-12 text-center text-slate-500">Darslar yuklanmoqda...</div>
      ) : lessons.length === 0 ? (
        <div className="bg-slate-900/60 border border-dashed border-slate-800 rounded-2xl p-12 text-center space-y-3">
          <BookOpen size={36} className="mx-auto text-slate-600" />
          <h3 className="text-base font-semibold text-white">Ushbu guruhda hali darslar yo'q</h3>
          <p className="text-xs text-slate-400 max-w-sm mx-auto">
            "Yangi Dars Qo'shish" tugmasini bosib, birinchi dars mavzusi va video darslikni joylashtiring.
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {lessons.map((lesson, idx) => {
            const isExpanded = expandedLessonId === lesson.id;
            const embedUrl = getEmbedUrl(lesson.videoUrl);

            return (
              <div
                key={lesson.id}
                className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden transition-all duration-200"
              >
                {/* Dars Sarlavhasi (Accordion header) */}
                <div
                  className="p-5 flex items-center justify-between cursor-pointer hover:bg-slate-800/40 select-none transition"
                  onClick={() => setExpandedLessonId(isExpanded ? null : lesson.id)}
                >
                  <div className="flex items-center gap-4">
                    <div className="w-9 h-9 rounded-xl bg-indigo-500/10 text-indigo-400 border border-indigo-500/20 flex items-center justify-center font-bold text-sm shrink-0">
                      {lesson.orderIndex || idx + 1}
                    </div>
                    <div>
                      <h3 className="text-base font-bold text-white flex items-center gap-2">
                        {lesson.title}
                        {lesson.videoUrl && (
                          <span className="text-[11px] bg-red-500/10 text-red-400 border border-red-500/20 px-2 py-0.5 rounded-full inline-flex items-center gap-1 font-medium">
                            <Video size={11} /> Video
                          </span>
                        )}
                        {lesson.fileUrl && (
                          <span className="text-[11px] bg-sky-500/10 text-sky-400 border border-sky-500/20 px-2 py-0.5 rounded-full inline-flex items-center gap-1 font-medium">
                            <FileText size={11} /> Material
                          </span>
                        )}
                      </h3>
                      <p className="text-xs text-slate-400 mt-0.5">
                        {lesson.homeworks?.length || 0} ta uy vazifasi biriktirilgan
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-3">
                    <Link
                      href={`/games/play?topic=${encodeURIComponent(lesson.title)}`}
                      onClick={(e) => e.stopPropagation()}
                      className="px-3 py-1.5 rounded-xl bg-gradient-to-r from-rose-600 to-purple-600 hover:from-rose-500 hover:to-purple-500 text-white text-xs font-bold flex items-center gap-1.5 shadow-md shadow-rose-600/20 transition"
                      title="Ushbu dars bo'yicha interaktiv o'yin o'ynash"
                    >
                      <Gamepad2 size={14} />
                      <span className="hidden sm:inline">Dars O‘yini</span>
                    </Link>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleDeleteLesson(lesson.id, lesson.title);
                      }}
                      className="p-1.5 text-slate-500 hover:text-rose-400 hover:bg-rose-500/10 rounded-lg transition"
                      title="Darsni o'chirish"
                    >
                      <Trash2 size={16} />
                    </button>
                    <div className="text-slate-400">
                      {isExpanded ? <ChevronUp size={20} /> : <ChevronDown size={20} />}
                    </div>
                  </div>
                </div>

                {/* Dars Kontenti (Akkordeon ochilganda) */}
                {isExpanded && (
                  <div className="border-t border-slate-800/80 p-6 space-y-6 bg-slate-950/40">
                    {/* Video pleyer */}
                    {embedUrl && (
                      <div className="space-y-2">
                        <label className="text-xs font-semibold uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
                          <Video size={14} className="text-indigo-400" /> Video Darslik
                        </label>
                        <div className="aspect-video w-full max-w-3xl rounded-xl overflow-hidden bg-black border border-slate-800 shadow-md">
                          <iframe
                            src={embedUrl}
                            title={lesson.title}
                            className="w-full h-full"
                            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                            allowFullScreen
                          ></iframe>
                        </div>
                      </div>
                    )}

                    {/* Dars matni / konspekt */}
                    {lesson.content && (
                      <div className="space-y-1.5">
                        <label className="text-xs font-semibold uppercase tracking-wider text-slate-400">
                          Dars Konspekti va Izohlar
                        </label>
                        <div className="bg-slate-900 border border-slate-800/80 rounded-xl p-4 text-sm text-slate-300 whitespace-pre-wrap leading-relaxed">
                          {lesson.content}
                        </div>
                      </div>
                    )}

                    {/* Biriktirilgan fayl / havola */}
                    {lesson.fileUrl && (
                      <div>
                        <a
                          href={lesson.fileUrl}
                          target="_blank"
                          rel="noreferrer"
                          className="inline-flex items-center gap-2 bg-slate-900 hover:bg-slate-800 border border-slate-800 text-sky-400 text-xs font-medium px-4 py-2 rounded-xl transition"
                        >
                          <FileText size={15} />
                          Qo'shimcha Darslik Materialini Ko'rish / Yuklab olish
                          <ExternalLink size={13} />
                        </a>
                      </div>
                    )}

                    {/* Uyga vazifalar bo'limi */}
                    <div className="border-t border-slate-800/80 pt-5 space-y-4">
                      <div className="flex items-center justify-between">
                        <h4 className="text-sm font-bold text-white flex items-center gap-2">
                          <Award size={16} className="text-amber-400" />
                          Uyga Vazifalar ({lesson.homeworks?.length || 0})
                        </h4>
                        <button
                          onClick={() => {
                            setSelectedLessonForHw(lesson.id);
                            setIsAddHomeworkOpen(true);
                          }}
                          className="inline-flex items-center gap-1.5 text-xs font-medium bg-amber-500/10 text-amber-300 border border-amber-500/20 hover:bg-amber-500/20 px-3 py-1.5 rounded-lg transition"
                        >
                          <Plus size={14} /> Vazifa biriktirish
                        </button>
                      </div>

                      {lesson.homeworks?.length === 0 ? (
                        <p className="text-xs text-slate-500 italic">Ushbu darsga hali uyga vazifa biriktirilmagan.</p>
                      ) : (
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          {lesson.homeworks?.map((hw: any) => {
                            const subCount = hw.submissions?.length || 0;

                            return (
                              <div
                                key={hw.id}
                                className="bg-slate-900 border border-slate-800 rounded-xl p-4 space-y-3 relative"
                              >
                                <div className="flex items-start justify-between gap-2">
                                  <h5 className="text-sm font-bold text-white">{hw.title}</h5>
                                  <span className="text-[11px] font-semibold text-amber-400 bg-amber-500/10 border border-amber-500/20 px-2 py-0.5 rounded-md shrink-0">
                                    Maks: {hw.maxScore} ball
                                  </span>
                                </div>

                                <p className="text-xs text-slate-300 whitespace-pre-wrap leading-relaxed line-clamp-3">
                                  {hw.description}
                                </p>

                                {hw.deadline && (
                                  <div className="text-[11px] text-slate-400 flex items-center gap-1.5">
                                    <Clock size={13} className="text-slate-500" />
                                    Muddati: {new Date(hw.deadline).toLocaleString()}
                                  </div>
                                )}

                                <div className="pt-2 border-t border-slate-800 flex items-center justify-between gap-2">
                                  <button
                                    onClick={() => handleOpenReview(hw)}
                                    className="text-xs font-semibold text-indigo-400 hover:text-indigo-300 flex items-center gap-1.5 transition"
                                  >
                                    <CheckCircle2 size={14} />
                                    Javoblar ({subCount})
                                  </button>

                                  <button
                                    onClick={() => {
                                      setSelectedHomeworkForSubmit(hw);
                                      setIsSubmitModalOpen(true);
                                    }}
                                    className="text-xs bg-slate-800 hover:bg-slate-700 text-slate-200 px-3 py-1.5 rounded-lg font-medium transition inline-flex items-center gap-1.5"
                                  >
                                    <Send size={12} /> Topshirish
                                  </button>
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* 1. Yangi Dars Qo'shish Modali */}
      {isAddLessonOpen && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 w-full max-w-lg space-y-4 shadow-2xl">
            <h3 className="text-lg font-bold text-white">Yangi Dars Qo'shish</h3>
            <form onSubmit={handleCreateLesson} className="space-y-4">
              <div>
                <label className="text-xs font-semibold text-slate-400">Dars Mavzusi *</label>
                <input
                  type="text"
                  required
                  placeholder="Masalan: 1-Dars. JavaScript Asoslari va O'zgaruvchilar"
                  value={lessonForm.title}
                  onChange={(e) => setLessonForm({ ...lessonForm, title: e.target.value })}
                  className="w-full mt-1.5 px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-sm text-white focus:outline-none focus:border-indigo-500"
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-400">Video Darslik Havolasi (YouTube / havola)</label>
                <input
                  type="url"
                  placeholder="https://www.youtube.com/watch?v=..."
                  value={lessonForm.videoUrl}
                  onChange={(e) => setLessonForm({ ...lessonForm, videoUrl: e.target.value })}
                  className="w-full mt-1.5 px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-sm text-white focus:outline-none focus:border-indigo-500"
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-400">Dars Konspekti / Qo'llanma matni</label>
                <textarea
                  rows={3}
                  placeholder="Darsda o'tilgan asosiy tushunchalar va eslatmalar..."
                  value={lessonForm.content}
                  onChange={(e) => setLessonForm({ ...lessonForm, content: e.target.value })}
                  className="w-full mt-1.5 px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-sm text-white focus:outline-none focus:border-indigo-500"
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-400">Qo'shimcha Material Havolasi (Google Drive / GitHub / PDF)</label>
                <input
                  type="url"
                  placeholder="https://..."
                  value={lessonForm.fileUrl}
                  onChange={(e) => setLessonForm({ ...lessonForm, fileUrl: e.target.value })}
                  className="w-full mt-1.5 px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-sm text-white focus:outline-none focus:border-indigo-500"
                />
              </div>

              <div className="flex justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setIsAddLessonOpen(false)}
                  className="px-4 py-2 text-sm text-slate-400 hover:text-white"
                >
                  Bekor qilish
                </button>
                <button
                  type="submit"
                  className="bg-indigo-600 hover:bg-indigo-700 text-white px-5 py-2 rounded-xl text-sm font-medium transition"
                >
                  Darsni Saqlash
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* 2. Darsga Uyga Vazifa Qo'shish Modali */}
      {isAddHomeworkOpen && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 w-full max-w-md space-y-4 shadow-2xl">
            <h3 className="text-lg font-bold text-white">Darsga Uyga Vazifa Biriktirish</h3>
            <form onSubmit={handleCreateHomework} className="space-y-4">
              <div>
                <label className="text-xs font-semibold text-slate-400">Vazifa Sarlavhasi *</label>
                <input
                  type="text"
                  required
                  placeholder="Masalan: Kalkulyator dasturini tuzish"
                  value={hwForm.title}
                  onChange={(e) => setHwForm({ ...hwForm, title: e.target.value })}
                  className="w-full mt-1.5 px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-sm text-white focus:outline-none focus:border-indigo-500"
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-400">Topshiriq Sharti va Talablar *</label>
                <textarea
                  rows={4}
                  required
                  placeholder="Talaba nimalar qilishi kerak, qanday qabul qilinadi..."
                  value={hwForm.description}
                  onChange={(e) => setHwForm({ ...hwForm, description: e.target.value })}
                  className="w-full mt-1.5 px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-sm text-white focus:outline-none focus:border-indigo-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-semibold text-slate-400">Maksimal Ball</label>
                  <input
                    type="number"
                    value={hwForm.maxScore}
                    onChange={(e) => setHwForm({ ...hwForm, maxScore: Number(e.target.value) })}
                    className="w-full mt-1.5 px-3.5 py-2 rounded-xl bg-slate-950 border border-slate-800 text-sm text-white"
                  />
                </div>
                <div>
                  <label className="text-xs font-semibold text-slate-400">Topshirish Muddati</label>
                  <input
                    type="datetime-local"
                    value={hwForm.deadline}
                    onChange={(e) => setHwForm({ ...hwForm, deadline: e.target.value })}
                    className="w-full mt-1.5 px-3.5 py-2 rounded-xl bg-slate-950 border border-slate-800 text-sm text-white"
                  />
                </div>
              </div>

              <div className="flex justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setIsAddHomeworkOpen(false)}
                  className="px-4 py-2 text-sm text-slate-400 hover:text-white"
                >
                  Bekor qilish
                </button>
                <button
                  type="submit"
                  className="bg-amber-600 hover:bg-amber-700 text-white px-5 py-2 rounded-xl text-sm font-medium transition"
                >
                  Vazifani Joylash
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* 3. O'quvchi Vazifa Topshirish Modali */}
      {isSubmitModalOpen && selectedHomeworkForSubmit && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 w-full max-w-md space-y-4 shadow-2xl">
            <h3 className="text-lg font-bold text-white">Vazifa Topshirish</h3>
            <p className="text-xs text-indigo-400 font-medium">{selectedHomeworkForSubmit.title}</p>
            <form onSubmit={handleSubmitHomework} className="space-y-4">
              <div>
                <label className="text-xs font-semibold text-slate-400">O'quvchini Tanlang *</label>
                <select
                  required
                  value={submitForm.studentId}
                  onChange={(e) => setSubmitForm({ ...submitForm, studentId: e.target.value })}
                  className="w-full mt-1.5 px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-sm text-white"
                >
                  <option value="">O'quvchi tanlang...</option>
                  {students.map((item: any) => {
                    const st = item.student || item;
                    return (
                      <option key={st.id} value={st.id}>
                        {st.fullName}
                      </option>
                    );
                  })}
                </select>
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-400">Javob Matni yoki Havola (GitHub, Figma, Google Docs) *</label>
                <textarea
                  rows={4}
                  required
                  placeholder="Vazifa havolasi yoki yozma javobingiz..."
                  value={submitForm.content}
                  onChange={(e) => setSubmitForm({ ...submitForm, content: e.target.value })}
                  className="w-full mt-1.5 px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-sm text-white focus:outline-none focus:border-indigo-500"
                />
              </div>

              <div className="flex justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setIsSubmitModalOpen(false)}
                  className="px-4 py-2 text-sm text-slate-400 hover:text-white"
                >
                  Bekor qilish
                </button>
                <button
                  type="submit"
                  className="bg-indigo-600 hover:bg-indigo-700 text-white px-5 py-2 rounded-xl text-sm font-medium transition"
                >
                  Yuborish
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* 4. O'qituvchi Vazifalarni Tekshirish va Baholash Modali */}
      {isReviewModalOpen && selectedHomeworkForReview && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 w-full max-w-2xl space-y-4 shadow-2xl max-h-[85vh] flex flex-col">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div>
                <h3 className="text-lg font-bold text-white">Topshirilgan Vazifalar</h3>
                <p className="text-xs text-indigo-400 mt-0.5">{selectedHomeworkForReview.title}</p>
              </div>
              <button
                onClick={() => setIsReviewModalOpen(false)}
                className="text-slate-400 hover:text-white text-sm"
              >
                Yopish
              </button>
            </div>

            <div className="flex-1 overflow-y-auto space-y-4 pr-1">
              {submissions.length === 0 ? (
                <div className="p-8 text-center text-slate-500 text-xs">
                  Hali hech bir o'quvchi ushbu vazifani topshirmagan.
                </div>
              ) : (
                submissions.map((sub: any) => {
                  const currentGrade = gradingState[sub.id] || { score: sub.score || 0, feedback: sub.feedback || '' };

                  return (
                    <div
                      key={sub.id}
                      className="bg-slate-950 border border-slate-800 rounded-xl p-4 space-y-3"
                    >
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-sm font-bold text-white">{sub.student?.fullName}</p>
                          <p className="text-[11px] text-slate-400">
                            Topshirildi: {new Date(sub.submittedAt).toLocaleString()}
                          </p>
                        </div>
                        <span
                          className={`text-xs px-2.5 py-1 rounded-full font-semibold ${
                            sub.status === 'reviewed'
                              ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                              : 'bg-amber-500/10 text-amber-400 border border-amber-500/20'
                          }`}
                        >
                          {sub.status === 'reviewed' ? `Baholangan (${sub.score} ball)` : 'Kutilmoqda'}
                        </span>
                      </div>

                      <div className="bg-slate-900 border border-slate-800 rounded-lg p-3 text-xs text-slate-200 whitespace-pre-wrap">
                        {sub.content}
                      </div>

                      {/* Baholash qismi */}
                      <div className="pt-2 border-t border-slate-800/80 grid grid-cols-1 sm:grid-cols-12 gap-2 items-center">
                        <div className="sm:col-span-3">
                          <label className="text-[11px] text-slate-400 block mb-1">Baho (max {selectedHomeworkForReview.maxScore})</label>
                          <input
                            type="number"
                            min="0"
                            max={selectedHomeworkForReview.maxScore}
                            value={currentGrade.score}
                            onChange={(e) =>
                              setGradingState({
                                ...gradingState,
                                [sub.id]: { ...currentGrade, score: Number(e.target.value) },
                              })
                            }
                            className="w-full px-2.5 py-1.5 rounded-lg bg-slate-900 border border-slate-800 text-xs text-white"
                          />
                        </div>

                        <div className="sm:col-span-6">
                          <label className="text-[11px] text-slate-400 block mb-1">O'qituvchi Izohi</label>
                          <input
                            type="text"
                            placeholder="Izoh yoki tavsiya..."
                            value={currentGrade.feedback}
                            onChange={(e) =>
                              setGradingState({
                                ...gradingState,
                                [sub.id]: { ...currentGrade, feedback: e.target.value },
                              })
                            }
                            className="w-full px-2.5 py-1.5 rounded-lg bg-slate-900 border border-slate-800 text-xs text-white"
                          />
                        </div>

                        <div className="sm:col-span-3 sm:pt-4">
                          <button
                            type="button"
                            onClick={() => handleGrade(sub.id)}
                            className="w-full bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold py-2 rounded-lg transition"
                          >
                            Saqlash
                          </button>
                        </div>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>
        </div>
      )}

      {/* AI O'qituvchi Yordamchi Modali */}
      <AiTeacherAssistantModal
        isOpen={isAiModalOpen}
        onClose={() => setIsAiModalOpen(false)}
        defaultTopic={groupName ? `${groupName} bo'yicha yangi mavzu` : ''}
        onApplyLesson={handleApplyAiLesson}
      />
    </div>
  );
}
