import React, {useEffect, useMemo, useState} from 'react';

export default function BuildStyles(){
 return <style>{`
  .ni4eMeaning{display:grid;grid-template-columns:180px 1fr auto;gap:32px;align-items:center;padding:42px max(24px,6vw);background:#0a2a21;color:#fff}
  .ni4eMeaning h2{margin:5px 0 8px;font-size:clamp(22px,2.4vw,34px);letter-spacing:-.025em}
  .ni4eMeaning p{margin:0;max-width:760px;color:rgba(255,255,255,.68);line-height:1.7}
  .meaningLabel{display:flex;flex-direction:column;gap:5px}.meaningLabel small{font-weight:800;letter-spacing:.18em;color:#d6b66a}
  .glanceGrid{display:grid;grid-template-columns:repeat(4,1fr);gap:14px}.glanceGrid article{padding:24px;border:1px solid #e5e9e7;background:#fff;display:flex;flex-direction:column;gap:5px}.glanceGrid b{font-size:34px;color:#0a6b48}.glanceGrid strong{font-size:15px}.glanceGrid span{font-size:12px;color:#78817d}
  .resourceGrid{display:grid;grid-template-columns:repeat(4,1fr);gap:14px}.resourceCard{border:1px solid #e5e9e7;background:#fff;padding:20px;text-align:left;display:flex;align-items:center;gap:14px;cursor:pointer;transition:.25s}.resourceCard:hover{transform:translateY(-4px);border-color:#0a6b48;box-shadow:0 14px 35px rgba(0,0,0,.07)}.resourceCard>svg{margin-left:auto}.resourceIcon{width:44px;height:44px;display:grid;place-items:center;background:#edf6f1;color:#0a6b48;flex:0 0 auto}.resourceCard b{display:block}.resourceCard p{font-size:12px;line-height:1.5;color:#77807c;margin:5px 0 0}
  .modalBackdrop{position:fixed;inset:0;z-index:1000;background:rgba(2,17,13,.72);backdrop-filter:blur(8px);display:grid;place-items:center;padding:20px}.detailModal{position:relative;background:#fff;color:#14201b;width:min(620px,100%);padding:38px;border-radius:20px;box-shadow:0 30px 90px rgba(0,0,0,.3);animation:modalIn .25s ease}.detailModal h2{font-size:32px;line-height:1.1;margin:8px 0 16px}.detailModal p{color:#68736e;line-height:1.75}.modalClose{position:absolute;right:16px;top:16px;border:0;background:#f2f4f3;width:38px;height:38px;border-radius:50%;display:grid;place-items:center;cursor:pointer}.modalMeta{display:flex;gap:20px;flex-wrap:wrap;color:#59655f;font-size:13px;margin-bottom:18px}.modalMeta span{display:flex;align-items:center;gap:7px}.resourcePreview{display:flex;gap:12px;align-items:center;padding:18px;background:#f2f7f4;margin:20px 0}.resourcePreview span{display:block;font-size:12px;color:#7a8580;margin-top:4px}
  @keyframes modalIn{from{opacity:0;transform:translateY(12px) scale(.98)}to{opacity:1;transform:none}}
  @media(max-width:900px){.ni4eMeaning{grid-template-columns:1fr}.glanceGrid,.resourceGrid{grid-template-columns:repeat(2,1fr)}}
  @media(max-width:600px){.glanceGrid,.resourceGrid{grid-template-columns:1fr}.detailModal{padding:28px 22px}.detailModal h2{font-size:25px}}
 `}</style>
}
