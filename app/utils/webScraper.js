const puppeteer = require('puppeteer');
 

async function getRows(url) {
  const browser = await puppeteer.launch();
  const page = await browser.newPage()	
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