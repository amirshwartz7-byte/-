import type { TaskItem, TaskTemplateContent } from "../types";
import { addDays } from "./dateUtils";

export function generateTasksFromMoveDate(
  moveDate: string,
  templates: TaskTemplateContent[]
): Omit<TaskItem, "id">[] {
  return templates.map((tpl) => {
    const due = addDays(moveDate, tpl.offsetDays);
    return {
      templateId: tpl.id,
      title: tpl.title,
      description: tpl.description,
      stage: tpl.stage,
      offsetDays: tpl.offsetDays,
      category: tpl.category,
      linkedProviderCategory: tpl.linkedProviderCategory,
      done: false,
      custom: false,
      dueDate: due.toISOString().slice(0, 10),
    };
  });
}
