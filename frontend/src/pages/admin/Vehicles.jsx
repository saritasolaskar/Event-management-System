import React from "react";
import AdminResourcePage from "./AdminResourcePage";

const fields = [
  {
    name: "vehicleNumber",
    label: "Vehicle Number",
    placeholder: "MH12AB1234",
  },
  {
    name: "vehicleType",
    label: "Vehicle Type",
    type: "select",
    options: [
      {
        value: "HATCHBACK",
        label: "Hatchback",
      },
      {
        value: "SEDAN",
        label: "Sedan",
      },
      {
        value: "SUV",
        label: "SUV",
      },
      {
        value: "MUV",
        label: "MUV",
      },
      {
        value: "TEMPO_TRAVELLER",
        label: "Tempo Traveller",
      },
      {
        value: "MINI_BUS",
        label: "Mini Bus",
      },
      {
        value: "BUS",
        label: "Bus",
      },
    ],
  },
  {
    name: "brand",
    label: "Brand",
    optional: true,
  },
  {
    name: "model",
    label: "Model",
    optional: true,
  },
  {
    name: "manufactureYear",
    label: "Manufacture Year",
    type: "number",
    optional: true,
  },
  {
    name: "fuelType",
    label: "Fuel Type",
    type: "select",
    optional: true,
    options: [
      {
        value: "PETROL",
        label: "Petrol",
      },
      {
        value: "DIESEL",
        label: "Diesel",
      },
      {
        value: "CNG",
        label: "CNG",
      },
      {
        value: "ELECTRIC",
        label: "Electric",
      },
      {
        value: "HYBRID",
        label: "Hybrid",
      },
    ],
  },
  {
    name: "seatingCapacity",
    label: "Seating Capacity",
    type: "number",
  },
  {
    name: "vendor",
    label: "Vendor",
    type: "select",
    dependency: "vendors",
    objectId: true,
    getOptionLabel: (item) =>
      item.companyName,
  },
  {
    name: "currentDriver",
    label: "Current Driver",
    type: "select",
    dependency: "drivers",
    objectId: true,
    optional: true,
    getOptionLabel: (item) =>
      `${item.firstName} ${item.lastName}`,
  },
  {
    name: "rcExpiry",
    label: "RC Expiry",
    type: "date",
    optional: true,
  },
  {
    name: "insuranceExpiry",
    label: "Insurance Expiry",
    type: "date",
    optional: true,
  },
  {
    name: "permitExpiry",
    label: "Permit Expiry",
    type: "date",
    optional: true,
  },
  {
    name: "fitnessExpiry",
    label: "Fitness Expiry",
    type: "date",
    optional: true,
  },
  {
    name: "pucExpiry",
    label: "PUC Expiry",
    type: "date",
    optional: true,
  },
  {
    name: "gpsEnabled",
    label: "GPS Enabled",
    type: "checkbox",
    optional: true,
    defaultValue: false,
  },
];

export default function Vehicles() {
  return (
    <AdminResourcePage
      title="Vehicles"
      description="Manage fleet vehicles, compliance, vendors and assignments."
      endpoint="/vehicles"
      dependencies={[
        {
          name: "vendors",
          endpoint: "/vendors",
        },
        {
          name: "drivers",
          endpoint: "/drivers",
        },
      ]}
      fields={fields}
      searchFields={[
        "vehicleNumber",
        "vehicleType",
        "brand",
        "model",
        "fuelType",
      ]}
      columns={[
        {
          key: "vehicleNumber",
          label: "Vehicle",
        },
        {
          key: "vehicleType",
          label: "Type",
        },
        {
          key: "brand",
          label: "Brand",
        },
        {
          key: "model",
          label: "Model",
        },
        {
          key: "seatingCapacity",
          label: "Seats",
        },
        {
          key: "vendor",
          label: "Vendor",
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