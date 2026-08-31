import React, { useState } from 'react';
import { Mail, Phone, MapPin, Send, CheckCircle, Clock } from 'lucide-react';
import confetti from 'canvas-confetti';

export function ContactPage() {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [subject, setSubject] = useState('');
  const [message, setMessage] = useState('');
  const [sent, setSent] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setSent(true);
    confetti({
      particleCount: 70,
      spread: 60,
      origin: { y: 0.6 },
    });
  };

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12 space-y-12">
      <div className="text-center max-w-2xl mx-auto space-y-2">
        <span className="text-xs font-bold text-[#cca72f] uppercase tracking-wider">
          Get in Touch
        </span>
        <h1 className="text-3xl sm:text-4xl font-black text-[#1a1c1c] font-['Plus_Jakarta_Sans']">
          Contact HomeBiz Support
        </h1>
        <p className="text-xs sm:text-sm text-[#665d55]">
          Have questions about your order, seller verification, or platform features? Our Karachi & Lahore team is here to assist.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-12 gap-8 items-start">
        {/* Contact Info */}
        <div className="md:col-span-5 space-y-6">
          <div className="bg-[#003527] text-white p-8 rounded-3xl space-y-6 shadow-md">
            <h3 className="font-bold text-lg font-['Plus_Jakarta_Sans']">
              Direct Contact Channels
            </h3>

            <div className="space-y-4 text-xs text-emerald-100">
              <div className="flex items-start gap-3">
                <Mail className="w-4 h-4 text-[#ffe088] flex-shrink-0 mt-0.5" />
                <div>
                  <span className="font-bold text-white block">Email Support</span>
                  <span>support@homebiz.pk</span>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <Phone className="w-4 h-4 text-[#ffe088] flex-shrink-0 mt-0.5" />
                <div>
                  <span className="font-bold text-white block">WhatsApp Helpline</span>
                  <span>+92 300 8472910</span>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <MapPin className="w-4 h-4 text-[#ffe088] flex-shrink-0 mt-0.5" />
                <div>
                  <span className="font-bold text-white block">Office Address</span>
                  <span>Gulberg III, Lahore & Clifton Block 4, Karachi</span>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <Clock className="w-4 h-4 text-[#ffe088] flex-shrink-0 mt-0.5" />
                <div>
                  <span className="font-bold text-white block">Support Hours</span>
                  <span>Mon - Sat: 9:00 AM - 9:00 PM PKT</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Contact Form */}
        <div className="md:col-span-7 bg-white rounded-3xl p-6 sm:p-8 border border-[#e3e2e1] shadow-xs">
          {sent ? (
            <div className="py-12 text-center space-y-3">
              <div className="w-14 h-14 rounded-full bg-[#b0f0d6] text-[#003527] mx-auto flex items-center justify-center">
                <CheckCircle className="w-8 h-8" />
              </div>
              <h3 className="text-lg font-bold text-[#1a1c1c]">Message Sent Successfully!</h3>
              <p className="text-xs text-[#665d55]">
                Our support team will get back to you within 2 hours on WhatsApp or email.
              </p>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-[#1a1c1c] uppercase tracking-wider mb-1">
                  Your Full Name
                </label>
                <input
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="e.g. Ayesha Siddiqui"
                  className="w-full text-xs p-3 bg-[#faf9f8] border border-[#e3e2e1] rounded-2xl focus:border-[#003527] outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-[#1a1c1c] uppercase tracking-wider mb-1">
                  Email or WhatsApp Number
                </label>
                <input
                  type="text"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="ayesha@example.com or 0300-1234567"
                  className="w-full text-xs p-3 bg-[#faf9f8] border border-[#e3e2e1] rounded-2xl focus:border-[#003527] outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-[#1a1c1c] uppercase tracking-wider mb-1">
                  Subject
                </label>
                <input
                  type="text"
                  required
                  value={subject}
                  onChange={(e) => setSubject(e.target.value)}
                  placeholder="e.g. Question about verified seller payout or custom quote"
                  className="w-full text-xs p-3 bg-[#faf9f8] border border-[#e3e2e1] rounded-2xl focus:border-[#003527] outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-[#1a1c1c] uppercase tracking-wider mb-1">
                  Message
                </label>
                <textarea
                  rows={4}
                  required
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  placeholder="Describe your inquiry in detail..."
                  className="w-full text-xs p-3 bg-[#faf9f8] border border-[#e3e2e1] rounded-2xl focus:border-[#003527] outline-none"
                />
              </div>

              <button
                type="submit"
                className="w-full py-3.5 px-4 rounded-full bg-[#003527] hover:bg-[#064e3b] text-white font-bold text-xs shadow-md transition-colors flex items-center justify-center gap-2"
              >
                <Send className="w-4 h-4 text-[#ffe088]" />
                <span>Send Message</span>
              </button>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
