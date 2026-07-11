import { taskTemplates } from "../data/taskTemplates";
import type { TaskItem, TaskTemplateContent } from "../types";
import { addDays } from "./dateUtils";

export function generateTasksFromMoveDate(
  moveDate: string,
  contentOverrides: TaskTemplateContent[] = []
): TaskItem[] {
  const overrideMap = new Map(contentOverrides.map((c) => [c.id, c]));
  return taskTemplates.map((tpl) => {
    const due = addDays(moveDate, tpl.offsetDays);
    const override = overrideMap.get(tpl.id);
    return {
      id: tpl.id,
      title: override?.title ?? tpl.title,
      description: override?.description ?? tpl.description,
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

export function defaultTaskTemplateContent(): TaskTemplateContent[] {
  return taskTemplates.map((t) => ({
    id: t.id,
    title: t.title,
    description: t.description,
  }));
}
