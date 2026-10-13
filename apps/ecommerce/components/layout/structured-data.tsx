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
      <script
        async
        src="https://www.googletagmanager.com/gtag/js?id=G-ET1FTMXB9X"
      ></script>
      <script
        dangerouslySetInnerHTML={{
          __html: `
              window.dataLayer = window.dataLayer || [];
              function gtag(){dataLayer.push(arguments);}
              gtag('js', new Date());
              gtag('config', 'G-ET1FTMXB9X');
            `,
        }}
      />
    </>
  );
}
