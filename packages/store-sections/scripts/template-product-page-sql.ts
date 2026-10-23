import { writeFileSync } from "node:fs";
import { CODE_TEMPLATES } from "../src/templates/catalog";
import { templatesProductPageSql } from "../src/templates/product-page-sql";

// `template:product-page-sql <output-path>`: writes the migration adding every template's product page.
// It writes the file itself so package-manager banners on stdout can never end up in the SQL.
const [output] = process.argv.slice(2);
if (!output) {
  process.stderr.write("Usage: template:product-page-sql <output-path>\n");
  process.exit(1);
}
const name = output.split(/[\/]/).pop() ?? output;
writeFileSync(output, templatesProductPageSql(CODE_TEMPLATES, name));
