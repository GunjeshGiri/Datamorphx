/**
 * Single source of truth for site-wide, legal and compliance constants.
 *
 * Before going live, replace every value marked `TODO(legal)` with the real
 * details. Indian IT Rules 2021, Rule 3(2) require the *name* and contact
 * details of the Grievance Officer to be published prominently.
 */

export const SITE_NAME = 'DataMorphX';
export const SITE_URL = 'https://datamorphx.com';
export const GITHUB_URL = 'https://github.com/GunjeshGiri/Datamorphx';

/** Shown at the top of every legal page. Update whenever a policy changes. */
export const LEGAL_LAST_UPDATED = '5 October 2026';

export const GRIEVANCE_OFFICER = {
    // TODO(legal): IT Rules 2021 require a real, named individual here.
    name: 'Grievance Officer',
    designation: 'Data Protection & Grievance Officer, DataMorphX',
    email: 'grievance@datamorphx.com',
    // TODO(legal): replace with the full postal address.
    address: '[Insert City, State], India',
    /**
     * IT Rules 2021, Rule 3(2)(a): acknowledge within 24 hours, resolve within
     * 15 days. These are stricter than the DPDP Rules, so meeting them
     * satisfies both regimes.
     */
    acknowledgeWithin: '24 hours',
    resolveWithin: '15 days',
} as const;

export const SECURITY_CONTACT = {
    email: 'security@datamorphx.com',
    acknowledgeWithin: '24 hours',
} as const;

export const GOVERNING_JURISDICTION = 'New Delhi, India';
