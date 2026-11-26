/**
 * PDF/UA tagged PDF writer using pdf-lib (structure tree + MCIDs + raster artifacts).
 */

import fontkit from "@pdf-lib/fontkit";
import {
  PDFArray,
  PDFBool,
  PDFDict,
  PDFDocument,
  PDFName,
  PDFNumber,
  PDFOperator,
  PDFPage,
  PDFRef,
  PDFString
} from "pdf-lib";
import type { PDFFont } from "pdf-lib";

import type { DocumentAccessibilityModel, PdfStructNode } from "./pdf-accessibility-tree";
import { collectMcidTargets, sanitizePdfText } from "./pdf-accessibility-tree";
import type { PdfExportMetadata } from "./pdf-metadata";
import {
  A4_HEIGHT_MM,
  A4_WIDTH_MM,
  anchorDestTopPt,
  letterboxImageMm,
  mmToPt,
  rectMmToPt
} from "./pdf-rect";
import { isUnsafeUrlScheme } from "./unsafe-url-schemes";

const GENTIUM_FONT_LOCAL = "/fonts/GentiumBookPlus-Regular.ttf";
const GENTIUM_FONT_CDN =
  "https://cdn.jsdelivr.net/fontsource/fonts/gentium-book-plus@latest/latin-400-normal.ttf";

function pdfOp(name: string, args: unknown[] = []): PDFOperator {
  return PDFOperator.of(name as never, args as never);
}

type PageInternals = {
  getContentStream: () => { push: (...ops: PDFOperator[]) => void };
  node: { set: (name: PDFName, value: unknown) => void; get: (name: PDFName) => unknown };
};

function pushOps(page: PDFPage, ...ops: PDFOperator[]): void {
  page.pushOperators(...ops);
}

function drawMcidMarkedContent(
  page: PDFPage,
  node: PdfStructNode,
  mcid: number,
  context: PDFDocument["context"]
): void {
  if (!node.rect) {
    return;
  }
  const props = PDFDict.withContext(context);
  props.set(PDFName.of("MCID"), PDFNumber.of(mcid));
  if (node.text) {
    props.set(PDFName.of("ActualText"), PDFString.of(sanitizePdfText(node.text)));
  }
  if (node.alt) {
    props.set(PDFName.of("Alt"), PDFString.of(sanitizePdfText(node.alt)));
  }
  pushOps(
    page,
    pdfOp("BDC", [PDFName.of(node.role), props]),
    endMarkedContent()
  );
}

function drawRasterLayer(
  page: PDFPage,
  image: Awaited<ReturnType<PDFDocument["embedPng"]>>,
  box: ReturnType<typeof letterboxImageMm>
): void {
  const x = mmToPt(box.x);
  const y = mmToPt(A4_HEIGHT_MM - box.y - box.h);
  const w = mmToPt(box.w);
  const h = mmToPt(box.h);
  page.drawImage(image, { x, y, width: w, height: h });
}

export function isAllowedLinkHref(href: string): boolean {
  return !isUnsafeUrlScheme(href);
}

export interface PageRasterInput {
  pngBytes: Uint8Array;
  canvasWidth: number;
  canvasHeight: number;
}

export interface LinkInput {
  href: string;
  rectMm: { x: number; y: number; w: number; h: number };
  pageIndex: number;
}

/** Internal `#anchor` target: 1-based page and distance from the top of that page (mm). */
export interface AnchorDest {
  page: number;
  topMm: number;
}

interface StructBuildCtx {
  doc: PDFDocument;
  pageRefs: PDFRef[];
  mcidByNode: WeakMap<PdfStructNode, number>;
  structRefs: WeakMap<PdfStructNode, PDFRef>;
  parentTreeNums: PDFArray;
  mcidKidsByPage: PDFArray[];
}

function endMarkedContent(): PDFOperator {
  return pdfOp("EMC");
}

function buildStructElem(
  node: PdfStructNode,
  ctx: StructBuildCtx,
  pageIndex: number,
  parentRef: PDFRef
): PDFRef | null {
  const { doc, pageRefs, mcidByNode, structRefs } = ctx;
  const context = doc.context;
  const ref = context.nextRef();
  structRefs.set(node, ref);

  const kids = PDFArray.withContext(context);
  const mcid = mcidByNode.get(node);
  const hasContent = mcid != null && node.rect != null;

  if (hasContent) {
    kids.push(PDFNumber.of(mcid));
  }

  for (const child of node.children) {
    const childRef = buildStructElem(child, ctx, pageIndex, ref);
    if (childRef) {
      kids.push(childRef);
    }
  }

  if (kids.size() === 0 && !hasContent) {
    return null;
  }

  const dict = PDFDict.withContext(context);
  dict.set(PDFName.of("Type"), PDFName.of("StructElem"));
  dict.set(PDFName.of("S"), PDFName.of(node.role));
  dict.set(PDFName.of("P"), parentRef);
  dict.set(PDFName.of("K"), kids.size() === 1 ? (kids.get(0) as PDFNumber | PDFRef) : kids);

  if (hasContent) {
    dict.set(PDFName.of("Pg"), pageRefs[pageIndex]);
    ctx.mcidKidsByPage[pageIndex]?.push(ref);
  }
  if (node.alt) {
    dict.set(PDFName.of("Alt"), PDFString.of(node.alt));
  }

  context.assign(ref, dict);
  return ref;
}

