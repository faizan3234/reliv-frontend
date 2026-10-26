import wordmark from '../../../shared/reliv-wordmark.svg';
export function Logo({className='h-8',width,height}) {
 return <img src={wordmark} alt="Reliv" className={className} width={width} height={height} style={{objectFit:'contain'}}/>;
}
export default Logo;
