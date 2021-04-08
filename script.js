'use strict'
const puppeteer = require('puppeteer');

const mainUrl = "https://www.avito.ru/sankt-peterburg/koshki/poroda-meyn-kun-ASgBAgICAUSoA5IV";


//Settings for puppeteer
const waitUntilSettings = ['networkidle0', 'domcontentloaded'];

//prefix to avito.ru links
const avitoPref = "https://www.avito.ru";
//amount of adverts you are willing to scrap. Used if value is smaller than the amount of adverts on the page
const amountOfAdverts = 1;

const selectors = {}
//Selectors - strings containing corresponding selectors
const titleSelector = '.title-info-title-text';
const descriptionSelector = '.item-description-text';
const priceSelector = '.price-value-string.js-price-value-string';
const sellerNameSelector = '.seller-info-name';
const dateSelector = '.title-info-metadata-item-redesign';
const advertSelector = '.link-link-39EVK.link-design-default-2sPEv.title-root-395AQ.iva-item-title-1Rmmj.title-list-1IIB_.title-root_maxHeight-3obWc';
const hrefSelector = 'href';

selectors.title = titleSelector;
selectors.description = descriptionSelector;
selectors.price = priceSelector;
selectors.sellerName = sellerNameSelector;
selectors.date = dateSelector;
selectors.advert = advertSelector;
selectors.href = hrefSelector;


/**
 * converts date to ISO-8601 format
 * @returns string in ISO-8601 format
 * @param inDate
 */
function parseDate(inDate) {
    let returningDate = new Date();
    let splittedInDate = inDate.split(" ");
    if (splittedInDate.length === 3) {
        if (splittedInDate[0] === 'сегодня' || splittedInDate[0] === 'Сегодня') {
            ;
        }

        if (splittedInDate[0] === 'вчера' || splittedInDate[0] === 'Вчера') {
            if (returningDate.getDate() === 1) {
                if (returningDate.getMonth() === 0)
                    returningDate.setFullYear(returningDate.getFullYear() - 1);
                returningDate.setMonth(returningDate.getMonth() - 1);
            }
            returningDate.setDate(returningDate.getDate() - 1);
        }
    }
    if (splittedInDate.length === 4) {
        switch (splittedInDate[1]) {
            case 'января':
                returningDate.setMonth(0);
                break;
            case 'февраля':
                returningDate.setMonth(1);
                break;
            case 'марта':
                returningDate.setMonth(2);
                break;
            case 'апреля':
                returningDate.setMonth(3);
                break;
            case 'мая':
                returningDate.setMonth(4);
                break;
            case 'июня':
                returningDate.setMonth(5);
                break;
            case 'июля':
                returningDate.setMonth(6);
                break;
            case 'августа':
                returningDate.setMonth(7);
                break;
            case 'сентября':
                returningDate.setMonth(8);
                break;
            case 'октября':
                returningDate.setMonth(9);
                break;
            case 'ноября':
                returningDate.setMonth(10);
                break;
            case 'декабря':
                returningDate.setMonth(11);
                break;
        }
        returningDate.setDate(splittedInDate[0]);
    }

    returningDate.setHours(splittedInDate.slice(-1)[0].split(':')[0], splittedInDate.slice(-1)[0].split(':')[1], 0, 0);
    return returningDate.toISOString();
}



/**
 * Function parses single advertisement page and puts data in a json
 * @param subUrl - url of advertPage
 * @returns JSON with information
 */
async function scrapSinglePage(subUrl) {
    console.log("scrapping page " + subUrl);
    const browser = await puppeteer.launch({headless: false,
                                                    args: [
                                                        "-ignore-certificate-errors"
                                                    ]
                                                    });
    const singleAdvertPage = await browser.newPage();

    await singleAdvertPage.goto(subUrl + "#login?authsrc=h", {
        waitUntil: waitUntilSettings
    });




    let result = await singleAdvertPage.evaluate((subUrl, selectors) => {

        //Retrieve data
        let curAdvert = {};
        curAdvert.title = document.querySelector(selectors.title).innerText;
        curAdvert.description = document.querySelector(selectors.description).innerText;
        curAdvert.url = subUrl;
        curAdvert.price = document.querySelector(selectors.price).children[0].innerText;
        curAdvert.author = document.querySelector(selectors.sellerName).innerText;
        curAdvert.date = document.querySelector(selectors.date).innerText;
        //Need to register
        //curAdvert.phone;

        return curAdvert;
    }, subUrl, selectors)

    result.date = parseDate(result.date);

    await browser.close();
    console.log(result);

    return result;
}

/**
 * Function get links to pages with advertisements on a corresponding pages and passes them to scrapSinglePage
 * @param mainUrl - links to list of advertisements
 * @returns {Promise<[]>}
 */
async function scrapMainUrl(mainUrl) {
    const browser = await puppeteer.launch({headless: true});
    const mainUrlPage = await browser.newPage();
    await mainUrlPage.goto(mainUrl, {
        waitUntil: waitUntilSettings
    });

    await mainUrlPage.setViewport({width: 1000, height: 500});

    let subUrls = await mainUrlPage.evaluate((mainUrl, selectors) => {
        let q = document.querySelectorAll(selectors.advert);
        let responses = [];
        for (let i = 0; i < q.length; i++) {
            let curAdvert = q[i];
            responses.push(curAdvert.getAttribute(selectors.href));
        }
        return responses;
    }, mainUrl, selectors);
    let responses = [];

    for (let i = 0; i < Math.min(amountOfAdverts, subUrls.length); i++) {
        responses.push(scrapSinglePage(avitoPref + subUrls[i]));
    }
    await browser.close();
    return responses;

}

(async () => {
    console.log(await scrapMainUrl(mainUrl));
})()



//console.log(parseDate("31 марта в 21:52"));
