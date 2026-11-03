# **Tallaby — Development & Product Roadmap**

Act as a Senior Full-Stack Engineer, Product Architect, and UI/UX Engineer working on the Tallaby monorepo.

Your responsibility is to review the existing implementation, understand the architecture, and execute the following improvements while maintaining code quality, performance, scalability, and consistency.

**Important instructions:**

* Inspect the existing codebase before making changes.  
* Reuse existing components, utilities, patterns, and architecture wherever possible.  
* Avoid unnecessary dependencies and duplicated logic.  
* Ensure all features work on desktop and mobile.  
* Preserve existing functionality and backward compatibility.  
* Do not implement major architectural changes without understanding their impact.  
* Test changes and fix any regressions before considering a task complete.

---

## **1\. Seller Dashboard (`apps/dashboard`)**

### **1.1 Product Management**

* Simplify stock management when updating orders. Make stock adjustments faster and require minimal input.  
* Improve the Add/Edit Product experience, especially on mobile screens.  
* Fix and redesign the product variants UI on mobile to make it intuitive and easy to use.  
* Improve the overall usability and responsiveness of product management.

### **1.2 Dashboard Performance**

* Implement server-side pagination for products.  
* Fetch only 20 products per page by default instead of loading the entire catalog.  
* Allow sellers to change the page size to 20, 50, 100, or more.  
* Optimize database queries and avoid unnecessary data fetching.  
* Improve caching strategies and cache revalidation.  
* Review server components, client components, and data-fetching patterns to identify performance bottlenecks.

### **1.3 Seller Onboarding & Guided Setup**

Implement a progressive onboarding experience for new sellers.

On the seller's first dashboard visit, guide them through these steps in sequence:

1. **Add your first product**  
   * After 5 seconds, display a Sonner notification from the top: "Add your first product".  
2. **Choose a theme**  
   * After the first product is successfully added, wait 5 seconds and display a top-positioned onboarding banner.  
3. **Configure shipping**  
   * After choosing a theme, guide the seller to configure shipping settings.  
4. **Publish your website**  
   * After completing shipping settings, guide the seller to publish their storefront.

Requirements:

* Each step should appear only after the previous step is completed.  
* Persist onboarding progress so it survives page refreshes and new sessions.  
* Do not repeatedly show completed steps.  
* Make the experience helpful without interrupting normal dashboard workflows.

### **1.4 Shipping & Delivery**

* Redesign and improve the Shipping page.  
* Allow sellers to create custom delivery areas using AI.  
* Sellers should be able to describe their delivery coverage in natural language.  
* AI should convert their descriptions into structured delivery areas and shipping configurations.  
* Allow sellers to review and edit AI-generated configurations before saving.

### **1.5 Store Policies**

* Make Return and Replacement policies clearly accessible on every storefront.  
* Each storefront must display its own seller-specific policies.  
* Do not redirect customers to Tallaby's global `/shipping` or `/returns` pages.  
* Never redirect customers from a seller storefront to Tallaby's marketplace for these policies.  
* Keep customers within the seller's storefront experience.

### **1.6 Seller Apps Marketplace**

Build a dedicated Apps page for discovering and managing seller applications.

**Page structure:**

* Two primary tabs:  
  * Installed Apps  
  * Explore Apps  
* Explore Apps should include a categorized sidebar on desktop.  
* On mobile, replace the sidebar with a tab-based navigation experience.

**App categorization:**

* Organize apps into relevant categories.  
* Support apps installed by default and apps installed manually by sellers.

**App monetization:**  
Support multiple pricing models:

* Free.  
* One-time purchase.  
* Monthly subscription.  
* Per-order fee.  
* Usage-based pricing (per action or time unit).

### **1.7 Themes:**

Make each theme to have more important default info like Store Meta title/description as fallback incase seller didn’t add his SEO meta title/description, for the default theme meta title/description, use the store name in the title/description, e.g (“Buy Fashion from \${store\_name} now \| Tallaby”)

For paid usage, deduct the applicable amount from the seller's wallet.

Design the architecture to support additional pricing models and applications in the future.

## 

## **2\. Storefront (`apps/dashboard` \+ `apps/ecommerce`)**

### **2.1 Storefront Animations**

