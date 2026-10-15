// Joins the class names that are set
export const cx = (...classNames: Array<string | false | null | undefined>) => classNames.filter(Boolean).join(" ");