function attachStructureTree(doc: PDFDocument, model: DocumentAccessibilityModel, ctx: StructBuildCtx): void {
  const context = doc.context;
  const catalog = doc.catalog;
  const structTreeRootRef = context.nextRef();
  const parentTreeRef = context.nextRef();
  const documentRef = context.nextRef();

  const docKids = PDFArray.withContext(context);
  for (const pageTree of model.pages) {
    for (const node of pageTree.nodes) {
      const ref = buildStructElem(node, ctx, pageTree.pageIndex, documentRef);
      if (ref) {
        docKids.push(ref);
      }
    }
  }

  const documentDict = PDFDict.withContext(context);
  documentDict.set(PDFName.of("Type"), PDFName.of("StructElem"));
  documentDict.set(PDFName.of("S"), PDFName.of("Document"));
  documentDict.set(PDFName.of("P"), structTreeRootRef);
  documentDict.set(PDFName.of("K"), docKids);
  context.assign(documentRef, documentDict);

  const rootDict = PDFDict.withContext(context);
  const rootKids = PDFArray.withContext(context);
  rootKids.push(documentRef);
  rootDict.set(PDFName.of("Type"), PDFName.of("StructTreeRoot"));
  rootDict.set(PDFName.of("K"), rootKids);
  rootDict.set(PDFName.of("ParentTree"), parentTreeRef);
  rootDict.set(PDFName.of("ParentTreeNextKey"), PDFNumber.of(model.pages.length));
  context.assign(structTreeRootRef, rootDict);

  const parentDict = PDFDict.withContext(context);
  parentDict.set(PDFName.of("Nums"), ctx.parentTreeNums);
  context.assign(parentTreeRef, parentDict);
  catalog.set(PDFName.of("StructTreeRoot"), structTreeRootRef);
  const markInfo = PDFDict.withContext(context);
  markInfo.set(PDFName.of("Marked"), PDFBool.True);
  catalog.set(PDFName.of("MarkInfo"), markInfo);
  catalog.set(PDFName.of("Lang"), PDFString.of("de-DE"));
}

function addLinkAnnotation(
  doc: PDFDocument,
  page: PDFPage,
  link: LinkInput,
  anchorDests: Map<string, AnchorDest>,
  pageRefs: PDFRef[]
): void {
  const trimmed = link.href.trim();
  if (!isAllowedLinkHref(trimmed)) {
    return;
  }
  const context = doc.context;
  let destArray: PDFArray | null = null;
  let actionDict: PDFDict | null = null;

  if (trimmed.startsWith("#")) {
    const id = decodeURIComponent(trimmed.slice(1));
    const target = anchorDests.get(id);
    if (target == null || target.page < 1 || target.page > pageRefs.length) {
      return;
    }
    const destRef = pageRefs[target.page - 1];
    destArray = PDFArray.withContext(context);
    destArray.push(destRef);
    destArray.push(PDFName.of("XYZ"));
    destArray.push(PDFNumber.of(0));
    destArray.push(PDFNumber.of(anchorDestTopPt(target.topMm)));
    destArray.push(PDFNumber.of(0));
  } else if (/^https?:\/\//i.test(trimmed)) {
    actionDict = PDFDict.withContext(context);
    actionDict.set(PDFName.of("Type"), PDFName.of("Action"));
    actionDict.set(PDFName.of("S"), PDFName.of("URI"));
    actionDict.set(PDFName.of("URI"), PDFString.of(trimmed));
  } else {
    return;
  }

  const r = rectMmToPt(link.rectMm);
  const annotRef = context.nextRef();
  const rectArr = PDFArray.withContext(context);
  rectArr.push(PDFNumber.of(r.x));
  rectArr.push(PDFNumber.of(r.y));
  rectArr.push(PDFNumber.of(r.x + r.w));
  rectArr.push(PDFNumber.of(r.y + r.h));

  const borderArr = PDFArray.withContext(context);
  borderArr.push(PDFNumber.of(0));
  borderArr.push(PDFNumber.of(0));
  borderArr.push(PDFNumber.of(0));

  const annotDict = PDFDict.withContext(context);
  annotDict.set(PDFName.of("Type"), PDFName.of("Annot"));
  annotDict.set(PDFName.of("Subtype"), PDFName.of("Link"));
  annotDict.set(PDFName.of("Rect"), rectArr);
  annotDict.set(PDFName.of("Border"), borderArr);
  if (destArray) {
    annotDict.set(PDFName.of("Dest"), destArray);
  }
  if (actionDict) {
    annotDict.set(PDFName.of("A"), actionDict);
  }

  context.assign(annotRef, annotDict);
  const pageNode = (page as unknown as PageInternals).node;
  const annots = pageNode.get(PDFName.of("Annots"));
  if (annots instanceof PDFArray) {
    annots.push(annotRef);
  } else {
    const annotsArr = PDFArray.withContext(context);
    annotsArr.push(annotRef);
    pageNode.set(PDFName.of("Annots"), annotsArr);
  }
}

