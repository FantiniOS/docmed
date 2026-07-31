"use client";

import jsPDF from "jspdf";
import { toPng } from "html-to-image";

// =============================================
// CONSTANTES DE LAYOUT
// =============================================
const PAGE_WIDTH = 210;
const PAGE_HEIGHT = 297;
const MARGIN_LEFT = 15;
const MARGIN_RIGHT = 15;
const MARGIN_TOP = 20;
const MARGIN_BOTTOM = 20;
const CONTENT_WIDTH = PAGE_WIDTH - MARGIN_LEFT - MARGIN_RIGHT;
const USABLE_HEIGHT = PAGE_HEIGHT - MARGIN_TOP - MARGIN_BOTTOM;

// Cores
const COLOR_PRIMARY = [16, 185, 129] as const;     // Emerald-500
const COLOR_DARK = [30, 41, 59] as const;           // Slate-800
const COLOR_MUTED = [100, 116, 139] as const;       // Slate-500
const COLOR_LIGHT_BG = [248, 250, 252] as const;    // Slate-50
const COLOR_BORDER = [226, 232, 240] as const;      // Slate-200
const COLOR_ALERT = [220, 38, 38] as const;         // Red-600
const COLOR_WHITE = [255, 255, 255] as const;

// =============================================
// HELPERS
// =============================================

function setColor(pdf: jsPDF, color: readonly [number, number, number]) {
  pdf.setTextColor(color[0], color[1], color[2]);
}

function drawLine(pdf: jsPDF, y: number) {
  pdf.setDrawColor(COLOR_BORDER[0], COLOR_BORDER[1], COLOR_BORDER[2]);
  pdf.setLineWidth(0.3);
  pdf.line(MARGIN_LEFT, y, PAGE_WIDTH - MARGIN_RIGHT, y);
}

/** Checks if we need a new page and adds one if so. Returns the new Y. */
function checkPageBreak(pdf: jsPDF, currentY: number, neededHeight: number): number {
  if (currentY + neededHeight > PAGE_HEIGHT - MARGIN_BOTTOM) {
    pdf.addPage();
    addFooter(pdf);
    return MARGIN_TOP;
  }
  return currentY;
}

function addFooter(pdf: jsPDF) {
  const pageCount = pdf.getNumberOfPages();
  const currentPage = pageCount;
  
  // Linha separadora do rodapé
  pdf.setDrawColor(COLOR_BORDER[0], COLOR_BORDER[1], COLOR_BORDER[2]);
  pdf.setLineWidth(0.2);
  pdf.line(MARGIN_LEFT, PAGE_HEIGHT - 15, PAGE_WIDTH - MARGIN_RIGHT, PAGE_HEIGHT - 15);
  
  // Texto do rodapé
  pdf.setFontSize(7);
  setColor(pdf, COLOR_MUTED);
  pdf.setFont("helvetica", "normal");
  pdf.text("Documento gerado automaticamente por IA — DocMed", MARGIN_LEFT, PAGE_HEIGHT - 10);
  pdf.text(`Página ${currentPage}`, PAGE_WIDTH - MARGIN_RIGHT, PAGE_HEIGHT - 10, { align: "right" });
}

function addAllFooters(pdf: jsPDF) {
  const totalPages = pdf.getNumberOfPages();
  for (let i = 1; i <= totalPages; i++) {
    pdf.setPage(i);
    // Linha separadora do rodapé
    pdf.setDrawColor(COLOR_BORDER[0], COLOR_BORDER[1], COLOR_BORDER[2]);
    pdf.setLineWidth(0.2);
    pdf.line(MARGIN_LEFT, PAGE_HEIGHT - 15, PAGE_WIDTH - MARGIN_RIGHT, PAGE_HEIGHT - 15);
    
    pdf.setFontSize(7);
    setColor(pdf, COLOR_MUTED);
    pdf.setFont("helvetica", "normal");
    pdf.text("Documento gerado automaticamente por IA — DocMed", MARGIN_LEFT, PAGE_HEIGHT - 10);
    pdf.text(`Página ${i} de ${totalPages}`, PAGE_WIDTH - MARGIN_RIGHT, PAGE_HEIGHT - 10, { align: "right" });
  }
}

// =============================================
// HEADER
// =============================================

