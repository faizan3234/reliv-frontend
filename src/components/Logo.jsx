import wordmark from '../../shared/reliv-wordmark.svg';
export default function Logo({className = '', size = 'text-3xl md:text-4xl'}) {
  return <span className={`inline-flex items-center ${size} ${className}`}><img src={wordmark} alt="Reliv" style={{width:'2.7em',height:'1.1em',objectFit:'contain'}} /></span>;
}
