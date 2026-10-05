import React from "react";
import AdminResourcePage from "./AdminResourcePage";

const fields = [
  {
    name: "locationCode",
    label: "Location Code",
    placeholder: "LOC-001",
  },
  {
    name: "name",
    label: "Location Name",
    placeholder: "Hotel / Airport / Venue",
  },
  {
    name: "address",
    label: "Address",
    type: "textarea",
    fullWidth: true,
  },
  {
    name: "city",
    label: "City",
  },
  {
    name: "state",
    label: "State",
  },
  {
    name: "country",
    label: "Country",
    optional: true,
    defaultValue: "India",
  },
  {
    name: "pincode",
    label: "Pincode",
    optional: true,
  },
  {
    name: "latitude",
    label: "Latitude",
    type: "number",
    optional: true,
  },
  {
    name: "longitude",
    label: "Longitude",
    type: "number",
    optional: true,
  },
  {
    name: "landmark",
    label: "Landmark",
    optional: true,
  },
];

export default function Locations() {
  return (
    <AdminResourcePage
      title="Locations"
      description="Manage venues, pickup points, airports and operational locations."
      endpoint="/locations"
      fields={fields}
      searchFields={[
        "locationCode",
        "name",
        "city",
        "state",
        "landmark",
      ]}
      columns={[
        {
          key: "locationCode",
          label: "Code",
        },
        {
          key: "name",
          label: "Location",
        },
        {
          key: "city",
          label: "City",
        },
        {
          key: "state",
          label: "State",
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