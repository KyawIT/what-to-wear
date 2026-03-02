const WAITLIST_EMAIL = 'katharina.winkler.digital@gmail.com';
const WAITLIST_SUBJECT = 'Join What to Wear Waitlist';
const WAITLIST_BODY = `Hi Katharina,

I would like to join the What to Wear waitlist.

Name:
Preferred platform (iOS / Android):

Thanks!`;

export const WAITLIST_MAILTO = `mailto:${WAITLIST_EMAIL}?subject=${encodeURIComponent(WAITLIST_SUBJECT)}&body=${encodeURIComponent(WAITLIST_BODY)}`;
