import { providers } from "../src/data/providers";
import { taskTemplates } from "../src/data/taskTemplates";

function sqlStr(v: string | undefined | null): string {
  if (v === undefined || v === null) return "null";
  return `'${v.replace(/'/g, "''")}'`;
}

const providerLines = providers.map((p) => {
  return `(${sqlStr(p.id)}, ${sqlStr(p.category)}, ${sqlStr(p.name)}, ${p.rating}, ${sqlStr(
    p.priceTag
  )}, ${p.avgPrice}, ${sqlStr(p.dealTag)}, ${sqlStr(p.description)}, ${sqlStr(
    p.phone
  )}, ${sqlStr(p.logoEmoji)})`;
});

const providersSql = `insert into public.providers (id, category, name, rating, price_tag, avg_price, deal_tag, description, phone, logo_emoji)
values
${providerLines.join(",\n")}
on conflict (id) do nothing;`;

const templateLines = taskTemplates.map((t) => {
  return `(${sqlStr(t.id)}, ${sqlStr(t.title)}, ${sqlStr(t.description)}, ${sqlStr(
    t.stage
  )}, ${t.offsetDays}, ${sqlStr(t.category)}, ${sqlStr(t.linkedProviderCategory)})`;
});

const templatesSql = `insert into public.task_templates (id, title, description, stage, offset_days, category, linked_provider_category)
values
${templateLines.join(",\n")}
on conflict (id) do nothing;`;

console.log("-- providers seed\n" + providersSql + "\n");
console.log("-- task templates seed\n" + templatesSql + "\n");
