const { marshall, unmarshall } = require("@aws-sdk/util-dynamodb");
const { GetItemCommand, PutItemCommand, UpdateItemCommand } = require("@aws-sdk/client-dynamodb");
const dynamoClient = require("../dynamo/dynamoDbClient");

function deepEqual(obj1, obj2) {
  return JSON.stringify(obj1) === JSON.stringify(obj2);
}

async function deltaSyncCustomer(customer) {
  const key = { ListID: customer.ListID };

  try {
    // Get existing record
    const existingData = await dynamoClient.send(
      new GetItemCommand({
        TableName: process.env.DYNAMO_TABLE_CUSTOMER,
        Key: marshall(key),
      })
    );

    const currentTimeStamp = new Date().toISOString();

    // If not found → insert
    if (!existingData.Item) {
      console.log(`Inserting new record: ${customer.ListID}`);

      const newCustomer = {
        ...customer,
        updatedAt: currentTimeStamp,
        createdAt: currentTimeStamp,
      }

      await dynamoClient.send(
        new PutItemCommand({
          TableName: process.env.DYNAMO_TABLE_CUSTOMER,
          Item: marshall(newCustomer),
        })
      );
      return { id: customer.ListID, status: "inserted" };
    }

    // Compare fields
    const existing = unmarshall(existingData.Item);
    const updateFields = {};
    let hasChanges = false;

    for (const [key, value] of Object.entries(customer)) {
      if (existing[key] !== value) {
        hasChanges = true;
        updateFields[key] = value;
      }
    }

    // If differences → update changed fields
    if (hasChanges) {
      updateFields.updatedAt = currentTimeStamp

      const updateExpression = [];
      const expressionValues = {};
      const expressionNames = {};

      for (const field of Object.keys(updateFields)) {
        updateExpression.push(`#${field} = :${field}`);
        expressionNames[`#${field}`] = field;
        expressionValues[`:${field}`] = updateFields[field];
      }

      await dynamoClient.send(
        new UpdateItemCommand({
          TableName: process.env.DYNAMO_TABLE_CUSTOMER,
          Key: marshall({ ListID: customer.ListID }),
          UpdateExpression: `SET ${updateExpression.join(", ")}`,
          ExpressionAttributeNames: expressionNames,
          ExpressionAttributeValues: marshall(expressionValues),
        })
      );

      console.log(`Updated record ${customer.ListID}`);
      return { id: customer.ListID, status: "updated" };
    }

    console.log(`No change for ${customer.ListID}`);
    return { id: customer.ListID, status: "no-change" };
  } catch (err) {
    console.error(`Error syncing ${customer.ListID}:`, err);
    return { id: customer.ListID, status: "error", error: err };
  }
}

async function deltaSyncEmployee(employee) {
  const key = { ListID: employee.ListID };

  try {
    // Get existing record
    const existingData = await dynamoClient.send(
      new GetItemCommand({
        TableName: process.env.DYNAMO_TABLE_EMPLOYEES,
        Key: marshall(key),
      })
    );

    const currentTimeStamp = new Date().toISOString();

    // Insert if new
    if (!existingData.Item) {
      console.log(`🆕 Inserting new employee: ${employee.Name}`);

      const newEmployee = {
        ...employee,
        createdAt: currentTimeStamp,
        updatedAt: currentTimeStamp
      }

      await dynamoClient.send(
        new PutItemCommand({
          TableName: process.env.DYNAMO_TABLE_EMPLOYEES,
          Item: marshall(newEmployee),
        })
      );
      return { id: employee.ListID, status: "inserted" };
    }

    // Compare existing vs. new
    const existing = unmarshall(existingData.Item);
    const updateFields = {};
    let hasChanges = false;

    for (const [key, value] of Object.entries(employee)) {
      if (!deepEqual(existing[key], value)) {
        hasChanges = true;
        updateFields[key] = value;
      }
    }

    // If there are changes → update
    if (hasChanges) {
      updateFields.updatedAt = currentTimeStamp

      const updateExpression = [];
      const expressionValues = {};
      const expressionNames = {};

      for (const field of Object.keys(updateFields)) {
        updateExpression.push(`#${field} = :${field}`);
        expressionNames[`#${field}`] = field;
        expressionValues[`:${field}`] = updateFields[field];
      }

      await dynamoClient.send(
        new UpdateItemCommand({
          TableName: process.env.DYNAMO_TABLE_EMPLOYEES,
          Key: marshall({ ListID: employee.ListID }),
          UpdateExpression: `SET ${updateExpression.join(", ")}`,
          ExpressionAttributeNames: expressionNames,
          ExpressionAttributeValues: marshall(expressionValues),
        })
      );

      console.log(`Updated employee: ${employee.Name}`);
      return { id: employee.ListID, status: "updated" };
    }

    // If nothing changed
    console.log(`No change for ${employee.Name}`);
    return { id: employee.ListID, status: "no-change" };
  } catch (err) {
    console.error(`Error syncing employee ${employee.ListID}:`, err);
    return { id: employee.ListID, status: "error", error: err };
  }
}

