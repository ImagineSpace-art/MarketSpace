CREATE TABLE public.marketspace_terms (
  version INTEGER PRIMARY KEY CHECK (version > 0),
  content TEXT NOT NULL CHECK (length(trim(content)) >= 100),
  published_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  published_by UUID REFERENCES auth.users(id) ON DELETE SET NULL
);

ALTER TABLE public.marketspace_terms ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can read MarketSpace terms"
  ON public.marketspace_terms FOR SELECT TO anon, authenticated
  USING (true);

CREATE POLICY "Admins can publish MarketSpace terms"
  ON public.marketspace_terms FOR INSERT TO authenticated
  WITH CHECK (
    published_by = auth.uid()
    AND EXISTS (
      SELECT 1 FROM public.store_admins
      WHERE user_id = auth.uid() AND role = 'admin'
    )
  );

GRANT SELECT ON public.marketspace_terms TO anon, authenticated;
GRANT INSERT ON public.marketspace_terms TO authenticated;

INSERT INTO public.marketspace_terms (version, content)
VALUES (1, $terms$MARKETSPACE TERMS OF SERVICE
Version 1 — Draft for project use

1. About MarketSpace
MarketSpace is an online marketplace that helps people discover stores, products, services, and advertisements and contact the people who offer them. MarketSpace provides the platform; unless a page clearly says otherwise, the seller and buyer make and complete their own transaction.

2. Accounts and honest information
Keep your sign-in details secure and provide accurate information. You are responsible for activity carried out through your account. Tell MarketSpace if you believe someone else has accessed it. Store and seller applications may require identity or contact checks before approval.

3. Seller responsibilities
You are responsible for the items and services you offer, the accuracy of your descriptions and prices, your stock, customer communication, delivery or meetup arrangements, and the policies you show to customers. Your published store policies must be clear, lawful, and consistent with these platform terms. Do not promise something you cannot provide.

4. Prohibited and misleading content
Do not list illegal, unsafe, counterfeit, stolen, or otherwise prohibited items or services. Do not impersonate another person or business, mislead users, manipulate views or clicks, harass people, or use MarketSpace to commit fraud. MarketSpace may remove content or restrict accounts that appear to violate these rules.

5. Buyer responsibilities and transactions
Check the listing, seller, price, condition, delivery or meetup plan, and seller policies before agreeing to buy. Unless MarketSpace expressly offers a checkout or payment service for a transaction, payment, delivery, returns, and disputes are arranged between the buyer and seller. MarketSpace does not guarantee a user's identity, a listing's accuracy, product quality, delivery, or a transaction's outcome.

6. Ads and engagement
Views and clicks are engagement measurements, not guaranteed sales or income. An advertisement does not earn a reward or payment unless MarketSpace separately announces a rewards program and its eligibility rules.

7. Fees and payments
These terms do not require a seller to pay MarketSpace or require MarketSpace to pay a seller. If MarketSpace introduces a fee, payment feature, or rewards program, it will explain the applicable terms before the feature is used.

8. Moderation and availability
MarketSpace may review, decline, remove, or limit stores, listings, ads, or accounts to protect users and enforce these terms. We will make reasonable efforts to operate the service, but do not promise it will always be available or error-free.

9. Privacy
MarketSpace handles personal information under its Privacy Policy. Do not publish another person's private information without permission. Information submitted for identity or store review may be visible to authorized reviewers and handled for the stated verification and safety purposes.

10. Changes and account restrictions
MarketSpace may update these terms. When a material update is published, the new version and effective date will be shown, and users may be asked to accept it before continuing. MarketSpace may suspend or close access for serious or repeated violations, while taking applicable law into account.

11. Contact and important notice
Use the support options provided in MarketSpace to ask questions or report a concern. This project draft is a plain-language description of platform rules, not legal advice. Have qualified counsel review it and add the operator's legal identity, governing law, dispute process, and required consumer disclosures before production use.$terms$)
ON CONFLICT (version) DO NOTHING;
