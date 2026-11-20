# Attendance Performance Baseline

Use this report after deploying the measurement release. Record aggregate timings from synthetic accounts only. Leave identity, course, session, token, URL, and device identifiers out of this file.

## Test setup

| Field                      | Value                                                                                       |
| -------------------------- | ------------------------------------------------------------------------------------------- |
| Test date                  | _Fill in_                                                                                   |
| Release commit             | _Fill in_                                                                                   |
| Mobile browser and version | _Fill in_                                                                                   |
| Device category            | _Phone / tablet; do not include a device serial or advertising ID_                          |
| Network type               | _Wi-Fi / cellular; do not include an IP address or network name_                            |
| Scan path                  | _SAMS in-app scanner / native Camera app_                                                   |
| Synthetic-account setup    | _Dedicated demo section and synthetic student/faculty accounts; no account names or emails_ |
| Check-in attempts          | _At least 10 per scan path and browser_                                                     |

## Timing summary

Report milliseconds as shown by the diagnostics panel. Calculate p50 and p95 over repeated attempts. Keep the first camera launch separate from warm launches.

| Browser and scan path | Camera startup p50 / p95 | QR decode p50 / p95 | Claim round trip p50 / p95 | Server auth p50 / p95 | Server database p50 / p95 | Server total p50 / p95 |
| --------------------- | -----------------------: | ------------------: | -------------------------: | --------------------: | ------------------------: | ---------------------: |
| _Cold in-app scan_    |                        — |                   — |                          — |                     — |                         — |                      — |
| _Warm in-app scans_   |                        — |                   — |                          — |                     — |                         — |                      — |
| _Native Camera link_  |                      n/a |                 n/a |                          — |                     — |                         — |                      — |

| Browser                           | QR token request p50 / p95 | QR render p50 / p95 | Roster request p50 / p95 | Roster update p50 / p95 | Roster poll interval | Student success to faculty row visible p50 / p95 |
| --------------------------------- | -------------------------: | ------------------: | -----------------------: | ----------------------: | -------------------: | -----------------------------------------------: |
| _First supported mobile browser_  |                          — |                   — |                        — |                       — |                    — |                                                — |
| _Second supported mobile browser_ |                          — |                   — |                        — |                       — |                    — |                                                — |

## Outcomes

| Outcome                                    | Count |
| ------------------------------------------ | ----: |
| Successful first check-ins                 |     — |
| Already-recorded responses                 |     — |
| Expired or rejected QR codes               |     — |
| Camera permission or availability failures |     — |
| Network failures                           |     — |
| Faculty roster failures                    |     — |

## Observations

- **Largest measured stage:** _Fill in_
- **Cold versus warm camera difference:** _Fill in_
- **Roster update behavior:** _Fill in_
- **Browser differences:** _Fill in_
- **Next optimization to investigate:** _Choose one stage and cite its measured p50/p95_

## Repeatable procedure

1. Use a dedicated synthetic course section and synthetic student and faculty accounts on the deployed HTTPS site. Do not use real institutional users, attendance sessions, or class records.
2. Open the student scan page with the exact `diagnostics=1` query parameter. Open the faculty live-session page with the same opt-in. The flag only displays local timing information; it does not authorize a request.
3. Keep both devices on the same network for each paired run. Start the first scan from a cold browser/camera launch, then run at least nine warm scans. Repeat the same run in a second supported mobile browser.
4. Record the timings and coarse result shown in the diagnostics disclosure. Do not save screenshots or copy URLs if they contain a session identifier or token.
5. For roster visibility, one observer starts a stopwatch when the student's success message appears and stops it when the new row appears on the faculty screen. Do not compare timestamps from the two devices.
6. Close the synthetic attendance session after the run. Attendance records from check-ins remain part of the audit history; do not delete records as part of this measurement.
7. Remove `diagnostics=1` when returning to the normal demo. Verify the diagnostics disclosure is absent.

## Privacy review

Before committing a completed report, verify it contains only aggregate durations and counts. Remove names, emails, user IDs, section/session IDs, QR tokens, full URLs, raw error text, IP addresses, network names, precise device identifiers, and identifiable screenshots.
