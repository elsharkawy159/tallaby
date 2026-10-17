import { classicTemplateMigrationSql } from "../src/templates/classic-sql";

process.stdout.write(classicTemplateMigrationSql(process.argv[2] ?? "NNNN_tallaby_classic_template_v2.sql"));