async function loadEmbeddedFont(doc: PDFDocument): Promise<PDFFont> {
  doc.registerFontkit(fontkit);
  let bytes: Uint8Array | null = null;
  const local = await fetch(GENTIUM_FONT_LOCAL);
  if (local.ok) {
    bytes = new Uint8Array(await local.arrayBuffer());
  } else {
    const remote = await fetch(GENTIUM_FONT_CDN);
    if (!remote.ok) {
      throw new Error("Gentium-Schrift weder lokal noch per CDN verfügbar.");
    }
    bytes = new Uint8Array(await remote.arrayBuffer());
  }
  return doc.embedFont(bytes, { subset: true });
}

function applyPdfMetadata(doc: PDFDocument, meta: PdfExportMetadata): void {
  doc.setTitle(meta.title);
  if (meta.author) {
    doc.setAuthor(meta.author);
  }
  if (meta.subject) {
    doc.setSubject(meta.subject);
  }
  if (meta.keywords) {
    const parts = meta.keywords.split(/;\s*/).map((s) => s.trim()).filter(Boolean);
    doc.setKeywords(parts.length > 0 ? parts : [meta.keywords]);
  }
  doc.setCreator("DSABrew");
  doc.setProducer("DSABrew PDF/UA Export");
  doc.setLanguage("de");
}

export async function buildTaggedPdfBytes(
  model: DocumentAccessibilityModel,
  rasters: PageRasterInput[],
  links: LinkInput[],
  anchorDests: Map<string, AnchorDest>
): Promise<Uint8Array> {
  const doc = await PDFDocument.create();
  applyPdfMetadata(doc, model.metadata);

  await loadEmbeddedFont(doc);

  const pageRefs: PDFRef[] = [];
  const mcidByNode = new WeakMap<PdfStructNode, number>();
  const parentTreeNums = PDFArray.withContext(doc.context);
  const mcidKidsByPage: PDFArray[] = [];

  for (let i = 0; i < rasters.length; i++) {
    const raster = rasters[i];
    const box = letterboxImageMm(raster.canvasWidth, raster.canvasHeight);
    const page = doc.addPage([mmToPt(A4_WIDTH_MM), mmToPt(A4_HEIGHT_MM)]);
    pageRefs.push(page.ref);
    page.node.set(PDFName.of("StructParents"), PDFNumber.of(i));

    const mcidKids = PDFArray.withContext(doc.context);
    mcidKidsByPage[i] = mcidKids;
    parentTreeNums.push(PDFNumber.of(i));
    parentTreeNums.push(mcidKids);

    const image = await doc.embedPng(raster.pngBytes);

    const pageTree = model.pages[i];
    const targets = collectMcidTargets(pageTree?.nodes ?? []);
    let mcid = 0;
    for (const node of targets) {
      mcidByNode.set(node, mcid);
      drawMcidMarkedContent(page, node, mcid, doc.context);
      mcid++;
    }

    drawRasterLayer(page, image, box);
  }

  for (let i = 0; i < rasters.length; i++) {
    const page = doc.getPage(i);
    for (const link of links.filter((l) => l.pageIndex === i)) {
      addLinkAnnotation(doc, page, link, anchorDests, pageRefs);
    }
  }

  const structCtx: StructBuildCtx = {
    doc,
    pageRefs,
    mcidByNode,
    structRefs: new WeakMap(),
    parentTreeNums,
    mcidKidsByPage
  };
  attachStructureTree(doc, model, structCtx);

  return doc.save({ useObjectStreams: false });
}

/** Check PDF bytes for tagged structure markers (unit tests). */
export function pdfBytesContainTaggedMarkers(bytes: Uint8Array): boolean {
  const text = new TextDecoder("latin1").decode(bytes);
  return text.includes("StructTreeRoot") && text.includes("Marked");
}