Expand and improve the existing animation system.

Requirements:

* Introduce more professional, smooth, and polished animations.  
* Improve transitions between sections and interactive elements.  
* Support consistent animations across storefront themes.  
* Prioritize performance and avoid unnecessary animation overhead.  
* Respect reduced-motion accessibility preferences.  
* Ensure animations work smoothly on both desktop and mobile.

### **2.2 Storefront Banner**

Fix storefront banner sizing and responsiveness.

Requirements:

* Correct banner dimensions and aspect ratios on desktop and mobile.  
* Prevent image distortion and unexpected cropping.  
* Ensure consistent visual presentation across different screen sizes and themes.

### **2.3 Product Stock**

Research and implement support for unlimited stock on product pages.

Requirements:

* Allow sellers to mark products as having unlimited stock.  
* Ensure unlimited-stock products are not incorrectly marked as out of stock.  
* Review the impact on product variants, cart validation, and order processing.

---

## 

## 

## **3\. Tallaby Public Website (`apps/ecommerce`)**

### **3.1 Homepage Improvements**

Redesign and improve the Tallaby homepage.

Requirements:

* Improve the visual hierarchy, layout, and overall user experience.  
* Showcase real screenshots of the seller dashboard.  
* Use authentic product screenshots rather than generic dashboard mockups.  
* Clearly communicate Tallaby's value proposition and key features.  
* Improve conversion-focused sections and calls to action.  
* Make the homepage responsive and visually consistent with Tallaby's brand identity.

### **3.2 SEO Improvements**

Improve SEO across Tallaby's public website.

Focus on:

* Technical SEO.  
* Metadata and page titles.  
* Structured data and schema markup.  
* Canonical URLs.  
* Internal linking.  
* Sitemap and robots.txt.  
* Open Graph and social sharing metadata.  
* Page performance and Core Web Vitals.  
* Search engine indexing and crawlability.

Prioritize improvements that can increase organic traffic and attract sellers.

---

## 

## 

## **4\. Global AI Store Builder (`apps/ecommerce` \+ `apps/dashboard`)**

### **4.1 AI-Powered Store Creation**

Plan and develop a global AI chatbot on Tallaby.com that can create a complete, ready-to-use seller store through a conversational experience.

The seller should be able to provide all necessary information directly through the chat.

**Information collected through the conversation:**

* Store name and business details.  
* Industry and business category.  
* Store description.  
* Logo and brand assets.  
* Social media links.  
* Contact information.  
* Products and product descriptions.  
* Product images.  
* Pricing and inventory details.  
* Shipping and delivery information.  
* Return and replacement policies.  
* Other information required to configure the store.

**Expected AI behavior:**

1. Start a conversation and understand the seller's business.  
2. Collect missing information through relevant questions.  
3. Accept uploaded images, logos, and product photos.  
4. Generate professional product descriptions and organize products into appropriate categories.  
5. Configure the store's branding and initial theme.  
6. Configure shipping and delivery settings.  
7. Generate the necessary store policies.  
8. Create and configure the storefront using the collected information.  
9. Validate the generated store and identify missing information.  
10. Present the completed store to the seller for review and publication.

**Final objective:**

A new seller should be able to create a fully configured, professional storefront through one AI conversation, with minimal manual work.

### **4.2 AI Cost Optimization**

Cost efficiency is a primary requirement, make it cost less credits..

Research and evaluate:

* Available AI models.  
* Model selection and task routing.  
* Token consumption.  
* Image generation and image processing costs.  
* Prompt optimization.  
* Context management.  
* Caching and reusable outputs.  
* Multi-step versus single-step generation.  
* Quality versus cost trade-offs.

Do not compromise the quality of the generated storefront just to achieve a lower cost.

**Deliverable before implementation:**  
A cost analysis showing the estimated cost per completed store, including the assumptions and expected token/image usage.

The target is to achieve the best possible storefront quality at the lowest practical cost.

---

## **5\. Tallaby Pricing System & Subscription System**

Refactor the existing pricing page and subscription model into two plans: Free and Pro.

### **Free Plan**

* Unlimited Products/Orders  
* 100 AI Credit per month.  
* AI actions shared across the entire seller account, not per user or team member.  
* 0.03 USD fee per created order.  
* Access to the free features.

