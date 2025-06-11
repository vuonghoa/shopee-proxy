const express = require('express');
const puppeteer = require('puppeteer');

const app = express();

app.get('/shopee', async (req, res) => {
  const productUrl = req.query.url;
  if (!productUrl || !productUrl.includes('shopee.vn')) {
    return res.status(400).json({ error: 'Invalid Shopee URL' });
  }

  try {
    const browser = await puppeteer.launch({
      headless: "new",
      args: ['--no-sandbox', '--disable-setuid-sandbox']
    });
    const page = await browser.newPage();
    await page.goto(productUrl, { waitUntil: 'networkidle2', timeout: 30000 });

    await page.waitForSelector('meta[property="og:title"]', { timeout: 10000 });

    const data = await page.evaluate(() => {
      const title = document.querySelector('meta[property="og:title"]')?.content || '';
      const image = document.querySelector('meta[property="og:image"]')?.content || '';
      const priceEl = document.querySelector('.pmmxKx'); // Lớp CSS hiển thị giá
      const price = priceEl ? priceEl.textContent.replace(/[^\d]/g, '') : null;
      return { title, image, price };
    });

    await browser.close();
    res.json(data);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to fetch product info' });
  }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Shopee Proxy running on port ${PORT}`));