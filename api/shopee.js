import chromium from '@sparticuz/chromium';
import puppeteer from 'puppeteer-core';

export default async function handler(req, res) {
  const { url } = req.query;
  if (!url || !url.includes('shopee.vn')) {
    return res.status(400).json({ error: 'Invalid Shopee URL' });
  }

  let browser = null;
  try {
    browser = await puppeteer.launch({
      args: chromium.args,
      executablePath: await chromium.executablePath(),
      headless: chromium.headless
    });

    const page = await browser.newPage();
    await page.goto(url, { waitUntil: 'networkidle2', timeout: 30000 });
    await page.waitForSelector('meta[property="og:title"]', { timeout: 10000 });

    const data = await page.evaluate(() => {
      const title = document.querySelector('meta[property="og:title"]')?.content || '';
      const image = document.querySelector('meta[property="og:image"]')?.content || '';
      const priceEl = document.querySelector('.pmmxKx');
      const price = priceEl?.textContent.replace(/[^\d]/g, '') || null;
      return { title, image, price };
    });

    return res.status(200).json(data);
  } catch (err) {
    console.error('Shopee fetch error:', err);
    return res.status(500).json({ error: 'Fetch failed' });
  } finally {
    if (browser) await browser.close();
  }
}