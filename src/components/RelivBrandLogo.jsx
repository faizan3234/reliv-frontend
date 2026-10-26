import wordmark from '../../shared/reliv-wordmark.svg';
export default function RelivBrandLogo({width=124}) {
 return <img src={wordmark} alt="Reliv" width={width} height={width*76/186} style={{display:'block',objectFit:'contain',flexShrink:0}}/>;
}
