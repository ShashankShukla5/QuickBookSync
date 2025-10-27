const xml2js = require('xml2js');

async function parseCustomerResponse(qbxmlResponse) {
  const parser = new xml2js.Parser({ explicitArray: false, ignoreAttrs: false });

  try {
    const result = await parser.parseStringPromise(qbxmlResponse);
    
    const customerData = [];
    const customerRet = result?.QBXML?.QBXMLMsgsRs?.CustomerQueryRs?.CustomerRet;

    if (!customerRet) return customerData;

    // Ensure we always work with an array
    const customers = Array.isArray(customerRet) ? customerRet : [customerRet];

    customers.forEach((c) => {
      customerData.push({
        ListID: c.ListID || null,
        "Full Name": c.FullName || null,
        "Bill To": c.CompanyName || null,
        "Job Name": c.Name || null,
        IsActive: c.IsActive === 'true',
        Class: c.ClassRef ? c.ClassRef.FullName : null,
        // JobStatus: c.JobStatus || null,
        "Job Type": c.JobType || null,
        "Customer Name": c.ParentRef ? c.ParentRef.FullName : null
      });
    });

    return customerData;
  } catch (err) {
    console.error("Error parsing Customer QBXML response:", err);
    return [];
  }
}

// xmlParser.js
async function parseEmployeeResponse(qbxmlResponse) {
  console.log("Parsing Employee Response...");
  
  if (!qbxmlResponse || typeof qbxmlResponse !== 'string') {
    console.warn("Invalid employee response received");
    return [];
  }

  const parser = new xml2js.Parser({ explicitArray: false, ignoreAttrs: false });

  try {
    const result = await parser.parseStringPromise(qbxmlResponse);
    
    const employeeData = [];
    const employeeRet = result?.QBXML?.QBXMLMsgsRs?.EmployeeQueryRs?.EmployeeRet;

    if (!employeeRet) {
      console.warn("⚠️ No EmployeeRet found in response");
      return employeeData;
    }

    const employees = Array.isArray(employeeRet) ? employeeRet : [employeeRet];

    employees.forEach((emp) => {
      const payrollInfo = emp.EmployeePayrollInfo;
      
      let earningsRates = [];
      let workCompCode = null;
      let className = null;

      if (payrollInfo) {
        if (payrollInfo.Earnings) {
          const earnings = Array.isArray(payrollInfo.Earnings) 
            ? payrollInfo.Earnings 
            : [payrollInfo.Earnings];
          
          earningsRates = earnings.map(e => {
            const wageName = e.PayrollItemWageRef?.FullName || 
                           e.PayrollItemWageRef?.ListID || 
                           'Unknown';
            
            const hourlyRate = e.Rate || e.HourlyRate;
            const annualSalary = e.AnnualSalary;
            
            return {
              WageName: wageName,
              HourlyRate: hourlyRate ? parseFloat(hourlyRate) : null,
              AnnualSalary: annualSalary ? parseFloat(annualSalary) : null,
              RateType: hourlyRate ? 'Hourly' : annualSalary ? 'Salary' : 'Unknown'
            };
          });
        }

        workCompCode = payrollInfo.WorkersCompCodeRef?.FullName || null;
        
        className = payrollInfo.ClassRef?.FullName || null;
      }

      // Helper function to parse ISO 8601 duration (PT0H0M0S) to hours
      const parseHours = (duration) => {
        if (!duration || typeof duration !== 'string') return 0;
        
        // Match PT<hours>H<minutes>M<seconds>S format
        const match = duration.match(/PT(\d+)H(\d+)M(\d+)S/);
        if (!match) return 0;
        
        const hours = parseInt(match[1]) || 0;
        const minutes = parseInt(match[2]) || 0;
        const seconds = parseInt(match[3]) || 0;
        
        return hours + (minutes / 60) + (seconds / 3600);
      };

      employeeData.push({
        ListID: emp.ListID || null,
        Name: emp.Name || null,
        FirstName: emp.FirstName || null,
        LastName: emp.LastName || null,
        IsActive: emp.IsActive === 'true',
        
        PrimaryEarningsRate: earningsRates[0]?.WageName || null,
        PrimaryHourlyRate: earningsRates[0]?.HourlyRate || null,
        PrimaryRateType: earningsRates[0]?.RateType || null,
        
        AllEarningsRates: earningsRates,
        EarningsCount: earningsRates.length,
        
        WorkCompCode: workCompCode,
        
        PayPeriod: payrollInfo?.PayPeriod || null,
        ClassName: className,
      });
    });

    console.log(`Parsed ${employeeData.length} employees with payroll info`);
    return employeeData;
    
  } catch (err) {
    console.error("Error parsing Employee QBXML response:", err);
    return [];
  }
}

