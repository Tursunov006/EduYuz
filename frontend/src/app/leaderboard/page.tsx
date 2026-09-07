'use client';

import { useState, useEffect } from 'react';
import axios from 'axios';
import { 
  Trophy, 
  Medal, 
  Coins, 
  Crown, 
  Sparkles, 
  TrendingUp, 
  Plus, 
  User 
} from 'lucide-react';

export default function LeaderboardPage() {
  const [leaders, setLeaders] = useState<any[]>([]);
  const [groups, setGroups] = useState<any[]>([]);
  const [selectedGroupId, setSelectedGroupId] = useState<string>('');
  const [loading, setLoading] = useState(true);

  // Qo'lda Coin berish modali
  const [isAwardModalOpen, setIsAwardModalOpen] = useState(false);
  const [awardForm, setAwardForm] = useState({
    studentId: '',
    amount: 20,
    reason: 'Darsdagi faollik uchun',
  });

  const getHeaders = () => {
    const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null;
    return token ? { Authorization: `Bearer ${token}` } : {};
  };

  async function loadData() {
    try {
      setLoading(true);
      const [leadRes, grpRes] = await Promise.all([
        axios.get(`http://localhost:3000/api/v1/gamification/leaderboard${selectedGroupId ? `?groupId=${selectedGroupId}` : ''}`),
        axios.get('http://localhost:3000/api/v1/groups', { headers: getHeaders() }),
      ]);
      setLeaders(leadRes.data || []);
      setGroups(grpRes.data || []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadData();
  }, [selectedGroupId]);

  async function handleAwardCoins(e: React.FormEvent) {
    e.preventDefault();
    if (!awardForm.studentId) return alert('O\'quvchini tanlang!');
    try {
      await axios.post(
        'http://localhost:3000/api/v1/gamification/award',
        {
          studentId: awardForm.studentId,
          amount: Number(awardForm.amount),
          reason: awardForm.reason,
        },
        { headers: getHeaders() }
      );
      alert('EduCoinlar muvaffaqiyatli berildi! 🪙✨');
      setIsAwardModalOpen(false);
      loadData();
    } catch (err: any) {
      alert(err.response?.data?.message || 'Xatolik yuz berdi');
    }
  }

  const top1 = leaders[0];
  const top2 = leaders[1];
  const top3 = leaders[2];
  const otherLeaders = leaders.slice(3);

  return (
    <div className="space-y-8 max-w-6xl mx-auto">
      {/* Sarlavha va Guruh filtri */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-black tracking-tight text-white flex items-center gap-3">
            <Trophy className="text-amber-400" size={32} />
            EduYuz Reytingi va EduCoinlar
          </h1>
          <p className="text-xs text-slate-400 mt-1">
            Darsga qatnashganlik va a'lo baholangan uy vazifalari uchun berilgan ballar shohsupasi
          </p>
        </div>

        <div className="flex items-center gap-3">
          <select
            value={selectedGroupId}
            onChange={(e) => setSelectedGroupId(e.target.value)}
            className="px-4 py-2.5 rounded-xl bg-slate-900 border border-slate-800 text-sm text-white focus:outline-none focus:border-indigo-500"
          >
            <option value="">Barcha o'quvchilar (Umumiy markaz)</option>
            {groups.map((g) => (
              <option key={g.id} value={g.id}>
                {g.name}
              </option>
            ))}
          </select>

          <button
            onClick={() => setIsAwardModalOpen(true)}
            className="flex items-center gap-2 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 text-slate-950 font-bold px-4 py-2.5 rounded-xl text-sm transition shadow-lg shadow-amber-500/20"
          >
            <Plus size={16} /> Bonus Coin Berish
          </button>
        </div>
      </div>

      {loading ? (
        <div className="p-12 text-center text-slate-500">Reyting hisoblanmoqda...</div>
      ) : leaders.length === 0 ? (
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-12 text-center space-y-3">
          <Trophy size={40} className="mx-auto text-slate-600" />
          <h3 className="text-base font-semibold text-white">Hozircha reytingda o'quvchilar yo'q</h3>
          <p className="text-xs text-slate-400 max-w-sm mx-auto">
            Davomat belgilanganda yoki uy vazifalari baholanganda o'quvchilar avtomatik EduCoin yig'adilar.
          </p>
        </div>
      ) : (
        <div className="space-y-8">
          {/* Top 3 Shohsupasi (Podium) */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 items-end pt-8">
            {/* 2-O'rin (Kumush) */}
            {top2 ? (
              <div className="order-2 md:order-1 bg-slate-900/80 border border-slate-800 rounded-3xl p-6 text-center space-y-3 relative shadow-xl hover:border-slate-700 transition">
                <div className="absolute -top-6 left-1/2 -translate-x-1/2 w-12 h-12 rounded-2xl bg-gradient-to-br from-slate-300 to-slate-500 flex items-center justify-center text-slate-950 font-black text-xl shadow-lg">
                  2
                </div>
                <div className="pt-4">
                  <h3 className="text-lg font-bold text-white">{top2.fullName}</h3>
                  <p className="text-xs text-slate-400">{top2.groupName}</p>
                </div>
                <div className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full bg-slate-800 text-slate-200 text-sm font-bold border border-slate-700">
                  <Coins size={16} className="text-amber-400" />
                  {top2.coins} EduCoin
                </div>
              </div>
            ) : <div className="hidden md:block order-1"></div>}

            {/* 1-O'rin (Oltin Shohsupa) */}
            {top1 ? (
              <div className="order-1 md:order-2 bg-gradient-to-b from-amber-500/10 via-slate-900 to-slate-900 border-2 border-amber-500/40 rounded-3xl p-8 text-center space-y-4 relative shadow-2xl shadow-amber-500/10 scale-105">
                <div className="absolute -top-8 left-1/2 -translate-x-1/2 w-16 h-16 rounded-2xl bg-gradient-to-br from-amber-400 to-amber-600 flex items-center justify-center text-slate-950 font-black text-2xl shadow-xl shadow-amber-500/30">
                  <Crown size={32} className="text-slate-950" />
                </div>
                <div className="pt-6">
                  <span className="text-[11px] uppercase tracking-widest text-amber-400 font-extrabold">
                    MUTLAQ CHEMPION
                  </span>
                  <h2 className="text-2xl font-black text-white mt-1">{top1.fullName}</h2>
                  <p className="text-xs text-slate-400">{top1.groupName}</p>
                </div>
                <div className="inline-flex items-center gap-2 px-5 py-2 rounded-2xl bg-amber-500/20 text-amber-300 text-base font-black border border-amber-500/40 shadow-inner">
                  <Coins size={20} className="text-amber-400" />
                  {top1.coins} EduCoin
                </div>
              </div>
            ) : null}

            {/* 3-O'rin (Bronza) */}
            {top3 ? (
              <div className="order-3 bg-slate-900/80 border border-slate-800 rounded-3xl p-6 text-center space-y-3 relative shadow-xl hover:border-slate-700 transition">
                <div className="absolute -top-6 left-1/2 -translate-x-1/2 w-12 h-12 rounded-2xl bg-gradient-to-br from-amber-700 to-amber-900 text-amber-100 flex items-center justify-center font-black text-xl shadow-lg">
                  3
                </div>
                <div className="pt-4">
                  <h3 className="text-lg font-bold text-white">{top3.fullName}</h3>
                  <p className="text-xs text-slate-400">{top3.groupName}</p>
                </div>
                <div className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full bg-slate-800 text-slate-200 text-sm font-bold border border-slate-700">
                  <Coins size={16} className="text-amber-400" />
                  {top3.coins} EduCoin
                </div>
              </div>
            ) : <div className="hidden md:block order-3"></div>}
          </div>

          {/* Umumiy Reyting Jadvali */}
          <div className="bg-slate-900 border border-slate-800 rounded-3xl overflow-hidden shadow-sm">
            <div className="p-5 border-b border-slate-800 flex items-center justify-between">
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                <TrendingUp size={18} className="text-indigo-400" />
                Umumiy O'quvchilar Jadvali ({leaders.length})
              </h3>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead className="bg-slate-950/60 text-slate-400 border-b border-slate-800">
                  <tr>
                    <th className="py-3 px-5 text-center w-16">O'rin</th>
                    <th className="py-3 px-5">O'quvchi</th>
                    <th className="py-3 px-5">Guruh / Kurs</th>
                    <th className="py-3 px-5 text-right">To'plangan EduCoin</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60">
                  {leaders.map((st) => (
                    <tr key={st.id} className="hover:bg-slate-800/30 transition">
                      <td className="py-4 px-5 text-center font-bold">
                        {st.rank === 1 ? (
                          <span className="inline-flex w-7 h-7 rounded-lg bg-amber-400 text-slate-950 items-center justify-center font-black text-xs">
                            1
                          </span>
                        ) : st.rank === 2 ? (
                          <span className="inline-flex w-7 h-7 rounded-lg bg-slate-400 text-slate-950 items-center justify-center font-black text-xs">
                            2
                          </span>
                        ) : st.rank === 3 ? (
                          <span className="inline-flex w-7 h-7 rounded-lg bg-amber-800 text-amber-100 items-center justify-center font-black text-xs">
                            3
                          </span>
                        ) : (
                          <span className="text-slate-500 font-semibold">{st.rank}</span>
                        )}
                      </td>
                      <td className="py-4 px-5 font-semibold text-white">
                        {st.fullName}
                      </td>
                      <td className="py-4 px-5 text-slate-300">
                        <span className="text-xs bg-slate-800 px-2.5 py-1 rounded-md text-slate-300">
                          {st.groupName}
                        </span>
                      </td>
                      <td className="py-4 px-5 text-right font-black text-amber-400">
                        <span className="inline-flex items-center gap-1.5 bg-amber-500/10 border border-amber-500/20 px-3 py-1 rounded-xl">
                          <Coins size={15} />
                          {st.coins}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* Bonus Coin Berish Modali */}
      {isAwardModalOpen && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 w-full max-w-md space-y-4 shadow-2xl">
            <h3 className="text-lg font-bold text-white flex items-center gap-2">
              <Coins className="text-amber-400" size={20} />
              O'quvchiga Bonus EduCoin Berish
            </h3>
            <form onSubmit={handleAwardCoins} className="space-y-4">
              <div>
                <label className="text-xs font-semibold text-slate-400">O'quvchini Tanlang *</label>
                <select
                  required
                  value={awardForm.studentId}
                  onChange={(e) => setAwardForm({ ...awardForm, studentId: e.target.value })}
                  className="w-full mt-1.5 px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-sm text-white"
                >
                  <option value="">O'quvchi tanlang...</option>
                  {leaders.map((st) => (
                    <option key={st.id} value={st.id}>
                      {st.fullName} ({st.groupName})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-400">Coin Miqdori (+/-)</label>
                <input
                  type="number"
                  required
                  value={awardForm.amount}
                  onChange={(e) => setAwardForm({ ...awardForm, amount: Number(e.target.value) })}
                  className="w-full mt-1.5 px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-sm text-white"
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-400">Berish Sababi</label>
                <input
                  type="text"
                  required
                  placeholder="Masalan: Hackathonda g'olib bo'lgani uchun"
                  value={awardForm.reason}
                  onChange={(e) => setAwardForm({ ...awardForm, reason: e.target.value })}
                  className="w-full mt-1.5 px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-sm text-white"
                />
              </div>

              <div className="flex justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setIsAwardModalOpen(false)}
                  className="px-4 py-2 text-sm text-slate-400 hover:text-white"
                >
                  Bekor qilish
                </button>
                <button
                  type="submit"
                  className="bg-amber-500 hover:bg-amber-600 text-slate-950 font-bold px-5 py-2 rounded-xl text-sm transition"
                >
                  Coinlarni Berish
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