### **Pro Plan**

* 2000 AI Credit per month (x20).  
* AI actions shared across the entire seller account.  
* 29 USD/month subscription.  
* Zero platform order commission.

### **Implementation Requirements**

* Refactor the pricing page to clearly communicate the differences.  
* Update subscription and billing logic.  
* Implement monthly AI action limits and usage tracking.  
* Ensure AI usage is shared across the seller account.  
* Implement order fee calculations based on the seller's active plan.  
* Ensure plan upgrades and downgrades are handled correctly.  
* Enforce limits on the backend, not only the frontend.  
* Ensure the seller can clearly see their plan and remaining AI actions.  
* Make the wallet to be in \$ instead of EGP  
* When user top-up, all top-up prices in \$, minimum top-up is \$5, max is \$1000, user pays in EGP  
* Find the currency conversion to show the user the equalivity of \$ in EGP  
* 1 AI Credit \= 1 Action

---

## 

## 

## **6\. Admin Dashboard (`apps/admin`)**

### **6.1 AI Usage & Cost Display**

Improve the AI usage reporting interface.

Requirements:

* Display AI usage costs in USD.  
* Display the approximate equivalent amount in EGP beside the USD amount.  
* Example: `$0.50 (~25 EGP)`.  
* Use a consistent and centralized currency conversion mechanism.  
* Make it clear that the EGP amount is an estimate.  
* Avoid hardcoding exchange rates across components.  
* Display the AI average cost per call over all stores (globally)

---

## 

## 

## **7\. Research & Product Strategy**

### **7.1 Salla Marketing & Product Research**

Research Salla's seller onboarding and store customization experience.

Focus on:

* How sellers configure their stores.  
* How store design and branding are organized.  
* How shipping and delivery settings work.  
* How social media integrations are presented.  
* How seller onboarding is structured.

Use the findings to improve Tallaby's seller experience.

**Proposed seller customization journey:**

1. Theme selection.  
2. Brand design system customization.  
3. Shipping and delivery configuration.  
4. Return and replacement policy configuration.  
5. Social media integration.

Identify opportunities to simplify this journey and make it more intuitive.

Do not blindly copy competitors. Adapt useful ideas to Tallaby's architecture and target market.

---

## **8\. Marketing**

### **8.1 Question & Answer Video Content**

Prioritize Question & Answer-style videos in Tallaby's marketing strategy.

Focus on:

* Common questions from online sellers.  
* Problems sellers face when starting an online store.  
* E-commerce tips and educational content.  
* Demonstrating how Tallaby solves specific problems.  
* Addressing objections and misconceptions.  
* Short-form videos suitable for Facebook, Instagram, and TikTok.

Develop content that educates sellers, demonstrates product value, and drives registrations.

---

## **9\. Execution Guidelines & Prioritization**

Work through the roadmap in a structured way.

For each task:

1. Inspect the relevant existing implementation.  
2. Identify affected applications, components, database tables, actions, and APIs.  
3. Identify dependencies and potential breaking changes.  
4. Propose an implementation approach.  
5. Implement the changes.  
6. Test functionality and responsive behavior.  
7. Check for regressions.  
8. Report completed work and any remaining issues.

### **Prioritization**

**P0 — Critical**

* Seller dashboard performance.  
* Product management and mobile UX.  
* AI image upload fix.  
* Shipping page improvements.  
* Store policy and redirect fixes.

**P1 — Core Product Improvements**

* Seller onboarding guidance.  
* Homepage redesign.  
* Storefront banner fixes.  
* Storefront animation system.  
* Pricing and subscription refactoring.  
* SEO improvements.

**P2 — New Features**

* Global AI Store Builder.  
* Seller Apps Marketplace.  
* AI-powered delivery area configuration.  
* Unlimited stock support.

**P3 — Research & Growth**

* Salla product research.  
* Marketing Q\&A video strategy.  
* Admin AI cost reporting improvements.

### **Final Rule**

Do not attempt to implement the entire roadmap in one uncontrolled change.

Work on one feature or logical group at a time. Keep the implementation production-ready, maintainable, and consistent with the existing Tallaby architecture.