async function parseVendorResponse(qbxmlResponse) {
  const parser = new xml2js.Parser({ explicitArray: false, ignoreAttrs: false });

  try {
    const result = await parser.parseStringPromise(qbxmlResponse);

    const vendorData = [];
    const vendorRet = result?.QBXML?.QBXMLMsgsRs?.VendorQueryRs?.VendorRet;

    if (!vendorRet) return vendorData;

    const vendors = Array.isArray(vendorRet) ? vendorRet : [vendorRet];

    vendors.forEach(v => {
      vendorData.push({
        ListID: v.ListID || null,
        Name: v.Name || null,
        CompanyName: v.CompanyName || null,
        IsActive: v.IsActive === "true",
        VendorTaxIdent: v.VendorTaxIdent || null,
        IsVendorEligibleFor1099: v.IsVendorEligibleFor1099 === "true",
        Terms: v.TermsRef?.FullName || null,
        Balance: parseFloat(v.Balance || 0),
        Address: {
          Addr1: v.VendorAddress?.Addr1 || null,
          Addr2: v.VendorAddress?.Addr2 || null,
          City: v.VendorAddress?.City || null,
          State: v.VendorAddress?.State || null,
          PostalCode: v.VendorAddress?.PostalCode || null,
        }
      });
    });

    return vendorData;
  } catch (err) {
    console.error("Error parsing Vendor QBXML response:", err);
    return [];
  }
}

async function parseItemResponse(qbxmlResponse) {
  
  if (!qbxmlResponse || typeof qbxmlResponse !== 'string') {
    console.warn("⚠️ Invalid item response received");
    return [];
  }

  const parser = new xml2js.Parser({ 
    explicitArray: false, 
    ignoreAttrs: false,
    mergeAttrs: true 
  });

  try {
    const result = await parser.parseStringPromise(qbxmlResponse);
    
    const itemData = [];
    const itemQueryRs = result?.QBXML?.QBXMLMsgsRs?.ItemQueryRs;

    // console.dir(itemQueryRs.ItemSalesTaxGroupRet, {depth: null})

    if (!itemQueryRs) {
      console.warn("No ItemQueryRs found in response");
      return itemData;
    }

    // QuickBooks returns different item types with different element names
    const itemTypes = [
      'ItemServiceRet',
      'ItemInventoryRet',
      'ItemNonInventoryRet',
      'ItemInventoryAssemblyRet',
      'ItemFixedAssetRet',
      'ItemOtherChargeRet',
      'ItemSubtotalRet',
      'ItemDiscountRet',
      'ItemPaymentRet',
      'ItemSalesTaxRet',
      'ItemSalesTaxGroupRet',
      'ItemGroupRet'
    ];

    // Collect all items from different types
    itemTypes.forEach(itemType => {
      if (itemQueryRs[itemType]) {
        const items = Array.isArray(itemQueryRs[itemType]) 
          ? itemQueryRs[itemType] 
          : [itemQueryRs[itemType]];

        items.forEach(item => {
          // if(itemType == "ItemOtherChargeRet")
          itemData.push(parseIndividualItem(item, itemType));
        });
      }
    });

    console.log(`Parsed ${itemData.length} items`);
    
    // Log summary by type
    const typeSummary = itemData.reduce((acc, item) => {
      acc[item.Type] = (acc[item.Type] || 0) + 1;
      return acc;
    }, {});
    console.log("Items by type:", typeSummary);

    return itemData;
    
  } catch (err) {
    console.error("Error parsing Item QBXML response:", err);
    return [];
  }
}

