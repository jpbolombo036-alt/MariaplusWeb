import { http, decodeMap, decodeList } from './http'
import { ApiConfig } from './config'
export interface GalleryPhoto { id:number; galleryId:number; guestCategoryId:number|null; caption:string|null; displayOrder:number; contentType:string; imageUrl:string }
export interface Gallery { id:number; eventId:number; title:string; description:string|null; enabled:boolean; photos:GalleryPhoto[] }
const parsePhoto=(v:Record<string,unknown>):GalleryPhoto=>({id:Number(v.id??0),galleryId:Number(v.galleryId??0),guestCategoryId:v.guestCategoryId==null?null:Number(v.guestCategoryId),caption:v.caption?String(v.caption):null,displayOrder:Number(v.displayOrder??0),contentType:String(v.contentType??'image/jpeg'),imageUrl:String(v.imageUrl??'')})
const parse=(v:unknown):Gallery=>{const j=decodeMap(v);return{id:Number(j.id??0),eventId:Number(j.eventId??0),title:String(j.title??'Galerie'),description:j.description?String(j.description):null,enabled:Boolean(j.enabled??true),photos:decodeList(j.photos).map(x=>parsePhoto(x as Record<string,unknown>))}}
export async function getGallery(id:number){return parse((await http.get(ApiConfig.weddingGalleryPath(id))).data)}
export async function updateGallery(id:number,payload:Record<string,unknown>){return parse((await http.put(ApiConfig.weddingGalleryPath(id),payload)).data)}
export async function uploadGalleryPhoto(id:number,file:File,categoryId:number|null){const f=new FormData();f.append('file',file);if(categoryId!=null)f.append('guestCategoryId',String(categoryId));return parsePhoto(decodeMap((await http.post(`${ApiConfig.weddingGalleryPath(id)}/photos`,f,{headers:{'Content-Type':'multipart/form-data'}})).data))}
export async function deleteGalleryPhoto(id:number,photoId:number){await http.delete(`${ApiConfig.weddingGalleryPath(id)}/photos/${photoId}`)}
export async function getPublicGallery(token:string){return parse((await http.get(`${ApiConfig.publicInvitationsPath}/${token}/gallery`)).data)}
