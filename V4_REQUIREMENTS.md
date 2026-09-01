# V4 Requirements Documentation

## 29. Partner Pricing & Subscription Plans

### Objective

The *Become a Partner* journey must include a dedicated *Pricing Plans* section so businesses can clearly understand the available plans, compare features, and choose the plan that best fits their business before creating an account.

Pricing should be visible in multiple places throughout the platform to improve conversion and encourage upgrades.

---

## Pricing Section Locations

Display pricing plans on:

* **Homepage** (Pricing Section)
* **Become a Partner Page** (Before Registration Form)
* **Partner Dashboard → My Plan** (Current & Upgrade Options)
* **Upgrade Plan Page** (Standalone)

The design should match the premium brand style with white rounded cards, purple/teal accents, subtle gradients and elegant typography.

---

## Subscription Plans

### 🟢 Free Plan

**Best for new businesses**

**Price:** Free

**Includes:**
* ✅ Basic Business Profile
* ✅ Business Description
* ✅ Contact Information
* ✅ WhatsApp Button
* ✅ Google Maps Location
* ✅ Opening Hours
* ✅ Up to 10 Gallery Images
* ✅ List Services
* ✅ Receive Booking Requests
* ✅ Receive Customer Requests
* ✅ Basic Search Visibility
* ✅ Basic Dashboard
* ✅ Basic Analytics

**CTA Button:** `Start Free`

---

### 🟣 Pro Plan

**Best for growing businesses**

**Price:** PKR 2,999 / Month *(Admin Editable)*

**Everything in Free plus:**
* ✅ Priority Search Ranking
* ✅ Unlimited Gallery Images
* ✅ Unlimited Services
* ✅ Customer Reviews Display
* ✅ Advanced Booking Management
* ✅ Quote Management
* ✅ Advanced Analytics
* ✅ Social Media Links
* ✅ Featured Profile Badge
* ✅ Business Performance Insights
* ✅ Promotional Campaign Access

**CTA:** `Upgrade to Pro`

---

### 👑 Featured Plan

**Maximum Visibility & Growth**

**Price:** PKR 5,999 / Month *(Admin Editable)*

**Everything in Pro plus:**
* ✅ Homepage Featured Listing
* ✅ Top Search Results Placement
* ✅ Category Priority Placement
* ✅ Premium Featured Badge
* ✅ Higher Search Visibility
* ✅ Seasonal Promotions
* ✅ Homepage Banner Placement
* ✅ Priority Customer Leads
* ✅ Premium Analytics Dashboard
* ✅ Priority Support (24/7)

**CTA:** `Become Featured`

---

## Feature Comparison Table

| Feature | Free | Pro | Featured |
|---------|------|-----|----------|
| Business Profile | ✅ | ✅ | ✅ |
| Booking Requests | ✅ | ✅ | ✅ |
| Customer Requests | ✅ | ✅ | ✅ |
| Quote Responses | ❌ | ✅ | ✅ |
| Gallery | 10 Photos | Unlimited | Unlimited |
| Services | Limited | Unlimited | Unlimited |
| Customer Reviews | ❌ | ✅ | ✅ |
| Analytics | Basic | Advanced | Premium |
| Search Priority | ❌ | ✅ | ✅ |
| Featured Badge | ❌ | ✅ | ✅ |
| Homepage Promotion | ❌ | ❌ | ✅ |
| Priority Support | ❌ | ❌ | ✅ |

---

## Partner Registration Flow

```
Become a Partner
     ↓
View Pricing Plans
     ↓
Compare Features
     ↓
Choose Plan
     ↓
Create Account
     ↓
Business Information
     ↓
Business Category
     ↓
Upload Photos
     ↓
Business Details
     ↓
Availability / Services
     ↓
Verification Documents
     ↓
Submit Application
     ↓
Admin Approval
     ↓
Partner Dashboard
```

---

## Upgrade & Downgrade

Partners should be able to upgrade or downgrade their subscription anytime from the dashboard.

**Dashboard should include:**
* Current Plan
* Renewal Date
* Upgrade Plan Button
* Downgrade Plan Button
* Billing History
* Payment History
* Active Subscription Status

---

## Admin Panel Features

Admin should be able to:

* ✅ Create Plans
* ✅ Edit Plan Features
* ✅ Change Monthly Price
* ✅ Change Yearly Price
* ✅ Activate/Deactivate Plans
* ✅ View Active Subscribers
* ✅ View Expired Plans
* ✅ Send Renewal Reminders
* ✅ Approve Manual Payments
* ✅ View Revenue Reports

---

## UI/UX Requirements

The Pricing section should include:

* Premium white pricing cards with rounded corners
* Teal/Purple highlights and accents
* "Most Popular" badge on Pro Plan
* Elegant typography (Plus Jakarta Sans)
* Smooth hover animations
* Monthly / Yearly billing toggle *(future-ready)*
* Side-by-side feature comparison
* FAQ section
* "Need Help Choosing?" support section
* Clear, prominent call-to-action buttons

---

## Design Instruction for Stitch

> Design the pricing page similar to modern SaaS platforms. Use three premium pricing cards (Free, Pro, Featured) with:
> 
> - White backgrounds with soft shadows
> - Rounded corners (24-32px)
> - Teal/Purple accent colors
> - Comparison table below
> - Strong, prominent CTA buttons
> - "Most Popular" badge on the Pro Plan
> - The pricing section must appear on the Homepage, Become a Partner page, and Partner Dashboard
> - All prices must be editable by the Admin without changing the code
> - Use Plus Jakarta Sans font for headings
> - Match the existing brand colors: #003527 (teal), #cca72f (gold), #1a1c1c (dark), white background

---

## Implementation Checklist

- [ ] Create PricingPlans component
- [ ] Add PricingPlans to BecomeSellerPage (before form)
- [ ] Add PricingPlans to HomePage
- [ ] Create Pricing management in Admin Dashboard
- [ ] Add subscription status to Vendor type
- [ ] Create subscription database/storage layer
- [ ] Add payment integration for upgrades
- [ ] Create Upgrade flow with payment
- [ ] Add pricing to SellerDashboard
- [ ] Create billing history page
- [ ] Add renewal reminders
- [ ] Test all pricing flows

