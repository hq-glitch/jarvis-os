import type {
  AutomationAction,
  AutomationLevel,
} from "@/lib/jarvis/automation-engine";

export type AutomationDecision = {
  action: AutomationAction;
  level: AutomationLevel;
  canExecuteAutomatically: boolean;
  requiresApproval: boolean;
  reason: string;
};

export function applyAutomationPolicy(
  action: AutomationAction,
): AutomationDecision {
  switch (action.type) {
    case "STALE_TASK":
      return {
        action,
        level: "SUGGEST",
        canExecuteAutomatically: false,
        requiresApproval: false,
        reason:
          "Stale work should be reviewed before Jarvis changes or closes it.",
      };

    case "OVERDUE_TASK":
      return {
        action,
        level: "SUGGEST",
        canExecuteAutomatically: false,
        requiresApproval: false,
        reason:
          "Overdue tasks need a human decision about whether to do, reschedule, or drop them.",
      };

    case "UPCOMING_DEADLINE":
      return {
        action,
        level: "SUGGEST",
        canExecuteAutomatically: false,
        requiresApproval: false,
        reason:
          "Deadline warnings are advisory; Jarvis should not change the underlying task automatically.",
      };

    case "HIGH_PRIORITY_TASK":
      return {
        action,
        level: "SUGGEST",
        canExecuteAutomatically: false,
        requiresApproval: false,
        reason:
          "Priority recommendations should remain advisory.",
      };

    default:
      return {
        action,
        level: "APPROVAL_REQUIRED",
        canExecuteAutomatically: false,
        requiresApproval: true,
        reason:
          "Unknown or consequential automation requires explicit approval.",
      };
  }
}
