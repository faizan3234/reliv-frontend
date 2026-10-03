import { useLocation } from 'react-router-dom';
import { useHealth } from '../context/HealthContext';
import { getScanCount } from '../utils/reportSnapshot';
import Report1 from './Report1';
import Report2 from './Report2';
import Report3 from './Report3';
import Report4 from './Report4';
import Report5 from './Report5';
import '../styles/report.css';
import '../styles/referenceReports.css';

// Render only beneath ProtectedReportRoute. No history-by-email or cloud reads.
export default function ReferenceReports() {
 const {data}=useHealth();
 const {pathname}=useLocation();
 const page=Math.min(5,Math.max(1,Number(pathname.match(/report-(\d)/)?.[1])||1));
 const count=getScanCount(data);
 const Page=[Report1,Report2,Report3,Report4,Report5][page-1];
 return <main className="reference-reports" aria-label="Health screening report">
  <header className="reference-progress"><strong>📋 Scan {count} · Report {page} / 5</strong><span>{count<7?`${7-count} scans left in your seven-scan journey`:'✓ Seven-scan journey complete'}</span></header>
  <p className="reference-note">Measured readings and calculated estimates are different. Body score, bone mass, body fat, muscle and calorie estimates are screening information—not diagnoses or direct tissue measurements.</p>
  <Page key={`${data.sessionId}-${page}`} />
 </main>;
}
