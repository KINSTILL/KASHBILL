---
title: "Privacy Policy"
version: "1.2"
effectiveDate: "2026-11-09"
---

# Privacy Policy

**Last updated:** November 9, 2026 · **Version 1.2**

In accordance with **Cameroonian Law No. 2024/017 of December 23, 2024** on the protection of personal data.

---

## 1. Data Controller

The Data Controller is:

- **Dany Mouelnjock**, sole proprietor
- **Address:** Douala, Cameroon
- **NIU:** P118816334425R
- **Contact:** support@mycashbill.app

**No separate Data Protection Officer (DPO) is designated.** Any request relating to personal data must be addressed to support@mycashbill.app.

---

## 2. Dual role: Controller and Processor

### 2.1 — Data Controller (account data)

The Publisher is **Data Controller** for the User's account data: phone number, hashed PIN, profile, technical logs, subscription history.

### 2.2 — Processor (End Customer data)

The Publisher acts as **sole technical Processor** for End Customer data entered by the User in documents (names, addresses, tax identifiers, amounts).

**The User is the sole Data Controller** of this data. The User warrants having the necessary rights and consents to process it. The Publisher undertakes to:

- process this data only according to the User's instructions;
- never use it for its own purposes (marketing, resale);
- delete it upon simple written request;
- notify any breach to the User within 48 hours.

---

## 3. Data collected

### 3.1 — Account identification data

- **Phone number** (unique login identifier)
- **6-digit PIN hashed** with the **argon2id** algorithm (never stored in plain text, never accessible even by the Publisher)
- **Display name, company name, city** (optional)
- **Email address** (optional, used only for subscription invoices and support)
- **Hashed recovery codes** (argon2id, never stored in plain text)
- **Tax identifiers** (NIU, RCCM, legal form, legal address — optional, entered by the User)

### 3.2 — Editing data (content created by the User)

- Text data entered in documents (client names, descriptions, prices, taxes, amounts, notes)
- Custom logo, signature, stamp, header and footer
- User's custom Terms and Conditions

### 3.3 — Subscription payment data

- Subscription transaction history (amount, date, status, Notch Pay reference)
- **No complete banking data is stored** (card number, CVV, Mobile Money PIN). This data is processed exclusively by Notch Pay.

### 3.4 — Technical and security data

- **IP address** (retained for a maximum of 90 days, for security and fraud prevention)
- **User-Agent** (browser, device)
- **Device ID** (device identifier for session management)
- **Technical logs** (errors, API requests, timestamps)
- **Audit logs** (sensitive actions: registration, login, revocation, recovery)

### 3.5 — Data NOT collected

The Publisher **does NOT collect**: GPS location data, biometric data, health data, political/religious/trade union data, complete banking data, data of minors under 18 years old.

---

## 4. Legal bases for processing

