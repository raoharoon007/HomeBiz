import React, { useState, useEffect, useRef } from 'react';
import { Storage, useStorageSubscription } from '../../lib/storage';
import { useAuth } from '../../lib/authContext';
import { Conversation, Message } from '../../types';
import {
  Send,
  CheckCheck,
  MessageSquare,
  ArrowLeft,
  Bot,
  Sparkles,
  Plus,
  User as UserIcon,
  Store,
  Clock,
  X,
  Check,
} from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { triggerVendorAiResponse } from '../../lib/vendorAiBot';
import { useSearchParams } from '../../lib/navigation';

interface ChatWindowProps {
  initialConversationId?: string;
  onBackMobile?: () => void;
}

export function ChatWindow({ initialConversationId, onBackMobile }: ChatWindowProps) {
  useStorageSubscription();
  const { user, role } = useAuth();
  const searchParams = useSearchParams();

  const userVendor = user
    ? Storage.getVendors().find((v) => v.id === user.sellerProfileId || v.userId === user.id)
    : null;

  const currentUserId = user ? user.id : 'user-c1';
  const currentUserName = user
    ? role === 'SELLER' && userVendor
      ? userVendor.businessName
      : user.name
    : 'Customer';

  const getUserConversations = (all: Conversation[]) => {
    if (!user) return [];

    return all.filter((conversation) => {
      if (role === 'SELLER') {
        return (
          conversation.vendorId === user.sellerProfileId ||
          conversation.vendorId === user.id ||
          Boolean(userVendor && conversation.vendorId === userVendor.id) ||
          Boolean(conversation.participants?.some((p) => p.id === user.id || (userVendor && p.id === userVendor.id)))
        );
      }

      if (role === 'ADMIN') {
        return true;
      }

      return (
        conversation.customerId === user.id ||
        Boolean(conversation.participants?.some((p) => p.id === user.id))
      );
    });
  };

  const [conversations, setConversations] = useState<Conversation[]>(() =>
    getUserConversations(Storage.getConversations())
  );

  const queryConvId = searchParams.get('convId');
  const [activeConvId, setActiveConvId] = useState<string>(() => {
    if (queryConvId) return queryConvId;
    if (initialConversationId) return initialConversationId;
    const userConvs = getUserConversations(Storage.getConversations());
    return userConvs[0]?.id || '';
  });

  const [inputMessage, setInputMessage] = useState('');
  const [aiAutoReplyEnabled, setAiAutoReplyEnabled] = useState(false);
  const [showNewChatModal, setShowNewChatModal] = useState(false);
  const [isGeneratingAiDraft, setIsGeneratingAiDraft] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Sync activeConvId if query param changes
  useEffect(() => {
    if (queryConvId) {
      setActiveConvId(queryConvId);
    }
  }, [queryConvId]);

  // Sync conversation list when storage or auth changes
  useEffect(() => {
    const updated = getUserConversations(Storage.getConversations());
    setConversations(updated);

    if (activeConvId && !updated.some((c) => c.id === activeConvId)) {
      if (updated.length > 0 && !queryConvId) {
        setActiveConvId(updated[0].id);
      }
    }
  }, [currentUserId, role, user?.sellerProfileId, userVendor?.id]);

  // Mark active conversation as read
  useEffect(() => {
    if (activeConvId && user) {
      Storage.markConversationAsRead(activeConvId, role === 'SELLER' ? 'SELLER' : 'CUSTOMER');
    }
  }, [activeConvId, user, role]);

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
          if (incoming.sender_id === currentUserId) return;
          const msg: Message = {
            id: incoming.id,
            conversationId: incoming.conversation_id,
            senderId: incoming.sender_id,
            senderName: incoming.sender_name || 'User',
            senderRole: incoming.sender_role || 'CUSTOMER',
            text: incoming.text || incoming.content || '',
            createdAt: incoming.created_at || new Date().toISOString(),
            timestamp: incoming.created_at || new Date().toISOString(),
            read: false,
          };
          Storage.appendRealtimeMessage(msg);
          if (role) {
            Storage.markConversationAsRead(activeConvId, role === 'SELLER' ? 'SELLER' : 'CUSTOMER');
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [activeConvId, currentUserId, role]);

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

    // If AI Auto-Responder toggle is explicitly enabled, trigger vendor bot
    if (aiAutoReplyEnabled && (role === 'CUSTOMER' || !user)) {
      triggerVendorAiResponse(activeConvId, text);
    }
  };

  // Generate an AI draft suggestion for the seller
  const handleGenerateAiDraft = () => {
    if (!activeConv) return;
    setIsGeneratingAiDraft(true);

    setTimeout(() => {
      const lastCustomerMsg = [...messages].reverse().find((m) => m.senderRole === 'CUSTOMER');
      const otherName = role === 'SELLER' ? activeConv.customerName || 'Customer' : activeConv.vendorName || 'Creator';

      let suggested = `Salam ${otherName}! Thank you for reaching out. Yes, we would be delighted to assist you with this order. Could you please confirm your preferred delivery date and any specific styling preferences?`;

      if (lastCustomerMsg?.text.toLowerCase().includes('price') || lastCustomerMsg?.text.toLowerCase().includes('kitna') || lastCustomerMsg?.text.toLowerCase().includes('cost')) {
        suggested = `Salam ${otherName}! Our bespoke package starts at Rs. ${userVendor?.startingPrice || 2500}. We prepare everything fresh with premium ingredients. Would you like a customized breakdown?`;
      } else if (lastCustomerMsg?.text.toLowerCase().includes('delivery') || lastCustomerMsg?.text.toLowerCase().includes('location') || lastCustomerMsg?.text.toLowerCase().includes('dha')) {
        suggested = `Salam ${otherName}! Yes, we deliver safely across ${userVendor?.city || 'Lahore'} via our verified doorstep delivery partners. What is your preferred delivery time?`;
      }

      setInputMessage(suggested);
      setIsGeneratingAiDraft(false);
    }, 600);
  };

  const quickReplies = role === 'SELLER'
    ? [
      'Salam! Yes, we can prepare this fresh for your event.',
      'Could you please share your delivery address and preferred time slot?',
      'Your order has been noted and our kitchen will prepare it with pure ingredients.',
      'Yes, we can customize the flavors and writing as you requested!',
    ]
    : [
      'Salam! Is this date still available?',
      'What flavors and custom options are available?',
      'Can you provide doorstep delivery to my location?',
      'Please confirm the total price with delivery included.',
    ];

  // For New Chat modal: list recent bookings/customers
  const recentBookings = role === 'SELLER' && userVendor
    ? Storage.getBookings().filter((b) => b.vendorId === userVendor.id)
    : [];

  return (
    <div className="bg-white rounded-3xl border border-[#e3e2e1] shadow-sm overflow-hidden h-[640px] flex flex-col md:flex-row">
      {/* Left Sidebar: Conversations List */}
      <div
        className={`w-full md:w-80 border-r border-[#e3e2e1] flex flex-col bg-[#faf9f8] ${activeConvId && onBackMobile ? 'hidden md:flex' : 'flex'
          }`}
      >
        <div className="p-3.5 border-b border-[#e3e2e1] bg-white flex items-center justify-between">
          <div>
            <h3 className="font-bold text-sm text-[#1a1c1c] flex items-center gap-1.5">
              <MessageSquare className="w-4 h-4 text-[#003527]" />
              <span>Conversations</span>
            </h3>
            <span className="text-[11px] text-[#665d55]">
              {role === 'SELLER' ? 'Direct customer messages' : 'Direct creator messages'}
            </span>
          </div>

          {role === 'SELLER' && recentBookings.length > 0 && (
            <button
              onClick={() => setShowNewChatModal(true)}
              className="p-1.5 rounded-full bg-[#003527] text-white hover:bg-[#064e3b] transition-colors shadow-2xs"
              title="Start new message with a customer"
            >
              <Plus className="w-3.5 h-3.5" />
            </button>
          )}
        </div>

        <div className="flex-1 overflow-y-auto divide-y divide-[#f4f3f2] custom-scrollbar">
          {conversations.length === 0 ? (
            <div className="p-8 text-center space-y-2">
              <div className="w-10 h-10 rounded-full bg-[#f4f3f2] text-[#665d55] mx-auto flex items-center justify-center">
                <MessageSquare className="w-5 h-5" />
              </div>
              <p className="text-xs font-bold text-[#1a1c1c]">No active conversations yet</p>
              <p className="text-[11px] text-[#665d55]">
                {role === 'SELLER'
                  ? 'When customers send inquiries from your storefront, they will show up here.'
                  : 'Inquire with any home creator on their storefront to start chatting.'}
              </p>
            </div>
          ) : (
            conversations.map((conv) => {
              const isSelected = conv.id === activeConvId;
              const otherPartyName = role === 'SELLER' ? conv.customerName || 'Customer' : conv.vendorName || 'Creator';
              const otherPartyAvatar = role === 'SELLER' ? conv.customerAvatar : conv.vendorAvatar;
              const unreadCount = role === 'SELLER' ? conv.unreadCountVendor || 0 : conv.unreadCountCustomer || 0;

              return (
                <div
                  key={conv.id}
                  onClick={() => {
                    setActiveConvId(conv.id);
                    if (role) {
                      Storage.markConversationAsRead(conv.id, role === 'SELLER' ? 'SELLER' : 'CUSTOMER');
                    }
                  }}
                  className={`p-3.5 cursor-pointer transition-colors flex items-start gap-3 ${isSelected ? 'bg-white border-l-4 border-[#003527] shadow-2xs' : 'hover:bg-white/60'
                    }`}
                >
                  <div className="relative flex-shrink-0">
                    <img
                      src={
                        otherPartyAvatar ||
                        `https://ui-avatars.com/api/?name=${encodeURIComponent(otherPartyName)}&background=003527&color=fff&size=80`
                      }
                      alt={otherPartyName}
                      className="w-10 h-10 rounded-full object-cover border border-[#e3e2e1]"
                    />
                    {unreadCount > 0 && (
                      <span className="absolute -top-1 -right-1 w-4 h-4 bg-[#ba1a1a] text-white text-[9px] font-bold rounded-full flex items-center justify-center shadow-xs">
                        {unreadCount}
                      </span>
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between">
                      <h4 className={`text-xs truncate ${unreadCount > 0 ? 'font-black text-[#003527]' : 'font-bold text-[#1a1c1c]'}`}>
                        {otherPartyName}
                      </h4>
                      <span className="text-[10px] text-[#665d55] flex-shrink-0 ml-1">
                        {new Date(conv.lastMessageAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </span>
                    </div>
                    <p className={`text-[11px] truncate mt-0.5 ${unreadCount > 0 ? 'font-bold text-[#1a1c1c]' : 'text-[#665d55]'}`}>
                      {conv.lastMessage}
                    </p>
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
                  `https://ui-avatars.com/api/?name=${encodeURIComponent(
                    role === 'SELLER' ? activeConv.customerName || 'Customer' : activeConv.vendorName || 'Creator'
                  )}&background=003527&color=fff&size=80`
                }
                alt="Avatar"
                className="w-9 h-9 rounded-full object-cover border border-[#95d3ba]"
              />
              <div>
                <h4 className="font-bold text-xs sm:text-sm text-[#1a1c1c] flex items-center gap-1.5">
                  <span>{role === 'SELLER' ? activeConv.customerName || 'Customer' : activeConv.vendorName || 'Creator'}</span>
                  <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-[#b0f0d6]/30 text-[#003527]">
                    {role === 'SELLER' ? 'Customer' : 'Seller'}
                  </span>
                </h4>
                <span className="text-[10px] text-emerald-700 font-medium flex items-center gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                  Live Direct Conversation
                </span>
              </div>
            </div>

            <div className="flex items-center gap-2">
              {/* AI Auto-Reply Toggle */}
              <button
                type="button"
                onClick={() => setAiAutoReplyEnabled(!aiAutoReplyEnabled)}
                className={`hidden sm:flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-bold border transition-colors ${aiAutoReplyEnabled
                  ? 'bg-purple-50 text-purple-700 border-purple-200'
                  : 'bg-stone-50 text-stone-600 border-stone-200 hover:bg-stone-100'
                  }`}
                title={aiAutoReplyEnabled ? 'AI bot will automatically reply' : 'Real live conversation (AI bot is off)'}
              >
                <Bot className="w-3.5 h-3.5" />
                <span>{aiAutoReplyEnabled ? 'AI Bot: ON' : 'AI Bot: OFF'}</span>
              </button>

              {activeConv.contextTitle && (
                <div className="hidden lg:block text-right">
                  <span className="text-[9px] text-[#665d55] block">Order / Ref</span>
                  <span className="text-xs font-bold text-[#003527] truncate max-w-[160px] block">
                    {activeConv.contextTitle}
                  </span>
                </div>
              )}
            </div>
          </div>

          {/* Messages Stream */}
          <div className="flex-1 p-4 overflow-y-auto space-y-3 bg-[#faf9f8] custom-scrollbar">
            <div className="text-center my-1">
              <span className="text-[10px] bg-white text-[#665d55] px-3 py-1 rounded-full border border-[#e3e2e1] shadow-2xs">
                💬 Direct Conversation • All orders covered by HomeBiz Guarantee
              </span>
            </div>

            {messages.map((msg) => {
              const isMe = msg.senderId === currentUserId || (role === 'SELLER' && msg.senderRole === 'SELLER') || (role === 'CUSTOMER' && msg.senderRole === 'CUSTOMER' && msg.senderId === currentUserId);

              return (
                <div key={msg.id} className={`flex ${isMe ? 'justify-end' : 'justify-start'}`}>
                  <div
                    className={`max-w-[80%] sm:max-w-[70%] rounded-2xl px-4 py-2.5 shadow-xs text-xs ${isMe
                      ? 'bg-[#003527] text-white rounded-br-xs'
                      : 'bg-white text-[#1a1c1c] border border-[#e3e2e1] rounded-bl-xs'
                      }`}
                  >
                    <div className="flex items-center justify-between gap-2 mb-1">
                      <span className={`text-[10px] font-bold ${isMe ? 'text-emerald-200' : 'text-[#003527]'}`}>
                        {msg.senderName}
                      </span>
                      <span className={`text-[9px] ${isMe ? 'text-emerald-300/80' : 'text-[#665d55]'}`}>
                        {msg.senderRole === 'SELLER' ? 'Seller' : 'Customer'}
                      </span>
                    </div>
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

          {/* Quick Replies & AI Draft Assistant Strip */}
          <div className="px-3 py-1.5 bg-white border-t border-[#f4f3f2] flex items-center justify-between gap-2 overflow-x-auto hide-scrollbar">
            <div className="flex items-center gap-1.5">
              {role === 'SELLER' && (
                <button
                  type="button"
                  onClick={handleGenerateAiDraft}
                  disabled={isGeneratingAiDraft}
                  className="flex-shrink-0 text-[11px] bg-[#FFF1E7] hover:bg-[#ffe088]/40 text-[#735c00] font-bold px-3 py-1 rounded-full border border-[#ffe088] transition-colors flex items-center gap-1"
                >
                  <Sparkles className="w-3 h-3 text-[#cca72f]" />
                  <span>{isGeneratingAiDraft ? 'Drafting...' : '✨ AI Suggest Reply'}</span>
                </button>
              )}
              {quickReplies.map((qr, i) => (
                <button
                  key={i}
                  onClick={() => handleSendMessage(qr)}
                  className="flex-shrink-0 text-[11px] bg-[#f4f3f2] hover:bg-[#b0f0d6]/30 hover:text-[#003527] text-[#404944] px-3 py-1 rounded-full transition-colors"
                >
                  {qr}
                </button>
              ))}
            </div>
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
                placeholder={role === 'SELLER' ? 'Reply to customer in Urdu or English...' : 'Message the creator in Urdu or English...'}
                className="flex-1 bg-[#f4f3f2] text-xs px-4 py-2.5 rounded-full border border-transparent focus:border-[#003527] focus:bg-white outline-none transition-all"
              />
              <button
                type="submit"
                disabled={!inputMessage.trim()}
                className="w-10 h-10 rounded-full bg-[#003527] hover:bg-[#064e3b] text-white flex items-center justify-center shadow-sm disabled:opacity-40 transition-colors flex-shrink-0 cursor-pointer"
              >
                <Send className="w-4 h-4" />
              </button>
            </form>
          </div>
        </div>
      ) : (
        <div className="flex-1 flex flex-col items-center justify-center p-8 text-center bg-[#faf9f8]">
          <div className="w-14 h-14 rounded-full bg-[#b0f0d6]/30 text-[#003527] flex items-center justify-center mb-3">
            <MessageSquare className="w-7 h-7" />
          </div>
          <h4 className="font-bold text-sm text-[#1a1c1c]">No Conversation Selected</h4>
          <p className="text-xs text-[#665d55] max-w-xs mt-1">
            {role === 'SELLER'
              ? 'Select a customer conversation from the left to reply directly.'
              : 'Choose a creator from the left or click "Chat with Creator" on any profile.'}
          </p>
        </div>
      )}

      {/* MODAL: START NEW CHAT WITH CUSTOMER (SELLER ONLY) */}
      {showNewChatModal && userVendor && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl border border-[#e3e2e1] space-y-4">
            <div className="flex items-center justify-between pb-2 border-b border-[#f4f3f2]">
              <h3 className="font-bold text-sm text-[#1a1c1c] flex items-center gap-1.5">
                <MessageSquare className="w-4 h-4 text-[#003527]" />
                <span>Message a Customer</span>
              </h3>
              <button
                onClick={() => setShowNewChatModal(false)}
                className="text-stone-400 hover:text-stone-700"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <p className="text-xs text-[#665d55]">
              Select a customer from your recent orders to initiate a direct message:
            </p>

            <div className="space-y-2 max-h-60 overflow-y-auto">
              {recentBookings.map((b) => (
                <div
                  key={b.id}
                  onClick={() => {
                    const conv = Storage.getOrCreateConversation(b.customerId, userVendor.id, {
                      type: 'BOOKING',
                      id: b.id,
                      title: `Order #${b.bookingNumber} (${b.serviceTitle})`,
                    });
                    setActiveConvId(conv.id);
                    setShowNewChatModal(false);
                  }}
                  className="p-3 bg-[#faf9f8] hover:bg-[#b0f0d6]/20 rounded-2xl border border-[#e3e2e1] cursor-pointer transition-colors flex items-center justify-between"
                >
                  <div>
                    <h5 className="font-bold text-xs text-[#1a1c1c]">{b.customerName}</h5>
                    <p className="text-[11px] text-[#665d55]">
                      #{b.bookingNumber} • {b.serviceTitle}
                    </p>
                  </div>
                  <span className="text-[11px] font-bold text-[#003527] bg-white px-2.5 py-1 rounded-full border border-[#95d3ba]">
                    Chat
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
