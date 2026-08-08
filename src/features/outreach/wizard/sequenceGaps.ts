/**
 * How long the sequence waits between emails, in working days.
 *
 * The defaults live here rather than in the step that draws them because the
 * page has to save them too: the timeline states "wait 4 working days" whether
 * or not anyone pressed a button, and a number shown that confidently has to be
 * the number stored.
 */
export const DEFAULT_ADVANCER_GAP = 3
export const DEFAULT_CLOSER_GAP = 4

/** Same day is not a gap; two months is not a sequence. */
export const MIN_GAP = 1
export const MAX_GAP = 60
