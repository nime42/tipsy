const puppeteer = require('puppeteer');
const { resolve } = require('path');
 
var browser=undefined;
var page=undefined;

async function getRows(url) {
    if(browser===undefined) {
        browser = await puppeteer.launch({args: ['--no-sandbox'],userDataDir: resolve('./tmp/puppeteer-data-dir')});
        page = await browser.newPage();	
        await page.setRequestInterception(true);
        page.on('request', (request) => { 
            if (request.resourceType() === 'stylesheet' || request.resourceType()==="image") {
                request.abort();
            } else {
                request.continue();
            }
        });

    }
  await page.goto(url);
  const rows=await page.evaluate(() => {
	  let rows=""
	  $(".share-coupon li").each((i,e)=>{
		  rows+=$(e).find(".btn-bet-selected").find("label").text()+"\n"});
        return rows;
  });
	return rows;
}

module.exports={
    getRows:getRows
}