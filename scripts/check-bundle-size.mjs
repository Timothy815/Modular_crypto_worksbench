import { readdirSync, statSync } from 'node:fs';
import { join } from 'node:path';

const distAssetsDir = join(process.cwd(), 'dist', 'assets');

const thresholds = {
  index: 322 * 1024, // raised narrowly for the shipped local-document/durability line plus reusable ownership/dependency visibility ergonomics
  react: 210 * 1024,
  maxChunk: 420 * 1024, // raised narrowly for the shipped AES/ECC teaching line plus the new ECC validation-consequence seeded content without forcing premature demo-data splitting
};

function formatKiB(bytes) {
  return `${(bytes / 1024).toFixed(1)} KiB`;
}

const jsFiles = readdirSync(distAssetsDir)
  .filter((fileName) => fileName.endsWith('.js'))
  .map((fileName) => ({
    fileName,
    size: statSync(join(distAssetsDir, fileName)).size,
  }));

const largestChunk = jsFiles.reduce((largest, current) =>
  current.size > largest.size ? current : largest,
);
const indexChunk = jsFiles.find((file) => file.fileName.startsWith('index-')) ?? null;
const reactChunk = jsFiles.find((file) => file.fileName.startsWith('react-')) ?? null;

const failures = [];

if (!indexChunk) {
  failures.push('Missing main index chunk in dist/assets.');
} else if (indexChunk.size > thresholds.index) {
  failures.push(
    `Main app chunk ${indexChunk.fileName} is ${formatKiB(indexChunk.size)}, above ${formatKiB(
      thresholds.index,
    )}.`,
  );
}

if (!reactChunk) {
  failures.push('Missing React vendor chunk in dist/assets.');
} else if (reactChunk.size > thresholds.react) {
  failures.push(
    `React chunk ${reactChunk.fileName} is ${formatKiB(reactChunk.size)}, above ${formatKiB(
      thresholds.react,
    )}.`,
  );
}

if (largestChunk.size > thresholds.maxChunk) {
  failures.push(
    `Largest JS chunk ${largestChunk.fileName} is ${formatKiB(
      largestChunk.size,
    )}, above ${formatKiB(thresholds.maxChunk)}.`,
  );
}

if (failures.length > 0) {
  console.error('Bundle size guard failed:');
  for (const failure of failures) {
    console.error(`- ${failure}`);
  }
  process.exit(1);
}

console.log(
  `Bundle size guard passed. index=${formatKiB(indexChunk.size)} react=${formatKiB(
    reactChunk.size,
  )} largest=${formatKiB(largestChunk.size)}`,
);