async function deltaSyncVendor(vendor) {
  const key = { ListID: vendor.ListID };

  try {
    // Fetch existing record from DynamoDB
    const existingData = await dynamoClient.send(
      new GetItemCommand({
        TableName: process.env.DYNAMO_TABLE_VENDORS,
        Key: marshall(key),
      })
    );

    const currentTimeStamp = new Date().toISOString()

    // If vendor doesn’t exist → insert new
    if (!existingData.Item) {
      console.log(`Inserting new vendor: ${vendor.Name}`);

      const newVendor = {
        ...vendor,
        createdAt: currentTimeStamp,
        updatedAt: currentTimeStamp
      }
      await dynamoClient.send(
        new PutItemCommand({
          TableName: process.env.DYNAMO_TABLE_VENDORS,
          Item: marshall(newVendor),
        })
      );
      return { id: vendor.ListID, status: "inserted" };
    }

    // Compare existing vs new to detect changes
    const existing = unmarshall(existingData.Item);
    const updateFields = {};
    let hasChanges = false;

    for (const [key, value] of Object.entries(vendor)) {
      if (!deepEqual(existing[key], value)) {
        hasChanges = true;
        updateFields[key] = value;
      }
    }

    // If there are differences → update only changed fields
    if (hasChanges) {
      updateFields.updatedAt = currentTimeStamp

      const updateExpression = [];
      const expressionValues = {};
      const expressionNames = {};

      for (const field of Object.keys(updateFields)) {
        updateExpression.push(`#${field} = :${field}`);
        expressionNames[`#${field}`] = field;
        expressionValues[`:${field}`] = updateFields[field];
      }

      await dynamoClient.send(
        new UpdateItemCommand({
          TableName: process.env.DYNAMO_TABLE_VENDORS,
          Key: marshall({ ListID: vendor.ListID }),
          UpdateExpression: `SET ${updateExpression.join(", ")}`,
          ExpressionAttributeNames: expressionNames,
          ExpressionAttributeValues: marshall(expressionValues),
        })
      );

      console.log(`Updated vendor: ${vendor.Name}`);
      return { id: vendor.ListID, status: "updated" };
    }

    // If nothing changed
    console.log(`No change for vendor: ${vendor.Name}`);
    return { id: vendor.ListID, status: "no-change" };

  } catch (err) {
    console.error(`Error syncing vendor ${vendor.ListID}:`, err);
    return { id: vendor.ListID, status: "error", error: err };
  }
} 

