export default async function handler(req,res){

try{

const sources = [

"https://www.espn.com/espn/rss/news",
"https://feeds.bbci.co.uk/sport/rss.xml",
"https://www.skysports.com/rss/12040",
"https://www.goal.com/feeds/en/news"
];

let news = [];

for(const src of sources){

try{

const r = await fetch(src);
const xml = await r.text();

const items = xml.match(/<item>(.*?)<\/item>/gs) || [];

items.slice(0,8).forEach((it,i)=>{

const title =
(it.match(/<title>(.*?)<\/title>/)?.[1] || "")
.replace(/<!\[CDATA\[|\]\]>/g,"");

const link =
(it.match(/<link>(.*?)<\/link>/)?.[1] || "");

news.push({

id:"sports-"+i,
title,
summary:"خبر رياضي",
source:"Sports",
time:new Date().toISOString(),
category:"sports",
link

});

});

}catch{}

}

res.status(200).json({news:news.slice(0,30)});

}catch{

res.status(500).json({news:[]});

}

}
