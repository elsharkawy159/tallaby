import { CODE_TEMPLATES } from "../src/templates/catalog";
import { templatesProductPageSql } from "../src/templates/product-page-sql";

// `template:product-page-sql [file]`: the migration adding every template's product page to the database.
const [file = "0101_template_product_pages.sql"] = process.argv.slice(2);
process.stdout.write(templatesProductPageSql(CODE_TEMPLATES, file));
