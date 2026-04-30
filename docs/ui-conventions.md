# UI conventions

This document captures reusable UI decisions so product-level styling and interaction rules do not get lost in PRs.

## Controls

- Inputs, selects, and textareas are rounded by default (`rounded-lg`) unless a screen has a documented exception.
- Standard field controls should use consistent height and border treatment across forms.
- Select controls should reserve right-side padding for native/custom arrow affordance (for example, `pr-10`).

## Field Layout And Spacing

- Keep a consistent vertical rhythm for label, control, helper text, and error text.
- Keep helper/error text concise and directly tied to the field.

## Typography And Labels

- Use clear, user-facing labels with plain language.
- Helper text should explain format expectations when inputs are constrained.

## Interaction States

- Maintain consistent hover/focus/disabled/error states for controls and action buttons.
- Validation errors should be surfaced near the field and avoid ambiguous wording.

## Input Constraints

- All text inputs should define explicit `maxLength` constraints unless a field is intentionally unbounded and documented as an exception.

## Conditional Sections

- When one selection controls later fields, include short explainer text and visually group dependent controls.
- Hidden conditional fields should not remain implicitly required.

## Decision Log

- 2026-04-29: Inputs/selects/textareas should be rounded by default.
- 2026-04-29: Select controls should include extra right padding for arrow affordance spacing.
