export default async function handler(req, res) {

try {

const feeds = [

{ url:"https://feeds.bbci.co.uk/news/world/rss.xml", source:"BBC" },
{ url:"https://www.aljazeera.com/xml/rss/all.xml", source:"Al Jazeera" },
{ url:"https://rss.nytimes.com/services/xml/rss/nyt/World.xml", source:"NYTimes" },
{ url:"https://www.reutersagency.com/feed/?best-topics=world&post_type=best", source:"Reuters" },
{ url:"https://feeds.skynews.com/feeds/rss/world.xml", source:"Sky News" }

];

let news = [];

for(const feed of feeds){

try{

const r = await fetch(feed.url);
const xml = await r.text();

const items = xml.match(/<item>(.*?)<\/item>/gs) || [];

items.slice(0,6).forEach((it,i)=>{

const title =
(it.match(/<title>(.*?)<\/title>/)?.[1] || "")
.replace(/<!\[CDATA\[|\]\]>/g,"");

const link =
(it.match(/<link>(.*?)<\/link>/)?.[1] || "");

const desc =
(it.match(/<description>(.*?)<\/description>/)?.[1] || "")
.replace(/<!\[CDATA\[|\]\]>/g,"");

news.push({

id:feed.source+"-"+i,

title,

summary:desc.slice(0,200),

source:feed.source,

time:new Date().toISOString(),

urgency:"medium",

category:"regional",

link

});

});

}catch{}

}

news = news.slice(0,30);

res.status(200).json({
news,
updated:new Date().toISOString()
});

}catch(e){

res.status(500).json({news:[]});

}

}
