# WP6.3.1 — Close selected task details

The selected Gantt summary now has an accessible Close button. It clears selection only; selecting the same or another bar opens the summary again. Passive Escape also dismisses it. An active remaining-effort edit or confirmation receives Escape first. Close is disabled while that summary has an unsubmitted effort edit, and unrelated task-table drafts retain their value and focus.

Dismissal preserves chart mode, scale, horizontal scroll and all persisted data. Focus returns to Go to start without activating that control. The button remains keyboard usable at 600px.

Validation: lint, typecheck, 341 unit/component tests and production build passed. The browser suite includes four new dismissal tests. Older inspection selectors now use exact accessible names to distinguish details from the new Close button.

Owner check (30 seconds): select a bar, enter Remaining Effort, press Escape once to cancel the draft, then again to dismiss. Select the bar again, use Close, and confirm zoom/scroll and effort/status are retained.

The owner's current request explicitly authorizes continuing immediately into WP6.4 and testing both together; this supersedes the document's intermediate acceptance gate. Main and the protected pre-progress tag remain unchanged.
