# Accessibility commitment

SAMS V2 aims to be usable by people with different abilities, devices, and input methods. Accessibility is part of feature review, not a one-time finish-line task. The project does not currently claim WCAG conformance; that requires a documented audit of the released product and its complete workflows.

## Product expectations

- Support keyboard navigation, visible focus, logical heading order, and meaningful button/link names.
- Associate form labels and instructions with inputs; announce validation and asynchronous status changes to assistive technology.
- Use semantic HTML and accessible names for icon-only controls.
- Preserve contrast and do not use color alone to express attendance, error, or authorization state.
- Keep layouts usable at narrow viewports and browser zoom; avoid hover-only interactions.
- Ensure QR scanning has an understandable failure path and an accessible alternative where institution policy permits. Do not make the QR image itself the only way to learn whether a check-in succeeded.
- Respect reduced-motion preferences and avoid unnecessary animation.
- Format dates and times with the institution timezone and expose the meaning of ambiguous local times.

## Review and testing

For user-facing changes, contributors should check keyboard-only operation, focus order, form labels and error messages, mobile reflow, and at least one screen-reader flow where practical. Automated accessibility tools can help identify common problems but cannot replace manual testing. Include accessibility impact in pull requests; report barriers through the project's issue tracker without posting private student information.

The maintainers should record a manual accessibility audit and any known limitations before calling an MVP release accessible or claiming a conformance level.
