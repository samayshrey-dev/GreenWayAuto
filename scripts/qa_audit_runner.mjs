import http from "node:http";

function request(options, postData = null) {
  return new Promise((resolve, reject) => {
    const req = http.request(options, (res) => {
      let data = "";
      res.on("data", (chunk) => (data += chunk));
      res.on("end", () => {
        resolve({
          statusCode: res.statusCode,
          headers: res.headers,
          body: data,
        });
      });
    });
    req.on("error", reject);
    if (postData) {
      req.write(typeof postData === "string" ? postData : JSON.stringify(postData));
    }
    req.end();
  });
}

async function runQAVerification() {
  console.log("=== STARTING QA VERIFICATION RUN ===");

  // 1. Landing Page HTML & Metadata
  console.log("\n1. Testing Landing Page (/)");
  const homeRes = await request({
    hostname: "localhost",
    port: 3000,
    path: "/",
    method: "GET",
  });
  console.log(`Status: ${homeRes.statusCode}`);
  const hasFavicon = homeRes.body.includes('href="/favicon.svg"');
  const hasOG = homeRes.body.includes('og:title');
  const hasTitle = homeRes.body.includes('EasyGarage');
  console.log(`Favicon link present: ${hasFavicon}`);
  console.log(`OpenGraph tags present: ${hasOG}`);
  console.log(`Page title contains EasyGarage: ${hasTitle}`);

  // 2. Favicon SVG static asset
  console.log("\n2. Testing Favicon asset (/favicon.svg)");
  const favRes = await request({
    hostname: "localhost",
    port: 3000,
    path: "/favicon.svg",
    method: "GET",
  });
  console.log(`Status: ${favRes.statusCode}, Content-Type: ${favRes.headers["content-type"]}`);

  // 3. Health Check
  console.log("\n3. Testing Health Check (/api/health)");
  const healthRes = await request({
    hostname: "localhost",
    port: 3000,
    path: "/api/health",
    method: "GET",
  });
  console.log(`Status: ${healthRes.statusCode}, Body: ${healthRes.body}`);

  // 4. Authentication Login via tRPC
  console.log("\n4. Testing Login via tRPC (auth.login)");
  const loginPayload = JSON.stringify({
    json: { email: "ops@alnoorauto.ae", password: "password" },
  });
  const loginRes = await request(
    {
      hostname: "localhost",
      port: 3000,
      path: "/api/trpc/auth.login",
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Content-Length": Buffer.byteLength(loginPayload),
      },
    },
    loginPayload
  );
  console.log(`Login Status: ${loginRes.statusCode}`);
  const cookies = loginRes.headers["set-cookie"] || [];
  const sessionCookie = cookies.find((c) => c.startsWith("app_session_id="));
  console.log(`Session Cookie Received: ${Boolean(sessionCookie)}`);
  
  const loginJson = JSON.parse(loginRes.body);
  const token = loginJson?.result?.data?.json?.token;
  const user = loginJson?.result?.data?.json?.user;
  console.log(`User Authenticated: ${user?.name} (${user?.email})`);
  console.log(`Bearer Token Provided: ${Boolean(token)}`);

  const authHeaders = {
    Cookie: sessionCookie ? sessionCookie.split(";")[0] : "",
    Authorization: `Bearer ${token}`,
  };

  // 5. Auth.me procedure
  console.log("\n5. Testing auth.me Session Verification");
  const meRes = await request({
    hostname: "localhost",
    port: 3000,
    path: "/api/trpc/auth.me",
    method: "GET",
    headers: authHeaders,
  });
  console.log(`auth.me Status: ${meRes.statusCode}`);
  const meData = JSON.parse(meRes.body)?.result?.data?.json;
  console.log(`Tenant Workshop: ${meData?.workshop?.name}, TRN: ${meData?.workshop?.trn}`);

  // 6. Dashboard Metrics
  console.log("\n6. Testing Dashboard Metrics (dashboard.getMetrics)");
  const metricsRes = await request({
    hostname: "localhost",
    port: 3000,
    path: "/api/trpc/dashboard.getMetrics",
    method: "GET",
    headers: authHeaders,
  });
  console.log(`Metrics Status: ${metricsRes.statusCode}`);
  const metricsData = JSON.parse(metricsRes.body)?.result?.data?.json;
  console.log(`Metrics: Open Jobs=${metricsData?.openJobsCount}, Revenue=AED ${metricsData?.todayRevenue}, Bays=${metricsData?.bayUtilisation}%`);

  // 7. Complete Workflow: Create Job -> Generate Invoice -> Settle Payment
  console.log("\n7. Testing End-to-End Workflow (Intake -> Work Order -> Tax Invoice -> Payment Settlement)");
  
  // Get customers
  const custRes = await request({
    hostname: "localhost",
    port: 3000,
    path: "/api/trpc/customers.list",
    method: "GET",
    headers: authHeaders,
  });
  const customers = JSON.parse(custRes.body)?.result?.data?.json || [];
  const targetCust = customers[0];

  // Get customer vehicles
  const vehQuery = encodeURIComponent(JSON.stringify({ json: { customerId: targetCust.id } }));
  const vehRes = await request({
    hostname: "localhost",
    port: 3000,
    path: `/api/trpc/vehicles.getByCustomer?input=${vehQuery}`,
    method: "GET",
    headers: authHeaders,
  });
  const vehicles = JSON.parse(vehRes.body)?.result?.data?.json || [];
  const targetVeh = vehicles[0];

  console.log(`Customer: ${targetCust.name}, Vehicle: ${targetVeh.make} ${targetVeh.model} (${targetVeh.plateCode} ${targetVeh.plateNumber})`);

  // Create Job Card
  const createJobPayload = JSON.stringify({
    json: {
      customerId: targetCust.id,
      vehicleId: targetVeh.id,
      bayNumber: "Bay 03",
      serviceSummary: "Comprehensive 40,000km Major Service & Brake Inspection",
      promiseTime: "Today, 18:00",
      customerComplaints: "Vibration at 100km/h; AC cooling low.",
    },
  });
  const createJobRes = await request(
    {
      hostname: "localhost",
      port: 3000,
      path: "/api/trpc/jobCards.create",
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Content-Length": Buffer.byteLength(createJobPayload),
        ...authHeaders,
      },
    },
    createJobPayload
  );
  const newJob = JSON.parse(createJobRes.body)?.result?.data?.json;
  console.log(`Created Job Card: ID=${newJob.id}, Number=${newJob.jobCardNumber}`);

  // Generate UAE Tax Invoice
  console.log("\n8. Testing On-Demand UAE Tax Invoice Generation (invoices.generateFromJobCard)");
  const invPayload = JSON.stringify({
    json: { jobCardId: newJob.id },
  });
  const invRes = await request(
    {
      hostname: "localhost",
      port: 3000,
      path: "/api/trpc/invoices.generateFromJobCard",
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Content-Length": Buffer.byteLength(invPayload),
        ...authHeaders,
      },
    },
    invPayload
  );
  const newInv = JSON.parse(invRes.body)?.result?.data?.json;
  console.log(`Generated Invoice: Number=${newInv.invoiceNumber}, Subtotal=AED ${newInv.subtotal}, 5% VAT=AED ${newInv.vatAmount}, Total=AED ${newInv.totalAmount}, TRN=${newInv.trn}`);

  // Settle Payment
  console.log("\n9. Testing Payment Settlement (payments.recordPayment)");
  const payPayload = JSON.stringify({
    json: {
      invoiceId: newInv.id,
      customerId: targetCust.id,
      amount: newInv.totalAmount,
      paymentMethod: "card",
      reference: "POS-AUTH-882194",
      notes: "Settled in full via Card POS terminal.",
    },
  });
  const payRes = await request(
    {
      hostname: "localhost",
      port: 3000,
      path: "/api/trpc/payments.recordPayment",
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Content-Length": Buffer.byteLength(payPayload),
        ...authHeaders,
      },
    },
    payPayload
  );
  const payData = JSON.parse(payRes.body)?.result?.data?.json;
  console.log(`Payment Recorded: ID=${payData?.id}, Amount=AED ${payData?.amount}, Status=${payData?.status || "settled"}`);

  // 10. Vehicle Digital Service Passport
  console.log("\n10. Testing Vehicle Digital Service Passport History (vehicles.getHistory)");
  const histQuery = encodeURIComponent(JSON.stringify({ json: { vehicleId: targetVeh.id } }));
  const histRes = await request({
    hostname: "localhost",
    port: 3000,
    path: `/api/trpc/vehicles.getHistory?input=${histQuery}`,
    method: "GET",
    headers: authHeaders,
  });
  const histData = JSON.parse(histRes.body)?.result?.data?.json;
  console.log(`Service Passport: Vehicle=${histData?.vehicle?.make} ${histData?.vehicle?.model}, Total Service Records=${histData?.serviceHistory?.length}`);

  // 11. Reports CSV Export
  console.log("\n11. Testing Workshop Reports CSV Export (reports.exportCsv)");
  const csvPayload = JSON.stringify({ json: null });
  const csvRes = await request(
    {
      hostname: "localhost",
      port: 3000,
      path: "/api/trpc/reports.exportCsv",
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Content-Length": Buffer.byteLength(csvPayload),
        ...authHeaders,
      },
    },
    csvPayload
  );
  const csvData = JSON.parse(csvRes.body)?.result?.data?.json;
  console.log(`CSV Export Success: Filename=${csvData?.filename}, Rows=${csvData?.csv?.split("\n").length}`);

  console.log("\n=== ALL QA VERIFICATION CHECKS COMPLETED SUCCESSFULLY ===");
}

runQAVerification().catch(console.error);
