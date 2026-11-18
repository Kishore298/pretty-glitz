const assert = require('assert');
const {
  isItemAvailable,
  calculateProductHealth,
  recalculateRollups,
  getProductTier,
} = require('../services/inventoryService');

console.log('🧪 RUNNING STOCK VALIDATION RULES & INVENTORY UNIT TESTS...\n');

// ─── 1. Test isItemAvailable (Table Rule) ───────────────────────────
console.log('Case 1: inStock: false with any count -> REJECT');
assert.strictEqual(isItemAvailable(false, 10).available, false, 'Should reject when inStock: false');
assert.strictEqual(isItemAvailable(false, 0).available, false, 'Should reject when inStock: false');
assert.strictEqual(isItemAvailable(false, null).available, false, 'Should reject when inStock: false');
console.log('  ✓ inStock: false rejected for all counts');

console.log('Case 2: inStock: true with null/undefined count -> ALLOW (legacy untracked)');
const resUntracked = isItemAvailable(true, null, 5);
assert.strictEqual(resUntracked.available, true, 'Legacy untracked item must be available');
assert.strictEqual(resUntracked.isUntracked, true, 'Should flag as untracked');
console.log('  ✓ inStock: true and null/undefined count allowed');

console.log('Case 3: inStock: true with count === 0 -> REJECT (tracked at zero)');
const resZero = isItemAvailable(true, 0, 1);
assert.strictEqual(resZero.available, false, 'Count 0 with inStock: true must REJECT (no overselling)');
console.log('  ✓ inStock: true with count: 0 correctly rejected');

console.log('Case 4: inStock: true with count > 0 -> ALLOW if count >= qty, REJECT if count < qty');
const resSuff = isItemAvailable(true, 10, 5);
assert.strictEqual(resSuff.available, true, 'Should allow when stock >= requested');
const resInsuff = isItemAvailable(true, 3, 5);
assert.strictEqual(resInsuff.available, false, 'Should reject when requested exceeds stock');
console.log('  ✓ count > 0 validated against requestedQty');

// ─── 2. Test calculateProductHealth across Tiers ────────────────────
console.log('\nCase 5: Tier 3 Simple Product Health');
const simpleOutOfStock = { inStock: false, inStockCount: 0, isActive: true };
assert.strictEqual(calculateProductHealth(simpleOutOfStock).status, 'OUT_OF_STOCK');

const simpleLowStock = { inStock: true, inStockCount: 3, lowStockThreshold: 5, isActive: true };
assert.strictEqual(calculateProductHealth(simpleLowStock).status, 'LOW_STOCK');

const simpleInStock = { inStock: true, inStockCount: 20, lowStockThreshold: 5, isActive: true };
assert.strictEqual(calculateProductHealth(simpleInStock).status, 'IN_STOCK');

const simpleUntracked = { inStock: true, inStockCount: null, isActive: true };
assert.strictEqual(calculateProductHealth(simpleUntracked).status, 'UNTRACKED');

const simpleInactive = { inStock: true, inStockCount: 20, isActive: false };
assert.strictEqual(calculateProductHealth(simpleInactive).status, 'INACTIVE');
console.log('  ✓ Simple product health states verified');

console.log('\nCase 6: Tier 1 Designer Glass Bangles Health & Variant Aggregation');
const designerBangle = {
  isActive: true,
  colorVariants: [
    {
      colorName: 'Royal Red',
      inStock: true,
      sizes: [
        { size: '2.4', stockCount: 10, inStock: true },
        { size: '2.6', stockCount: 2, inStock: true }, // Low stock (<= 5)
      ],
    },
    {
      colorName: 'Emerald Green',
      inStock: true,
      sizes: [
        { size: '2.4', stockCount: 15, inStock: true },
        { size: '2.6', stockCount: 0, inStock: false },
      ],
    },
  ],
};
const designerHealth = calculateProductHealth(designerBangle, 5);
assert.strictEqual(designerHealth.status, 'LOW_STOCK', 'Aggregate health should be LOW_STOCK due to size 2.6 with count 2');
assert.strictEqual(designerHealth.totalTrackedStock, 27, 'Total tracked stock should sum to 10+2+15+0 = 27');
console.log('  ✓ Designer glass bangles aggregate health and sum verified (27 total units, status LOW_STOCK)');

// ─── 3. Test recalculateRollups ─────────────────────────────────────
console.log('\nCase 7: Rollup recalculation on zero stock');
const testProductRollup = {
  inStock: true,
  colorVariants: [
    {
      colorName: 'Gold',
      inStock: true,
      sizes: [
        { size: '2.4', stockCount: 0, inStock: true },
        { size: '2.6', stockCount: 0, inStock: true },
      ],
    },
  ],
};
recalculateRollups(testProductRollup);
assert.strictEqual(testProductRollup.colorVariants[0].sizes[0].inStock, false, 'Size 2.4 should be set inStock: false');
assert.strictEqual(testProductRollup.colorVariants[0].inStock, false, 'Color variant Gold should be set inStock: false');
assert.strictEqual(testProductRollup.inStock, false, 'Product should be set inStock: false');
console.log('  ✓ Rollup correctly marks sizes, color variant, and product as out of stock');

console.log('\n🎉 ALL STOCK VALIDATION UNIT TESTS PASSED SUCCESSFULLY!\n');
