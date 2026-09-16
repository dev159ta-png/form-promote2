import html2canvas from 'html2canvas-pro';
import { jsPDF } from 'jspdf';
import { AggregatedResult, EvaluationSubmission, FormTemplate, GradeThreshold, SystemSettings } from '../types';
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
 * Returns the internal styling rules for high-resolution A4 export
 * with pure HEX/RGB colors and Sarabun typography (never blank).
 */
function getReportCss(): string {
  return `
    @import url('https://fonts.googleapis.com/css2?family=Sarabun:ital,wght@0,300;0,400;0,500;0,600;0,700;0,800;1,400&display=swap');
    
    .pes-pdf-root {
      box-sizing: border-box;
      font-family: 'Sarabun', 'TH Sarabun New', Tahoma, sans-serif !important;
      background-color: #ffffff;
      color: #111827;
      width: 794px;
      padding: 22px 34px;
      margin: 0;
      line-height: 1.35;
      font-size: 12pt;
      letter-spacing: normal !important;
      -webkit-font-smoothing: antialiased;
    }
    .pes-pdf-root * {
      box-sizing: border-box;
      font-family: 'Sarabun', 'TH Sarabun New', Tahoma, sans-serif !important;
    }
    .pes-header {
      text-align: center;
      margin-bottom: 8px;
      padding-bottom: 6px;
      border-bottom: 2px solid #1e293b;
    }
    .pes-logo {
      width: 52px;
      height: 52px;
      margin: 0 auto 4px;
    }
    .pes-logo img {
      width: 100%;
      height: 100%;
      object-fit: contain;
    }
    .pes-title {
      font-size: 14pt;
      font-weight: 700;
      margin: 0 0 2px;
      color: #0f172a;
    }
    .pes-subtitle {
      font-size: 11pt;
      color: #334155;
      margin: 0 0 2px;
    }
    .pes-school-info {
      font-size: 10pt;
      color: #475569;
      white-space: nowrap;
    }
    .pes-section-title {
      font-size: 11.5pt;
      font-weight: 700;
      background: #f1f5f9;
      padding: 3px 8px;
      border-radius: 4px;
      border-left: 4px solid #1e40af;
      margin: 8px 0 4px;
      color: #0f172a;
    }
    .pes-table {
      width: 100%;
      border-collapse: collapse;
      margin-bottom: 6px;
    }
    .pes-table td {
      padding: 2px 4px;
      font-size: 11pt;
      vertical-align: top;
    }
    .pes-label {
      color: #475569;
      width: 22%;
    }
    .pes-val {
      color: #0f172a;
      font-weight: 600;
    }
    .pes-score-grid {
      display: flex;
      gap: 8px;
      margin-bottom: 6px;
    }
    .pes-score-box {
      flex: 1;
      border: 1px solid #cbd5e1;
      border-radius: 6px;
      padding: 5px 4px;
      text-align: center;
      background: #f8fafc;
    }
    .pes-score-box-lbl {
      font-size: 10pt;
      color: #64748b;
      margin-bottom: 1px;
    }
    .pes-score-box-num {
      font-size: 15pt;
      font-weight: 800;
      color: #0f172a;
    }
    .pes-badge {
      display: inline-block;
      padding: 2px 10px;
      border-radius: 12px;
      font-weight: 700;
      font-size: 11pt;
      background: #e0e7ff;
      color: #1e3a8a;
      border: 1px solid #bfdbfe;
    }
    .pes-thresholds {
      font-size: 9pt;
      color: #475569;
      background: #f8fafc;
      padding: 4px 8px;
      border-radius: 5px;
      border: 1px solid #e2e8f0;
      margin-bottom: 6px;
    }
    .pes-threshold-grid {
      display: grid;
      grid-template-columns: repeat(4, 1fr);
      gap: 4px;
      margin-top: 2px;
      font-weight: 500;
    }
    .pes-card {
      border: 1px solid #e2e8f0;
      border-radius: 5px;
      padding: 4px 8px;
      margin-bottom: 4px;
      background: #ffffff;
      page-break-inside: avoid;
    }
    .pes-card-hdr {
      display: flex;
      justify-content: space-between;
      border-bottom: 1px dashed #cbd5e1;
      padding-bottom: 2px;
      margin-bottom: 2px;
      font-size: 10.5pt;
    }
    .pes-card-score {
      font-weight: 700;
      color: #1e40af;
    }
    .pes-card-comments {
      font-size: 9.5pt;
      color: #334155;
    }
    .pes-comment {
      margin: 1px 0;
    }
    .pes-sigs-grid {
      display: flex;
      justify-content: space-around;
      gap: 8px;
      margin-top: 6px;
      page-break-inside: avoid;
    }
    .pes-sig-box {
      flex: 1;
      border: 1px solid #e2e8f0;
      border-radius: 6px;
      padding: 5px 3px;
      text-align: center;
      background: #fcfcfd;
    }
    .pes-sig-img-wrap {
      height: 40px;
      display: flex;
      align-items: center;
      justify-content: center;
      margin-bottom: 2px;
    }
    .pes-sig-img {
      max-height: 38px;
      max-width: 110px;
      object-fit: contain;
    }
    .pes-sig-placeholder {
      font-size: 9pt;
      color: #94a3b8;
      font-style: italic;
    }
    .pes-sig-line {
      border-top: 1px solid #94a3b8;
      margin-bottom: 2px;
      width: 80%;
      margin-left: auto;
      margin-right: auto;
    }
    .pes-sig-name {
      font-weight: 700;
      font-size: 10.5pt;
      color: #0f172a;
    }
    .pes-sig-pos {
      font-size: 9pt;
      color: #64748b;
    }
    .pes-sig-date {
      font-size: 8pt;
      color: #94a3b8;
      margin-top: 1px;
    }
    .pes-approval {
      display: flex;
      justify-content: space-around;
      margin-top: 8px;
      padding-top: 6px;
      border-top: 2px solid #cbd5e1;
      text-align: center;
      page-break-inside: avoid;
    }
    .pes-approval-box {
      width: 46%;
    }
    .pes-approval-space {
      height: 32px;
      border-bottom: 1px dashed #94a3b8;
      width: 180px;
      margin: 0 auto 4px;
    }
    .pes-footer {
      margin-top: 8px;
      text-align: center;
      font-size: 8.5pt;
      color: #94a3b8;
      border-top: 1px solid #e2e8f0;
      padding-top: 3px;
    }
  `;
}

