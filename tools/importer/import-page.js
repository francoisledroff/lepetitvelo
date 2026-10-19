/* eslint-disable */
/* global WebImporter */


import droffCleanupTransformer from './transformers/droff-cleanup.js';
import droffLinksTransformer from './transformers/droff-links.js';
import droffMetadataTransformer from './transformers/droff-metadata.js';
import { pagePathToEds } from './transformers/droff-url.js';

const PAGE_TEMPLATE = {
  "name": "page",
  "description": "Simple JBake page: home (photo + intro), Projects, Conferences",
  "urls": [
    "https://droff.com/",
    "https://droff.com/conferences.html",
    "https://droff.com/projects.html"
  ],
  "representativeUrl": "https://droff.com/",
  "urlPattern": "/*",
  "blocks": [],
  "sections": [
    {
      "id": "rc1",
      "name": "Page body",
      "selector": [
        "#wrap > div.container"
      ],
      "style": null,
      "blocks": [],
      "defaultContent": [
        "div.page-header h1",
        "div.imageblock",
        "div.paragraph"
      ]
    }
  ]
};

const parsers = {

};

// Order matters: cleanup and links run before parsers, metadata runs after them.
// droff-url.js is a helper module, not a transformer.
const transformers = [
  droffCleanupTransformer,
  droffLinksTransformer,
  droffMetadataTransformer,
];

function executeTransformers(hookName, element, payload) {
  const enhancedPayload = { ...payload, template: PAGE_TEMPLATE };
  transformers.forEach((fn) => {
    try { fn(hookName, element, enhancedPayload); }
    catch (e) { console.error(`Transformer failed at ${hookName}:`, e); }
  });
}

function findBlocksOnPage(document, template) {
  const pageBlocks = [];
  template.blocks.forEach((blockDef) => {
    blockDef.instances.forEach((selector) => {
      document.querySelectorAll(selector).forEach((element) => {
        pageBlocks.push({ name: blockDef.name, selector, element });
      });
    });
  });
  return pageBlocks;
}

export default {
  transform: (payload) => {
    const { document, url, params } = payload;
    const main = document.body;

    // Read before droff-metadata removes .page-header and <title>
    const h1 = document.querySelector('.page-header h1');
    const title = ((h1 && h1.textContent) || document.title || '')
      .replace(/\s+/g, ' ').trim().replace(/^Fran(c|ç)ois Le Droff\s*:\s*/i, '');

    executeTransformers('beforeTransform', main, payload);

    const pageBlocks = findBlocksOnPage(document, PAGE_TEMPLATE);
    pageBlocks.forEach((block) => {
      if (!block.element.parentNode) return;
      const parser = parsers[block.name];
      if (!parser) return;
      try { parser(block.element, { document, url, params }); }
      catch (e) { console.error(`Failed to parse ${block.name} (${block.selector}):`, e); }
    });

    // droff-metadata appends the Metadata block; no createMetadata() / extra <hr> here
    executeTransformers('afterTransform', main, payload);

    WebImporter.rules.transformBackgroundImages(main, document);
    WebImporter.rules.adjustImageUrls(main, url, params.originalURL);

    // Same normalization as rewritten links (e.g. /tags/adobe.io.html -> /tags/adobe-io)
    const edsPath = pagePathToEds(new URL(params.originalURL).pathname);
    const path = (!edsPath || edsPath === '/') ? '/index' : edsPath;

    return [{
      element: main,
      path,
      report: { title, template: PAGE_TEMPLATE.name, blocks: pageBlocks.map((b) => b.name) },
    }];
  },
};
