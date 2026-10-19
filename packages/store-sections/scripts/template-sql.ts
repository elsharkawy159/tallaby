import { getCodeTemplate, templateSeedSql } from "../src/templates/catalog";

const [key = "", file = "NNNN_template.sql"] = process.argv.slice(2);
const template = getCodeTemplate(key);
if (!template) {
  process.stderr.write(`Unknown template "${key}"\n`);
  process.exit(1);
}
process.stdout.write(templateSeedSql(template, file));