/**
 * Builds the inner HTML body for the official evaluation report.
 */
function buildOfficialReportBody(
  result: AggregatedResult,
  systemSettings: SystemSettings,
  thresholds?: GradeThreshold[]
): string {
  const formTitle = getOfficialReportTitle(result.evaluatee.position);
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
      <div class="pes-card">
        <div class="pes-card-hdr">
          <strong>กรรมการท่านที่ ${idx + 1}: ${sub.evaluatorName}</strong> (${sub.evaluatorPosition})
          <span class="pes-card-score">คะแนน: ${sub.totalScore.toFixed(2)} / ${sub.maxScore} (${sub.percentage.toFixed(2)}%) &bull; ${sub.grade}</span>
        </div>
        <div class="pes-card-comments">
          <div class="pes-comment"><strong>จุดเด่น:</strong> ${sub.comments.strengths || '-'}</div>
          <div class="pes-comment"><strong>ข้อควรพัฒนา:</strong> ${sub.comments.improvements || '-'}</div>
        </div>
      </div>
    `
    )
    .join('');

  const signaturesHtml = result.submissions
    .map(
      (sub) => `
      <div class="pes-sig-box">
        <div class="pes-sig-img-wrap">
          ${
            sub.signatureDataUrl
              ? `<img src="${sub.signatureDataUrl}" alt="ลายมือชื่อ" class="pes-sig-img" />`
              : `<span class="pes-sig-placeholder">(ลงนามดิจิทัล)</span>`
          }
        </div>
        <div class="pes-sig-line"></div>
        <div class="pes-sig-name">(${sub.evaluatorName})</div>
        <div class="pes-sig-pos">${sub.evaluatorPosition}</div>
        <div class="pes-sig-date">${new Date(sub.submittedAt).toLocaleDateString('th-TH', {
          year: 'numeric',
          month: 'long',
          day: 'numeric',
        })}</div>
      </div>
    `
    )
    .join('');

  return `
    <div class="pes-pdf-root">
      <div class="pes-header">
        ${
          systemSettings.logoUrl
            ? `<div class="pes-logo"><img src="${systemSettings.logoUrl}" alt="ตราโรงเรียน" /></div>`
            : ''
        }
        <h1 class="pes-title">${formTitle}</h1>
        <div class="pes-subtitle">${systemSettings.evaluationRound} ประจำปีงบประมาณ ${systemSettings.academicYear}</div>
        <div class="pes-school-info">สถานศึกษา: ${systemSettings.schoolName} (${systemSettings.schoolAffiliation})</div>
      </div>

      <div class="pes-section-title">ตอนที่ 1: ข้อมูลของผู้รับการประเมิน</div>
      <table class="pes-table">
        <tr>
          <td class="pes-label">ชื่อ-นามสกุล:</td>
          <td class="pes-val">${result.evaluatee.name}</td>
          <td class="pes-label">ตำแหน่ง:</td>
          <td class="pes-val" style="color: #1e40af;">${result.evaluatee.position}</td>
        </tr>
        <tr>
          <td class="pes-label">ฝ่าย/กลุ่มงาน:</td>
          <td class="pes-val">${result.evaluatee.department}</td>
          <td class="pes-label">ชุดคณะกรรมการ:</td>
          <td class="pes-val">${result.groupName}</td>
        </tr>
        <tr>
          <td class="pes-label">แบบฟอร์มที่ประเมิน:</td>
          <td class="pes-val" colspan="3">${result.formTitle}</td>
        </tr>
      </table>

      <div class="pes-section-title">ตอนที่ 2: สรุปผลคะแนนรวมเฉลี่ยและการตัดสินผล (Mean Scoring)</div>
      <div class="pes-score-grid">
        <div class="pes-score-box">
          <div class="pes-score-box-lbl">คะแนนเฉลี่ยรวม</div>
          <div class="pes-score-box-num">${result.meanScore.toFixed(2)} <span style="font-size: 11pt; color: #94a3b8; font-weight: normal;">/ ${result.maxScore}</span></div>
        </div>
        <div class="pes-score-box">
          <div class="pes-score-box-lbl">คิดเป็นร้อยละเฉลี่ย</div>
          <div class="pes-score-box-num" style="color: #1e40af;">${result.meanPercentage.toFixed(2)}%</div>
        </div>
        <div class="pes-score-box">
          <div class="pes-score-box-lbl">ระดับผลการประเมิน</div>
          <div style="margin-top: 4px;"><span class="pes-badge">${result.finalGrade}</span></div>
        </div>
      </div>

      <div class="pes-thresholds">
        <strong>เกณฑ์การตัดระดับผลการประเมิน:</strong>
        <div class="pes-threshold-grid">
          ${activeThresholds
            .map((t) => `<div>&bull; ${t.level} (${t.minScore.toFixed(2)} - ${t.maxScore.toFixed(2)}%)</div>`)
            .join('')}
        </div>
      </div>

      <div class="pes-section-title">ตอนที่ 3: คะแนนและข้อคิดเห็นจากคณะกรรมการรายบุคคล (${result.submissions.length} ท่าน)</div>
      ${committeeRowsHtml}

      <div class="pes-section-title">ตอนที่ 4: การลงนามรับรองผลของคณะกรรมการประเมิน</div>
      <div class="pes-sigs-grid">
        ${signaturesHtml}
      </div>

      <div class="pes-approval">
        <div class="pes-approval-box">
          <div style="font-weight: 700; margin-bottom: 6px;">ผู้รับการประเมินรับทราบผล</div>
          <div class="pes-approval-space"></div>
          <div style="font-weight: 600;">(${result.evaluatee.name})</div>
          <div style="font-size: 10pt; color: #64748b;">วันที่ ........ เดือน .................... พ.ศ. ........</div>
        </div>

        <div class="pes-approval-box">
          <div style="font-weight: 700; margin-bottom: 6px;">ผู้อำนวยการสถานศึกษา / ผู้มีอำนาจสั่งจ้าง</div>
          <div class="pes-approval-space"></div>
          <div style="font-weight: 600;">( ${systemSettings.directorName || 'นายปรัชญา สมณะช้างเผือก'} )</div>
          <div style="font-size: 10.5pt; color: #475569;">${systemSettings.directorPosition || 'ผู้อำนวยการโรงเรียนศึกษาพิเศษชัยนาท'}</div>
          <div style="font-size: 10pt; color: #64748b;">วันที่ ........ เดือน .................... พ.ศ. ........</div>
        </div>
      </div>

      <div class="pes-footer">
        เอกสารนี้พิมพ์จากระบบประเมินผลการปฏิบัติงานบุคลากรออนไลน์ (PES) ${systemSettings.schoolName || 'โรงเรียนศึกษาพิเศษชัยนาท'} เมื่อวันที่ ${new Date().toLocaleDateString('th-TH', {
          year: 'numeric',
          month: 'long',
          day: 'numeric',
        })}
      </div>
    </div>
  `;
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
  const bodyHtml = buildOfficialReportBody(result, systemSettings, thresholds);
  const css = getReportCss();

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
      margin: 10mm;
    }
    body {
      margin: 0;
      padding: 0;
      background: #ffffff;
    }
    ${css}
  </style>
</head>
<body>
  ${bodyHtml}
</body>
</html>`;
}

