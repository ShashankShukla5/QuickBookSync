const {deltaSyncCustomer, deltaSyncEmployee, deltaSyncVendor, deltaSyncItem, deltaSyncPriceLevel} = require('./syncHelp')

async function deltaSyncCustomers(customers) {
  const results = await Promise.all(
    customers.map((c) => deltaSyncCustomer(c))
  );
  console.log("✅ All customers synced:", results);
  return results;
}

async function deltaSyncEmployees(employees) {
  const results = await Promise.all(
    employees.map((c) => deltaSyncEmployee(c))
  );
  console.log("✅ All customers synced:", results);
  return results;
}

async function deltaSyncVendors(vendors) {
  const results = await Promise.all(
    vendors.map((c) => deltaSyncVendor(c))
  );
  console.log("✅ All customers synced:", results);
  return results;
}

async function deltaSyncItems(items) {
  const results = await Promise.all(
    items.map((c) => deltaSyncItem(c))
  );
  console.log("✅ All customers synced:", results);
  return results;
}

async function deltaSyncPriceLevels(priceLevels) {
  const results = await Promise.all(
    priceLevels.map((c) => deltaSyncPriceLevel(c))
  );
  console.log("✅ All customers synced:", results);
  return results;
}

module.exports = {
    deltaSyncCustomers,
    deltaSyncEmployees,
    deltaSyncVendors,
    deltaSyncItems,
    deltaSyncPriceLevels
}