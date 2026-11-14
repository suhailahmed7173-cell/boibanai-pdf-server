/**
 * BoiBanai PDF Server — সরাসরি PDF ডাউনলোডের সার্ভার।
 *
 * কেন সার্ভার লাগে: ফোন/কম্পিউটার একা আসল-টেক্সট PDF বানাতে পারে না —
 * বাংলা যুক্তাক্ষর ঠিকভাবে সাজাতে পারে শুধু আসল Chrome ইঞ্জিন।
 * এই সার্ভার আসল Chrome (Puppeteer) দিয়ে বইয়ের HTML থেকে A5 PDF বানিয়ে দেয়।
 * প্রিন্ট-দিয়ে-PDF অপশনটা আলাদাভাবে অ্যাপেই থাকবে — দুইটা অপশনই থাকবে।
 *
 * হোস্ট: Vercel Hobby (ফ্রি, কার্ড লাগে না) — api/pdf.js সার্ভারলেস ফাংশন।
 * Render-এও চলবে (server.js, একই কোড) — তবে Render এখন কার্ড চায়, তাই
 * Vercel-ই মূল হোস্ট। একই কোড, একই package.json দুই জায়গায় চলে।
 *
 *   POST /api/pdf  { html, filename } → application/pdf (A5, আসল টেক্সট)
 *   GET  /api/pdf  → { ok: true }  (health)
 */
const express = require('express');
const chromium = require('@sparticuz/chromium');
const puppeteer = require('puppeteer-core');

const app = express();
app.use(express.json({ limit: '25mb' }));

// শুধু BoiBanai অ্যাপ থেকেই ডাকা যাবে (CORS সীমিত)
app.use((req, res, next) => {
  res.setHeader('Access-Control-Allow-Origin', 'https://boibanai-app.web.app');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  res.setHeader('Access-Control-Allow-Methods', 'POST, GET, OPTIONS');
  if (req.method === 'OPTIONS') return res.sendStatus(204);
  next();
});

let browserPromise = null;
async function getBrowser() {
  if (!browserPromise) {
    browserPromise = puppeteer.launch({
      args: [...chromium.args, '--no-sandbox', '--disable-setuid-sandbox', '--disable-dev-shm-usage', '--font-render-hinting=none'],
      defaultViewport: chromium.defaultViewport,
      executablePath: await chromium.executablePath(),
      headless: chromium.headless,
    }).catch((e) => { browserPromise = null; throw e; });
  }
  return browserPromise;
}

app.get('/health', (req, res) => res.json({ ok: true }));

app.post('/pdf', async (req, res) => {
  const { html, filename } = req.body || {};
  if (!html || typeof html !== 'string' || html.length < 100) {
    return res.status(400).json({ error: 'html চাই' });
  }
  const safeName = String(filename || 'boi.pdf').replace(/[^a-zA-Z0-9_.\-ঀ-৾ ]/g, '').slice(0, 80) || 'boi.pdf';
  let page = null;
  try {
    const browser = await getBrowser();
    page = await browser.newPage();
    await page.setContent(html, { waitUntil: 'networkidle0', timeout: 60000 });
    await page.emulateMediaType('print');
    const pdf = await page.pdf({
      format: 'A5',
      printBackground: true,
      preferCSSPageSize: true,
      margin: { top: '0', bottom: '0', left: '0', right: '0' },
    });
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename="${encodeURIComponent(safeName)}"`);
    res.send(pdf);
  } catch (e) {
    console.error('PDF ভুল:', e && e.message);
    res.status(500).json({ error: 'PDF বানানো যায়নি' });
  } finally {
    if (page) { try { await page.close(); } catch (e) {} }
  }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log('BoiBanai PDF server চলছে, পোর্ট ' + PORT));
