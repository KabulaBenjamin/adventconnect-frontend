import React, { useState } from 'react';
import { useParams } from 'react-router-dom';
import { Send, Users, Info, Hash } from 'lucide-react';

const GroupChat = () => {
  const { groupId } = useParams();
  const [message, setMessage] = useState('');

  // Placeholder messages - we will connect Socket.io here later
  const messages = [
    { id: 1, user: "Sarah", text: "Blessed morning everyone!", time: "08:30" },
    { id: 2, user: "John", text: "Amen! Are we meeting for practice today?", time: "08:35" }
  ];

  return (
    <div className="flex h-[calc(100vh-64px)] bg-white">
      {/* Chat Area */}
      <div className="flex-1 flex flex-col">
        <div className="p-4 border-b flex justify-between items-center bg-gray-50/50">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-blue-600 rounded-xl flex items-center justify-center text-white">
              <Hash size={20} />
            </div>
            <div>
              <h2 className="font-black text-gray-900 leading-none">Youth Ministry Chat</h2>
              <span className="text-[10px] font-bold text-green-600 uppercase tracking-widest">12 Members Online</span>
            </div>
          </div>
          <button className="p-2 text-gray-400 hover:text-blue-600 transition">
            <Info size={20} />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {messages.map((msg) => (
            <div key={msg.id} className="flex flex-col items-start">
              <span className="text-[10px] font-black text-gray-400 ml-1 mb-1">{msg.user}</span>
              <div className="bg-gray-100 p-4 rounded-2xl rounded-tl-none max-w-md">
                <p className="text-sm font-bold text-gray-800">{msg.text}</p>
                <span className="text-[9px] text-gray-400 mt-2 block text-right">{msg.time}</span>
              </div>
            </div>
          ))}
        </div>

        <div className="p-4 bg-white border-t">
          <div className="flex gap-2 bg-gray-50 p-2 rounded-2xl border border-gray-100">
            <input 
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              placeholder="Message your community..."
              className="flex-1 bg-transparent border-none focus:ring-0 px-3 font-bold text-sm"
            />
            <button className="bg-blue-600 text-white p-3 rounded-xl hover:bg-blue-700 transition">
              <Send size={18} />
            </button>
          </div>
        </div>
      </div>

      {/* Right Sidebar - Members List */}
      <div className="w-72 border-l hidden lg:block p-6">
        <h3 className="font-black text-gray-900 mb-6 flex items-center gap-2">
          <Users size={18} className="text-blue-600" /> Members
        </h3>
        <div className="space-y-4">
           <MemberItem name="Sarah J." role="Admin" online />
           <MemberItem name="John Doe" role="Member" online />
           <MemberItem name="Benjamin K." role="Superuser" />
        </div>
      </div>
    </div>
  );
};

const MemberItem = ({ name, role, online }: any) => (
  <div className="flex items-center gap-3">
    <div className="relative">
      <div className="w-8 h-8 bg-gray-200 rounded-lg" />
      {online && <div className="absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 bg-green-500 border-2 border-white rounded-full" />}
    </div>
    <div>
      <p className="text-xs font-black text-gray-900">{name}</p>
      <p className="text-[9px] font-bold text-gray-400 uppercase tracking-tighter">{role}</p>
    </div>
  </div>
);

export default GroupChat;
