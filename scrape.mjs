import puppeteer from 'puppeteer';

(async () => {
  const browser = await puppeteer.launch({ headless: "new" });
  const page = await browser.newPage();
  await page.goto('https://laongen.com/', { waitUntil: 'networkidle0' });
  
  // Extract all textual content and structure
  const content = await page.evaluate(() => {
    return document.body.innerText;
  });
  
  console.log(content);
  await browser.close();
})();
