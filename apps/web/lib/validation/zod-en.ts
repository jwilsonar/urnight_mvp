import { z, type ZodErrorMap } from "zod";

/** English Zod defaults for forms backed by the shared contracts package. */
export const zodErrorMapEn: ZodErrorMap = (issue, ctx) => {
  switch (issue.code) {
    case z.ZodIssueCode.invalid_type:
      if (issue.received === "undefined" || issue.received === "null") {
        return { message: "This field is required." };
      }
      return { message: "Invalid value." };

    case z.ZodIssueCode.too_small: {
      const min = issue.minimum as number;
      if (issue.type === "string") {
        return min <= 1
          ? { message: "This field is required." }
          : { message: `Use at least ${min} characters.` };
      }
      if (issue.type === "number")
        return { message: `Must be ${min} or more.` };
      if (issue.type === "array") return { message: `Select at least ${min}.` };
      return { message: "The value is too short." };
    }

    case z.ZodIssueCode.too_big: {
      const max = issue.maximum as number;
      if (issue.type === "string")
        return { message: `Use no more than ${max} characters.` };
      if (issue.type === "number")
        return { message: `Must be ${max} or less.` };
      return { message: "The value is too long." };
    }

    case z.ZodIssueCode.invalid_string:
      if (issue.validation === "email")
        return { message: "Enter a valid email address." };
      if (issue.validation === "url") return { message: "Enter a valid URL." };
      return { message: "Invalid format." };

    case z.ZodIssueCode.invalid_enum_value:
      return { message: "Choose one of the available options." };

    default:
      return { message: ctx.defaultError };
  }
};
