export default async function handler(req,res){

try{

const accounts = [

"https://nitter.net/Osinttechnical/rss",
"https://nitter.net/IntelSky/rss",
"https://nitter.net/AuroraIntel/rss",
"https://nitter.net/sentdefender/rss"

];

let news = [];

for(const src of accounts){

try{

const r = await fetch(src);
const xml = await r.text();

const items = xml.match(/<item>(.*?)<\/item>/gs) || [];

items.slice(0,5).forEach((it,i)=>{

const title =
(it.match(/<title>(.*?)<\/title>/)?.[1] || "")
.replace(/<!\[CDATA\[|\]\]>/g,"");

const link =
(it.match(/<link>(.*?)<\/link>/)?.[1] || "");

news.push({

id:"x-"+i+"-"+src,
title,
summary:"مصدر استخباراتي من منصة X",
source:"X Intelligence",
time:new Date().toISOString(),
urgency:"high",
category:"military",
link

});

});

}catch{}

}

res.status(200).json({news});

}catch(e){

res.status(500).json({news:[]});

}

}
