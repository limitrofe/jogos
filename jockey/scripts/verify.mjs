import { chromium, devices } from "playwright";

const url = process.argv[2] ?? "http://localhost:5173";
const runs = [
  { name: "desktop", viewport: { width: 1440, height: 920 }, deviceScaleFactor: 1 },
  { name: "mobile", ...devices["iPhone 13"] },
];

const browser = await chromium.launch();
const failures = [];

for (const run of runs) {
  const context = await browser.newContext(run);
  const page = await context.newPage();
  page.setDefaultTimeout(60000);
  page.setDefaultNavigationTimeout(60000);
  const consoleErrors = [];
  page.on("console", (message) => {
    if (message.type() === "error") consoleErrors.push(message.text());
  });
  page.on("pageerror", (error) => consoleErrors.push(error.message));

  await page.goto(url, { waitUntil: "networkidle" });
  await page.waitForSelector("#race-canvas");
  await page.waitForSelector(".horse-card");
  await page.screenshot({ path: `artifacts/${run.name}-selection.png`, fullPage: true, timeout: 60000 });

  const hasSelection = await page.locator("text=Jockey Club").isVisible();
  if (!hasSelection) failures.push(`${run.name}: selection title missing`);

  await page.locator(".horse-card").first().click();
  await page.waitForSelector("#hud:not(.hidden)");
  const raceUntil = Date.now() + 5000;
  while (Date.now() < raceUntil) {
    await page.keyboard.press("Space");
    await page.waitForTimeout(190);
  }
  await page.screenshot({ path: `artifacts/${run.name}-race.png`, fullPage: true, timeout: 60000 });

  const energyVisible = await page.locator("#energy-text").isVisible();
  const paceVisible = await page.locator("#pace-value").isVisible();
  const wearVisible = await page.locator("#wear-text").isVisible();
  if (!energyVisible || !paceVisible || !wearVisible) {
    failures.push(`${run.name}: HUD did not render expected controls`);
  }
  const energyValue = Number.parseFloat(await page.locator("#energy-text").innerText());
  if (!Number.isFinite(energyValue) || energyValue >= 99.8) {
    failures.push(`${run.name}: energy did not decrease after race release (${energyValue})`);
  }

  const canvasStats = await page.evaluate(() => {
    const canvas = document.querySelector("#race-canvas");
    const sample = document.createElement("canvas");
    sample.width = 80;
    sample.height = 50;
    const ctx = sample.getContext("2d", { willReadFrequently: true });
    ctx.drawImage(canvas, 0, 0, sample.width, sample.height);
    const data = ctx.getImageData(0, 0, sample.width, sample.height).data;
    let nonBlack = 0;
    const colors = new Set();
    for (let i = 0; i < data.length; i += 16) {
      const r = data[i];
      const g = data[i + 1];
      const b = data[i + 2];
      if (r + g + b > 24) nonBlack += 1;
      colors.add(`${r >> 4},${g >> 4},${b >> 4}`);
    }
    return { nonBlack, colors: colors.size };
  });

  if (canvasStats.nonBlack < 300 || canvasStats.colors < 8) {
    failures.push(`${run.name}: canvas looks blank (${JSON.stringify(canvasStats)})`);
  }

  if (consoleErrors.length) {
    failures.push(`${run.name}: console errors: ${consoleErrors.join(" | ")}`);
  }

  await context.close();
}

await browser.close();

if (failures.length) {
  console.error(failures.join("\n"));
  process.exit(1);
}

console.log("Browser verification passed for desktop and mobile.");
