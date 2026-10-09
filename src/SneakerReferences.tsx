import {useState} from 'react'
const MODELS=[
 {id:'b580fb8a337e4609807185f1fab2f305',name:'Air Force 1 Low',author:'mister dude',url:'https://sketchfab.com/3d-models/nike-air-force-1-b580fb8a337e4609807185f1fab2f305',license:'CC BY'},
 {id:'fbe52211197c4b449f29de5aa4eb0611',name:'Air Jordan 1 High',author:'DeezVertz',url:'https://sketchfab.com/3d-models/nike-air-jordan-1-fbe52211197c4b449f29de5aa4eb0611',license:'CC BY'}
] as const
export default function SneakerReferences(){
 const [selected,setSelected]=useState(0)
 const model=MODELS[selected]
 return <section style={{background:'#fff',borderRadius:16,padding:16,margin:'16px 0',border:'1px solid #ddd'}}>
  <h2 style={{margin:'0 0 8px'}}>Real sneaker 3D references</h2>
  <p style={{margin:'0 0 12px'}}>Rotate and inspect real sneaker geometry. These externally hosted references are not yet paintable or connected to the 2D editor. The editable preview remains available under 3D Preview.</p>
  <div style={{display:'flex',gap:8,flexWrap:'wrap',marginBottom:12}}>{MODELS.map((m,i)=><button key={m.id} onClick={()=>setSelected(i)} style={{padding:'10px 14px',borderRadius:9,border:'1px solid #bbb',background:selected===i?'#171717':'#fff',color:selected===i?'#fff':'#111'}}>{m.name}</button>)}</div>
  <iframe key={model.id} title={model.name+' interactive 3D reference'} src={'https://sketchfab.com/models/'+model.id+'/embed?autostart=0&ui_infos=1&ui_controls=1'} allow="autoplay; fullscreen; xr-spatial-tracking" allowFullScreen loading="lazy" referrerPolicy="strict-origin-when-cross-origin" style={{width:'100%',height:'min(65vh,540px)',minHeight:320,border:0,borderRadius:10,background:'#222'}}/>
  <p style={{fontSize:12,lineHeight:1.5}}>Model by {model.author} · {model.license} · <a href={model.url} target="_blank" rel="noopener noreferrer">Original model and attribution</a>. Nike and Jordan are third-party trademarks; this studio is not affiliated with them.</p>
  <p style={{fontSize:12}}>Air Force 1 High is pending verified model access and licensing; Vans will be added later.</p>
 </section>
}
