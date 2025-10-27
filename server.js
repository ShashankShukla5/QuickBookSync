const express = require("express");
const bodyParser = require("body-parser");
const soap = require("soap");
const fs = require("fs");
const http = require("http");
require("dotenv").config();

const qbRequests = require("./utils/qbRequest");
const {
  parseCustomerResponse,
  parseEmployeeResponse,
  parseVendorResponse,
  parseItemResponse,
  parsePriceLevelResponse
} = require("./utils/xmlParser");
const { deltaSyncCustomers, deltaSyncEmployees, deltaSyncVendors, deltaSyncItems, deltaSyncPriceLevels } = require("./utils/deltaSync");

const app = express();
app.use(bodyParser.raw({ type: () => true, limit: "5mb" }));

const qbQueriesTemplate = [
  { type: "Customer", xml: qbRequests.buildCustomerQuery() },
  { type: "Employee", xml: qbRequests.buildEmployeeQuery() },
  { type: "Vendor", xml: qbRequests.buildVendorQuery() },
  { type: "Item", xml: qbRequests.buildItemQuery() },
  { type: "PriceLevel", xml: qbRequests.buildPriceLevelQuery() },
];

let qbQueries = [...qbQueriesTemplate]; // copy for current session

// Define SOAP service methods that QBWC expects
const service = {
  QBWebConnectorSvc: {
    QBWebConnectorSvcSoap: {
      authenticate: function (args) {
        console.log("authenticate called", args);

        const { strUserName, strPassword } = args;
        const validUser = "testuser";
        const validPass = "testpass";

        qbQueries = [...qbQueriesTemplate];

        if (strUserName === validUser && strPassword === validPass) {
          const result = {
            authenticateResult: {
              string: ["token123", ""],
            },
          };
          console.log("Returning:", result);
          return result;
        } else {
          const failResult = { authenticateResult: { string: ["", "nvu"] } };
          console.log("Returning:", failResult);
          return failResult;
        }
      },
      sendRequestXML: function (args) {
        console.log("sendRequestXML called");

        if (qbQueries.length === 0) {
          console.log("All queries sent. Returning empty.");
          return { sendRequestXMLResult: "" };
        }

        const nextQuery = qbQueries.shift();
        console.log("Sending QBXML for:", nextQuery.type);
        this.lastQueryType = nextQuery.type;
        return { sendRequestXMLResult: nextQuery.xml };
      },
      receiveResponseXML: async function (args) {
        console.log("receiveResponseXML called for", this.lastQueryType);

        let parsedData = [];

        switch (this.lastQueryType) {
          case "Customer":
            parsedData = await parseCustomerResponse(args.response);
            await deltaSyncCustomers(parsedData);
            break;

          case "Employee":
            parsedData = await parseEmployeeResponse(args.response);
            await deltaSyncEmployees(parsedData)
            break;

          case "Vendor":
            parsedData = await parseVendorResponse(args.response);
            await deltaSyncVendors(parsedData);
            break;

          case "Item":
            parsedData = await parseItemResponse(args.response);
            await deltaSyncItems(parsedData);
            break;

          case "PriceLevel":
            parsedData = await parsePriceLevelResponse(args.response);
            await deltaSyncPriceLevels(parsedData);
            break;

          default:
            console.warn("Unknown query type:", this.lastQueryType);
        }

        // Calculate percentage dynamically
        const totalQueries = qbQueriesTemplate.length;
        const remaining = qbQueries.length;
        const completed = totalQueries - remaining;
        const percentDone = Math.floor((completed / totalQueries) * 100);

        console.log(`Progress: ${completed}/${totalQueries} (${percentDone}%)`);
        console.log(`Remaining queries: ${remaining}`);

        return { receiveResponseXMLResult: percentDone };
      },

      closeConnection: function (args) {
        console.log("closeConnection called", args);
        return {
          closeConnectionResult: {
            string: ["OK"],
          },
        };
      },
    },
  },
};

const xml = fs.readFileSync("qbwc.wsdl", "utf8");
const server = http.createServer(app);

server.listen(8000, function () {
  soap.listen(server, "/qbwc", service, xml);
  console.log("SOAP service listening on http://localhost:8000/qbwc");
});
