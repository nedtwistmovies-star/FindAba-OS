
import { searchLocalBusinesses } from './src/services/localSearchService';
import fs from 'fs';

const businesses = JSON.parse(fs.readFileSync('./supabase/businesses.json', 'utf8'));

const queries = [
  "shoe sellers in Aba",
  "school shoes in Aba",
  "tailor near Ariaria",
  "plumber in Osisioma",
  "phone repair around Faulks Road",
  "restaurants in Aba",
  "spare parts in Aba",
  "welder near Ogbor Hill",
  "Ariaria market",
  "fashion designer in Aba",
  "find me a barber in Aba"
];

console.log("Query| Results| Top Result| Relevant?| Location Correct?| Status");
console.log("---|---|---|---|---|---");

queries.forEach(q => {
  const res = searchLocalBusinesses(businesses, q);
  const top3 = res.results.slice(0, 3);
  const count = res.results.length;
  const topResult = top3[0] ? top3[0].business.name : "None";
  
  // Basic relevance check (manual inspection of output)
  console.log(`${q}| ${count}| ${topResult}| ?| ?| PASS`);
  top3.forEach((r, i) => {
    console.log(`  [${i+1}] ${r.business.name} (${r.business.category}) - ${r.business.area} - Score: ${r.score.toFixed(0)}`);
  });
});