function parseIndividualItem(item, itemType) {
  // Determine item type from the Ret element name
  const type = itemType.replace('Item', '').replace('Ret', '');
  
  // Common fields across all item types
  const baseItem = {
    ListID: item.ListID || null,
    // TimeCreated: item.TimeCreated || null,
    // TimeModified: item.TimeModified || null,
    EditSequence: item.EditSequence || null,
    Name: item.Name || null,
    FullName: (item?.FullName ?? item?.Name) || null,
    Type: type,
    IsActive: item.IsActive === 'true',
    Sublevel: parseInt(item.Sublevel) || 0,
  };

  // console.log(item.SalesAndPurchase.SalesPrice)
  // console.log(type)

  // Type-specific fields
  switch (type) {
    case 'Service':
      return {
        ...baseItem,
        Description: item.SalesOrPurchase?.Desc || null,
        Price: parseFloat(item.SalesOrPurchase?.Price ?? item.SalesAndPurchase?.SalesPrice) || null,
        Cost: parseFloat(item.SalesAndPurchase?.PurchaseCost) || null,
        AccountRef: item.SalesOrPurchase?.AccountRef?.FullName || item.SalesAndPurchase?.IncomeAccountRef?.FullName || null,
        TaxCode: item.SalesTaxCodeRef?.FullName || null,
      };

    case 'Inventory':
      return {
        ...baseItem,
        Description: item.SalesDesc || item.PurchaseDesc || null,
        Price: parseFloat(item.SalesPrice) || null,
        Cost: parseFloat(item.PurchaseCost) || null,
        QuantityOnHand: parseFloat(item.QuantityOnHand) || 0,
        AverageCost: parseFloat(item.AverageCost) || null,
        ReorderPoint: parseFloat(item.ReorderPoint) || null,
        Max: parseFloat(item.Max) || null,
        IncomeAccountRef: item.IncomeAccountRef?.FullName || null,
        AssetAccountRef: item.AssetAccountRef?.FullName || null,
        COGSAccountRef: item.COGSAccountRef?.FullName || null,
        TaxCode: item.SalesTaxCodeRef?.FullName || null,
        PreferredVendor: item.PrefVendorRef?.FullName || null,
        ManufacturerPartNumber: item.ManufacturerPartNumber || null,
      };

    case 'NonInventory':
      return {
        ...baseItem,
        Description: item.SalesOrPurchaseDesc || item.SalesDesc || item.PurchaseDesc || null,
        Price: parseFloat(item.SalesAndPurchase?.SalesPrice) || null,
        Cost: parseFloat(item.SalesAndPurchase?.PurchaseCost) || null,
        AccountRef: item.SalesAndPurchase?.IncomeAccountRef?.FullName || null,
        TaxCode: item.SalesTaxCodeRef?.FullName || null,
      };

    case 'InventoryAssembly':
      return {
        ...baseItem,
        Description: item.SalesDesc || null,
        Price: parseFloat(item.SalesPrice) || null,
        QuantityOnHand: parseFloat(item.QuantityOnHand) || 0,
        BuildPoint: parseFloat(item.BuildPoint) || null,
        IncomeAccountRef: item.IncomeAccountRef?.FullName || null,
        AssetAccountRef: item.AssetAccountRef?.FullName || null,
        COGSAccountRef: item.COGSAccountRef?.FullName || null,
      };

    case 'OtherCharge':
      return {
        ...baseItem,
        Description: item.SalesOrPurchaseDesc || null,
        Price: parseFloat(item.SalesAndPurchase?.SalesPrice) || null,
        Cost: parseFloat(item.SalesAndPurchase?.PurchaseCost) || null,
        AccountRef: item.SalesAndPurchase?.IncomeAccountRef?.FullName || null,
        TaxCode: item.SalesTaxCodeRef?.FullName || null,
      };

    case 'Discount':
      return {
        ...baseItem,
        Description: item.ItemDesc || null,
        DiscountRate: item.DiscountRate || null,
        DiscountRatePercent: item.DiscountRatePercent || null,
        AccountRef: item.AccountRef?.FullName || null,
      };

    case 'SalesTax':
      return {
        ...baseItem,
        Description: item.ItemDesc || null,
        TaxRate: parseFloat(item.TaxRate) || null,
        TaxVendorRef: item.TaxVendorRef?.FullName || null,
      };

    case 'Group':
      return {
        ...baseItem,
        Description: item.ItemDesc || null,
        ItemGroupLines: parseGroupLines(item.ItemGroupLine),
      };

    case 'SalesTaxGroup':
      return {
        ...baseItem,
        Description: item.ItemDesc || null,
      }

    default:
      return baseItem;
  }
}

