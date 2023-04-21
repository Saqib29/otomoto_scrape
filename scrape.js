const axios = require('axios');
const cheerio = require('cheerio');

const initialUrl = 'https://www.otomoto.pl/ciezarowe/uzytkowe/mercedes-benz/od-+2014/q-actros?search%5Bfilter_enum_damaged%5D=0&search%5Border%5D=created_at+%3Adesc';
let retryPageUrl = [];
let retryItemUrl = [];

async function getTotalAdsCount(data) {
  const $ = cheerio.load(data);
  const texts = $('.ooa-1uewmxv h1');
  const totalAdsCount = texts.first().text().match(/\d+/)[0];
  return totalAdsCount;
}

async function addItems(data) {
  const $ = cheerio.load(data);
  const items = {};
  $('.ooa-19sk4h4.e1ioucql0 article').each((index, element) => {
    const id = $(element).attr('id');
    const itemUrl = $(element).find('h2 > a').attr('href');
    items[id] = itemUrl;
  });
  return items;
}


async function scrapeTruckItem(data) {
  const $ = cheerio.load(data);
  const details = {};

  details.title = $('.offer-summary .offer-title.big-text.fake-title').text().trim();
  details.id = $('.offer-content__metabar .offer-meta__item').next().find('.offer-meta__value').text();
  const price = $('.price-wrapper div').attr('data-price');
  const currency = $('.price-wrapper .offer-price__currency').text();
  details.price = `${price} ${currency}`;

  const mapping = {
    'Data pierwszej rejestracji w historii pojazdu': 'registration_date',
    'Przebieg': 'mileage',
    'Rok produkcji': 'production_date',
    'Moc': 'Power',
  };

  $('.parametersArea ul > li').each((index, element) => {
    const $span = $(element).find('span');
    const key = mapping[$span.text()];
  if (key) {
    details[key] = $(element).find('div').text().trim();
  }
    
  });

  return details;
}


function getNextPageUrl(pageNum) {
  return `${initialUrl}&page=${pageNum}`;
}

async function fetchPage(url) {
  try {
    const response = await axios.get(url);
    return response;
  } catch (err) {
    return err;
  }
}

async function getTotalPageNum(data) {
    const mainDiv = '.ooa-1oll9pn.e8b33l77';
    const $ = cheerio.load(data);
    const lastPageLink = $(mainDiv).find('ul > li > a').last().attr('href');
    const lastPageNum = lastPageLink.match(/(\d+)$/)[0];
    return parseInt(lastPageNum, 10);
}
  

async function getAllItems() {
  const response = await fetchPage(initialUrl);
  const data = response.data;

  const totalAdsCount = await getTotalAdsCount(data);
  const totalPages = await getTotalPageNum(data);

  let items = {};
  for (let i = 1; i <= totalPages; i++) {
    const url = getNextPageUrl(i);
    const response = await fetchPage(url);
    const data = response.data;
    const item = await addItems(data);
    items = { ...items, ...item };
    console.log(url);
    if (i > 50) break;
  }

  let allData = [];
  for (const id in items) {
    const response = await fetchPage(items[id]);
    const details = await scrapeTruckItem(response.data);
    allData.push(details);
  }

  return { totalAdsCount, totalPages, allData };
}


(async () => {
    const { totalAdsCount, totalPages, allData } = await getAllItems();
    console.log(allData);
    console.log(totalAdsCount);
    console.log(totalPages);
})();
