import {useEffect,useRef,useState} from 'react'
import type {AF1RegionColors,AF1RegionId} from './af1Regions'

export function useDesignHistory<F,A,S>(
 colors:AF1RegionColors,finishes:F,artworks:A,surfaceStrokes:S,
 setFinishes:(v:F)=>void,setArtworks:(v:A)=>void,setSurfaceStrokes:(v:S)=>void,
 onColorChange:(id:AF1RegionId,color:string)=>void
){
 const history=useRef<string[]>([])
 const redoStack=useRef<string[]>([])
 const ignoreNext=useRef(false)
 const [revision,setRevision]=useState(0)
 const snapshot=JSON.stringify({colors,finishes,artworks,surfaceStrokes})
 useEffect(()=>{
  if(ignoreNext.current){ignoreNext.current=false;return}
  if(history.current.at(-1)!==snapshot){
   history.current.push(snapshot)
   if(history.current.length>100)history.current.shift()
   redoStack.current=[]
   setRevision(v=>v+1)
  }
 },[snapshot])
 const restore=(value:string)=>{
  const saved=JSON.parse(value) as {colors:AF1RegionColors;finishes:F;artworks:A;surfaceStrokes?:S}
  ignoreNext.current=true
  setFinishes(saved.finishes)
  setArtworks(saved.artworks)
  if(saved.surfaceStrokes!==undefined)setSurfaceStrokes(saved.surfaceStrokes)
  for(const id of Object.keys(saved.colors) as AF1RegionId[]){
   if(colors[id]!==saved.colors[id])onColorChange(id,saved.colors[id])
  }
  setRevision(v=>v+1)
 }
 const undo=()=>{
  if(history.current.length<2)return
  redoStack.current.push(history.current.pop()!)
  restore(history.current.at(-1)!)
 }
 const redo=()=>{
  const value=redoStack.current.pop()
  if(!value)return
  history.current.push(value)
  restore(value)
 }
 useEffect(()=>{
  const handler=(event:KeyboardEvent)=>{
   const target=event.target as HTMLElement|null
   if(target?.closest('input,textarea,[contenteditable="true"]'))return
   if(!(event.ctrlKey||event.metaKey))return
   const key=event.key.toLowerCase()
   if(key==='z'){
    event.preventDefault()
    if(event.shiftKey)redo();else undo()
   }else if(key==='y'){event.preventDefault();redo()}
  }
  window.addEventListener('keydown',handler)
  return()=>window.removeEventListener('keydown',handler)
 })
 void revision
 return {undo,redo,canUndo:history.current.length>1,canRedo:redoStack.current.length>0}
}
