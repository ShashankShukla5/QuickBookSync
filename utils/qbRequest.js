// qbRequests.js

function buildCustomerQuery() {
  return `<?xml version="1.0"?>
          <?qbxml version="13.0"?>
        <QBXML>
              <QBXMLMsgsRq onError="stopOnError">
                <CustomerQueryRq requestID="1">
                  <ActiveStatus>All</ActiveStatus>
                  <IncludeRetElement>ListID</IncludeRetElement>
                  <IncludeRetElement>FullName</IncludeRetElement>
                  <IncludeRetElement>CompanyName</IncludeRetElement>
                  <IncludeRetElement>Name</IncludeRetElement>
                  <IncludeRetElement>IsActive</IncludeRetElement>
                  <IncludeRetElement>ClassRef</IncludeRetElement>
                  <IncludeRetElement>JobStatus</IncludeRetElement>
                  <IncludeRetElement>JobType</IncludeRetElement>
                  <IncludeRetElement>ParentRef</IncludeRetElement>
                </CustomerQueryRq>
              </QBXMLMsgsRq>
        </QBXML>`;
}

// function buildEmployeeQuery() {
//   return `<?xml version="1.0"?>
//           <?qbxml version="13.0"?>
//         <QBXML>
//               <QBXMLMsgsRq onError="stopOnError">
//                 <EmployeeQueryRq requestID="2">
//                   <ActiveStatus>All</ActiveStatus>
//                   <IncludeRetElement>ListID</IncludeRetElement>
//                   <IncludeRetElement>FullName</IncludeRetElement>
//                   <IncludeRetElement>FirstName</IncludeRetElement>
//                   <IncludeRetElement>LastName</IncludeRetElement>
//                   <IncludeRetElement>IsActive</IncludeRetElement>
//                 </EmployeeQueryRq>
//               </QBXMLMsgsRq>
//         </QBXML>`;
// }

// qbRequest.js
function buildEmployeeQuery() {
  return `<?xml version="1.0" encoding="utf-8"?>
<?qbxml version="13.0"?>
<QBXML>
  <QBXMLMsgsRq onError="continueOnError">
    <EmployeeQueryRq>
    </EmployeeQueryRq>
  </QBXMLMsgsRq>
</QBXML>`;
}

function buildVendorQuery() {
  return `<?xml version="1.0"?>
    <?qbxml version="13.0"?>
    <QBXML>
      <QBXMLMsgsRq onError="stopOnError">
        <VendorQueryRq requestID="3">
          <ActiveStatus>All</ActiveStatus>
        </VendorQueryRq>
      </QBXMLMsgsRq>
    </QBXML>`;
}

function buildItemQuery() {
  return `<?xml version="1.0" encoding="utf-8"?>
  <?qbxml version="13.0"?>
  <QBXML>
    <QBXMLMsgsRq onError="stopOnError">
      <ItemQueryRq requestID="1">
        <OwnerID>0</OwnerID>
      </ItemQueryRq>
    </QBXMLMsgsRq>
  </QBXML>`;
}

function buildPriceLevelQuery() {
  return `<?xml version="1.0" encoding="utf-8"?>
  <?qbxml version="13.0"?>
  <QBXML>
    <QBXMLMsgsRq onError="stopOnError">
      <PriceLevelQueryRq>
        <ActiveStatus>All</ActiveStatus>
        <IncludeRetElement>ListID</IncludeRetElement>
        <IncludeRetElement>Name</IncludeRetElement>
        <IncludeRetElement>IsActive</IncludeRetElement>
        <IncludeRetElement>PriceLevelType</IncludeRetElement>
        <IncludeRetElement>PriceLevelFixedPercentage</IncludeRetElement>
        <IncludeRetElement>PriceLevelPerItemRet</IncludeRetElement>
      </PriceLevelQueryRq>
    </QBXMLMsgsRq>
  </QBXML>`;
}

module.exports = {
  buildCustomerQuery,
  buildEmployeeQuery,
  buildVendorQuery,
  buildItemQuery,
  buildPriceLevelQuery
};
