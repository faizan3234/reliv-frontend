export async function photoData(file){
 if(!file||!/^image\/(jpeg|png|webp)$/.test(file.type)||file.size>20_000_000)throw Error('Choose a JPEG, PNG or WebP photo under 20 MB. Convert HEIC to JPEG first.');
 const url=URL.createObjectURL(file);
 try{
  const image=new Image();image.src=url;await image.decode();
  const scale=Math.min(1,1600/Math.max(image.naturalWidth,image.naturalHeight));
  const canvas=document.createElement('canvas');canvas.width=Math.max(1,Math.round(image.naturalWidth*scale));canvas.height=Math.max(1,Math.round(image.naturalHeight*scale));
  const ctx=canvas.getContext('2d');if(!ctx)throw Error('Photo processing is unavailable.');ctx.fillStyle='white';ctx.fillRect(0,0,canvas.width,canvas.height);ctx.drawImage(image,0,0,canvas.width,canvas.height);
  for(const quality of [.85,.7,.55]){const data=canvas.toDataURL('image/jpeg',quality);if(data.length<1_500_000)return data;}
  throw Error('Use a smaller photo.');
 }catch(error){throw Error(error.message||'Could not read this photo.');}finally{URL.revokeObjectURL(url);}
}
