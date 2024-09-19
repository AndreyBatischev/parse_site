const puppeteer = require('puppeteer');
const fs = require('fs');

const [,, productUrl, region] = process.argv;

if (!productUrl || !region) {
  console.error('Необходимо указать URL товара и регион');
  process.exit(1);
}

(async () => {
  const browser = await puppeteer.launch({ headless: false });
  const page = await browser.newPage();

  try {
    await page.setViewport({ width: 1920, height: 1080 });

    await page.goto(productUrl, { waitUntil: 'networkidle0' });

    await new Promise(resolve => setTimeout(resolve, 5000));
   
    await page.waitForSelector('.Region_region__6OUBn', { visible: true });

    await page.evaluate(() => {
        const button = document.querySelector('.Region_region__6OUBn');
        if (button) {
          button.click();
        }
      });

    await new Promise(resolve => setTimeout(resolve, 3000));

    await page.evaluate((region) => {
        const items = document.querySelectorAll('.UiRegionListBase_item___ly_A'); 
        items.forEach((item) => {
          if (item.textContent.trim() === region) { 
            item.click(); 
          }
        });
      }, region);

  await new Promise(resolve => setTimeout(resolve, 3000));
    // Делаем скриншот страницы
    await page.screenshot({ path: 'screenshot.jpg', fullPage: true });

    // Извлекаем информацию о товаре (цены, рейтинг, количество отзывов)
    const productData = await page.evaluate(() => {
      const getTextContent = (selector) => {
        const element = document.querySelector(selector);
        return element ? element.textContent.trim() : null;
      };

      const oldPrice = getTextContent('.Price_price__QzA8L');  // Зачеркнутая цена
      const discPrice = getTextContent('.Price_role_discount__l_tpE');  // Цена со скидкой
      const price = getTextContent('.Price_role_regular__X6X4D');   // Обычная цена
      const rating = getTextContent('.ActionsRow_stars__EKt42');      // Рейтинг
      const reviews = getTextContent('.ActionsRow_reviews__AfSj_');   // Количество отзывов

      return {
        price,
        oldPrice,
        discPrice,
        rating,
        reviews
      };
    });

    // Сохраняем информацию в файл product.txt
    const dataToSave = `
      Обычная цена: ${productData.price || 'Не указана'}
      Текущая цена со скидкой: ${productData.discPrice || 'Не указана'}
      Зачеркнутая цена: ${productData.oldPrice || 'Нет'}
      Рейтинг: ${productData.rating || 'Нет'}
      Количество отзывов: ${productData.reviews || 'Нет'}
    `;

    fs.writeFileSync('product.txt', dataToSave.trim());
    console.log('Данные успешно сохранены в product.txt и скриншот сохранен в screenshot.jpg');
    
  } catch (error) {
    console.error('Ошибка при выполнении скрипта:', error);
  } finally {
    await browser.close();
  }
})();
