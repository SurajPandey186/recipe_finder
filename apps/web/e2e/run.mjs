/**
 * End-to-end checks for the SvelteKit <-> Stencil integration.
 *
 * The boundary between the app and the published web components is the part of
 * this project most likely to break silently — a component can fail to render
 * while every route still returns 200 and the types still check. So these
 * assertions go past "the page loaded" and inspect the custom elements
 * themselves: that object props arrive as properties rather than stringified
 * attributes, that each custom event is received, that slotted content is
 * projected, and that persisted state survives a reload.
 *
 *   npm run dev                 # in one terminal
 *   npm run test:e2e            # in another
 *
 * Point it at any deployment with BASE:
 *   BASE=https://web-ten-tau-66.vercel.app npm run test:e2e
 *
 * Requires the Chromium binary once: npx playwright install chromium
 */
import { chromium } from 'playwright';

const BASE = process.env.BASE ?? 'http://localhost:5173';
const SHOTS = process.env.SHOTS ?? new URL('./screenshots', import.meta.url).pathname.slice(1);

let pass = 0;
let fail = 0;
const failures = [];

function check(name, ok, detail = '') {
	if (ok) {
		pass++;
		console.log(`  PASS  ${name}`);
	} else {
		fail++;
		failures.push(`${name}${detail ? ' — ' + detail : ''}`);
		console.log(`  FAIL  ${name}${detail ? ' — ' + detail : ''}`);
	}
}

function section(title) {
	console.log(`\n=== ${title} ===`);
}

const browser = await chromium.launch();
const context = await browser.newContext({ viewport: { width: 1400, height: 950 } });
const page = await context.newPage();

const consoleErrors = [];
page.on('console', (m) => {
	if (m.type() === 'error') consoleErrors.push(m.text());
});
page.on('pageerror', (e) => consoleErrors.push(`pageerror: ${e.message}`));

/** Read a property off a custom element in the page — proves props, not attributes. */
const prop = (sel, name) =>
	page.evaluate(([s, n]) => {
		const el = document.querySelector(s);
		return el ? el[n] : undefined;
	}, [sel, name]);

