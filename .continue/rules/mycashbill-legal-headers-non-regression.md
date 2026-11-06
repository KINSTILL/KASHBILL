---
alwaysApply: true
---

When applying the "legal headers" spec, do not remove existing PDF behaviors: keep `hidePrices` handling (BORDEREAU without prices), `PaymentBadges` in Footer, `formatDateShort`, `locale` prop threading, and `doc.payload.notes`. Merge new ClientBlock/DocumentMeta/components alongside existing logic instead of full replacement when the provided template omits these behaviors. STOP and report if a FIND string is not found. No new dependencies; FR+EN for all UI strings; no `any`.