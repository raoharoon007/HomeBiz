import React, { useState, useEffect, useRef } from 'react';
import { Storage, useStorageSubscription } from '../../lib/storage';
import { useAuth } from '../../lib/authContext';
import { Conversation, Message } from '../../types';
import { Send, Paperclip, CheckCheck, Clock, MessageSquare, ArrowLeft, Store, User as UserIcon } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { triggerVendorAiResponse } from '../../lib/vendorAiBot';

interface ChatWindowProps {
  initialConversationId?: string;
  onBackMobile?: () => void;
}

export function ChatWindow({ initialConversationId, onBackMobile }: ChatWindowProps) {
  useStorageSubscription();
  const { user, role } = useAuth();
  const currentUserId = user ? user.id : 'user-c1';
  const currentUserName = user ? user.name : 'Customer';

  const getUserConversations = (all: Conversation[]) => {
    if (!user) return [];

    return all.filter((conversation) => {
      if (role === 'SELLER') {
        return conversation.vendorId === user.sellerProfileId || conversation.vendorId === user.id;
      }

      if (role === 'ADMIN') {
        return true;
      }

      return conversation.customerId === user.id;
    });
  };

  const [conversations, setConversations] = useState<Conversation[]>(() => getUserConversations(Storage.getConversations()));
  const [activeConvId, setActiveConvId] = useState<string>(() => {
    if (initialConversationId) return initialConversationId;
    const userConvs = getUserConversations(Storage.getConversations());
    return userConvs[0]?.id || '';
  });

  const [inputMessage, setInputMessage] = useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setConversations(getUserConversations(Storage.getConversations()));
  }, [currentUserId, role, user?.sellerProfileId]);

  // Supabase Realtime — subscribe to new messages in the active conversation
  useEffect(() => {
    if (!activeConvId) return;

    const channel = supabase
      .channel(`chat-${activeConvId}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'messages',
          filter: `conversation_id=eq.${activeConvId}`,
        },
        (payload: any) => {
          const incoming = payload.new;
          // Ignore messages from the current user (already added optimistically)
          if (incoming.sender_id === currentUserId) return;
          const msg: Message = {
            id: incoming.id,
            conversationId: incoming.conversation_id,
            senderId: incoming.sender_id,
            senderName: incoming.sender_name || 'User',
            senderRole: incoming.sender_role || 'CUSTOMER',
            text: incoming.text || incoming.content || '',
            timestamp: incoming.created_at,
            read: false,
          };
          Storage.appendRealtimeMessage(msg);
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [activeConvId, currentUserId]);

  const activeConv = conversations.find((c) => c.id === activeConvId);
  const messages = Storage.getMessages(activeConvId);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages.length, activeConvId]);

  const handleSendMessage = (textToSend?: string) => {
    const text = (textToSend || inputMessage).trim();
    if (!text || !activeConvId) return;

    Storage.sendMessage({
      conversationId: activeConvId,
      senderId: currentUserId,
      senderName: currentUserName,
      senderRole: role,
      text,
    });

    setInputMessage('');

    // Trigger AI Vendor Bot auto-reply if message is sent by a Customer
    if (role === 'CUSTOMER' || !user) {
      triggerVendorAiResponse(activeConvId, text);
    }
  };

  const quickReplies = [
    'Salam! Is this date still available?',
    'What flavors and custom fillings are available?',
    'Can you provide home delivery in DHA / Gulberg?',
    'Yes, we can definitely customize this for your event!',
  ];

  return (
    <div className="bg-white rounded-2xl border border-[#e3e2e1] shadow-xs overflow-hidden h-[620px] flex flex-col md:flex-row">
      {/* Left Sidebar: Conversations List */}
      <div
        className={`w-full md:w-80 border-r border-[#e3e2e1] flex flex-col bg-[#faf9f8] ${activeConvId && onBackMobile ? 'hidden md:flex' : 'flex'
          }`}
      >
        <div className="p-3.5 border-b border-[#e3e2e1] bg-white">
          <h3 className="font-bold text-sm text-[#1a1c1c]">Conversations</h3>
          <span className="text-[11px] text-[#665d55]">Direct messaging with home creators</span>
        </div>

        <div className="flex-1 overflow-y-auto divide-y divide-[#f4f3f2] custom-scrollbar">
          {conversations.length === 0 ? (
            <div className="p-8 text-center text-xs text-[#665d55]">No active conversations.</div>
          ) : (
            conversations.map((conv) => {
              const isSelected = conv.id === activeConvId;
              const otherPartyName = role === 'SELLER' ? conv.customerName : conv.vendorName;
              const otherPartyAvatar = role === 'SELLER' ? conv.customerAvatar : conv.vendorAvatar;

              return (
                <div
                  key={conv.id}
                  onClick={() => setActiveConvId(conv.id)}
                  className={`p-3.5 cursor-pointer transition-colors flex items-start gap-3 ${isSelected ? 'bg-white border-l-4 border-[#003527]' : 'hover:bg-white/60'
                    }`}
                >
                  <img
                    src={
                      otherPartyAvatar ||
                      'https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=100&q=80'
                    }
                    alt={otherPartyName || 'User'}
                    className="w-10 h-10 rounded-full object-cover border border-[#e3e2e1] flex-shrink-0"
                  />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between">
                      <h4 className="font-bold text-xs text-[#1a1c1c] truncate">{otherPartyName}</h4>
                      <span className="text-[10px] text-[#665d55] flex-shrink-0">
                        {new Date(conv.lastMessageAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </span>
                    </div>
                    <p className="text-[11px] text-[#665d55] truncate mt-0.5">{conv.lastMessage}</p>
                    {conv.contextTitle && (
                      <span className="inline-block mt-1 text-[9px] bg-[#f4f3f2] text-[#003527] px-1.5 py-0.5 rounded font-medium truncate max-w-full">
                        {conv.contextTitle}
                      </span>
                    )}
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>

      {/* Right Area: Active Chat */}
      {activeConv ? (
        <div className="flex-1 flex flex-col bg-white h-full">
          {/* Header */}
          <div className="p-3.5 border-b border-[#e3e2e1] flex items-center justify-between bg-white z-10">
            <div className="flex items-center gap-3">
              {onBackMobile && (
                <button
                  onClick={onBackMobile}
                  className="md:hidden p-1.5 rounded-lg text-stone-600 hover:bg-stone-100"
                >
                  <ArrowLeft className="w-4 h-4" />
                </button>
              )}
              <img
                src={
                  (role === 'SELLER' ? activeConv.customerAvatar : activeConv.vendorAvatar) ||
                  'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=150&q=80'
                }
                alt="Avatar"
                className="w-9 h-9 rounded-full object-cover border border-[#95d3ba]"
              />
              <div>
                <h4 className="font-bold text-xs sm:text-sm text-[#1a1c1c]">
                  {role === 'SELLER' ? activeConv.customerName : activeConv.vendorName}
                </h4>
                <span className="text-[10px] text-emerald-700 font-medium flex items-center gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                  Active on HomeBiz
                </span>
              </div>
            </div>

            {activeConv.contextTitle && (
              <div className="hidden sm:block text-right">
                <span className="text-[10px] text-[#665d55] block">Order / Request Ref</span>
                <span className="text-xs font-bold text-[#003527]">{activeConv.contextTitle}</span>
              </div>
            )}
          </div>

          {/* Messages Stream */}
          <div className="flex-1 p-4 overflow-y-auto space-y-3 bg-[#faf9f8] custom-scrollbar">
            <div className="text-center my-2">
              <span className="text-[10px] bg-white text-[#665d55] px-3 py-1 rounded-full border border-[#e3e2e1] shadow-2xs">
                Encrypted & Verified Chat • Payments protected by HomeBiz SafeGuarantee
              </span>
            </div>

            {messages.map((msg) => {
              const isMe = msg.senderId === currentUserId;

              return (
                <div key={msg.id} className={`flex ${isMe ? 'justify-end' : 'justify-start'}`}>
                  <div
                    className={`max-w-[78%] rounded-2xl px-4 py-2.5 shadow-xs text-xs ${isMe
                        ? 'bg-[#003527] text-white rounded-br-xs'
                        : 'bg-white text-[#1a1c1c] border border-[#e3e2e1] rounded-bl-xs'
                      }`}
                  >
                    <p className="leading-relaxed whitespace-pre-wrap">{msg.text}</p>
                    <div
                      className={`flex items-center justify-end gap-1 mt-1 text-[9px] ${isMe ? 'text-emerald-200' : 'text-[#665d55]'
                        }`}
                    >
                      <span>{new Date(msg.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                      {isMe && <CheckCheck className="w-3 h-3 text-[#95d3ba]" />}
                    </div>
                  </div>
                </div>
              );
            })}
            <div ref={messagesEndRef} />
          </div>

          {/* Quick Replies Strip */}
          <div className="px-3 py-2 bg-white border-t border-[#f4f3f2] flex items-center gap-1.5 overflow-x-auto hide-scrollbar">
            {quickReplies.map((qr, i) => (
              <button
                key={i}
                onClick={() => handleSendMessage(qr)}
                className="flex-shrink-0 text-[11px] bg-[#f4f3f2] hover:bg-[#FFF1E7] hover:text-[#735c00] text-[#404944] px-3 py-1 rounded-full transition-colors"
              >
                {qr}
              </button>
            ))}
          </div>

          {/* Input Bar */}
          <div className="p-3 bg-white border-t border-[#e3e2e1]">
            <form
              onSubmit={(e) => {
                e.preventDefault();
                handleSendMessage();
              }}
              className="flex items-center gap-2"
            >
              <input
                type="text"
                value={inputMessage}
                onChange={(e) => setInputMessage(e.target.value)}
                placeholder="Type your message in Urdu or English..."
                className="flex-1 bg-[#f4f3f2] text-xs px-4 py-2.5 rounded-full border border-transparent focus:border-[#003527] focus:bg-white outline-none transition-all"
              />
              <button
                type="submit"
                disabled={!inputMessage.trim()}
                className="w-10 h-10 rounded-full bg-[#003527] hover:bg-[#064e3b] text-white flex items-center justify-center shadow-sm disabled:opacity-40 transition-colors flex-shrink-0"
              >
                <Send className="w-4 h-4" />
              </button>
            </form>
          </div>
        </div>
      ) : (
        <div className="flex-1 flex flex-col items-center justify-center p-8 text-center bg-[#faf9f8]">
          <MessageSquare className="w-12 h-12 text-[#95d3ba] mb-3" />
          <h4 className="font-bold text-sm text-[#1a1c1c]">No Conversation Selected</h4>
          <p className="text-xs text-[#665d55] max-w-xs mt-1">
            Choose a conversation from the left or message any creator directly from their profile page.
          </p>
        </div>
      )}
    </div>
  );
}
