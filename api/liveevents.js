export default async function handler(req,res){

try{

const url =
"https://api.gdeltproject.org/api/v2/events/doc/doc?query=attack%20OR%20missile%20OR%20strike&mode=ArtList&maxrecords=20&format=json";

const r = await fetch(url);
const data = await r.json();

const events = (data.articles || []).map((a,i)=>({

id:"gdelt-"+i,
title:a.title,
summary:a.seendate,
source:a.domain,
time:new Date().toISOString(),
urgency:"medium",
category:"military"

}));

res.status(200).json({events});

}catch(e){

res.status(500).json({events:[]});

}

}
