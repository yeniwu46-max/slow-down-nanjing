async (page) => {
  await page.getByRole('button', { name: /玄武湖/ }).click();
  await page.waitForTimeout(2500);
  const text = await page.locator('body').innerText();
  return {
    canvas: await page.locator('canvas').count(),
    hasHint: text.includes('轻点湖面'),
    snippet: text.replace(/\s+/g, ' ').slice(0, 280),
  };
}
