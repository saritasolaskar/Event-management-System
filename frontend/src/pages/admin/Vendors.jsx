import React from "react";
import AdminResourcePage from "./AdminResourcePage";

const fields = [
  {
    name: "companyName",
    label: "Company Name",
    placeholder: "Vendor company",
  },
  {
    name: "ownerName",
    label: "Owner Name",
    placeholder: "Owner name",
  },
  {
    name: "email",
    label: "Email",
    type: "email",
    placeholder: "vendor@example.com",
  },
  {
    name: "phone",
    label: "Phone",
    placeholder: "+91 XXXXX XXXXX",
  },
  {
    name: "gstNumber",
    label: "GST Number",
    optional: true,
  },
  {
    name: "panNumber",
    label: "PAN Number",
    optional: true,
  },
  {
    name: "paymentCycle",
    label: "Payment Cycle (Days)",
    type: "number",
    optional: true,
  },
  {
    name: "commissionType",
    label: "Commission Type",
    type: "select",
    options: [
      {
        value: "PERCENTAGE",
        label: "Percentage",
      },
      {
        value: "FIXED",
        label: "Fixed",
      },
    ],
    optional: true,
  },
  {
    name: "commissionValue",
    label: "Commission Value",
    type: "number",
    optional: true,
  },
];

export default function Vendors() {
  return (
    <AdminResourcePage
      title="Vendors"
      description="Manage vendor companies and commercial relationships."
      endpoint="/vendors"
      fields={fields}
      searchFields={[
        "companyName",
        "ownerName",
        "email",
        "phone",
        "gstNumber",
      ]}
      columns={[
        {
          key: "companyName",
          label: "Company",
        },
        {
          key: "ownerName",
          label: "Owner",
        },
        {
          key: "phone",
          label: "Phone",
        },
        {
          key: "email",
          label: "Email",
        },
        {
          key: "status",
          label: "Status",
          status: true,
        },
      ]}
    />
  );
}