/* eslint-disable */
/* global WebImporter */

import columnsFramedParser from './parsers/columns-framed.js';
import droffCleanupTransformer from './transformers/droff-cleanup.js';
import droffLinksTransformer from './transformers/droff-links.js';
import droffMetadataTransformer from './transformers/droff-metadata.js';
import { pagePathToEds } from './transformers/droff-url.js';

const PAGE_TEMPLATE = {
  "name": "blog-post",
  "description": "JBake blog post: page-header with H1 title + credit line (publish date, tags), AsciiDoc body (paragraphs, lists, tables, code listings, images)",
  "urls": [
    "https://droff.com/content/2018/06/21/Cheeky_And_Cheesy.html",
    "https://droff.com/content/2004/12/13/javapolis_2004_part1_Eclipse_in_Action_by+_Eric_Gamma.html",
    "https://droff.com/content/2005/01/26/javapolis_2004.html",
    "https://droff.com/content/2005/07/14/there_s_far_less_oa.html",
    "https://droff.com/content/2005/09/06/book_review_maven_a_developer.html",
    "https://droff.com/content/2005/09/07/ossgtp_du_18_aout_2005.html",
    "https://droff.com/content/2005/10/08/jboss_transaction_configuration.html",
    "https://droff.com/content/2005/10/17/death_to_the_jboss_transaction.html",
    "https://droff.com/content/2005/10/27/symposium_dng_2005.html",
    "https://droff.com/content/2005/11/23/jboss_locking_follow_up.html",
    "https://droff.com/content/2005/11/23/retour_sur_rialto_et_le.html",
    "https://droff.com/content/2005/11/29/qsos_qualification_et_de_selection.html",
    "https://droff.com/content/2005/12/21/javapolis_2005.html",
    "https://droff.com/content/2006/01/18/p6spy_integration_in_jboss_do.html",
    "https://droff.com/content/2006/01/25/qsos_est_desormais_sous_licence.html",
    "https://droff.com/content/2006/02/03/pjbug_jboss_clustering.html",
    "https://droff.com/content/2006/03/02/pragmatic_profiling_find_out_quickly.html",
    "https://droff.com/content/2006/06/28/bravo_a_xwiki.html",
    "https://droff.com/content/2006/06/30/pjbug_28_juin_2006.html",
    "https://droff.com/content/2006/07/04/javaday_2006.html",
    "https://droff.com/content/2006/12/31/javapolis_2006_quelques_liens.html",
    "https://droff.com/content/2007/01/30/salon_solution_linux.html",
    "https://droff.com/content/2007/09/07/max_2007.html",
    "https://droff.com/content/2008/01/11/tous_mes_voeux_pour_une.html",
    "https://droff.com/content/2008/02/07/retour_sur_le_salon_solution.html",
    "https://droff.com/content/2008/04/25/quickly_create_run_and_test.html",
    "https://droff.com/content/2008/04/26/testing_maven_archetype.html",
    "https://droff.com/content/2008/04/30/create_your_maven_repository_from.html",
    "https://droff.com/content/2008/05/24/a_blazeds_xdoclet_spring_hibernate.html",
    "https://droff.com/content/2008/05/31/l_url_clef_de_voute.html",
    "https://droff.com/content/2008/07/01/partenariat_adobe_google_yahoo_les.html",
    "https://droff.com/content/2008/07/31/a_new_set_of_flex.html",
    "https://droff.com/content/2008/10/28/a_new_set_of_maven.html",
    "https://droff.com/content/2008/11/16/speaking_at_max.html",
    "https://droff.com/content/2008/11/29/back_on_the_road_heading.html",
    "https://droff.com/content/2008/12/08/l_integration_de_flex_et.html",
    "https://droff.com/content/2008/12/16/demo_surprise_de_lcds_next.html",
    "https://droff.com/content/2009/02/03/java_for_flex_architects.html",
    "https://droff.com/content/2009/03/03/maven_on_flex_livecycle_es.html",
    "https://droff.com/content/2009/03/09/le_semi_de_paris.html",
    "https://droff.com/content/2009/06/05/conference_ria_flex_au_riveria.html",
    "https://droff.com/content/2009/06/23/the_spring_of_flex_remoting.html",
    "https://droff.com/content/2009/07/06/demain_soiree_ria_flex_et.html",
    "https://droff.com/content/2009/07/10/compte_rendu_de_la_soiree.html",
    "https://droff.com/content/2009/07/22/automated_testing_and_quality_control.html",
    "https://droff.com/content/2009/09/02/flexpmd_is_born.html",
    "https://droff.com/content/2009/09/16/tour_d_horizon_des_outils.html",
    "https://droff.com/content/2009/10/06/cairngorm_3_is_out_for.html",
    "https://droff.com/content/2009/11/20/radeon_ati_video_driver_issue.html",
    "https://droff.com/content/2010/01/13/cairngorm_3_0_2_release.html",
    "https://droff.com/content/2010/03/29/sortie_de_flexpmd_1_1.html",
    "https://droff.com/content/2010/04/19/demain_soir_java_flex_cidre.html",
    "https://droff.com/content/2010/05/19/la_sortie_de_cairngorm3_ma.html",
    "https://droff.com/content/2010/11/29/soiree_flex_ria_au_nantes.html",
    "https://droff.com/content/2011/03/09/les_cast_codeurs_podcast_episode.html",
    "https://droff.com/content/2011/08/02/a_customer_experience_management_a.html",
    "https://droff.com/content/2013/04/19/back_from_devoxx_part_11.html",
    "https://droff.com/content/2013/04/22/back_from_devoxx_part_2.html",
    "https://droff.com/content/2013/04/23/back_from_devoxx_part_3.html",
    "https://droff.com/content/2013/04/26/back_from_devoxx_part_4.html",
    "https://droff.com/content/2013/07/31/perforce_shelving_jenkins.html",
    "https://droff.com/content/2014/05/05/master_chef_puppet_show_and.html",
    "https://droff.com/content/2014/05/13/master_chef_class_learn_how.html",
    "https://droff.com/content/2014/07/03/back_from_basel.html",
    "https://droff.com/content/2014/07/29/chef_metal_experimentations_aem_test.html",
    "https://droff.com/content/2014/12/04/an_aem_cq_salesforce_integration.html",
    "https://droff.com/content/2015/04/10/devoxx-fr-2015.html",
    "https://droff.com/content/2015/11/03/code-motion-Berlin-2015.html",
    "https://droff.com/content/2016/01/25/Jhipster-meetup.html",
    "https://droff.com/content/2016/06/21/BrestByNight.html",
    "https://droff.com/content/2016/11/17/Devops-days-berlin-2016.html",
    "https://droff.com/content/2016/12/21/InstruMENTAL.html",
    "https://droff.com/content/2017/06/21/Hammered_Hamster.html",
    "https://droff.com/content/2017/12/21/Hammered_Hamster.html",
    "https://droff.com/content/2018/04/19/devoxx-2018-lab-secu.html",
    "https://droff.com/content/2018/05/08/precipitation.html",
    "https://droff.com/content/2018/08/08/adobe-ims-jwt-token-util.html",
    "https://droff.com/content/2018/09/04/adaptTo-2018-lab.html",
    "https://droff.com/content/2018/11/20/comme-ma-poche.html",
    "https://droff.com/content/2019/06/21/unCOVER.html",
    "https://droff.com/content/2019/10/08/experience-league-conf.html",
    "https://droff.com/content/2019/12/21/Fais_tu_frettes.html",
    "https://droff.com/content/2020/01/08/les_cobayes.html",
    "https://droff.com/content/2020/01/12/cher_pays_de_mon_enfance.html",
    "https://droff.com/content/2020/12/22/Comment_ca_pas_de_soiree_compil.html",
    "https://droff.com/content/2021/01/16/grasse_matinee.html"
  ],
  "representativeUrl": "https://droff.com/content/2018/06/21/Cheeky_And_Cheesy.html",
  "urlPattern": "/content/*",
  "blocks": [
    {
      "name": "columns-framed",
      "instances": [
        "table.tableblock"
      ]
    }
  ],
  "sections": [
    {
      "id": "rc2",
      "name": "Post body",
      "selector": [
        "#wrap > div.container"
      ],
      "style": null,
      "blocks": [
        "columns-framed"
      ],
      "defaultContent": [
        "div.paragraph",
        "div.ulist",
        "div.olist",
        "div.dlist",
        "div.quoteblock",
        "div.literalblock",
        "div.listingblock",
        "div.imageblock",
        "div.sect2",
        "div.sect3",
        "div.sect4"
      ]
    }
  ]
};

const parsers = {
  'columns-framed': columnsFramedParser,
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
