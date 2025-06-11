import chromium from '@sparticuz/chromium';
import puppeteer from 'puppeteer-core';

export default async function handler(req, res) {
  const { url } = req.query;

  // Kiểm tra URL hợp lệ
  if (!url || !url.includes('shopee.vn')) {
    return res.status(400).json({ error: 'Invalid Shopee URL' });
  }

  let browser = null;

  try {
    // Khởi tạo browser tương thích môi trường Vercel
    browser = await puppeteer.launch({
      args: chromium.args,
      executablePath: await chromium.executablePath(),
      headless: chromium.headless
    });

    const page = await browser.newPage();

    // Thêm User-Agent để tránh Shopee chặn bot
    await page.setUserAgent(
      'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/123.0.0.0 Safari/537.36'
    );

    // Truy cập vào URL sản phẩm
    await page.goto(url, {
      waitUntil: 'networkidle2',
      timeout: 30000
    });

    // Chờ tiêu đề xuất hiện
    await page.waitForSelector('meta[property="og:title"]', { timeout: 10000 });

    // Lấy dữ liệu tiêu đề, hình ảnh, giá
    const data = await page.evaluate(() => {
      const title = document.querySelector('meta[property="og:title"]')?.content || '';
      const image = document.querySelector('meta[property="og:image"]')?.content || '';
      const priceEl = document.querySelector('.pmmxKx'); // Có thể phải điều chỉnh class nếu Shopee thay đổi

      const price = priceEl?.textContent.replace(/[^\d]/g, '') || null;

      return { title, image, price };
    });

    return res.status(200).json(data);
  } catch (err) {
    console.error('Shopee fetch error:', err);
    return res.status(500).json({ error: 'Fetch failed' });
  } finally {
    if (browser !== null) {
      await browser.close();
    }
  }
}