function drawHeader(pdf: jsPDF, pacienteNome: string): number {
  let y = MARGIN_TOP;

  // Barra de topo colorida
  pdf.setFillColor(COLOR_PRIMARY[0], COLOR_PRIMARY[1], COLOR_PRIMARY[2]);
  pdf.rect(0, 0, PAGE_WIDTH, 3, "F");

  // Título principal
  pdf.setFontSize(18);
  pdf.setFont("helvetica", "bold");
  setColor(pdf, COLOR_PRIMARY);
  pdf.text("Dossiê Clínico Inteligente", MARGIN_LEFT, y);
  y += 7;

  // Subtítulo
  pdf.setFontSize(9);
  pdf.setFont("helvetica", "normal");
  setColor(pdf, COLOR_MUTED);
  pdf.text("Triagem & Mapeamento por IA — DocMed", MARGIN_LEFT, y);
  y += 6;

  // Info do paciente e data
  pdf.setFontSize(9);
  setColor(pdf, COLOR_MUTED);
  const dataAtual = new Date().toLocaleDateString("pt-BR", {
    day: "2-digit",
    month: "long",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
  pdf.text(`Gerado em: ${dataAtual}`, PAGE_WIDTH - MARGIN_RIGHT, y, { align: "right" });

  pdf.setFont("helvetica", "bold");
  setColor(pdf, COLOR_DARK);
  pdf.text(`Paciente: ${pacienteNome}`, MARGIN_LEFT, y);
  y += 4;

  // Linha divisória
  drawLine(pdf, y);
  y += 6;

  return y;
}

// =============================================
// MARKDOWN PARSER → RENDER BLOCKS
// =============================================

interface TextBlock {
  type: "heading" | "bullet" | "bold_line" | "paragraph";
  text: string;
  level?: number; // 1 = ##, 2 = ###
}

function parseMarkdownToBlocks(markdown: string): TextBlock[] {
  const lines = markdown.split("\n");
  const blocks: TextBlock[] = [];

  for (const rawLine of lines) {
    const line = rawLine.trim();
    if (!line) continue;

    // Heading ## or ###
    const headingMatch = line.match(/^(#{1,3})\s+(.+)/);
    if (headingMatch) {
      // Remove emojis for cleaner PDF rendering
      const cleanText = headingMatch[2].replace(/[\u{1F300}-\u{1FAFF}\u{2600}-\u{27BF}\u{FE00}-\u{FE0F}\u{1F900}-\u{1F9FF}]/gu, "").trim();
      blocks.push({
        type: "heading",
        text: cleanText,
        level: headingMatch[1].length === 3 ? 2 : 1,
      });
      continue;
    }

    // Bullet points (- or *)
    const bulletMatch = line.match(/^[-*]\s+(.+)/);
    if (bulletMatch) {
      blocks.push({ type: "bullet", text: bulletMatch[1] });
      continue;
    }

    // Regular paragraph
    blocks.push({ type: "paragraph", text: line });
  }

  return blocks;
}

/** Renders a single text, handling inline **bold** markers. Returns final Y. */
function renderInlineText(
  pdf: jsPDF,
  text: string,
  x: number,
  y: number,
  maxWidth: number,
  fontSize: number,
  baseColor: readonly [number, number, number]
): number {
  // Split by **bold** segments
  const parts = text.split(/(\*\*[^*]+\*\*)/g);
  
  // First, build the full plain text for line wrapping
  const plainText = text.replace(/\*\*/g, "");
  pdf.setFontSize(fontSize);
  pdf.setFont("helvetica", "normal");
  const wrappedLines = pdf.splitTextToSize(plainText, maxWidth) as string[];
  
  // For each wrapped line, render with bold segments
  let currentY = y;
  for (const wLine of wrappedLines) {
    let remaining = wLine;
    let cursorX = x;
    
    // Find bold segments within this line
    // Simple approach: render entire line, then overlay bold parts
    // More reliable: just check if parts of the line should be bold
    
    // Find all bold ranges in the original text
    const boldRanges: { start: number; end: number }[] = [];
    let searchText = text.replace(/\*\*/g, "");
    const boldRegex = /\*\*([^*]+)\*\*/g;
    let offset = 0;
    let match;
    const originalForBold = text;
    let plainIdx = 0;
    
    // Reset regex
    const boldParts = originalForBold.match(/\*\*([^*]+)\*\*/g) || [];
    const boldTexts = boldParts.map(b => b.replace(/\*\*/g, ""));

    // Check if any bold text exists in this wrapped line
    let lineHasBold = false;
    for (const bt of boldTexts) {
      if (wLine.includes(bt) || bt.includes(wLine.trim())) {
        lineHasBold = true;
        break;
      }
    }
    
    if (!lineHasBold) {
      // Simple line, no bold
      pdf.setFont("helvetica", "normal");
      setColor(pdf, baseColor);
      pdf.text(wLine, cursorX, currentY);
    } else {
      // Render with inline bold
      let lineRemaining = wLine;
      cursorX = x;
      
      while (lineRemaining.length > 0) {
        // Find the earliest bold text in the remaining line
        let earliestIdx = lineRemaining.length;
        let earliestBold = "";
        
        for (const bt of boldTexts) {
          const idx = lineRemaining.indexOf(bt);
          if (idx !== -1 && idx < earliestIdx) {
            earliestIdx = idx;
            earliestBold = bt;
          }
        }
        
        if (earliestBold && earliestIdx < lineRemaining.length) {
          // Render text before bold
          if (earliestIdx > 0) {
            const beforeText = lineRemaining.substring(0, earliestIdx);
            pdf.setFont("helvetica", "normal");
            setColor(pdf, baseColor);
            pdf.text(beforeText, cursorX, currentY);
            cursorX += pdf.getTextWidth(beforeText);
          }
          
          // Render bold text
          pdf.setFont("helvetica", "bold");
          setColor(pdf, baseColor);
          pdf.text(earliestBold, cursorX, currentY);
          cursorX += pdf.getTextWidth(earliestBold);
          
          lineRemaining = lineRemaining.substring(earliestIdx + earliestBold.length);
        } else {
          // No more bold, render rest
          pdf.setFont("helvetica", "normal");
          setColor(pdf, baseColor);
          pdf.text(lineRemaining, cursorX, currentY);
          lineRemaining = "";
        }
      }
    }
    
    currentY += fontSize * 0.45;
  }
  
  return currentY;
}

// =============================================
// RENDER BLOCKS TO PDF
// =============================================

function renderBlocks(pdf: jsPDF, blocks: TextBlock[], startY: number): number {
  let y = startY;

  for (const block of blocks) {
    switch (block.type) {
      case "heading": {
        const isMainHeading = (block.level || 1) === 1;
        const fontSize = isMainHeading ? 12 : 10;
        const spaceBefore = isMainHeading ? 8 : 5;
        const spaceAfter = isMainHeading ? 3 : 2;

        y = checkPageBreak(pdf, y, spaceBefore + fontSize * 0.5 + spaceAfter + 2);
        y += spaceBefore;

        if (isMainHeading) {
          // Background bar for main headings
          pdf.setFillColor(COLOR_LIGHT_BG[0], COLOR_LIGHT_BG[1], COLOR_LIGHT_BG[2]);
          pdf.roundedRect(MARGIN_LEFT - 2, y - 5, CONTENT_WIDTH + 4, 9, 1.5, 1.5, "F");
          
          // Accent bar
          pdf.setFillColor(COLOR_PRIMARY[0], COLOR_PRIMARY[1], COLOR_PRIMARY[2]);
          pdf.rect(MARGIN_LEFT - 2, y - 5, 1.5, 9, "F");
        }

        pdf.setFontSize(fontSize);
        pdf.setFont("helvetica", "bold");
        setColor(pdf, isMainHeading ? COLOR_DARK : COLOR_DARK);
        
        // Check for alert keywords
        const lowerText = block.text.toLowerCase();
        if (lowerText.includes("alerta") || lowerText.includes("crítico") || lowerText.includes("atenção")) {
          setColor(pdf, COLOR_ALERT);
        }
        
        pdf.text(block.text, MARGIN_LEFT + (isMainHeading ? 3 : 0), y);
        y += spaceAfter;

        if (isMainHeading) {
          y += 2;
        }
        break;
      }

      case "bullet": {
        y = checkPageBreak(pdf, y, 8);
        
        // Bullet marker
        pdf.setFillColor(COLOR_PRIMARY[0], COLOR_PRIMARY[1], COLOR_PRIMARY[2]);
        pdf.circle(MARGIN_LEFT + 2, y - 1.2, 0.8, "F");
        
        // Bullet text with potential bold
        y = renderInlineText(pdf, block.text, MARGIN_LEFT + 6, y, CONTENT_WIDTH - 6, 9, COLOR_DARK);
        y += 1;
        break;
      }

      case "paragraph": {
        const plainText = block.text.replace(/\*\*/g, "");
        pdf.setFontSize(9);
        pdf.setFont("helvetica", "normal");
        const lines = pdf.splitTextToSize(plainText, CONTENT_WIDTH) as string[];
        const blockHeight = lines.length * 4.5;
        
        y = checkPageBreak(pdf, y, blockHeight);
        y = renderInlineText(pdf, block.text, MARGIN_LEFT, y, CONTENT_WIDTH, 9, COLOR_DARK);
        y += 2;
        break;
      }
    }
  }

  return y;
}

// =============================================
// BODY MAP CAPTURE
// =============================================

async function captureBodyMap(): Promise<string | null> {
  const mapElement = document.getElementById("body-map-container");
  if (!mapElement) return null;

  try {
    const dataUrl = await toPng(mapElement, {
      quality: 1,
      backgroundColor: "#ffffff",
      pixelRatio: 3,
    });
    return dataUrl;
  } catch (err) {
    console.warn("Falha ao capturar mapa corporal para o PDF:", err);
    return null;
  }
}

// =============================================
// MAIN EXPORT FUNCTION
// =============================================

export async function gerarPDFProfissional(
  paciente: { nome: string },
  resumoMarkdown: string,
  regioesAfetadas: string[]
): Promise<void> {
  const pdf = new jsPDF("p", "mm", "a4");

  // 1. Header
  let y = drawHeader(pdf, paciente.nome);

  // 2. Parse and render the markdown summary
  const blocks = parseMarkdownToBlocks(resumoMarkdown);
  y = renderBlocks(pdf, blocks, y);

  // 3. Body Map Section
  y = checkPageBreak(pdf, y, 80);
  y += 6;
  drawLine(pdf, y);
  y += 8;

  // Section title
  pdf.setFontSize(12);
  pdf.setFont("helvetica", "bold");
  setColor(pdf, COLOR_DARK);
  pdf.setFillColor(COLOR_LIGHT_BG[0], COLOR_LIGHT_BG[1], COLOR_LIGHT_BG[2]);
  pdf.roundedRect(MARGIN_LEFT - 2, y - 5, CONTENT_WIDTH + 4, 9, 1.5, 1.5, "F");
  pdf.setFillColor(COLOR_PRIMARY[0], COLOR_PRIMARY[1], COLOR_PRIMARY[2]);
  pdf.rect(MARGIN_LEFT - 2, y - 5, 1.5, 9, "F");
  pdf.text("Mapa Corporal — Focos Ativos", MARGIN_LEFT + 3, y);
  y += 8;

  // Regions list
  if (regioesAfetadas.length > 0) {
    pdf.setFontSize(8);
    pdf.setFont("helvetica", "normal");
    setColor(pdf, COLOR_MUTED);
    const regionLabels = regioesAfetadas.map(r => r.replace(/_/g, " ").replace(/\b\w/g, c => c.toUpperCase()));
    pdf.text(`Regiões identificadas: ${regionLabels.join(", ")}`, MARGIN_LEFT, y);
    y += 6;
  }

  // Capture body map image
  const bodyMapImg = await captureBodyMap();
  if (bodyMapImg) {
    y = checkPageBreak(pdf, y, 90);
    
    const img = new window.Image();
    img.src = bodyMapImg;

    await new Promise<void>((resolve) => {
      img.onload = () => {
        const imgWidth = 55;
        const imgHeight = (img.height * imgWidth) / img.width;
        const imgX = (PAGE_WIDTH - imgWidth) / 2;
        
        // Background card for the body map
        pdf.setFillColor(COLOR_LIGHT_BG[0], COLOR_LIGHT_BG[1], COLOR_LIGHT_BG[2]);
        pdf.setDrawColor(COLOR_BORDER[0], COLOR_BORDER[1], COLOR_BORDER[2]);
        pdf.roundedRect(imgX - 5, y - 3, imgWidth + 10, imgHeight + 6, 3, 3, "FD");
        
        pdf.addImage(bodyMapImg, "PNG", imgX, y, imgWidth, imgHeight);
        resolve();
      };
      img.onerror = () => resolve();
    });
  }

  // 4. Add footers to all pages (with correct total count)
  addAllFooters(pdf);

  // 5. Save
  pdf.save(`dossie-clinico-${paciente.nome.replace(/\s+/g, "_")}.pdf`);
}
