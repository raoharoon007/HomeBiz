import { Storage } from './storage';
import { Conversation, VendorProfile, Message } from '../types';

/**
 * Advanced Multi-Turn AI Vendor Auto-Responder for HomeBiz Pakistan
 * Uses Google GenAI API (if key present) or an advanced multi-turn conversational engine.
 */
export async function triggerVendorAiResponse(conversationId: string, userMessageText: string) {
  if (typeof window === 'undefined') return;

  // Run asynchronously after a realistic 1.2s - 2s delay
  setTimeout(async () => {
    try {
      const conversations = Storage.getConversations();
      const conv = conversations.find((c) => c.id === conversationId);
      if (!conv) return;

      const vendor = conv.vendorId
        ? Storage.getVendorById(conv.vendorId) || Storage.getVendors()[0]
        : Storage.getVendors()[0];

      const allMsgs = Storage.getMessages(conversationId);
      const lastMsg = allMsgs[allMsgs.length - 1];

      // Avoid double bot replies if last message is already from seller
      if (lastMsg && lastMsg.senderRole === 'SELLER' && (Date.now() - new Date(lastMsg.createdAt).getTime()) < 2000) {
        return;
      }

      const customerName = conv.customerName ? conv.customerName.split(' ')[0] : 'dear customer';

      // 1. Try Google Gemini API if API key exists
      let replyText = await tryGeminiApi(vendor, customerName, userMessageText, allMsgs);

      // 2. Fallback to advanced multi-turn conversational engine if Gemini API not available
      if (!replyText) {
        replyText = generateMultiTurnVendorResponse(userMessageText, vendor, customerName, allMsgs);
      }

      Storage.sendMessage({
        conversationId,
        senderId: vendor.userId || 'vendor-bot',
        senderName: vendor.businessName,
        senderRole: 'SELLER',
        text: replyText,
      });
    } catch (e) {
      console.error('Vendor AI Response error:', e);
    }
  }, 1300);
}

/**
 * Call Google Gemini API if key is available
 */
async function tryGeminiApi(
  vendor: VendorProfile,
  customerName: string,
  userMessageText: string,
  history: Message[]
): Promise<string | null> {
  try {
    const apiKey =
      (import.meta as any).env?.VITE_GEMINI_API_KEY ||
      (typeof process !== 'undefined' ? (process.env as any)?.GEMINI_API_KEY : null) ||
      localStorage.getItem('hb_gemini_api_key');

    if (!apiKey) return null;

    const serviceSummary = vendor.services.map((s) => `${s.title} (Rs. ${s.price})`).join(', ');

    const systemPrompt = `You are ${vendor.businessName}, a top-rated home business in ${vendor.locality}, ${vendor.city}, Pakistan (Category: ${vendor.category}).
Your specialties: ${vendor.specialties?.join(', ') || 'Custom Quality'}.
Your services & pricing: ${serviceSummary}. Starting price: Rs. ${vendor.startingPrice}. Notice period: ${vendor.availabilityNotice || '24-48 hrs'}.
Customer name: ${customerName}.
Rules:
1. Respond warmly and naturally in Roman Urdu & English (like a hospitable Pakistani home entrepreneur).
2. Keep it concise (2-4 short sentences max).
3. Do NOT repeat formal greetings if this is an ongoing chat.
4. Answer their exact question accurately based on your business info.
5. End with a helpful, friendly question or CTA.`;

    const recentHistory = history.slice(-6).map((m) => `${m.senderRole === 'CUSTOMER' ? customerName : vendor.businessName}: ${m.text}`).join('\n');
    const prompt = `${systemPrompt}\n\nChat History:\n${recentHistory}\n${customerName}: ${userMessageText}\n${vendor.businessName}:`;

    const res = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${apiKey}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [{ parts: [{ text: prompt }] }],
        generationConfig: { temperature: 0.7, maxOutputTokens: 250 },
      }),
    });

    if (res.ok) {
      const data = await res.json();
      const text = data?.candidates?.[0]?.content?.parts?.[0]?.text;
      if (text) return text.trim();
    }
  } catch (e) {
    console.warn('Gemini API fetch fallback to internal AI engine:', e);
  }
  return null;
}

/**
 * Advanced Multi-Turn Conversational AI Engine (Dynamic, Context-Aware, Non-Repeating)
 */
