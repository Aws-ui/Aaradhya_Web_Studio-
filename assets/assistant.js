// Answers are shared by the local language model and the lightweight topic matcher.
const topics = [
  ["pricing", "price prices cost quote fees rates budget package charges kitna kitne kharcha paisa daam rate कीमत बजट", "For a quote, send Ramesh your business type, pages or services you need, and target launch date on WhatsApp. He can estimate the scope and cost from those details.", "Quote ke liye business ka type, pages ya services aur launch date Ramesh ko WhatsApp karein. In details ke hisaab se cost milegi."],
  ["contact", "contact whatsapp phone call mobile email number ramesh kamble owner founder sampark baat संपर्क नंबर", "You can reach Ramesh Kamble on WhatsApp or by phone at +91 95618 51358, or email Www.rkamble@gmail.com.", "Ramesh Kamble se WhatsApp ya call par +91 95618 51358 pe baat karein. Email: Www.rkamble@gmail.com."],
  ["timeline", "timeline time deadline days weeks delivery launch kab din samay कितना समय", "Timing depends on the pages, content and integrations you need. Share your target launch date with Ramesh to confirm a schedule.", "Timeline pages, content aur features par depend karti hai. Apni launch date Ramesh ko bhejkar schedule confirm karein."],
  ["seo", "seo search ranking google organic keywords traffic content visibility rank खोज गूगल", "Start with an SEO review of your current site. The studio can help with keyword research, page titles, content planning and on-page improvements. Share your site URL and the customers you want to reach.", "SEO ke liye apni website ka link aur target customers batayein. Studio keyword research, page titles aur content planning mein help karta hai."],
  ["campaigns", "ads ad campaign campaigns advertising paid leads marketing meta promotion promote vigyapan विज्ञापन", "For paid campaigns, start with your audience, offer and monthly ad budget. The studio helps with creative, audience testing and conversion reporting.", "Paid campaign ke liye audience, offer aur monthly ad budget share karein. Studio ad creative, testing aur reporting mein help karta hai."],
  ["website", "website web design development mobile responsive landing page redesign portfolio dukaan वेबसाइट बनवानी", "For a new website, start with the action visitors should take: enquire, book or buy. The studio designs responsive pages around that goal. Do you already have a site, or are you starting fresh?", "Website ke liye pehle goal batayein: enquiry, booking ya sales. Aapki existing site hai ya nayi website banwani hai?"],
  ["services", "services service options offer offerings kya karte kya kar sakte help choose सेवाएं", "The studio offers web design and development, performance marketing, and SEO and content. Tell me which area you want to explore.", "Studio website design, paid marketing aur SEO/content par kaam karta hai. Aap kis service ke baare mein jaanna chahte hain?"]
];
const log = document.querySelector(".chat-log");
const chat = document.querySelector("#studio-chat");
const input = document.querySelector("#chat-question");
let session;
let busy = false;

function studioAnswer(question) {
  const words = question.toLowerCase().match(/[\p{L}\p{M}\p{N}]+/gu) || [];
  const hindi = /[\u0900-\u097f]|\b(kya|hai|chahiye|kitna|kitne|batao|mera|mujhe|kaise|banwani|kharcha|paisa|kab)\b/i.test(question);
  const scores = topics.map(([name, vocabulary]) => {
    const terms = vocabulary.split(" ");
    const score = words.filter(word => terms.includes(word)).length;
    // A specific question about cost or timing takes precedence over the service mentioned.
    return score * (["pricing", "contact", "timeline"].includes(name) ? 2.5 : 1);
  });
  const best = Math.max(...scores);
  if (best) return topics[scores.indexOf(best)][hindi ? 3 : 2];
  return hindi ? "Is sawaal par Ramesh aapko behtar jawab de sakte hain. Neeche WhatsApp link se seedha baat karein." : "For that question, contact Ramesh using the WhatsApp link below. I can also help with services, pricing enquiries and project timelines.";
}

async function getReply(question) {
  const fallback = studioAnswer(question);
  try {
    const model = globalThis.LanguageModel;
    if (!model || await model.availability() !== "available") return fallback;
    session ??= await model.create({initialPrompts: [{role:"system", content:
      "You are the AW Studio project assistant. Reply in the visitor’s language in up to three sentences. Use only these studio facts. Never invent prices, deadlines, guarantees or bookings. Refer other questions to Ramesh. " + topics.map(topic => topic[2]).join(" ")
    }]});
    return await session.prompt(question, {signal: AbortSignal.timeout(12000)}) || fallback;
  } catch { return fallback; }
}

function message(text, visitor = false) {
  const bubble = document.createElement("p");
  if (visitor) bubble.className = "visitor";
  bubble.textContent = text;
  log.append(bubble);
  log.scrollTop = log.scrollHeight;
  return bubble;
}

async function ask(text) {
  if (busy || !text.trim()) return;
  busy = true;
  input.value = "";
  message(text, true);
  const pending = message("…");
  try { pending.textContent = await getReply(text); }
  finally { busy = false; log.scrollTop = log.scrollHeight; }
}

document.querySelector("#chat-launch").onclick = () => chat.showModal();
document.querySelector("#chat-close").onclick = () => chat.close();
document.querySelector("#ask-form").onsubmit = event => { event.preventDefault(); ask(input.value.trim()); };
document.querySelectorAll(".chat-prompts button").forEach(button => {
  button.onclick = () => ask(button.textContent);
});
