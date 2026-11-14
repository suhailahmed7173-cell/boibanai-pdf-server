/**
 * BoiBanai PDF — Vercel Hobby সার্ভারলেস ফাংশন (Node runtime)।
 * POST /api/pdf { html, filename } → application/pdf (A5, আসল টেক্সট)
 * GET  /api/pdf → { ok: true }  (health)
 * Vercel-এর নিজের নির্দেশিত পথ: puppeteer-core + @sparticuz/chromium।
 * সীমা (Hobby, Fluid compute): সময় ৩০০ সেকেন্ড পর্যন্ত, মেমরি ২GB,
 * request/response body ৪.৫MB — তাই বড় ছবি অ্যাপ আগেই ছোট করে পাঠায়।
 */
const chromium = require('@sparticuz/chromium');
const puppeteer = require('puppeteer-core');

const MAX_HTML_BYTES = 4200000; // ৪.৫MB সীমার নিচে
const MAX_PDF_BYTES = 4400000;

module.exports = async (req, res) => {
  res.setHeader('Access-Control-Allow-Origin', 'https://boibanai-app.web.app');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  res.setHeader('Access-Control-Allow-Methods', 'POST, GET, OPTIONS');
  if (req.method === 'OPTIONS') return res.status(204).end();
  if (req.method === 'GET') return res.status(200).json({ ok: true });
  if (req.method !== 'POST') return res.status(405).json({ error: 'POST চাই' });

  const { html, filename } = req.body || {};
  if (!html || typeof html !== 'string' || html.length < 100) {
    return res.status(400).json({ error: 'html চাই' });
  }
  if (Buffer.byteLength(html, 'utf8') > MAX_HTML_BYTES) {
    return res.status(413).json({ error: 'বইটা অনেক বড় — প্রিন্ট দিয়ে PDF করুন' });
  }
  const safeName = String(filename || 'boi.pdf').replace(/[^a-zA-Z0-9_.\-ঀ-৾ ]/g, '').slice(0, 80) || 'boi.pdf';

  let browser = null;
  try {
    browser = await puppeteer.launch({
      args: [...chromium.args, '--hide-scrollbars', '--disable-web-security'],
      defaultViewport: chromium.defaultViewport,
      executablePath: await chromium.executablePath(),
      headless: chromium.headless,
    });
    const page = await browser.newPage();
    await page.setContent(html, { waitUntil: 'networkidle0', timeout: 60000 });
    await page.emulateMediaType('print');
    const pdf = await page.pdf({
      format: 'A5',
      printBackground: true,
      preferCSSPageSize: true,
      margin: { top: '0', bottom: '0', left: '0', right: '0' },
    });
    if (pdf.length > MAX_PDF_BYTES) {
      return res.status(413).json({ error: 'PDF অনেক বড় — প্রিন্ট দিয়ে PDF করুন' });
    }
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename="${encodeURIComponent(safeName)}"`);
    res.send(pdf);
  } catch (e) {
    console.error('PDF ভুল:', e && e.message);
    res.status(500).json({ error: 'PDF বানানো যায়নি' });
  } finally {
    if (browser) { try { await browser.close(); } catch (e) {} }
  }
};
