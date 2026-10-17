import { JsonLd } from "@/components/seo/json-ld";
import {
  generateWebsiteStructuredData,
  generateOrganizationStructuredData,
} from "@/lib/structured-data";

export function Scripts() {
  const websiteData = generateWebsiteStructuredData();
  const organizationData = generateOrganizationStructuredData();

  return (
    <>
      <JsonLd data={websiteData} />
      <JsonLd data={organizationData} />
    </>
  );
}
