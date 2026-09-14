import html2pdf from 'html2pdf.js';
import { AggregatedResult, GradeThreshold, SystemSettings } from '../types';
import { getGradeInfo } from './evaluationCalculator';

/**
 * Returns the formal Thai government evaluation form title based on position
 */
export function getOfficialReportTitle(position: string): string {
  if (position.includes('พนักงานราชการ')) {
    return 'แบบสรุปผลการประเมินการปฏิบัติงานของพนักงานราชการทั่วไป';
  }
  if (position.includes('จ้างเหมา')) {
    return 'แบบสรุปผลการประเมินการปฏิบัติงานของผู้รับจ้างเหมาบริการ';
  }
  return 'แบบสรุปผลการประเมินการปฏิบัติงานของลูกจ้างชั่วคราว';
}

/**
 * Generates an isolated, print-ready HTML string for official A4 report
 * with Sarabun font and guaranteed distortion-free Thai typography.
 */
export function generateOfficialReportHtml(
  result: AggregatedResult,
  systemSettings: SystemSettings,
  thresholds?: GradeThreshold[]
): string {
  const formTitle = getOfficialReportTitle(result.evaluatee.position);
  const gradeInfo = getGradeInfo(result.finalGrade, thresholds);

  const activeThresholds =
    thresholds && thresholds.length > 0
      ? thresholds
      : [
          { level: 'ระดับดีเด่น', minScore: 90, maxScore: 100 },
          { level: 'ระดับดี', minScore: 70, maxScore: 89.99 },
          { level: 'ระดับปกติ', minScore: 60, maxScore: 69.99 },
          { level: 'งดจ้างต่อ', minScore: 0, maxScore: 59.99 },
        ];

  const committeeRowsHtml = result.submissions
    .map(
      (sub, idx) => `
      <div class="committee-card">
        <div class="committee-header">
          <strong>กรรมการท่านที่ ${idx + 1}: ${sub.evaluatorName}</strong> (${sub.evaluatorPosition})
          <span class="committee-score">คะแนน: ${sub.totalScore.toFixed(2)} / ${sub.maxScore} (${sub.percentage.toFixed(2)}%) &bull; ${sub.grade}</span>
        </div>
        <div class="committee-comments">
          <div class="comment-item"><strong>จุดเด่น:</strong> ${sub.comments.strengths || '-'}</div>
          <div class="comment-item"><strong>ข้อควรพัฒนา:</strong> ${sub.comments.improvements || '-'}</div>
        </div>
      </div>
    `
    )
    .join('');

  const signaturesHtml = result.submissions
    .map(
      (sub) => `
      <div class="sig-box">
        <div class="sig-img-container">
          ${
            sub.signatureDataUrl
              ? `<img src="${sub.signatureDataUrl}" alt="ลายมือชื่อ" class="sig-img" />`
              : `<span class="sig-placeholder">(ลงนามดิจิทัล)</span>`
          }
        </div>
        <div class="sig-line"></div>
        <div class="sig-name">(${sub.evaluatorName})</div>
        <div class="sig-pos">${sub.evaluatorPosition}</div>
        <div class="sig-date">${new Date(sub.submittedAt).toLocaleDateString('th-TH', {
          year: 'numeric',
          month: 'long',
          day: 'numeric',
        })}</div>
      </div>
    `
    )
    .join('');

  return `<!DOCTYPE html>
<html lang="th">
<head>
  <meta charset="UTF-8">
  <title>แบบรายงานผลการประเมิน_${result.evaluatee.name}</title>
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link href="https://fonts.googleapis.com/css2?family=Sarabun:ital,wght@0,300;0,400;0,500;0,600;0,700;0,800;1,400&display=swap" rel="stylesheet">
  <style>
    @page {
      size: A4 portrait;
      margin: 15mm 15mm 15mm 15mm;
    }
    *, *::before, *::after {
      box-sizing: border-box;
      font-family: 'Sarabun', 'TH Sarabun New', Tahoma, sans-serif !important;
      letter-spacing: normal !important;
    }
    body {
      background: #ffffff;
      color: #111827;
      font-size: 13pt;
      line-height: 1.5;
      margin: 0;
      padding: 0;
      -webkit-font-smoothing: antialiased;
      -moz-osx-font-smoothing: grayscale;
    }
    .report-container {
      width: 100%;
      max-width: 100%;
      margin: 0 auto;
    }
    .header-section {
      text-align: center;
      margin-bottom: 16px;
      padding-bottom: 12px;
      border-bottom: 2px solid #1e293b;
    }
    .logo-container {
      width: 70px;
      height: 70px;
      margin: 0 auto 8px;
    }
    .logo-container img {
      width: 100%;
      height: 100%;
      object-fit: contain;
    }
    .main-title {
      font-size: 16pt;
      font-weight: 700;
      margin: 0 0 4px;
      color: #0f172a;
    }
    .sub-title {
      font-size: 13pt;
      color: #334155;
      margin: 0 0 2px;
    }
    .school-info {
      font-size: 12pt;
      color: #475569;
    }
    .section-title {
      font-size: 13pt;
      font-weight: 700;
      background: #f1f5f9;
      padding: 6px 12px;
      border-radius: 6px;
      border-left: 4px solid #1e40af;
      margin: 16px 0 8px;
      color: #0f172a;
    }
    .info-table {
      width: 100%;
      border-collapse: collapse;
      margin-bottom: 12px;
    }
    .info-table td {
      padding: 4px 8px;
      font-size: 12.5pt;
      vertical-align: top;
    }
    .label {
      color: #475569;
      width: 25%;
    }
    .val {
      color: #0f172a;
      font-weight: 600;
    }
    .score-summary-grid {
      display: flex;
      gap: 12px;
      margin-bottom: 12px;
    }
    .score-box {
      flex: 1;
      border: 1px solid #cbd5e1;
      border-radius: 8px;
      padding: 10px;
      text-align: center;
      background: #f8fafc;
    }
    .score-box-label {
      font-size: 11pt;
      color: #64748b;
      margin-bottom: 4px;
    }
    .score-box-val {
      font-size: 18pt;
      font-weight: 800;
      color: #0f172a;
    }
    .score-box-badge {
      display: inline-block;
      padding: 4px 16px;
      border-radius: 20px;
      font-weight: 700;
      font-size: 13pt;
      background: #e0e7ff;
      color: #1e3a8a;
      border: 1px solid #bfdbfe;
    }
    .threshold-list {
      font-size: 10.5pt;
      color: #475569;
      background: #f8fafc;
      padding: 8px 12px;
      border-radius: 6px;
      border: 1px solid #e2e8f0;
      margin-bottom: 12px;
    }
    .threshold-grid {
      display: grid;
      grid-template-columns: repeat(4, 1fr);
      gap: 8px;
      margin-top: 4px;
      font-weight: 500;
    }
    .committee-card {
      border: 1px solid #e2e8f0;
      border-radius: 6px;
      padding: 8px 12px;
      margin-bottom: 8px;
      background: #ffffff;
      page-break-inside: avoid;
    }
    .committee-header {
      display: flex;
      justify-content: space-between;
      border-bottom: 1px dashed #cbd5e1;
      padding-bottom: 4px;
      margin-bottom: 4px;
      font-size: 12pt;
    }
    .committee-score {
      font-weight: 700;
      color: #1e40af;
    }
    .committee-comments {
      font-size: 11pt;
      color: #334155;
    }
    .comment-item {
      margin: 2px 0;
    }
    .signatures-grid {
      display: flex;
      justify-content: space-around;
      gap: 12px;
      margin-top: 12px;
      page-break-inside: avoid;
    }
    .sig-box {
      flex: 1;
      border: 1px solid #e2e8f0;
      border-radius: 8px;
      padding: 10px;
      text-align: center;
      background: #fcfcfd;
    }
    .sig-img-container {
      height: 55px;
      display: flex;
      align-items: center;
      justify-content: center;
      margin-bottom: 6px;
    }
    .sig-img {
      max-height: 50px;
      max-width: 130px;
      object-fit: contain;
    }
    .sig-placeholder {
      font-size: 10pt;
      color: #94a3b8;
      font-style: italic;
    }
    .sig-line {
      border-top: 1px solid #94a3b8;
      margin-bottom: 4px;
    }
    .sig-name {
      font-weight: 700;
      font-size: 11.5pt;
      color: #0f172a;
    }
    .sig-pos {
      font-size: 10pt;
      color: #64748b;
    }
    .sig-date {
      font-size: 9pt;
      color: #94a3b8;
      margin-top: 2px;
    }
    .approval-section {
      display: flex;
      justify-content: space-around;
      margin-top: 20px;
      padding-top: 16px;
      border-top: 2px solid #cbd5e1;
      text-align: center;
      page-break-inside: avoid;
    }
    .approval-box {
      width: 45%;
    }
    .approval-space {
      height: 50px;
      border-bottom: 1px dashed #94a3b8;
      width: 220px;
      margin: 0 auto 8px;
    }
    .page-footer {
      margin-top: 20px;
      text-align: center;
      font-size: 9.5pt;
      color: #94a3b8;
      border-top: 1px solid #e2e8f0;
      padding-top: 6px;
    }
  </style>
</head>
<body>
  <div class="report-container">
    <div class="header-section">
      ${
        systemSettings.logoUrl
          ? `<div class="logo-container"><img src="${systemSettings.logoUrl}" alt="ตราโรงเรียน" /></div>`
          : ''
      }
      <h1 class="main-title">${formTitle}</h1>
      <div class="sub-title">${systemSettings.evaluationRound} ประจำปีงบประมาณ ${systemSettings.academicYear}</div>
      <div class="school-info">สถานศึกษา: ${systemSettings.schoolName} (${systemSettings.schoolAffiliation})</div>
    </div>

    <div class="section-title">ตอนที่ 1: ข้อมูลของผู้รับการประเมิน</div>
    <table class="info-table">
      <tr>
        <td class="label">ชื่อ-นามสกุล:</td>
        <td class="val">${result.evaluatee.name}</td>
        <td class="label">ตำแหน่ง:</td>
        <td class="val" style="color: #1e40af;">${result.evaluatee.position}</td>
      </tr>
      <tr>
        <td class="label">ฝ่าย/กลุ่มงาน:</td>
        <td class="val">${result.evaluatee.department}</td>
        <td class="label">ชุดคณะกรรมการ:</td>
        <td class="val">${result.groupName}</td>
      </tr>
      <tr>
        <td class="label">แบบฟอร์มที่ประเมิน:</td>
        <td class="val" colspan="3">${result.formTitle}</td>
      </tr>
    </table>

    <div class="section-title">ตอนที่ 2: สรุปผลคะแนนรวมเฉลี่ยและการตัดสินผล (Mean Scoring)</div>
    <div class="score-summary-grid">
      <div class="score-box">
        <div class="score-box-label">คะแนนเฉลี่ยรวม</div>
        <div class="score-box-val">${result.meanScore.toFixed(2)} <span style="font-size: 11pt; color: #94a3b8; font-weight: normal;">/ ${result.maxScore}</span></div>
      </div>
      <div class="score-box">
        <div class="score-box-label">คิดเป็นร้อยละเฉลี่ย</div>
        <div class="score-box-val" style="color: #1e40af;">${result.meanPercentage.toFixed(2)}%</div>
      </div>
      <div class="score-box">
        <div class="score-box-label">ระดับผลการประเมิน</div>
        <div style="margin-top: 6px;"><span class="score-box-badge">${result.finalGrade}</span></div>
      </div>
    </div>

    <div class="threshold-list">
      <strong>เกณฑ์การตัดระดับผลการประเมิน:</strong>
      <div class="threshold-grid">
        ${activeThresholds
          .map((t) => `<div>&bull; ${t.level} (${t.minScore.toFixed(2)} - ${t.maxScore.toFixed(2)}%)</div>`)
          .join('')}
      </div>
    </div>

    <div class="section-title">ตอนที่ 3: คะแนนและข้อคิดเห็นจากคณะกรรมการรายบุคคล (${result.submissions.length} ท่าน)</div>
    ${committeeRowsHtml}

    <div class="section-title">ตอนที่ 4: การลงนามรับรองผลของคณะกรรมการประเมิน</div>
    <div class="signatures-grid">
      ${signaturesHtml}
    </div>

    <div class="approval-section">
      <div class="approval-box">
        <div style="font-weight: 700; margin-bottom: 8px;">ผู้รับการประเมินรับทราบผล</div>
        <div class="approval-space"></div>
        <div style="font-weight: 600;">(${result.evaluatee.name})</div>
        <div style="font-size: 10pt; color: #64748b;">วันที่ ........ เดือน .................... พ.ศ. ........</div>
      </div>

      <div class="approval-box">
        <div style="font-weight: 700; margin-bottom: 8px;">ผู้อำนวยการสถานศึกษา / ผู้มีอำนาจสั่งจ้าง</div>
        <div class="approval-space"></div>
        <div style="font-weight: 600;">(นายปรัชญา สมณะช้างเผือก)</div>
        <div style="font-size: 10.5pt; color: #475569;">ผู้อำนวยการโรงเรียนศึกษาพิเศษชัยนาท</div>
        <div style="font-size: 10pt; color: #64748b;">วันที่ ........ เดือน .................... พ.ศ. ........</div>
      </div>
    </div>

    <div class="page-footer">
      เอกสารนี้พิมพ์จากระบบประเมินผลการปฏิบัติงานบุคลากรออนไลน์ (PES) โรงเรียนศึกษาพิเศษชัยนาท เมื่อวันที่ ${new Date().toLocaleDateString('th-TH', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
      })}
    </div>
  </div>
</body>
</html>`;
}