function generateMultiTurnVendorResponse(
  userText: string,
  vendor: VendorProfile,
  customerName: string,
  history: Message[]
): string {
  const lower = userText.toLowerCase().trim();
  const sellerMsgsCount = history.filter((m) => m.senderRole === 'SELLER').length;
  const isFirstTurn = sellerMsgsCount === 0;

  // Dynamic Openers (only use full formal greeting on turn 1)
  const getRandomOpener = () => {
    if (isFirstTurn) {
      const firstOpeners = [
        `Walaikum Assalam ${customerName}! 🌸 Thank you for messaging ${vendor.businessName}.`,
        `Salam ${customerName}! Welcome to ${vendor.businessName}. So glad you reached out! ✨`,
        `Assalam-o-Alaikum ${customerName}! 🌺 Welcome to ${vendor.businessName} (${vendor.city}).`,
      ];
      return firstOpeners[Math.floor(Math.random() * firstOpeners.length)];
    } else {
      const turnOpeners = [
        `Sure thing ${customerName}!`,
        `Got it ${customerName}! 👍`,
        `Definitely!`,
        `Regarding your question,`,
        `No problem at all!`,
        `Yes, absolutely!`,
        `I understand!`,
      ];
      return turnOpeners[Math.floor(Math.random() * turnOpeners.length)];
    }
  };

  const opener = getRandomOpener();

  // 1. Gratitude / Closing / Thanks
  if (
    lower === 'thanks' ||
    lower === 'thank you' ||
    lower === 'shukriya' ||
    lower === 'ok' ||
    lower === 'okay' ||
    lower === 'thk h' ||
    lower === 'achha' ||
    lower === 'great' ||
    lower === 'perfect' ||
    lower.includes('jazakallah')
  ) {
    const closings = [
      `You're most welcome ${customerName}! 😊 Please feel free to message anytime whenever you're ready to place the order. Have a blessed day!`,
      `Anytime! 🌟 Let us know when you'd like us to lock in your date. Looking forward to serving you!`,
      `JazakAllah Khair for connecting with ${vendor.businessName}! We'll be right here whenever you need anything else. ✨`,
    ];
    return closings[Math.floor(Math.random() * closings.length)];
  }

  // 2. Price / Rates / Cost Inquiry
  if (
    lower.includes('price') ||
    lower.includes('rate') ||
    lower.includes('cost') ||
    lower.includes('kitne') ||
    lower.includes('kitna') ||
    lower.includes('charge') ||
    lower.includes('pese') ||
    lower.includes('paisay') ||
    lower.includes('budget') ||
    lower.includes('rs')
  ) {
    const sampleServices = vendor.services
      .slice(0, 2)
      .map((s) => `• **${s.title}**: Rs. ${s.price.toLocaleString()}`)
      .join('\n');

    const priceVariations = [
      `${opener}\n\nOur customized packages start from **Rs. ${vendor.startingPrice.toLocaleString()}**.\n\nHere are a couple of our top-selling options:\n${sampleServices}\n\nNotice required: ${vendor.availabilityNotice || '24-48 hours'}. Would you like a personalized quote for a specific size or quantity?`,
      `${opener}\n\nPricing for ${vendor.businessName} starts at **Rs. ${vendor.startingPrice.toLocaleString()}**, depending on customization.\n\nKey packages:\n${sampleServices}\n\nIf you have a target budget in mind, let me know and we can customize something special for you!`,
      `${opener}\n\nOur starting rate is **Rs. ${vendor.startingPrice.toLocaleString()}**.\n\nMost customers choose:\n${sampleServices}\n\nShall I lock in a tentative package for your event?`,
    ];
    return priceVariations[Math.floor(Math.random() * priceVariations.length)];
  }

  // 3. Location / Delivery / Area / Home Visit Inquiry
  if (
    lower.includes('delivery') ||
    lower.includes('dha') ||
    lower.includes('gulberg') ||
    lower.includes('clifton') ||
    lower.includes('bahria') ||
    lower.includes('location') ||
    lower.includes('address') ||
    lower.includes('city') ||
    lower.includes('home visit') ||
    lower.includes('area') ||
    lower.includes('pauhoncha') ||
    lower.includes('bhej')
  ) {
    const areas = vendor.serviceAreas ? vendor.serviceAreas.join(', ') : vendor.locality;
    const deliveryVariations = [
      `${opener}\n\nWe are based in **${vendor.locality}, ${vendor.city}** and deliver across: ${areas}.\n\nDelivery prep notice: ${vendor.services[0]?.noticePeriod || '24-48 hours'}. What is your exact delivery locality and preferred time slot?`,
      `${opener}\n\nYes! We actively provide doorstep delivery/home visits in ${vendor.city} (including ${areas}).\n\nPlease tell us your specific area so we can calculate the fastest delivery slot for your order!`,
      `${opener}\n\nOur studio kitchen/workspace is in **${vendor.locality}**, and we safely deliver across ${vendor.city}.\n\nWould you like delivery or pickup for your order?`,
    ];
    return deliveryVariations[Math.floor(Math.random() * deliveryVariations.length)];
  }

  // 4. Availability / Dates / Urgent Orders
  if (
    lower.includes('available') ||
    lower.includes('date') ||
    lower.includes('slot') ||
    lower.includes('urgent') ||
    lower.includes('eid') ||
    lower.includes('booking') ||
    lower.includes('book') ||
    lower.includes('kl') ||
    lower.includes('kal') ||
    lower.includes('today') ||
    lower.includes('tomorrow')
  ) {
    const availVariations = [
      `${opener}\n\nYes! We currently have slots available for this week in **${vendor.city}**.\n\nOur standard notice period is ${vendor.services[0]?.noticePeriod || '24 to 48 hours'}. What date and time slot do you have in mind?`,
      `${opener}\n\nWe are accepting orders for upcoming dates! Peak weekend slots fill up fast.\n\nPlease share your exact event date so I can verify our calendar right away!`,
      `${opener}\n\nSlots are open! We require ${vendor.availabilityNotice || 'advance notice'} to ensure 100% fresh quality. Which date would you like to reserve?`,
    ];
    return availVariations[Math.floor(Math.random() * availVariations.length)];
  }

  // 5. Customization / Flavors / Design / Menu
  if (
    lower.includes('custom') ||
    lower.includes('design') ||
    lower.includes('flavor') ||
    lower.includes('cake') ||
    lower.includes('stain') ||
    lower.includes('henna') ||
    lower.includes('food') ||
    lower.includes('menu') ||
    lower.includes('bento') ||
    lower.includes('dress') ||
    lower.includes('lawn') ||
    lower.includes('photo') ||
    lower.includes('shoot') ||
    lower.includes('biryani')
  ) {
    const specialties = vendor.specialties ? vendor.specialties.join(' • ') : 'Premium Bespoke Quality';
    const customVariations = [
      `${opener}\n\nWe specialize in: **${specialties}**.\n\nEverything is handcrafted to your exact preferences. Feel free to send over any Pinterest or photo references, and we'll bring it to life!`,
      `${opener}\n\nWe love custom orders! Our specialties include **${specialties}**.\n\nTell us your theme, flavor/style choice, or quantity, and we'll tailor it precisely for you!`,
      `${opener}\n\nCustomization is our core highlight! We use 100% pure ingredients and materials (${specialties}). What style or specification would you like?`,
    ];
    return customVariations[Math.floor(Math.random() * customVariations.length)];
  }

  // 6. Discount / Offer / Deal
  if (
    lower.includes('discount') ||
    lower.includes('deal') ||
    lower.includes('offer') ||
    lower.includes('less') ||
    lower.includes('kam') ||
    lower.includes('concession')
  ) {
    return `${opener}\n\nWe take pride in premium quality materials and small-batch craftsmanship! However, for orders above Rs. 5,000, we offer a complimentary add-on or a 5% loyalty discount.\n\nLet me know your order details so I can apply the best rate for you!`;
  }

  // 7. General Contextual Fallback (Dynamic based on category & turn)
  const defaultVariations = [
    `${opener}\n\nWe would love to help you with your order! At **${vendor.businessName}** (${vendor.city}), we maintain a ★ ${vendor.rating.toFixed(1)} rating with over ${vendor.reviewCount} happy customers.\n\nOur starting rate is **Rs. ${vendor.startingPrice.toLocaleString()}**. How can I assist you further?`,
    `${opener}\n\nI'm right here to assist! We offer bespoke services in **${vendor.locality}, ${vendor.city}** with quick turnaround times.\n\nWould you like to discuss menu options, pricing, or event dates?`,
    `${opener}\n\nThank you for chatting! We take pride in top-notch quality and hygiene.\n\nPlease let me know if you'd like to see sample photos or receive an itemized quote for your event!`,
  ];
  return defaultVariations[Math.floor(Math.random() * defaultVariations.length)];
}