| Type of data | Legal basis |
|---|---|
| Phone, PIN, name, company name, city | **Performance of the contract** |
| Email address | **Performance of the contract** (invoices, security notifications) |
| Tax identifiers (NIU, RCCM) | **Performance of the contract** (document generation) |
| End Customer data | **Performance of the contract** (generation at the User's request) |
| Subscription history | **Legal obligation** (10-year accounting retention) |
| Audit logs | **Legitimate interest** (security, fraud prevention) |
| IP address, User-Agent | **Legitimate interest** (security, abuse prevention) |
| Analytics cookies | **Consent** (opt-in, revocable) |

---

## 5. Purposes of processing

1. **Account creation and management**: registration, authentication, profile
2. **Service provision**: document generation, storage and sharing
3. **Subscription management**: payment, invoicing, renewal
4. **Customer support**: responding to requests via support@mycashbill.app
5. **Security**: fraud prevention, abuse detection
6. **Legal obligations**: retention of invoices, cooperation with authorities upon requisition
7. **Service improvement** (with consent): aggregated and anonymized statistical analysis

**No data is used for commercial prospecting, resale or profiling without explicit consent.**

---

## 6. Recipients and processors

The Publisher **does not sell, rent or market any personal data**.

Data is hosted or processed only by essential technical processors:

### 6.1 — Hosting

- **Contabo GmbH** — Aschauer Straße 32a, 81549 München, Germany
- **Server location:** Germany (European Union)
- **Role:** hosting the application and database

### 6.2 — Subscription payment

- **Notch Pay** — licensed payment aggregator (Cameroon)
- **Role:** processing Mobile Money and credit card transactions
- **Note:** Notch Pay is the sole Data Controller for banking data collected directly from the User

### 6.3 — Transactional emails

- **Resend** — emailing service (United States)
- **Role:** sending subscription invoices and security notifications
- **Note:** Resend only has access to the email address and the content of the email sent

### 6.4 — Authorities

Data may be communicated to **competent Cameroonian or international authorities** upon judicial or administrative requisition, within the strict limits provided by law.

---

## 7. International transfers

| Processor | Country | Guarantees |
|---|---|---|
| Contabo GmbH | Germany (EU) | Adequate level of protection recognized by Law No. 2024/017 |
| Resend | United States | EU Standard Contractual Clauses (SCC) |

In accordance with **Article 44 of Law No. 2024/017**, the Publisher ensures that any transfer outside Cameroon benefits from appropriate guarantees.

---

## 8. Retention periods

| Type of data | Duration |
|---|---|
| Active account | As long as the account exists |
| Deleted account (soft delete) | **30 days** (recovery possible) then anonymization |
| Generated documents (free plan) | **30 days** |
| Generated documents (Pro plan) | **365 days** |
| Audit logs | **12 months** |
| Technical logs (IP, errors) | **90 days** |
| Subscription invoices | **10 years** (accounting and tax obligation) |
| Notch Pay payment data | Managed by Notch Pay according to its own policy |
| Analytics cookies | **12 months** maximum |
| Used recovery codes | Deleted immediately after use |

**Data is effectively deleted upon expiration of these periods by a daily automated process.** PDF files associated with expired documents are also deleted from storage.

---

## 9. Security

### 9.1 — Technical measures

- **Communication encryption**: HTTPS/TLS mandatory
- **Secret hashing**: PIN and recovery codes with **argon2id**
- **Encryption at rest**: signatures, logos and stamps are encrypted on disk with **AES-256-GCM**
- **Session cookies**: signed JWT, httpOnly cookies
- **CSRF protection**: mandatory X-Requested-With header on mutations
- **Rate limiting**: limiting authentication attempts and abuse
- **Immutable audit log**: traceability of all sensitive actions (DB trigger)
- **Backups**: database backed up daily

### 9.2 — Organizational measures

- Access to data restricted to what is strictly necessary
- No access by the Publisher to PIN or recovery codes (hashed)
- Documented incident response procedure

### 9.3 — Limits

**No system is infallible.** The Publisher cannot guarantee absolute security. In case of a breach, the Publisher undertakes to notify affected Users as soon as possible.

---

## 10. Data breach

In case of a personal data breach, the Publisher undertakes to:

1. **Notify the competent Cameroonian supervisory authority** within **72 hours** of becoming aware of it (Article 41 of Law No. 2024/017).
2. **Inform affected Users** as soon as possible (email + in-app notification) if the breach is likely to result in a high risk to their rights.
3. **Document the incident** in an internal register.
4. **Implement corrective measures** necessary to limit the impact and prevent recurrence.

---

## 11. User rights

In accordance with Law No. 2024/017, the User has the following rights:

- **Access**: obtain a copy of their data (JSON or CSV format)
- **Rectification**: correct any inaccurate or incomplete data
- **Erasure** (right to be forgotten): deletion of data, subject to legal retention obligations (subscription invoices: 10 years)
- **Restriction**: temporary suspension of processing
- **Objection**: object to processing for legitimate reasons
- **Portability**: receive data in a structured, machine-readable format
- **Withdrawal of consent**: at any time, for processing based on consent

**To exercise these rights:** support@mycashbill.app

**The Publisher responds within a maximum of 30 days** from receipt of the request. In case of a complex request, this period may be extended by 30 additional days, with prior information.

---

## 12. Cookies

The use of cookies is detailed in the **Cookie Policy** accessible at https://mycashbill.app/en/legal/cookies.

The User may at any time manage their preferences via the cookie banner or their browser settings.

---

## 13. Minors

The Service is **strictly reserved for persons aged 18 and over**. The Publisher does not knowingly collect data from minors. If the Publisher discovers that an account was created by a minor, it will proceed with immediate deletion.

---

## 14. Supervisory authority and right to complain

In accordance with Law No. 2024/017, the User has the right to lodge a complaint with the **competent Cameroonian supervisory authority for personal data protection** if they believe, after contacting the Publisher, that their rights are not respected.

The User is invited to first contact the Publisher at **support@mycashbill.app** to seek an amicable solution.

---

## 15. Modification of the Policy

The Publisher reserves the right to **modify this Policy at any time**, in particular to comply with legal, regulatory or technical developments.

The version in force is the one published at the date of consultation. Major changes will be notified to registered Users. Continued use of the Service after modification constitutes acceptance of the new Policy.

---

## 16. Limitation of liability

To the fullest extent permitted by applicable law, the **total and cumulative liability** of Dany Mouelnjock towards a User, in connection with the processing of personal data, is **strictly limited to the lower of the following two amounts**:

- **(a)** the total amount actually paid by the User during the **twelve (12) months** preceding the triggering event of the damage;
- **(b)** an absolute cap of **ten thousand (10,000) CFA francs**.

For users of the free plan, this cap is **zero (0) CFA francs**.

This limitation **does not apply** in case of gross negligence or wilful misconduct, fraud, or violation of a mandatory legal provision.

---

## 17. Contact

For any question relating to this Policy:

- **Email:** support@mycashbill.app
- **Address:** Dany Mouelnjock — MyCashBill, Douala, Cameroon
- **NIU:** P118816334425R
