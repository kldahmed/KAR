import React, { useEffect, useState } from "react";
export default function GlobalHeader({ language = "ar" }) {
  const [time, setTime] = useState("");
  const [count, setCount] = useState(247);

  useEffect(() => {
    const tick = () => {
      const n = new Date();
      const p = v => String(v).padStart(2,"0");
      setTime(`${p(n.getUTCHours())}:${p(n.getUTCMinutes())}:${p(n.getUTCSeconds())} UTC`);
    };
    tick(); const id = setInterval(tick,1000); return ()=>clearInterval(id);
  },[]);
  useEffect(()=>{
    const id=setInterval(()=>setCount(c=>c+Math.floor(Math.random()*3)-1),4500);
    return()=>clearInterval(id);
  },[]);

  return (
    <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",padding:"0 24px",height:"62px",background:"rgba(2,5,9,0.97)",borderBottom:"1px solid rgba(0,200,255,0.1)",backdropFilter:"blur(20px)",fontFamily:"'Cairo',sans-serif",direction:language==="ar"?"rtl":"ltr",position:"relative",zIndex:200}}>
      <div style={{display:"flex",alignItems:"center",gap:"12px"}}>
        <div style={{width:"38px",height:"38px",border:"2px solid #00c8ff",borderRadius:"50%",display:"flex",alignItems:"center",justifyContent:"center"}}>
          <div style={{width:"10px",height:"10px",background:"#00c8ff",borderRadius:"50%",boxShadow:"0 0 10px #00c8ff"}}/>
        </div>
        <div style={{fontSize:"20px",fontWeight:900,color:"#fff"}}>
          النبض <span style={{color:"#00c8ff"}}>العالمي</span>
        </div>
      </div>
      <div style={{display:"flex",alignItems:"center",gap:"8px",fontSize:"12px",color:"#4a6b7a"}}>
        <div style={{width:"7px",height:"7px",background:"#ff3a3a",borderRadius:"50%",boxShadow:"0 0 6px #ff3a3a"}}/>
        <span>بث استخباراتي مباشر</span>
        <span style={{margin:"0 8px",opacity:0.3}}>|</span>
        <span style={{color:"#00c8ff",fontWeight:700}}>{count.toLocaleString("ar-SA")}</span>
        <span> إشارة نشطة</span>
      </div>
      <div style={{display:"flex",alignItems:"center",gap:"16px"}}>
        <div style={{display:"flex",alignItems:"center",gap:"7px",padding:"5px 14px",border:"1px solid #ff3a3a",borderRadius:"3px",fontSize:"12px",fontWeight:700,color:"#ff3a3a"}}>
          <div style={{width:"6px",height:"6px",background:"#ff3a3a",borderRadius:"50%"}}/>
          مستوى التهديد: مرتفع
        </div>
        <div style={{fontSize:"13px",fontWeight:600,color:"#00c8ff",direction:"ltr"}}>{time}</div>
      </div>
    </div>
  );
}