async function deltaSyncItem(item) {
  const key = { ListID: item.ListID };

  try {
    // Fetch existing record from DynamoDB
    const existingData = await dynamoClient.send(
      new GetItemCommand({
        TableName: process.env.DYNAMO_TABLE_ITEMS,
        Key: marshall(key),
      })
    );

    const currentTimeStamp = new Date().toISOString()

    // If item does not exist → insert new record
    if (!existingData.Item) {
      console.log(`Inserting new item: ${item.Name} (${item.Type})`);

      const newItem = {
        ...item,
        createdAt: currentTimeStamp,
        updatedAt: currentTimeStamp
      }
      await dynamoClient.send(
        new PutItemCommand({
          TableName: process.env.DYNAMO_TABLE_ITEMS,
          Item: marshall(newItem),
        })
      );
      return { id: item.ListID, status: "inserted" };
    }

    // Existing record found → Compare with current data
    const existing = unmarshall(existingData.Item);
    const updateFields = {};
    let hasChanges = false;

    for (const [key, value] of Object.entries(item)) {
      if (!deepEqual(existing[key], value)) {
        hasChanges = true;
        updateFields[key] = value;
      }
    }

    // If differences found → update changed fields only
    if (hasChanges) {
      updateFields.updatedAt = currentTimeStamp

      const updateExpression = [];
      const expressionValues = {};
      const expressionNames = {};

      for (const field of Object.keys(updateFields)) {
        updateExpression.push(`#${field} = :${field}`);
        expressionNames[`#${field}`] = field;
        expressionValues[`:${field}`] = updateFields[field];
      }

      await dynamoClient.send(
        new UpdateItemCommand({
          TableName: process.env.DYNAMO_TABLE_ITEMS,
          Key: marshall({ ListID: item.ListID }),
          UpdateExpression: `SET ${updateExpression.join(", ")}`,
          ExpressionAttributeNames: expressionNames,
          ExpressionAttributeValues: marshall(expressionValues),
        })
      );

      console.log(`Updated item: ${item.Name} (${item.Type})`);
      return { id: item.ListID, status: "updated" };
    }

    // No difference detected
    console.log(`No change for item: ${item.Name} (${item.Type})`);
    return { id: item.ListID, status: "no-change" };

  } catch (err) {
    console.error(`Error syncing item ${item.ListID}:`, err);
    return { id: item.ListID, status: "error", error: err };
  }
}

async function deltaSyncPriceLevel(priceLevel) {
  const key = { ListID: priceLevel.ListID };

  try {
    // Fetch existing record from DynamoDB
    const existingData = await dynamoClient.send(
      new GetItemCommand({
        TableName: process.env.DYNAMO_TABLE_PRICELEVELS,
        Key: marshall(key),
      })
    );

    const currentTimeStamp = new Date().toISOString()

    // Insert new if not found
    if (!existingData.Item) {
      console.log(`Inserting new Price Level: ${priceLevel.Name}`);

      const newPriceLevel = {
        ...priceLevel,
        createdAt: currentTimeStamp,
        updatedAt: currentTimeStamp
      }

      await dynamoClient.send(
        new PutItemCommand({
          TableName: process.env.DYNAMO_TABLE_PRICELEVELS,
          Item: marshall(newPriceLevel),
        })
      );
      return { id: priceLevel.ListID, status: "inserted" };
    }

    // Compare existing vs new to detect differences
    const existing = unmarshall(existingData.Item);
    const updateFields = {};
    let hasChanges = false;

    for (const [field, value] of Object.entries(priceLevel)) {
      if (!deepEqual(existing[field], value)) {
        hasChanges = true;
        updateFields[field] = value;
      }
    }

    // If there are changes → update only modified fields
    if (hasChanges) {
      updateFields.updatedAt = currentTimeStamp
      
      const updateExpression = [];
      const expressionValues = {};
      const expressionNames = {};

      for (const field of Object.keys(updateFields)) {
        updateExpression.push(`#${field} = :${field}`);
        expressionNames[`#${field}`] = field;
        expressionValues[`:${field}`] = updateFields[field];
      }

      await dynamoClient.send(
        new UpdateItemCommand({
          TableName: process.env.DYNAMO_TABLE_PRICELEVELS,
          Key: marshall({ ListID: priceLevel.ListID }),
          UpdateExpression: `SET ${updateExpression.join(", ")}`,
          ExpressionAttributeNames: expressionNames,
          ExpressionAttributeValues: marshall(expressionValues),
        })
      );

      console.log(`Updated Price Level: ${priceLevel.Name}`);
      return { id: priceLevel.ListID, status: "updated" };
    }

    // No change
    console.log(`No change for Price Level: ${priceLevel.Name}`);
    return { id: priceLevel.ListID, status: "no-change" };

  } catch (err) {
    console.error(`Error syncing Price Level ${priceLevel.ListID}:`, err);
    return { id: priceLevel.ListID, status: "error", error: err };
  }
}

module.exports = {
    deltaSyncCustomer,
    deltaSyncEmployee,
    deltaSyncVendor,
    deltaSyncItem,
    deltaSyncPriceLevel
}