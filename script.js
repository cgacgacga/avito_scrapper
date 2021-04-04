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
const priceSelector = '.js-item-price';
const sellerNameSelector = '.seller-info-name';
const dateSelector = '.title-info-metadata-item-redesign';
const advertSelector = '.link-link-39EVK.link-design-default-2sPEv.title-root-395AQ.iva-item-title-1Rmmj.title-list-1IIB_.title-root_maxHeight-3obWc';
const hrefSelector = 'href';

selectors.titleSelector = titleSelector;
selectors.descriptionSelector = descriptionSelector;
selectors.priceSelector = priceSelector;
selectors.sellerNameSelector = sellerNameSelector;
selectors.dateSelector = dateSelector;
selectors.advertSelector = advertSelector;
selectors.hrefSelector = hrefSelector;

/**
 * Function parses single advertisement page and puts data in a json
 * @param subUrl - url of advertPage
 * @returns JSON with information
 */
async function scrapSinglePage(subUrl) {
    console.log("scrapping page " + subUrl);
    const browser = await puppeteer.launch({headless: true});
    const page = await browser.newPage();

    await page.goto(subUrl, {
        waitUntil: waitUntilSettings
    });
    await page.setViewport({width: 1000, height: 500});

    let result = await page.evaluate((subUrl, selectors) => {
        let curAdvert = {};
        curAdvert.title = document.querySelector(selectors.titleSelector).innerText;
        curAdvert.description = document.querySelector(selectors.descriptionSelector).innerText;
        curAdvert.url = subUrl;
        curAdvert.price = document.querySelector(selectors.priceSelector).innerText;
        curAdvert.author = document.querySelector(selectors.sellerNameSelector).innerText;
        curAdvert.date = document.querySelector(selectors.dateSelector).innerText;
        //Need to register
        //curAdvert.phone;

        return curAdvert;
    }, subUrl, selectors);

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
    const page = await browser.newPage();
    await page.goto(mainUrl, {
        waitUntil: waitUntilSettings
    });
    await page.setViewport({width: 1000, height: 500});

    let subUrls = await page.evaluate((mainUrl, selectors) => {
        let q = document.querySelectorAll(selectors.advertSelector);
        let responses = [];
        for (let i = 0; i < q.length; i++) {
            let curAdvert = q[i];
            responses.push(curAdvert.getAttribute(selectors.hrefSelector));
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

scrapMainUrl(mainUrl)
    .then(r => console.log("Success"))
    .catch(r => console.log("Failed"));