try {
	// ---------------------------------------------------------------- DISCOVERY
	section('Recipe Discovery');
	await page.goto(BASE, { waitUntil: 'networkidle' });

	check('custom elements registered', await page.evaluate(() => !!customElements.get('rf-recipe-card')));

	const cardCount = await page.locator('rf-recipe-card').count();
	check('recipe cards render', cardCount > 0, `found ${cardCount}`);

	// The crux: is `recipe` a real object on the element, or a stringified attribute?
	const recipeProp = await prop('rf-recipe-card', 'recipe');
	check(
		'PROPS: recipe passed as object (not "[object Object]" attribute)',
		recipeProp && typeof recipeProp === 'object' && !!recipeProp.title,
		`typeof=${typeof recipeProp} title=${recipeProp?.title}`
	);

	const catsProp = await prop('rf-search-bar', 'categories');
	check(
		'PROPS: categories passed as array',
		Array.isArray(catsProp) && catsProp.length > 0,
		`isArray=${Array.isArray(catsProp)} len=${catsProp?.length}`
	);

	// Shadow DOM actually painted something
	const firstTitle = await page
		.locator('rf-recipe-card')
		.first()
		.evaluate((el) => el.shadowRoot?.querySelector('.card__title')?.textContent?.trim());
	check('shadow DOM renders the title', !!firstTitle, `"${firstTitle}"`);

	const imgOk = await page
		.locator('rf-recipe-card')
		.first()
		.evaluate((el) => {
			const img = el.shadowRoot?.querySelector('img');
			return img ? img.complete && img.naturalWidth > 0 : false;
		});
	check('card image actually loads', imgOk);

	// SLOT: app-injected button appears inside the card
	const slotted = await page
		.locator('rf-recipe-card')
		.first()
		.evaluate((el) => el.querySelector('[slot="actions"]')?.textContent?.trim());
	check('SLOTS: "actions" slot content projected', !!slotted, `"${slotted}"`);

	await page.screenshot({ path: `${SHOTS}/01-discover.png` });

	// ---------------------------------------------------------------- SEARCH
	section('Search');
	await page.locator('rf-search-bar').evaluate((el) => {
		const input = el.shadowRoot.querySelector('input[type="search"]');
		input.value = 'chicken';
		input.dispatchEvent(new Event('input', { bubbles: true }));
		el.shadowRoot.querySelector('form').requestSubmit();
	});
	await page.waitForURL(/q=chicken/, { timeout: 15000 });
	await page.waitForLoadState('networkidle');
	const searchCount = await page.locator('rf-recipe-card').count();
	check('EVENTS: rfSearch handled → URL updated', page.url().includes('q=chicken'));
	check('search returns results', searchCount > 0, `${searchCount} cards`);
	await page.screenshot({ path: `${SHOTS}/02-search.png` });

	// ---------------------------------------------------------------- FILTER
	section('Filter');
	await page.goto(BASE, { waitUntil: 'networkidle' });
	await page.locator('rf-search-bar').evaluate((el) => {
		const sel = el.shadowRoot.querySelectorAll('select')[0];
		sel.value = 'Seafood';
		sel.dispatchEvent(new Event('change', { bubbles: true }));
	});
	await page.waitForURL(/category=Seafood/, { timeout: 15000 });
	await page.waitForLoadState('networkidle');
	check('EVENTS: rfFilterChange handled → URL updated', page.url().includes('category=Seafood'));
	check('filtered results render', (await page.locator('rf-recipe-card').count()) > 0);

	// ---------------------------------------------------------------- FAVOURITES
	section('Favorites');
	await page.goto(BASE, { waitUntil: 'networkidle' });
	const favTitle = await page
		.locator('rf-recipe-card')
		.first()
		.evaluate((el) => el.shadowRoot.querySelector('.card__title').textContent.trim());

	await page.locator('rf-recipe-card').first().evaluate((el) => {
		el.shadowRoot.querySelector('.card__fav').click();
	});
	await page.waitForTimeout(400);

	const favOn = await page
		.locator('rf-recipe-card')
		.first()
		.evaluate((el) => el.shadowRoot.querySelector('.card__fav').classList.contains('card__fav--on'));
	check('EVENTS: rfFavoriteToggle handled → heart fills', favOn);

	const stored = await page.evaluate(() => JSON.parse(localStorage.getItem('rf:favorites') || '[]'));
	check('favorite persisted to localStorage', stored.length === 1, `${stored.length} stored`);

	await page.goto(`${BASE}/favorites`, { waitUntil: 'networkidle' });
	await page.waitForTimeout(500);
	const favPageTitle = await page
		.locator('rf-recipe-card')
		.first()
		.evaluate((el) => el.shadowRoot.querySelector('.card__title').textContent.trim())
		.catch(() => null);
	check('favorites page lists the recipe', favPageTitle === favTitle, `"${favPageTitle}" vs "${favTitle}"`);

	// Hard reload → survives
	await page.reload({ waitUntil: 'networkidle' });
	await page.waitForTimeout(500);
	check(
		'favorite SURVIVES reload',
		(await page.locator('rf-recipe-card').count()) === 1,
		`${await page.locator('rf-recipe-card').count()} cards after reload`
	);
	await page.screenshot({ path: `${SHOTS}/03-favorites.png` });

	// remove
	await page.locator('rf-recipe-card').first().evaluate((el) => {
		el.shadowRoot.querySelector('.card__fav').click();
	});
	await page.waitForTimeout(400);
	const afterRemove = await page.evaluate(() =>
		JSON.parse(localStorage.getItem('rf:favorites') || '[]')
	);
	check('remove from favorites works', afterRemove.length === 0, `${afterRemove.length} left`);

	// ---------------------------------------------------------------- DETAILS
	section('Recipe Details');
	await page.goto(`${BASE}/recipe/52771`, { waitUntil: 'networkidle' });
	const h1 = await page.locator('h1').first().textContent();
	check('details page heading', h1?.includes('Arrabiata'), `"${h1}"`);
	const ingCount = await page.locator('.ingredients li').count();
	check('ingredients listed', ingCount > 0, `${ingCount} ingredients`);
	const stepCount = await page.locator('.steps li').count();
	check('instructions listed as steps', stepCount > 0, `${stepCount} steps`);
	await page.screenshot({ path: `${SHOTS}/04-details.png`, fullPage: true });

	// ---------------------------------------------------------------- VALIDATION
	section('Recipe Management — validation');
	await page.goto(`${BASE}/my-recipes/new`, { waitUntil: 'networkidle' });
	await page.locator('button[type="submit"]').click();
	await page.waitForTimeout(400);
	const errCount = await page.locator('.field__error').count();
	check('empty submit blocked with inline errors', errCount >= 3, `${errCount} field errors`);
	check('nothing saved on invalid submit', !page.url().includes('/recipe/'), page.url());
	await page.screenshot({ path: `${SHOTS}/05-validation.png` });

	// ---------------------------------------------------------------- CREATE
	section('Recipe Management — create / edit / delete');
	await page.fill('input[type="text"]', 'E2E Test Lemon Pasta');
	await page.locator('input[aria-label="Ingredient 1 name"]').fill('Lemon');
	await page.locator('input[aria-label="Ingredient 1 amount"]').fill('2 whole');
	await page.locator('textarea').fill(
		'Boil the pasta until al dente.\nZest and juice the lemons into warm cream.\nToss together and serve immediately.'
	);
	await page.locator('button[type="submit"]').click();
	await page.waitForURL(/\/recipe\/user-/, { timeout: 15000 });
	check('create recipe saves and redirects', page.url().includes('/recipe/user-'), page.url());
	const createdId = page.url().split('/recipe/')[1];
	const createdH1 = await page.locator('h1').first().textContent();
	check('created recipe renders', createdH1?.includes('E2E Test Lemon Pasta'), `"${createdH1}"`);

	// edit
	await page.goto(`${BASE}/my-recipes/${createdId}/edit`, { waitUntil: 'networkidle' });
	await page.waitForTimeout(500);
	await page.fill('input[type="text"]', 'E2E Renamed Pasta');
	await page.locator('button[type="submit"]').click();
	await page.waitForURL(/\/recipe\/user-/, { timeout: 15000 });
	await page.waitForTimeout(400);
	const editedH1 = await page.locator('h1').first().textContent();
	check('edit recipe persists', editedH1?.includes('E2E Renamed Pasta'), `"${editedH1}"`);

	// user recipe appears in discovery
	await page.goto(BASE, { waitUntil: 'networkidle' });
	await page.waitForTimeout(600);
	const inDiscovery = await page.evaluate(() =>
		[...document.querySelectorAll('rf-recipe-card')].some((el) =>
			el.shadowRoot?.querySelector('.card__title')?.textContent?.includes('E2E Renamed Pasta')
		)
	);
	check('user recipe appears in discovery grid', inDiscovery);

	// ---------------------------------------------------------------- PLANNER
	section('Weekly Meal Planner');
	await page.goto(BASE, { waitUntil: 'networkidle' });
	await page.locator('rf-recipe-card').first().locator('[slot="actions"]').click();
	await page.waitForTimeout(500);

	const modalOpen = await page.locator('rf-modal').evaluate((el) => el.open === true);
	check('SLOTS: rf-modal opens via `open` property', modalOpen);
	const footerSlot = await page
		.locator('rf-modal')
		.evaluate((el) => !!el.querySelector('[slot="footer"]'));
	check('SLOTS: modal "footer" slot projected', footerSlot);
	await page.screenshot({ path: `${SHOTS}/06-plan-modal.png` });

	await page.locator('rf-modal select').first().selectOption('Wednesday');
	await page.locator('rf-modal select').nth(1).selectOption('Dinner');
	await page.locator('rf-modal').getByRole('button', { name: 'Add to plan' }).click();
	await page.waitForTimeout(500);

	const planStored = await page.evaluate(() => JSON.parse(localStorage.getItem('rf:planner') || '{}'));
	check('recipe assigned to Wednesday/Dinner', !!planStored?.Wednesday?.Dinner, JSON.stringify(planStored).slice(0, 90));

	await page.goto(`${BASE}/planner`, { waitUntil: 'networkidle' });
	await page.waitForTimeout(500);
	const slotCount = await page.locator('rf-meal-slot').count();
	check('planner renders 7 days x 3 meals', slotCount === 21, `${slotCount} slots`);

	const mealProp = await page.evaluate(() => {
		const slots = [...document.querySelectorAll('rf-meal-slot')];
		const filled = slots.find((s) => s.meal);
		return filled ? { day: filled.day, slot: filled.slotName, title: filled.meal.title } : null;
	});
	check(
		'PROPS: meal object reaches rf-meal-slot',
		mealProp?.day === 'Wednesday' && mealProp?.slot === 'Dinner',
		JSON.stringify(mealProp)
	);
	await page.screenshot({ path: `${SHOTS}/07-planner.png` });

	// MODIFY: swap the recipe already in a filled slot, in place
	const beforeSwap = await page.evaluate(
		() => JSON.parse(localStorage.getItem('rf:planner')).Wednesday.Dinner.title
	);
	await page.evaluate(() => {
		const filled = [...document.querySelectorAll('rf-meal-slot')].find((s) => s.meal);
		filled.shadowRoot.querySelector('.slot__change').click();
	});
	await page.waitForURL(/assign=.*replacing=1/, { timeout: 15000 });
	check('MODIFY: swap control navigates with replacing flag', page.url().includes('replacing=1'));
	await page.waitForLoadState('networkidle');
	const swapBanner = await page.locator('.assign-banner').textContent();
	check('MODIFY: banner says swapping', /Swapping/i.test(swapBanner ?? ''), `"${swapBanner?.trim()}"`);

	// pick a different recipe than the one already there
	await page.evaluate((current) => {
		const cards = [...document.querySelectorAll('rf-recipe-card')];
		const other = cards.find(
			(c) => c.shadowRoot?.querySelector('.card__title')?.textContent?.trim() !== current
		);
		other.querySelector('[slot="actions"]').click();
	}, beforeSwap);
	await page.waitForURL(/\/planner/, { timeout: 15000 });
	await page.waitForTimeout(600);
	const afterSwap = await page.evaluate(
		() => JSON.parse(localStorage.getItem('rf:planner')).Wednesday.Dinner.title
	);
	check(
		'MODIFY: slot now holds a different recipe',
		afterSwap && afterSwap !== beforeSwap,
		`"${beforeSwap}" -> "${afterSwap}"`
	);
	const stillOne = await page.evaluate(() => {
		const p = JSON.parse(localStorage.getItem('rf:planner'));
		return Object.values(p).reduce((n, d) => n + Object.keys(d ?? {}).length, 0);
	});
	check('MODIFY: swap replaced rather than added', stillOne === 1, `${stillOne} slots filled`);

	// remove planned meal
	await page.evaluate(() => {
		const filled = [...document.querySelectorAll('rf-meal-slot')].find((s) => s.meal);
		filled.shadowRoot.querySelector('.slot__remove').click();
	});
	await page.waitForTimeout(500);
	const afterPlanRemove = await page.evaluate(() =>
		JSON.parse(localStorage.getItem('rf:planner') || '{}')
	);
	check('EVENTS: rfRemove clears the slot', !afterPlanRemove?.Wednesday?.Dinner);

	// assign-from-empty-slot flow
	await page.evaluate(() => {
		const empty = [...document.querySelectorAll('rf-meal-slot')].find((s) => !s.meal);
		empty.shadowRoot.querySelector('.slot__empty').click();
	});
	await page.waitForURL(/assign=/, { timeout: 15000 });
	check('EVENTS: rfAssign navigates to picker', page.url().includes('assign='), page.url());
	await page.waitForLoadState('networkidle');
	const bannerVisible = await page.locator('.assign-banner').isVisible().catch(() => false);
	check('assign banner shown', bannerVisible);

	// ---------------------------------------------------------------- DELETE
	section('Delete');
	await page.goto(`${BASE}/my-recipes`, { waitUntil: 'networkidle' });
	await page.waitForTimeout(500);
	await page.getByRole('button', { name: 'Delete' }).first().click();
	await page.waitForTimeout(400);
	const delModal = await page
		.locator('rf-modal[heading="Delete recipe?"]')
		.evaluate((el) => el.open === true);
	check('delete confirmation modal opens', delModal);
	await page
		.locator('rf-modal[heading="Delete recipe?"]')
		.getByRole('button', { name: 'Delete' })
		.click();
	await page.waitForTimeout(500);
	const remaining = await page.evaluate(() =>
		JSON.parse(localStorage.getItem('rf:user-recipes') || '[]')
	);
	check('delete removes the user recipe', remaining.length === 0, `${remaining.length} left`);

	// ---------------------------------------------------------------- CONSOLE
	section('Console health');
	const realErrors = consoleErrors.filter(
		(e) => !/favicon|404 \(Not Found\).*favicon/i.test(e)
	);
	check('no console errors', realErrors.length === 0, realErrors.slice(0, 3).join(' | '));
} catch (err) {
	fail++;
	failures.push(`EXCEPTION: ${err.message}`);
	console.log(`\n  EXCEPTION: ${err.message}`);
	await page.screenshot({ path: `${SHOTS}/99-exception.png` }).catch(() => {});
} finally {
	await browser.close();
	console.log(`\n${'='.repeat(60)}`);
	console.log(`RESULT: ${pass} passed, ${fail} failed`);
	if (failures.length) {
		console.log('\nFAILURES:');
		failures.forEach((f) => console.log(`  - ${f}`));
	}
	console.log('='.repeat(60));
	process.exit(fail > 0 ? 1 : 0);
}
