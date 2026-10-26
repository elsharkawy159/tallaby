// Disabled 2026-10-27: storefront templates and the section library come from the codebase only
// (owner; @workspace/store-sections). The templates, template_versions and library_sections tables
// were dropped (0109). The original code is kept below, commented out, for reference.
export {};

// import { getCodeTemplate, templatesSeedSql } from "../src/templates/catalog";
//
// // `template:sql <key>[,<key>…] <file>`: one template, or a batch in one migration.
// const [keys = "", file = "NNNN_template.sql"] = process.argv.slice(2);
// const templates = keys.split(",").map((key) => {
//   const template = getCodeTemplate(key);
//   if (!template) {
//     process.stderr.write(`Unknown template "${key}"\n`);
//     process.exit(1);
//   }
//   return template;
// });
// process.stdout.write(templatesSeedSql(templates, file));
//
