# BoiBanai PDF Server

সরাসরি PDF ডাউনলোডের সার্ভার — বইয়ের HTML থেকে আসল Chrome দিয়ে A5 PDF বানায়
(আসল টেক্সট, বাংলা যুক্তাক্ষর ঠিকঠাক)।

## হোস্ট: Vercel Hobby (ফ্রি, কার্ড লাগে না) — মূল হোস্ট

- `api/pdf.js` — সার্ভারলেস ফাংশন: `POST /api/pdf { html, filename }` → PDF
- `GET /api/pdf` → `{ ok: true }` (health)
- `vercel.json` — maxDuration 120s, memory 2048MB (Hobby সীমা: ৩০০s / 2GB)
- Vercel-এর নিজের নির্দেশিত পথ: `puppeteer-core` + `@sparticuz/chromium`
- সীমা: request/response body ৪.৫MB — বড় ছবি অ্যাপ আগেই ছোট করে পাঠায়;
  না পারলে প্রিন্ট-দিয়ে-PDF (ফলব্যাক) আছে।

ডেপ্লয়: Vercel Dashboard → Add New Project → Import Git Repository
(`suhailahmed7173-cell/boibanai-pdf-server`) → Deploy।

## বিকল্প: Render (আপাতত বন্ধ — কার্ড চায়)

- `server.js` — একই কোডের Express সার্ভার (`POST /pdf`, `GET /health`)
- `render.yaml` — Render Blueprint (Free web service)
- ২০২৬-১১-১৪: Render ফ্রি সার্ভিস বানাতেও পরিচয় যাচাইয়ের কার্ড চায়;
  ব্যবহারকারীর কার্ড নেই, তাই Render-এ ডেপ্লয় হয়নি।
- Koyeb (প্রাইসিং পাতায় ফ্রি টিয়ার নেই, Pro $29 থেকে) ও Hugging Face
  Docker Spaces (PRO $9/mo লাগে) — দুটোই ২০২৬-১১-১৪ যাচাই করে বাদ।

## অ্যাপের দিকের কোড

`app-integration.js` — `downloadPdfDirect()`: সার্ভার জাগানো, ছবি
data: URL-এ বদলে ছোট করা, PDF চাওয়া (আবার চেষ্টাসহ), ডাউনলোড।
না পারলে `printBook()` (প্রিন্ট-দিয়ে-PDF) — দুইটা অপশনই থাকে।
