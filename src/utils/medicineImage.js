// Use the same-origin API proxy on Pi and admin phones. Older database rows
// retain /medicine-images; no database rewrite or image re-upload is required.
export function medicineImageUrl(kit, base) {
 const raw=kit?.image_path || kit?.imageUrl;
 if(typeof raw!=='string'||!raw.trim())return '';
 const value=raw.trim();
 if(value.startsWith('/medicine-images/'))return `${base.replace(/\/$/,'')}/api${value}`;
 if(value.startsWith('/api/medicine-images/'))return `${base.replace(/\/$/,'')}${value}`;
 if(/^(https?:|data:image\/|blob:)/i.test(value))return value;
 return '';
}