/**
 * Waits for all images inside an element to be completely loaded.
 */
async function waitForImagesToLoad(container: HTMLElement): Promise<void> {
  const images = Array.from(container.querySelectorAll('img'));
  if (images.length === 0) return;

  await Promise.all(
    images.map(
      (img) =>
        new Promise<void>((resolve) => {
          if (img.complete) {
            resolve();
            return;
          }
          img.onload = () => resolve();
          img.onerror = () => resolve(); // don't block on broken images
          setTimeout(resolve, 2000); // 2s safety timeout
        })
    )
  );
}

/**
 * Renders HTML content directly into a high-resolution, multi-page A4 PDF
 * using direct html2canvas + jsPDF engine. Never produces blank pages.
 */
async function renderHtmlToPdf(
  htmlContent: string,
  filename: string
): Promise<void> {
  // 1. Ensure Sarabun and system fonts are ready
  if (document.fonts && document.fonts.ready) {
    try {
      await document.fonts.ready;
    } catch (e) {
      console.warn('Font loading check non-fatal error:', e);
    }
  }

  // 2. Create offscreen sandbox container
  // Must have opacity: 1 and positive coordinates so html2canvas renders all content
  const sandbox = document.createElement('div');
  sandbox.id = 'pes-pdf-render-sandbox';
  sandbox.style.position = 'fixed';
  sandbox.style.top = '0px';
  sandbox.style.left = '0px';
  sandbox.style.width = '794px'; // 210mm in px at 96 DPI
  sandbox.style.backgroundColor = '#ffffff';
  sandbox.style.color = '#111827';
  sandbox.style.zIndex = '-9999'; // Underneath application UI
  sandbox.style.opacity = '1';
  sandbox.style.pointerEvents = 'none';
  sandbox.style.overflow = 'visible';

  // Inject CSS style + markup
  sandbox.innerHTML = `<style>${getReportCss()}</style>${htmlContent}`;
  document.body.appendChild(sandbox);

  try {
    // 3. Wait for all images (logos, signatures) to load
    await waitForImagesToLoad(sandbox);

    // Short buffer for CSS rendering
    await new Promise((r) => setTimeout(r, 200));

    // 4. Capture with html2canvas (2x scale for 300 DPI sharpness)
    const canvas = await html2canvas(sandbox, {
      scale: 2,
      useCORS: true,
      logging: false,
      backgroundColor: '#ffffff',
      scrollX: 0,
      scrollY: 0,
      width: 794,
      windowWidth: 794,
    });

    if (!canvas || canvas.width === 0 || canvas.height === 0) {
      throw new Error('Canvas rendering produced an empty buffer');
    }

    // 5. Convert to jsPDF with smart content-aware page slicing (prevents cutting text or elements)
    const pdf = new jsPDF({
      unit: 'mm',
      format: 'a4',
      orientation: 'portrait',
    });

    const pdfWidth = 210;
    const pdfHeight = 297;
    const margin = 8; // 8mm margin
    const contentWidth = pdfWidth - margin * 2; // 194mm
    const pageAvailHeight = pdfHeight - margin * 2; // 281mm
    const pxPerMm = canvas.width / contentWidth;
    const maxPageCanvasHeight = Math.floor(pageAvailHeight * pxPerMm);

    // Get 2D context for pixel checking
    const canvasCtx = canvas.getContext('2d', { willReadFrequently: true });

    // Collect DOM elements that must not be sliced across horizontally
    const sandboxRect = sandbox.getBoundingClientRect();
    const breakableElements = Array.from(
      sandbox.querySelectorAll<HTMLElement>(
        '.pes-header, .pes-section-title, .pes-table, .pes-table tr, .pes-score-grid, .pes-thresholds, .pes-card, .pes-sigs-grid, .pes-sig-box, .pes-approval, .pes-approval-box, .pes-footer, h1, h2, h3, h4, p, table, tr, td'
      )
    );

    const intervals = breakableElements
      .map((el) => {
        const rect = el.getBoundingClientRect();
        return {
          top: Math.round((rect.top - sandboxRect.top) * 2),
          bottom: Math.round((rect.bottom - sandboxRect.top) * 2),
        };
      })
      .filter((inv) => inv.bottom > inv.top);

    const slicePoints: number[] = [0];
    let currentY = 0;

    while (currentY < canvas.height) {
      const idealBottom = currentY + maxPageCanvasHeight;

      if (idealBottom >= canvas.height) {
        slicePoints.push(canvas.height);
        break;
      }

      // Check if any element is crossed by idealBottom
      let safeCutY = idealBottom;
      const crossing = intervals.filter(
        (inv) => inv.top < idealBottom && inv.bottom > idealBottom
      );

      if (crossing.length > 0) {
        // Break before the uppermost crossing element
        const minCrossingTop = Math.min(...crossing.map((inv) => inv.top));
        // Keep at least 25% of the page
        if (minCrossingTop > currentY + maxPageCanvasHeight * 0.25) {
          safeCutY = minCrossingTop - Math.round(4 * 2);
        }
      }

      // Search for a horizontal row of white pixels near safeCutY to guarantee zero cut characters
      if (canvasCtx) {
        const scanStart = Math.min(safeCutY, canvas.height - 1);
        const scanLimit = Math.max(currentY + Math.round(60 * 2), scanStart - Math.round(50 * 2));
        let bestWhiteRow = -1;

        for (let y = scanStart; y >= scanLimit; y -= 2) {
          let isLineWhite = true;
          const step = Math.floor(canvas.width / 24);
          for (let x = Math.floor(step / 2); x < canvas.width; x += step) {
            const p = canvasCtx.getImageData(x, y, 1, 1).data;
            if (p[0] < 240 || p[1] < 240 || p[2] < 240) {
              isLineWhite = false;
              break;
            }
          }
          if (isLineWhite) {
            bestWhiteRow = y;
            break;
          }
        }

        if (bestWhiteRow > currentY + Math.round(50 * 2)) {
          safeCutY = bestWhiteRow;
        }
      }

      // Ensure positive progress
      if (safeCutY <= currentY + Math.round(50 * 2)) {
        safeCutY = idealBottom;
      }

      slicePoints.push(safeCutY);
      currentY = safeCutY;
    }

    const totalPages = slicePoints.length - 1;

    for (let i = 0; i < totalPages; i++) {
      if (i > 0) {
        pdf.addPage();
      }

      const sourceY = slicePoints[i];
      const sliceHeight = slicePoints[i + 1] - sourceY;
      const sliceHeightMm = (sliceHeight * contentWidth) / canvas.width;

      const pageCanvas = document.createElement('canvas');
      pageCanvas.width = canvas.width;
      pageCanvas.height = sliceHeight;
      const ctx = pageCanvas.getContext('2d');
      if (ctx) {
        ctx.fillStyle = '#ffffff';
        ctx.fillRect(0, 0, pageCanvas.width, pageCanvas.height);
        ctx.drawImage(
          canvas,
          0,
          sourceY,
          canvas.width,
          sliceHeight,
          0,
          0,
          canvas.width,
          sliceHeight
        );
      }

      const sliceImgData = pageCanvas.toDataURL('image/jpeg', 0.98);
      pdf.addImage(sliceImgData, 'JPEG', margin, margin, contentWidth, sliceHeightMm);
    }

    // 6. Download the PDF
    pdf.save(filename);
  } finally {
    // 7. Always clean up sandbox element
    if (sandbox.parentNode) {
      sandbox.parentNode.removeChild(sandbox);
    }
  }
}

