import React from "react";
import AdminResourcePage from "./AdminResourcePage";

const fields = [
  {
    name: "firstName",
    label: "First Name",
  },
  {
    name: "lastName",
    label: "Last Name",
  },
  {
    name: "phone",
    label: "Phone",
  },
  {
    name: "email",
    label: "Email",
    type: "email",
    optional: true,
  },
  {
    name: "dateOfBirth",
    label: "Date of Birth",
    type: "date",
    optional: true,
  },
  {
    name: "gender",
    label: "Gender",
    type: "select",
    optional: true,
    options: [
      {
        value: "MALE",
        label: "Male",
      },
      {
        value: "FEMALE",
        label: "Female",
      },
      {
        value: "OTHER",
        label: "Other",
      },
    ],
  },
  {
    name: "address",
    label: "Address",
    type: "textarea",
    optional: true,
    fullWidth: true,
  },
  {
    name: "city",
    label: "City",
    optional: true,
  },
  {
    name: "state",
    label: "State",
    optional: true,
  },
  {
    name: "pincode",
    label: "Pincode",
    optional: true,
  },
  {
    name: "vendor",
    label: "Vendor",
    type: "select",
    dependency: "vendors",
    objectId: true,
    optionValue: "companyName",
    getOptionLabel: (item) =>
      item.companyName,
  },
  {
    name: "licenseNumber",
    label: "License Number",
  },
  {
    name: "licenseExpiry",
    label: "License Expiry",
    type: "date",
  },
  {
    name: "badgeNumber",
    label: "Badge Number",
    optional: true,
  },
  {
    name: "policeVerificationExpiry",
    label: "Police Verification Expiry",
    type: "date",
    optional: true,
  },
  {
    name: "medicalCertificateExpiry",
    label: "Medical Certificate Expiry",
    type: "date",
    optional: true,
  },
];

export default function Drivers() {
  return (
    <AdminResourcePage
      title="Drivers"
      description="Manage drivers, licenses, vendors and compliance records."
      endpoint="/drivers"
      dependencies={[
        {
          name: "vendors",
          endpoint: "/vendors",
        },
      ]}
      fields={fields}
      searchFields={[
        "firstName",
        "lastName",
        "phone",
        "email",
        "licenseNumber",
        "badgeNumber",
      ]}
      columns={[
        {
          key: "firstName",
          label: "First Name",
        },
        {
          key: "lastName",
          label: "Last Name",
        },
        {
          key: "phone",
          label: "Phone",
        },
        {
          key: "vendor",
          label: "Vendor",
        },
        {
          key: "licenseExpiry",
          label: "License Expiry",
          date: true,
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