import { CODE_TEMPLATES, templatesMetaSql } from "../src/templates/catalog";

// `template:meta-sql`: the UPDATE statements that fill `templates.meta` (appended to migration 0087).
process.stdout.write(templatesMetaSql(CODE_TEMPLATES));