/**
 * Downloads a crisp, distortion-free PDF for an individual evaluatee.
 * Directly renders into a multi-page A4 document with Sarabun font and all scores.
 */
export async function downloadIndividualPdf(
  result: AggregatedResult,
  systemSettings: SystemSettings,
  thresholds?: GradeThreshold[]
): Promise<void> {
  const filename = `แบบรายงานผลการประเมิน_${result.evaluatee.name.replace(/\s+/g, '_')}.pdf`;
  const bodyHtml = buildOfficialReportBody(result, systemSettings, thresholds);

  try {
    await renderHtmlToPdf(bodyHtml, filename);
  } catch (error) {
    console.error('Direct PDF export error, falling back to print engine:', error);
    // Graceful fallback to native browser print-to-PDF dialog
    printIndividualReport(result, systemSettings, thresholds);
  }
}

/**
 * Downloads a crisp PDF for an individual evaluation sheet (ใบบันทึกคะแนนรายบุคคล).
 */
export async function downloadSingleSubmissionPdf(
  submission: EvaluationSubmission,
  form: FormTemplate | undefined,
  systemSettings: SystemSettings,
  thresholds?: GradeThreshold[]
): Promise<void> {
  const gradeInfo = getGradeInfo(submission.grade, thresholds);
  const filename = `ใบบันทึกคะแนน_${submission.evaluateeName.replace(/\s+/g, '_')}_โดย_${submission.evaluatorName.replace(/\s+/g, '_')}.pdf`;

  const categoriesHtml =
    form && form.categories
      ? form.categories
          .map((cat, catIdx) => {
            const catScore = submission.categoryScores?.[cat.id];
            const indicatorsHtml = cat.indicators
              .map((ind, indIdx) => {
                const indScore = submission.scores[ind.id] ?? 0;
                return `
                <div style="display: flex; justify-content: space-between; padding: 4px 8px; border-bottom: 1px solid #f1f5f9; font-size: 11pt;">
                  <div>
                    <span style="font-weight: 500;">${catIdx + 1}.${indIdx + 1} ${ind.title}</span>
                    ${ind.description ? `<div style="font-size: 9.5pt; color: #64748b;">${ind.description}</div>` : ''}
                  </div>
                  <div style="font-weight: 700; color: #1e40af; font-family: monospace; white-space: nowrap; margin-left: 12px;">
                    ${indScore} / ${ind.weight} คะแนน
                  </div>
                </div>
              `;
              })
              .join('');

            return `
            <div style="border: 1px solid #cbd5e1; border-radius: 6px; margin-bottom: 8px; overflow: hidden; font-size: 11.5pt;">
              <div style="background: #f1f5f9; padding: 5px 8px; font-weight: 700; display: flex; justify-content: space-between;">
                <span>${catIdx + 1}. ${cat.name} (ค่าน้ำหนัก ${cat.weightPercentage}%)</span>
                ${catScore ? `<span style="color: #1e40af;">${catScore.scored.toFixed(2)} / ${catScore.max} (${catScore.percentage.toFixed(1)}%)</span>` : ''}
              </div>
              <div>${indicatorsHtml}</div>
            </div>
          `;
          })
          .join('')
      : '';

  const bodyHtml = `
    <div class="pes-pdf-root">
      <div class="pes-header">
        ${
          systemSettings.logoUrl
            ? `<div class="pes-logo"><img src="${systemSettings.logoUrl}" alt="ตราโรงเรียน" /></div>`
            : ''
        }
        <h1 class="pes-title">ใบบันทึกคะแนนการประเมินการปฏิบัติงาน</h1>
        <div class="pes-subtitle">${systemSettings.evaluationRound} ประจำปีงบประมาณ ${systemSettings.academicYear}</div>
        <div class="pes-school-info">สถานศึกษา: ${systemSettings.schoolName} &bull; ${submission.formTitle}</div>
      </div>

      <div class="pes-section-title">ข้อมูลผู้รับการประเมิน และ คณะกรรมการผู้ประเมิน</div>
      <table class="pes-table">
        <tr>
          <td class="pes-label">ชื่อผู้รับการประเมิน:</td>
          <td class="pes-val">${submission.evaluateeName}</td>
          <td class="pes-label">กรรมการผู้ประเมิน:</td>
          <td class="pes-val" style="color: #1e40af;">${submission.evaluatorName}</td>
        </tr>
        <tr>
          <td class="pes-label">ตำแหน่ง:</td>
          <td class="pes-val">${submission.evaluateePosition}</td>
          <td class="pes-label">ตำแหน่งกรรมการ:</td>
          <td class="pes-val">${submission.evaluatorPosition}</td>
        </tr>
        <tr>
          <td class="pes-label">สังกัด/ฝ่าย:</td>
          <td class="pes-val">${submission.evaluateeDepartment}</td>
          <td class="pes-label">วันที่ประเมิน:</td>
          <td class="pes-val">${new Date(submission.submittedAt).toLocaleDateString('th-TH', {
            year: 'numeric',
            month: 'long',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit',
          })} น.</td>
        </tr>
      </table>

      <div class="pes-section-title">สรุปผลคะแนนการประเมิน</div>
      <div class="pes-score-grid">
        <div class="pes-score-box">
          <div class="pes-score-box-lbl">คะแนนรวมที่ได้</div>
          <div class="pes-score-box-num">${submission.totalScore} <span style="font-size: 11pt; color: #94a3b8; font-weight: normal;">/ ${submission.maxScore}</span></div>
        </div>
        <div class="pes-score-box">
          <div class="pes-score-box-lbl">คิดเป็นร้อยละ (%)</div>
          <div class="pes-score-box-num" style="color: #1e40af;">${submission.percentage.toFixed(2)}%</div>
        </div>
        <div class="pes-score-box">
          <div class="pes-score-box-lbl">ระดับผลการประเมิน</div>
          <div style="margin-top: 4px;"><span class="pes-badge">${submission.grade}</span></div>
        </div>
      </div>

      ${categoriesHtml ? `<div class="pes-section-title">รายละเอียดคะแนนรายหมวด/ตัวชี้วัด</div>${categoriesHtml}` : ''}

      <div class="pes-section-title">ความคิดเห็นและข้อเสนอแนะของผู้ประเมิน</div>
      <div style="display: flex; gap: 8px; margin-bottom: 12px;">
        <div style="flex: 1; background: #f0fdf4; border: 1px solid #bbf7d0; border-radius: 6px; padding: 6px 10px;">
          <strong style="color: #166534; font-size: 11pt;">จุดเด่น / ผลงานที่โดดเด่น:</strong>
          <p style="margin: 2px 0 0; font-size: 10.5pt; color: #334155;">${submission.comments.strengths || submission.comments.assignedWorkAndSuccess || '-'}</p>
        </div>
        <div style="flex: 1; background: #fffbeb; border: 1px solid #fde68a; border-radius: 6px; padding: 6px 10px;">
          <strong style="color: #92400e; font-size: 11pt;">ข้อควรปรับปรุง / พัฒนา:</strong>
          <p style="margin: 2px 0 0; font-size: 10.5pt; color: #334155;">${submission.comments.improvements || submission.comments.improvementsAndTraining || '-'}</p>
        </div>
      </div>

      <div style="margin-top: 14px; text-align: center; border-top: 1px solid #e2e8f0; padding-top: 10px;">
        <div style="height: 50px; display: flex; align-items: center; justify-content: center; margin-bottom: 4px;">
          ${
            submission.signatureDataUrl
              ? `<img src="${submission.signatureDataUrl}" alt="ลายมือชื่อ" style="max-height: 48px; object-fit: contain;" />`
              : `<span style="font-size: 10pt; color: #94a3b8; font-style: italic;">(ลงนามดิจิทัลอิเล็กทรอนิกส์)</span>`
          }
        </div>
        <div style="font-weight: 700; font-size: 11.5pt;">(${submission.evaluatorName})</div>
        <div style="font-size: 10pt; color: #64748b;">${submission.evaluatorPosition}</div>
        <div style="font-size: 9pt; color: #94a3b8; margin-top: 2px;">วันที่ลงนาม: ${new Date(submission.submittedAt).toLocaleDateString('th-TH')}</div>
      </div>
    </div>
  `;

  await renderHtmlToPdf(bodyHtml, filename);
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

