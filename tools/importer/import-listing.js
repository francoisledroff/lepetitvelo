/* eslint-disable */
/* global WebImporter */

import postListParser from './parsers/post-list.js';
import tagListParser from './parsers/tag-list.js';
import droffCleanupTransformer from './transformers/droff-cleanup.js';
import droffLinksTransformer from './transformers/droff-links.js';
import droffMetadataTransformer from './transformers/droff-metadata.js';
import droffAsTagTransformer from './transformers/droff-as-tag.js';
import { pagePathToEds } from './transformers/droff-url.js';

const PAGE_TEMPLATE = {
  "name": "listing",
  "description": "Post listings: Archives (all posts grouped by year), per-tag pages (posts with tag grouped by year), tag index (all tags). Rebuilt as auto-updating blocks from the query index",
  "urls": [
    "https://droff.com/tags/Tech.html",
    "https://droff.com/archive.html",
    "https://droff.com/listalltags.html",
    "https://droff.com/tags/AEM.html",
    "https://droff.com/tags/API.html",
    "https://droff.com/tags/About.html",
    "https://droff.com/tags/Adobe.html",
    "https://droff.com/tags/All.html",
    "https://droff.com/tags/Ansible.html",
    "https://droff.com/tags/Architecture.html",
    "https://droff.com/tags/Books.html",
    "https://droff.com/tags/CQ5.html",
    "https://droff.com/tags/Cairngorm.html",
    "https://droff.com/tags/Chef.html",
    "https://droff.com/tags/CodeMotion.html",
    "https://droff.com/tags/Compile.html",
    "https://droff.com/tags/Conference.html",
    "https://droff.com/tags/Conversation.html",
    "https://droff.com/tags/Devops.html",
    "https://droff.com/tags/Devoxx.html",
    "https://droff.com/tags/Flex.html",
    "https://droff.com/tags/FlexPMD.html",
    "https://droff.com/tags/Français.html",
    "https://droff.com/tags/General.html",
    "https://droff.com/tags/IMS.html",
    "https://droff.com/tags/IT.html",
    "https://droff.com/tags/JBoss.html",
    "https://droff.com/tags/JHipster.html",
    "https://droff.com/tags/JWT.html",
    "https://droff.com/tags/Java.html",
    "https://droff.com/tags/Javapolis.html",
    "https://droff.com/tags/Jenkins.html",
    "https://droff.com/tags/Lectures.html",
    "https://droff.com/tags/Linux.html",
    "https://droff.com/tags/Maven.html",
    "https://droff.com/tags/Misc.html",
    "https://droff.com/tags/Music.html",
    "https://droff.com/tags/OAuth.html",
    "https://droff.com/tags/OpenSource.html",
    "https://droff.com/tags/Papa.html",
    "https://droff.com/tags/Perforce.html",
    "https://droff.com/tags/Project.html",
    "https://droff.com/tags/Puppet.html",
    "https://droff.com/tags/QSOS.html",
    "https://droff.com/tags/Security.html",
    "https://droff.com/tags/Spring.html",
    "https://droff.com/tags/Sécurité.html",
    "https://droff.com/tags/XWiki.html",
    "https://droff.com/tags/adobe.io.html",
    "https://droff.com/tags/devopsdays.html",
    "https://droff.com/tags/keyCloak.html",
    "https://droff.com/tags/lab.html",
    "https://droff.com/tags/ossgtp.html"
  ],
  "representativeUrl": "https://droff.com/tags/Tech.html",
  "urlPattern": "/tags/*",
  "blocks": [
    {
      "name": "post-list",
      "instances": [
        "div.container.marketing",
        "#wrap > div.container"
      ]
    },
    {
      "name": "tag-list",
      "instances": [
        "h4 + p"
      ]
    }
  ],
  "sections": [
    {
      "id": "rc1",
      "name": "Listing body",
      "selector": [
        "#wrap > div.container"
      ],
      "style": null,
      "blocks": [
        "post-list",
        "tag-list"
      ],
      "defaultContent": [
        "h1",
        "h4"
      ]
    }
  ]
};

const parsers = {
  'post-list': postListParser,
  'tag-list': tagListParser,
};

// Order matters: cleanup and links run before parsers, metadata runs after them.
// droff-url.js is a helper module, not a transformer.
const transformers = [
  droffAsTagTransformer,
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
    // "?as-tag=Spring Security" imports a synthetic tag page (see droff-as-tag.js)
    const asTag = new URL(params.originalURL).searchParams.get('as-tag');
    const edsPath = pagePathToEds(asTag ? `/tags/${asTag}.html` : new URL(params.originalURL).pathname);
    const path = (!edsPath || edsPath === '/') ? '/index' : edsPath;

    return [{
      element: main,
      path,
      report: { title, template: PAGE_TEMPLATE.name, blocks: pageBlocks.map((b) => b.name) },
    }];
  },
};
