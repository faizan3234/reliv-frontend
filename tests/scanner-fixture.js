export default class Scanner {
 constructor(video,onDecode,options){this.onDecode=onDecode;this.options=options;window.__scanners.push(this);}
 async start(){this.starts=(this.starts||0)+1;if(window.__denyCamera)throw Error('Permission denied');}
 destroy(){this.destroyed=true;}
 stop(){this.stopped=true;}
 async hasFlash(){return false;}
}
