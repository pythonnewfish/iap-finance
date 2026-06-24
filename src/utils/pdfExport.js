/**
 * PDF 报告导出工具
 * 单页长图方案，不分页
 */
import html2canvas from 'html2canvas'
import { jsPDF } from 'jspdf'

/**
 * 导出 Dashboard 为 PDF 报告（单页）
 * @param {HTMLElement} element - 要导出的 DOM 元素
 * @param {string} fileName - 文件名（不含扩展名）
 * @param {Function} onProgress - 进度回调 (0-100)
 */
export async function exportToPDF(element, fileName = 'IAP游戏买量分析报告', onProgress) {
  if (!element) throw new Error('未找到导出元素')

  const updateProgress = (p) => onProgress?.(Math.min(100, Math.max(0, p)))
  
  try {
    updateProgress(5)
    
    const scrollHeight = element.scrollHeight
    const clientWidth = element.clientWidth
    
    updateProgress(10)
    
    // 截图整个内容区域
    const canvas = await html2canvas(element, {
      scale: 2,
      useCORS: true,
      allowTaint: true,
      backgroundColor: '#f9fafb',
      width: clientWidth,
      height: scrollHeight,
      scrollX: 0,
      scrollY: -window.scrollY,
      logging: false,
      imageTimeout: 15000,
      onclone: (clonedDoc) => {
        const clonedElement = clonedDoc.querySelector('[data-pdf-content]')
        if (clonedElement) {
          clonedElement.querySelectorAll('[data-no-print], .no-print').forEach(el => {
            el.style.display = 'none'
          })
        }
      }
    })
    
    updateProgress(60)
    
    // 创建自定义尺寸的 PDF（单页，尺寸匹配内容）
    const imgWidth = canvas.width / 2   // 还原 scale:2
    const imgHeight = canvas.height / 2
    // 转为 mm（按 96dpi: 1px ≈ 0.2646mm）
    const pxToMm = 0.2646
    const pdfWidth = imgWidth * pxToMm
    const pdfHeight = imgHeight * pxToMm
    
    const pdf = new jsPDF({
      orientation: pdfWidth > pdfHeight ? 'landscape' : 'portrait',
      unit: 'mm',
      format: [pdfWidth, pdfHeight]  // 自定义尺寸，匹配内容
    })
    
    updateProgress(80)
    
    // 整张图铺满一页
    const imgData = canvas.toDataURL('image/jpeg', 0.95)
    pdf.addImage(imgData, 'JPEG', 0, 0, pdfWidth, pdfHeight)
    
    updateProgress(95)
    
    // 下载
    const dateStr = new Date().toISOString().split('T')[0]
    pdf.save(`${fileName}_${dateStr}.pdf`)
    
    updateProgress(100)
    
  } catch (error) {
    console.error('PDF导出失败:', error)
    throw error
  }
}
