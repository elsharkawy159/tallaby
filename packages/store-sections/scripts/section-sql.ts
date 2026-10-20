import { DESIGNS } from "../src/designs";
import { librarySectionsSeedSql } from "../src/library/section-seed";

// `section:sql`: the library_sections seed (one insert-only row per design) on stdout.
process.stdout.write(librarySectionsSeedSql(DESIGNS));