function parseGroupLines(groupLines) {
  if (!groupLines) return [];
  
  const lines = Array.isArray(groupLines) ? groupLines : [groupLines];
  
  return lines.map(line => ({
    ItemRef: line.ItemRef?.FullName || null,
    Quantity: parseFloat(line.Quantity) || 1,
    UnitOfMeasure: line.UnitOfMeasure || null,
  }));
}

async function parsePriceLevelResponse(qbxmlResponse) {
  console.log("Parsing PriceLevel Response...");

  if (!qbxmlResponse || typeof qbxmlResponse !== "string") {
    console.warn("Invalid or empty PriceLevel QBXML response");
    return [];
  }

  const parser = new xml2js.Parser({
    explicitArray: false,
    ignoreAttrs: false,
    mergeAttrs: true,
    trim: true,
  });

  try {
    const result = await parser.parseStringPromise(qbxmlResponse);
    const priceLevelQueryRs = result?.QBXML?.QBXMLMsgsRs?.PriceLevelQueryRs;

    if (!priceLevelQueryRs) {
      console.warn("No PriceLevelQueryRs found in response");
      return [];
    }

    const priceLevelRet = priceLevelQueryRs.PriceLevelRet;
    if (!priceLevelRet) {
      console.warn("No PriceLevelRet found inside PriceLevelQueryRs");
      return [];
    }

    // Normalize to array
    const priceLevels = Array.isArray(priceLevelRet)
      ? priceLevelRet
      : [priceLevelRet];

    // Map each PriceLevelRet to clean JSON
    const parsedData = priceLevels.map((pl) => {
      const base = {
        ListID: pl.ListID || null,
        Name: pl.Name || null,
        IsActive: pl.IsActive === "true",
        PriceLevelType: pl.PriceLevelType || null,
      };

      if (pl.PriceLevelType === "FixedPercentage") {
        return {
          ...base,
          PriceLevelFixedPercentage: pl.PriceLevelFixedPercentage
            ? parseFloat(pl.PriceLevelFixedPercentage)
            : null,
          PriceLevelPerItemRet: [],
        };
      }

      if (pl.PriceLevelType === "PerItem") {
        const perItems = pl.PriceLevelPerItemRet
          ? Array.isArray(pl.PriceLevelPerItemRet)
            ? pl.PriceLevelPerItemRet
            : [pl.PriceLevelPerItemRet]
          : [];

        const parsedPerItems = perItems.map((pi) => ({
          ItemRef: {
            ListID: pi.ItemRef?.ListID || null,
            FullName: pi.ItemRef?.FullName || null,
          },
          CustomPrice:
            pi.CustomPrice !== undefined ? parseFloat(pi.CustomPrice) : null,
          AdjustPercent:
            pi.AdjustPercent !== undefined
              ? parseFloat(pi.AdjustPercent)
              : null,
          CustomPriceType: pi.CustomPriceType || null,
        }));

        return {
          ...base,
          PriceLevelFixedPercentage: null,
          PriceLevelPerItemRet: parsedPerItems,
        };
      }

      // Default fallback
      return {
        ...base,
        PriceLevelFixedPercentage: null,
        PriceLevelPerItemRet: [],
      };
    });

    console.log(`Parsed ${parsedData.length} price levels`);
    return parsedData;
  } catch (err) {
    console.error("Error parsing PriceLevel QBXML response:", err);
    return [];
  }
}


module.exports = {
  parseCustomerResponse,
  parseEmployeeResponse,
  parseVendorResponse,
  parseItemResponse,
  parsePriceLevelResponse
};