/**
 * Downloads a crisp, distortion-free PDF for an individual evaluatee.
 * Uses html2pdf with high-resolution canvas settings and pre-loaded Sarabun font.
 */
export async function downloadIndividualPdf(
  result: AggregatedResult,
  systemSettings: SystemSettings,
  thresholds?: GradeThreshold[],
  customElement?: HTMLElement
): Promise<void> {
  // Ensure all fonts including Sarabun are fully loaded before rendering
  if (document.fonts && document.fonts.ready) {
    await document.fonts.ready;
  }

  const filename = `แบบรายงานผลการประเมิน_${result.evaluatee.name.replace(/\s+/g, '_')}.pdf`;

  let containerToExport: HTMLElement;
  let createdTempContainer = false;

  if (customElement) {
    containerToExport = customElement;
  } else {
    // Render the dedicated official HTML into an isolated offscreen container
    const htmlString = generateOfficialReportHtml(result, systemSettings, thresholds);
    const tempDiv = document.createElement('div');
    tempDiv.style.position = 'fixed';
    tempDiv.style.left = '-99999px';
    tempDiv.style.top = '0';
    tempDiv.style.width = '210mm'; // Standard A4 width
    tempDiv.style.backgroundColor = '#ffffff';
    tempDiv.style.padding = '15mm';
    tempDiv.style.boxSizing = 'border-box';
    tempDiv.innerHTML = htmlString;
    document.body.appendChild(tempDiv);
    containerToExport = tempDiv;
    createdTempContainer = true;
  }

  const opt = {
    margin: [8, 8, 8, 8] as [number, number, number, number],
    filename: filename,
    image: { type: 'jpeg' as const, quality: 0.98 },
    html2canvas: {
      scale: 2, // 300 DPI equivalent for sharp, legible text and zero font distortion
      useCORS: true,
      letterRendering: true,
      logging: false,
      scrollY: 0,
      scrollX: 0,
      windowWidth: 1024,
    },
    jsPDF: {
      unit: 'mm',
      format: 'a4',
      orientation: 'portrait' as const,
    },
    pagebreak: {
      mode: ['avoid-all', 'css', 'legacy'],
      avoid: ['.committee-card', '.sig-box', '.approval-section', '.score-summary-grid'],
    },
  };

  try {
    await html2pdf().set(opt).from(containerToExport).save();
  } finally {
    if (createdTempContainer && containerToExport.parentNode) {
      containerToExport.parentNode.removeChild(containerToExport);
    }
  }
}

