import graphJson from "../src/data/nanjing-culture-knowledge.json";
import { validateKnowledgeGraph } from "../src/lib/culture/validate";
import type { KnowledgeGraphData } from "../src/lib/culture/types";

const result = validateKnowledgeGraph(graphJson as KnowledgeGraphData);
console.log(JSON.stringify(result.stats, null, 2));
for (const warning of result.warnings) console.warn(`WARN ${warning}`);
for (const error of result.errors) console.error(`ERROR ${error}`);
if (result.errors.length) process.exitCode = 1;
