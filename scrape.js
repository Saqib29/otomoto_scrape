const axios = require('axios');
const cheerio = require('cheerio');

const initial_url = 'https://www.otomoto.pl/ciezarowe/uzytkowe/mercedes-benz/od-+2014/q-actros?search%5Bfilter_enum_damaged%5D=0&search%5Border%5D=created_at+%3Adesc';
// const initial_url = 'https://www.otomoto.pl/ciezarowe/uzytkowe/mercedes-benz/od-+2014/q-actros?search%5Bfilter_enum_damaged%5D=0&search%5Border%5D=created_at+%3Adesc&page=15';



function getTotalAdsCount(data) {
    const $ = cheerio.load(data);
    const texts = $('.ooa-1uewmxv h1');
    const totalAdsCount = texts.first().text().match(/\d+/)[0];
    return totalAdsCount;
}


async function addItems(data) {

    const $ = cheerio.load(data);
    const items = [];
    $('.ooa-19sk4h4.e1ioucql0  article').each((index, element) => {
        const id = $(element).attr('id');
        const itemUrl = $(element).find('h2 > a').attr('href');
        
        items[id] = itemUrl;
    });
    return items;
}


async function scrapeTruckItem(data) {
    // main function to crawol data
    const $ = cheerio.load(data);

    details = {}

    details['title'] = $('.offer-summary').find('.offer-title.big-text.fake-title ').text().trim();
    details['id'] = $('.offer-content__metabar').find('.offer-meta__item').next().find('.offer-meta__value').text();
    details['price'] = $('.price-wrapper').find('div').attr('data-price') + ' ' +
                     $('.price-wrapper').find('.offer-price__currency').text();
    

    const detailsLists = $('.parametersArea').find('ul > li');
    detailsLists.each((index, element) => {
        const $span = $(element).find('span');
        const searchStringRegDate = 'Data pierwszej rejestracji w historii pojazdu';
        const searchStringMileage = 'Przebieg';
        const searchStringProductionDate = 'Rok produkcji';
        const searchStringPower = 'Moc';

        if($span.text() === searchStringRegDate){
            details['Date of registration'] = $(element).find('div').text().trim();
        }
        if($span.text() === searchStringMileage){
            details['Mileage'] = $(element).find('div').text().trim();
            // console.log(mileage)
        }
        if($span.text() === searchStringProductionDate){
            details['Production date'] = $(element).find('div').text().trim();
        }
        if($span.text() === searchStringPower){
            details['Power'] = $(element).find('div').text().trim();
        }

        
    });
    return details;
}

function getNextPageUrl(pageNum){
    const url = initial_url + `&page=${pageNum}`;
    return url;
}

function getTotalPageNum(data) {
    const mainDiv = '.ooa-1oll9pn.e8b33l77';
    const $ = cheerio.load(data);
    const url = $(mainDiv).find('ul > li > a').last().attr('href');
    const regex = /(\d+)$/;
    const pageNum = url.match(regex)[0];

    return pageNum;
}

async function fetchPage(url) {
    try{
        const response = await axios.get(url);
        return response;
    } catch(err) {
        return err.stack;
    }
}

(async () => {
    // console.log(url);
    const retry = [];

    try{

        const response = await fetchPage(initial_url);
        const data = response.data;
        
        const totalAddsCount = getTotalAdsCount(data);
        const totalPages = getTotalPageNum(data)


        let items = {};
        for (let i=1; i<=totalPages; i++){
            const url = getNextPageUrl(i);
            const response = await fetchPage(url);
            const data = response.data;

            const item = await addItems(data);
            
            items = {...items, ...item}

            console.log(url);
            if(i>50) break;
        }
        
        let all_data = [];
        for(let url in items){
            const respons = await fetchPage(items[url]);
            const details = await scrapeTruckItem(respons.data);
            all_data.push(details);
        }
        

        console.log(all_data);

        console.log(`total page exist ${totalPages}`)
        console.log(`total ads ${totalAddsCount}`)

    } catch(err) {
        console.log(err);
    } 


})();