/**
 * Triggers the browser's high-fidelity native print-to-PDF engine
 * via an isolated hidden iframe with Sarabun font and exact A4 layout.
 */
export function printIndividualReport(
  result: AggregatedResult,
  systemSettings: SystemSettings,
  thresholds?: GradeThreshold[]
): void {
  const htmlContent = generateOfficialReportHtml(result, systemSettings, thresholds);

  // Use hidden iframe to isolate the print document from modal UI and page styles
  const iframe = document.createElement('iframe');
  iframe.style.position = 'fixed';
  iframe.style.right = '0';
  iframe.style.bottom = '0';
  iframe.style.width = '0';
  iframe.style.height = '0';
  iframe.style.border = '0';

  document.body.appendChild(iframe);

  const doc = iframe.contentWindow?.document;
  if (!doc) {
    window.print();
    return;
  }

  doc.open();
  doc.write(htmlContent);
  doc.close();

  iframe.onload = () => {
    setTimeout(() => {
      try {
        iframe.contentWindow?.focus();
        iframe.contentWindow?.print();
      } catch (err) {
        console.error('Print iframe error:', err);
        window.print();
      } finally {
        setTimeout(() => {
          if (iframe.parentNode) {
            iframe.parentNode.removeChild(iframe);
          }
        }, 3000);
      }
    }, 500);
  };
}
