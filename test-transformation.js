// Test the bill transformation with the backend response format
const backendResponse = [
    {
        "id": 1,
        "billNumber": "BILL-2025-001",
        "prescription": null,
        "customer": {
            "id": 45,
            "username": "customer",
            "email": "customer2@gmail.com",
            "password": "$2a$10$i6eTBwuOYbsYr1xCkZG1GuqVuVXivx7wLbkcrdGklYd5JCxcl4N/y",
            "firstName": "cust2",
            "lastName": "Smith",
            "phone": null,
            "address": null,
            "isActive": true,
            "role": {
                "id": 3,
                "name": "CUSTOMER",
                "description": "Customer who can upload prescriptions and view order history"
            },
            "createdAt": [
                2025,
                6,
                30,
                16,
                7,
                19,
                279736000
            ],
            "updatedAt": [
                2025,
                6,
                30,
                16,
                7,
                19,
                283476000
            ]
        },
        "pharmacist": {
            "id": 2,
            "username": "pharmacist1",
            "email": "pharmacist@philldesk.com",
            "password": "$2a$10$example",
            "firstName": "Dr. John",
            "lastName": "Perera",
            "phone": "+94772345678",
            "address": "Kandy, Sri Lanka",
            "isActive": true,
            "role": {
                "id": 2,
                "name": "PHARMACIST",
                "description": "Pharmacist who can approve prescriptions and manage inventory"
            },
            "createdAt": [
                2025,
                6,
                29,
                20,
                36,
                44,
                712367000
            ],
            "updatedAt": [
                2025,
                6,
                29,
                20,
                36,
                44,
                712367000
            ]
        },
        "billItems": [],
        "subtotal": 150.00,
        "discount": 10.00,
        "tax": 15.60,
        "totalAmount": 155.60,
        "paymentStatus": "PENDING",
        "paymentMethod": null,
        "paymentType": "ONLINE",
        "notes": "Sample bill for testing payment functionality",
        "createdAt": [
            2025,
            7,
            22,
            14,
            6,
            51,
            394451000
        ],
        "updatedAt": [
            2025,
            7,
            22,
            20,
            30,
            2,
            248785000
        ],
        "paidAt": null
    }
];

// Utility function to convert date array to ISO string
const convertDateArrayToString = (dateArray) => {
  if (!dateArray || dateArray.length < 3) {
    return new Date().toISOString()
  }
  
  const [year, month, day, hour = 0, minute = 0, second = 0] = dateArray
  const date = new Date(year, month - 1, day, hour, minute, second)
  return date.toISOString()
}

// Transform bill API response to expected UI format
const transformBillData = (apiData) => {
  const getUIStatus = (paymentStatus, paymentType) => {
    if (paymentStatus === 'PENDING') {
      return paymentType === 'PAY_ON_PICKUP' ? 'Ready for Billing' : 'Pending Billing'
    }
    return paymentStatus === 'PAID' ? 'Paid' : 'Pending Billing'
  }

  return {
    id: apiData.id,
    billNumber: apiData.billNumber,
    orderId: apiData.billNumber,
    customerName: `${apiData.customer.firstName} ${apiData.customer.lastName}`,
    customerEmail: apiData.customer.email,
    customerPhone: apiData.customer.phone,
    pharmacistName: `${apiData.pharmacist.firstName} ${apiData.pharmacist.lastName}`,
    subtotal: apiData.subtotal,
    discount: apiData.discount,
    tax: apiData.tax,
    total: apiData.totalAmount,
    totalAmount: apiData.totalAmount,
    amount: apiData.totalAmount,
    shipping: 0,
    paymentStatus: apiData.paymentStatus,
    paymentMethod: apiData.paymentMethod,
    paymentType: apiData.paymentType,
    status: getUIStatus(apiData.paymentStatus, apiData.paymentType),
    notes: apiData.notes,
    createdAt: convertDateArrayToString(apiData.createdAt),
    updatedAt: convertDateArrayToString(apiData.updatedAt),
    paidAt: apiData.paidAt ? convertDateArrayToString(apiData.paidAt) : undefined,
    orderDate: convertDateArrayToString(apiData.createdAt),
    billItems: apiData.billItems || [],
    items: apiData.billItems || [],
    prescriptionId: apiData.prescription?.id,
    prescriptionNumber: apiData.prescription?.prescriptionNumber,
    invoiceId: apiData.billNumber,
    generatedDate: convertDateArrayToString(apiData.createdAt),
    paidAmount: apiData.paymentStatus === 'PAID' ? apiData.totalAmount : 0,
    insurance: undefined
  }
}

// Test the transformation
const transformedData = backendResponse.map(bill => transformBillData(bill));

console.log('Original backend data:');
console.log(JSON.stringify(backendResponse[0], null, 2));
console.log('\nTransformed frontend data:');
console.log(JSON.stringify(transformedData[0], null, 2));

console.log('\n=== Key mappings ===');
console.log(`Customer: ${backendResponse[0].customer.firstName} ${backendResponse[0].customer.lastName} -> ${transformedData[0].customerName}`);
console.log(`Pharmacist: ${backendResponse[0].pharmacist.firstName} ${backendResponse[0].pharmacist.lastName} -> ${transformedData[0].pharmacistName}`);
console.log(`Payment Status: ${backendResponse[0].paymentStatus} (${backendResponse[0].paymentType}) -> ${transformedData[0].status}`);
console.log(`Total Amount: ${backendResponse[0].totalAmount} -> ${transformedData[0].total}`);
console.log(`Created Date: [${backendResponse[0].createdAt.join(',')}] -> ${transformedData[0].createdAt}`);
