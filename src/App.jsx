import React, { useState, useEffect, useRef } from "react";
import { Send, Inbox, Heart, Sparkles, Lock, ChevronLeft, Trash2 } from "lucide-react";
import { db } from "./firebase";
import {
  collection,
  addDoc,
  deleteDoc,
  doc,
  getDocs,
  getDoc,
  setDoc,
  query,
  orderBy,
  serverTimestamp,
} from "firebase/firestore";

const MESSAGES_COLLECTION = "messages";

function timeAgo(ts) {
  const diff = Math.floor((Date.now() - ts) / 1000);
  if (diff < 60) return "เมื่อสักครู่";
  if (diff < 3600) return `${Math.floor(diff / 60)} นาทีที่แล้ว`;
  if (diff < 86400) return `${Math.floor(diff / 3600)} ชั่วโมงที่แล้ว`;
  return `${Math.floor(diff / 86400)} วันที่แล้ว`;
}

export default function App() {
  const [view, setView] = useState("send");
  const [text, setText] = useState("");
  const [name, setName] = useState("");
  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [unlocked, setUnlocked] = useState(false);
  const [pinInput, setPinInput] = useState("");
  const [pinConfirm, setPinConfirm] = useState("");
  const [storedPin, setStoredPin] = useState(undefined);
  const [pinError, setPinError] = useState("");
  const taRef = useRef(null);

  async function checkPin() {
    try {
      const snap = await getDoc(doc(db, "config", "pin"));
      setStoredPin(snap.exists() ? snap.data().value : null);
    } catch (e) {
      setStoredPin(null);
    }
  }

  async function loadMessages() {
    setLoading(true);
    try {
      const q = query(collection(db, MESSAGES_COLLECTION), orderBy("ts", "desc"));
      const snap = await getDocs(q);
      const list = snap.docs.map((d) => {
        const data = d.data();
        return {
          id: d.id,
          text: data.text,
          name: data.name,
          ts: data.ts?.toMillis ? data.ts.toMillis() : Date.now(),
        };
      });
      setMessages(list);
    } catch (e) {
      console.error(e);
      setMessages([]);
    } finally {
      setLoading(false);
    }
  }

  async function handleSend() {
    if (!text.trim() || sending) return;
    setSending(true);
    try {
      await addDoc(collection(db, MESSAGES_COLLECTION), {
        text: text.trim(),
        name: name.trim() || "ไม่ระบุชื่อ",
        ts: serverTimestamp(),
      });
      setText("");
      setName("");
      setView("sent");
    } catch (e) {
      console.error(e);
      alert("ส่งข้อความไม่สำเร็จ ลองใหม่อีกครั้ง");
    } finally {
      setSending(false);
    }
  }

  async function handleDelete(id) {
    try {
      const next = messages.filter((m) => m.id !== id);
      setMessages(next);
      await deleteDoc(doc(db, MESSAGES_COLLECTION, id));
    } catch (e) {
      console.error(e);
      loadMessages();
    }
  }

  async function handleSetPin() {
    if (pinInput.length < 4) {
      setPinError("รหัสต้องมีอย่างน้อย 4 หลัก");
      return;
    }
    if (pinInput !== pinConfirm) {
      setPinError("รหัสไม่ตรงกัน ลองใหม่อีกครั้ง");
      return;
    }
    try {
      await setDoc(doc(db, "config", "pin"), { value: pinInput });
      setStoredPin(pinInput);
      setUnlocked(true);
      setPinError("");
    } catch (e) {
      console.error(e);
      setPinError("ตั้งรหัสไม่สำเร็จ ลองใหม่");
    }
  }

  function handleCheckPin() {
    if (pinInput === storedPin) {
      setUnlocked(true);
      setPinError("");
    } else {
      setPinError("รหัสไม่ถูกต้อง");
      setPinInput("");
    }
  }

  const charLimit = 500;

  if (view === "send" || view === "sent") {
    return (
      <div className="min-h-screen bg-gradient-to-br from-violet-600 via-fuchsia-600 to-pink-500 flex flex-col items-center justify-center p-5 relative overflow-hidden">
        <div className="absolute top-10 left-10 w-40 h-40 bg-white/10 rounded-full blur-3xl" />
        <div className="absolute bottom-10 right-10 w-56 h-56 bg-white/10 rounded-full blur-3xl" />

        <div className="w-full max-w-sm relative z-10">
          <div className="text-center mb-6">
            <div className="inline-flex items-center gap-1.5 bg-white/20 backdrop-blur px-3 py-1 rounded-full text-white text-xs font-medium mb-3">
              <Sparkles size={12} />
              ส่งแบบไม่ระบุตัวตน
            </div>
            <h1 className="text-white text-4xl font-extrabold tracking-tight drop-shadow-sm">
              Say<span className="text-white/90">IT</span>
            </h1>
            <p className="text-white/80 text-sm mt-1">
              บอกอะไรก็ได้... จะชม จะแซว จะระบาย ก็ได้หมด
            </p>
          </div>

          {view === "send" ? (
            <div className="bg-white rounded-3xl shadow-2xl p-5">
              <textarea
                ref={taRef}
                value={text}
                onChange={(e) => setText(e.target.value.slice(0, charLimit))}
                placeholder="พิมพ์ข้อความที่นี่..."
                rows={5}
                className="w-full resize-none border-0 outline-none text-gray-800 placeholder-gray-400 text-base leading-relaxed"
              />
              <div className="flex justify-end text-xs text-gray-400 mb-3">
                {text.length}/{charLimit}
              </div>
              <div className="h-px bg-gray-100 mb-3" />
              <input
                value={name}
                onChange={(e) => setName(e.target.value.slice(0, 40))}
                placeholder="ชื่อ (จะใส่หรือไม่ใส่ก็ได้)"
                className="w-full border-0 outline-none text-gray-700 placeholder-gray-400 text-sm mb-4"
              />
              <button
                onClick={handleSend}
                disabled={!text.trim() || sending}
                className="w-full flex items-center justify-center gap-2 bg-gradient-to-r from-violet-600 to-pink-500 disabled:opacity-40 disabled:cursor-not-allowed text-white font-semibold py-3.5 rounded-2xl active:scale-95 transition-transform"
              >
                {sending ? "กำลังส่ง..." : (<><Send size={17} /> ส่งข้อความ</>)}
              </button>
            </div>
          ) : (
            <div className="bg-white rounded-3xl shadow-2xl p-8 text-center">
              <div className="w-16 h-16 bg-pink-50 rounded-full flex items-center justify-center mx-auto mb-4">
                <Heart className="text-pink-500" size={28} fill="currentColor" />
              </div>
              <h2 className="text-xl font-bold text-gray-800 mb-1">ส่งสำเร็จแล้ว!</h2>
              <p className="text-gray-500 text-sm mb-6">ข้อความของคุณถูกส่งไปเรียบร้อย</p>
              <button
                onClick={() => setView("send")}
                className="w-full bg-gradient-to-r from-violet-600 to-pink-500 text-white font-semibold py-3 rounded-2xl active:scale-95 transition-transform"
              >
                ส่งอีกข้อความ
              </button>
            </div>
          )}

          <button
            onClick={() => {
              setUnlocked(false);
              setPinInput("");
              setPinConfirm("");
              setPinError("");
              setView("inbox");
              loadMessages();
              checkPin();
            }}
            className="w-full flex items-center justify-center gap-1.5 text-white/70 text-xs mt-5 hover:text-white"
          >
            <Inbox size={13} /> เจ้าของเว็บ ดูข้อความที่ได้รับ
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="bg-gradient-to-br from-violet-600 to-pink-500 px-5 pt-6 pb-8 rounded-b-3xl shadow-md">
        <button
          onClick={() => setView("send")}
          className="flex items-center gap-1 text-white/90 text-sm mb-4"
        >
          <ChevronLeft size={16} /> กลับหน้าส่งข้อความ
        </button>
        <h1 className="text-white text-2xl font-extrabold flex items-center gap-2">
          <Inbox size={22} /> กล่องข้อความ
        </h1>
        <p className="text-white/80 text-sm mt-1">
          {messages.length} ข้อความทั้งหมด
        </p>
      </div>

      {storedPin === undefined ? (
        <p className="text-center text-gray-400 mt-10">กำลังตรวจสอบ...</p>
      ) : !unlocked ? (
        <div className="max-w-sm mx-auto mt-10 px-5">
          <div className="bg-white rounded-2xl shadow p-6 text-center">
            <Lock className="mx-auto text-gray-400 mb-3" size={28} />
            {storedPin === null ? (
              <>
                <p className="text-gray-700 font-semibold mb-1">ตั้งรหัสผ่านสำหรับดูข้อความ</p>
                <p className="text-gray-500 text-sm mb-4">
                  ตั้งครั้งเดียว ครั้งต่อไปต้องใส่รหัสนี้ทุกครั้งถึงจะเห็นข้อความ
                </p>
                <input
                  type="password"
                  inputMode="numeric"
                  value={pinInput}
                  onChange={(e) => setPinInput(e.target.value.replace(/\D/g, "").slice(0, 12))}
                  placeholder="ตั้งรหัส (อย่างน้อย 4 หลัก)"
                  className="w-full border border-gray-200 rounded-xl px-4 py-3 text-center text-lg tracking-widest outline-none focus:border-violet-400 mb-3"
                />
                <input
                  type="password"
                  inputMode="numeric"
                  value={pinConfirm}
                  onChange={(e) => setPinConfirm(e.target.value.replace(/\D/g, "").slice(0, 12))}
                  placeholder="ใส่รหัสอีกครั้ง"
                  className="w-full border border-gray-200 rounded-xl px-4 py-3 text-center text-lg tracking-widest outline-none focus:border-violet-400 mb-3"
                />
                {pinError && <p className="text-red-500 text-xs mb-3">{pinError}</p>}
                <button
                  onClick={handleSetPin}
                  className="w-full bg-gray-800 text-white font-semibold py-3 rounded-xl"
                >
                  ตั้งรหัสและเข้าดูข้อความ
                </button>
              </>
            ) : (
              <>
                <p className="text-gray-700 font-semibold mb-1">ใส่รหัสผ่าน</p>
                <p className="text-gray-500 text-sm mb-4">เพื่อดูข้อความทั้งหมด</p>
                <input
                  type="password"
                  inputMode="numeric"
                  autoFocus
                  value={pinInput}
                  onChange={(e) => setPinInput(e.target.value.replace(/\D/g, "").slice(0, 12))}
                  onKeyDown={(e) => e.key === "Enter" && handleCheckPin()}
                  placeholder="รหัสผ่าน"
                  className="w-full border border-gray-200 rounded-xl px-4 py-3 text-center text-lg tracking-widest outline-none focus:border-violet-400 mb-3"
                />
                {pinError && <p className="text-red-500 text-xs mb-3">{pinError}</p>}
                <button
                  onClick={handleCheckPin}
                  className="w-full bg-gray-800 text-white font-semibold py-3 rounded-xl"
                >
                  ปลดล็อก
                </button>
              </>
            )}
          </div>
          <p className="text-center text-xs text-gray-400 mt-3">
            * รหัสนี้กันได้แค่คนทั่วไปที่เผลอกดเข้ามา ไม่ใช่ระบบความปลอดภัยระดับสูง
          </p>
        </div>
      ) : loading ? (
        <p className="text-center text-gray-400 mt-10">กำลังโหลด...</p>
      ) : messages.length === 0 ? (
        <div className="text-center mt-16 px-5">
          <p className="text-gray-400">ยังไม่มีข้อความเข้ามา</p>
          <p className="text-gray-300 text-sm mt-1">แชร์ลิงก์เว็บนี้ให้เพื่อนๆ สิ!</p>
        </div>
      ) : (
        <div className="max-w-sm mx-auto px-5 py-5 space-y-3">
          {messages.map((m) => (
            <div key={m.id} className="bg-white rounded-2xl shadow-sm p-4 relative">
              <p className="text-gray-800 text-[15px] leading-relaxed whitespace-pre-wrap">
                {m.text}
              </p>
              <div className="flex items-center justify-between mt-3">
                <span className="text-xs font-medium text-violet-500 bg-violet-50 px-2 py-0.5 rounded-full">
                  {m.name}
                </span>
                <span className="text-xs text-gray-300">{timeAgo(m.ts)}</span>
              </div>
              <button
                onClick={() => handleDelete(m.id)}
                className="absolute top-3 right-3 text-gray-300 hover:text-red-400"
                aria-label="ลบข้อความ"
              >
                <Trash2 size={15} />
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
  }
