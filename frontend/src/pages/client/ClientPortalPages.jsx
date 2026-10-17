
import { useEffect, useState } from "react";
import { Link } from "react-router-dom";

import {
  getClientDashboard,
  getClientEvents,
  getClientInvoices,
  downloadClientInvoice,
} from "../../api/clientPortal.api";

const pageStyle = {
  display: "grid",
  gap: "20px",
  color: "var(--text-primary, #172033)",
};

const cardStyle = {
  background: "var(--surface, #ffffff)",
  border: "1px solid var(--border, #e5e7eb)",
  borderRadius: "12px",
  padding: "20px",
  minWidth: 0,
};

const gridStyle = {
  display: "grid",
  gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))",
  gap: "16px",
};

function unwrap(response) {
  return response?.data?.data ?? response?.data ?? response;
}

function getList(response) {
  const data = unwrap(response);

  if (Array.isArray(data)) return data;
  if (Array.isArray(data?.items)) return data.items;
  if (Array.isArray(data?.events)) return data.events;
  if (Array.isArray(data?.invoices)) return data.invoices;

  return [];
}

function getId(item) {
  return item?._id || item?.id || "";
}

function formatDate(value) {
  if (!value) return "—";

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) return "—";

  return date.toLocaleDateString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

function formatCurrency(value) {
  const amount = Number(value);

  if (!Number.isFinite(amount)) return "—";

  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 2,
  }).format(amount);
}

function getError(error) {
  if (error?.response?.status === 404) {
    return "No current records were found for this request.";
  }

  return (
    error?.response?.data?.message ||
    error?.message ||
    "Unable to load information. Please try again."
  );
}

function PageMessage({ children, error = false }) {
  return (
    <div
      role={error ? "alert" : "status"}
      style={{
        ...cardStyle,
        color: error ? "#b42318" : "inherit",
      }}
    >
      {children}
    </div>
  );
}

function PageHeader({ title, description }) {
  return (
    <header>
      <h1 style={{ margin: "0 0 8px", fontSize: "28px" }}>
        {title}
      </h1>
      <p style={{ margin: 0, color: "#667085" }}>
        {description}
      </p>
    </header>
  );
}

function Metric({ label, value }) {
  return (
    <div style={cardStyle}>
      <p style={{ margin: "0 0 12px", color: "#667085" }}>
        {label}
      </p>
      <strong style={{ fontSize: "28px" }}>{value ?? 0}</strong>
    </div>
  );
}

function Status({ value }) {
  const status = String(value || "UNKNOWN").replaceAll("_", " ");

  return (
    <span
      style={{
        display: "inline-block",
        padding: "5px 9px",
        borderRadius: "20px",
        background: "#f2f4f7",
        fontSize: "12px",
        fontWeight: 600,
      }}
    >
      {status}
    </span>
  );
}

function DataTable({ headers, children }) {
  return (
    <div style={{ ...cardStyle, overflowX: "auto" }}>
      <table
        style={{
          width: "100%",
          borderCollapse: "collapse",
          textAlign: "left",
        }}
      >
        <thead>
          <tr>
            {headers.map((header) => (
              <th
                key={header}
                style={{
                  padding: "12px",
                  borderBottom: "1px solid #e5e7eb",
                  color: "#667085",
                  whiteSpace: "nowrap",
                }}
              >
                {header}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>{children}</tbody>
      </table>
    </div>
  );
}

function Cell({ children }) {
  return (
    <td
      style={{
        padding: "14px 12px",
        borderBottom: "1px solid #f0f1f3",
        verticalAlign: "top",
      }}
    >
      {children ?? "—"}
    </td>
  );
}

export function ClientDashboard() {
  const [dashboard, setDashboard] = useState(null);
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  async function loadDashboard() {
    setLoading(true);
    setError("");

    try {
      const results = await Promise.allSettled([
        getClientDashboard(),
        getClientEvents(),
      ]);

      const dashboardResult = results[0];
      const eventsResult = results[1];

      if (dashboardResult.status === "fulfilled") {
        setDashboard(unwrap(dashboardResult.value));
      } else {
        setError(getError(dashboardResult.reason));
      }

      if (eventsResult.status === "fulfilled") {
        setEvents(getList(eventsResult.value));
      } else {
        setError((current) =>
          current
            ? `${current} Events could not be loaded.`
            : getError(eventsResult.reason)
        );
      }
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadDashboard();
  }, []);

  if (loading) return <PageMessage>Loading your dashboard…</PageMessage>;

  return (
    <div style={pageStyle}>
      <PageHeader
        title="Client Dashboard"
        description="A summary of your events and invoices."
      />

      {error && (
        <PageMessage error>{error}</PageMessage>
      )}

      <section style={gridStyle}>
        <Metric label="Total Events" value={dashboard?.totalEvents} />
        <Metric
          label="Completed Events"
          value={dashboard?.completedEvents}
        />
        <Metric
          label="Total Invoices"
          value={dashboard?.totalInvoices}
        />
        <Metric
          label="Pending Invoices"
          value={dashboard?.pendingInvoices}
        />
      </section>

      <section style={pageStyle}>
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            gap: "12px",
            flexWrap: "wrap",
          }}
        >
          <h2 style={{ margin: 0 }}>Recent Events</h2>
          <Link to="/client/events">View all events</Link>
        </div>

        {events.length === 0 ? (
          <PageMessage>
            No events are currently available for your account.
          </PageMessage>
        ) : (
          <DataTable
            headers={["Event", "Start Date", "End Date", "Status"]}
          >
            {events.slice(0, 5).map((event) => (
              <tr key={getId(event)}>
                <Cell>
                  {event.name || event.eventName || event.eventCode}
                </Cell>
                <Cell>{formatDate(event.startDate)}</Cell>
                <Cell>{formatDate(event.endDate)}</Cell>
                <Cell><Status value={event.status} /></Cell>
              </tr>
            ))}
          </DataTable>
        )}
      </section>
    </div>
  );
}

export function ClientEvents() {
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  async function loadEvents() {
    setLoading(true);
    setError("");

    try {
      const response = await getClientEvents();
      setEvents(getList(response));
    } catch (err) {
      setError(getError(err));
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadEvents();
  }, []);

  return (
    <div style={pageStyle}>
      <PageHeader
        title="My Events"
        description="View events associated with your client account."
      />

      <div>
        <button
          type="button"
          onClick={loadEvents}
          disabled={loading}
          style={{ padding: "9px 14px", cursor: "pointer" }}
        >
          {loading ? "Refreshing…" : "Refresh"}
        </button>
      </div>

      {error && <PageMessage error>{error}</PageMessage>}

      {loading ? (
        <PageMessage>Loading events…</PageMessage>
      ) : events.length === 0 ? (
        <PageMessage>No events found.</PageMessage>
      ) : (
        <DataTable
          headers={[
            "Event",
            "Event Code",
            "Start Date",
            "End Date",
            "Status",
          ]}
        >
          {events.map((event) => (
            <tr key={getId(event)}>
              <Cell>
                <strong>{event.name || event.eventName || "Event"}</strong>
              </Cell>
              <Cell>{event.eventCode}</Cell>
              <Cell>{formatDate(event.startDate)}</Cell>
              <Cell>{formatDate(event.endDate)}</Cell>
              <Cell><Status value={event.status} /></Cell>
            </tr>
          ))}
        </DataTable>
      )}
    </div>
  );
}

export function ClientInvoices() {
  const [invoices, setInvoices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [downloadingId, setDownloadingId] = useState("");

  async function loadInvoices() {
    setLoading(true);
    setError("");

    try {
      const response = await getClientInvoices();
      setInvoices(getList(response));
    } catch (err) {
      setError(getError(err));
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadInvoices();
  }, []);

  async function handleDownload(invoice) {
    const id = getId(invoice);

    if (!id) {
      setError("This invoice has no valid identifier.");
      return;
    }

    setError("");
    setDownloadingId(id);

    try {
      const blob = await downloadClientInvoice(id);
      const url = URL.createObjectURL(blob);
      const anchor = document.createElement("a");

      anchor.href = url;
      anchor.download = `invoice-${invoice.invoiceNumber || id}.pdf`;
      document.body.appendChild(anchor);
      anchor.click();
      anchor.remove();
      URL.revokeObjectURL(url);
    } catch (err) {
      setError(getError(err));
    } finally {
      setDownloadingId("");
    }
  }

  return (
    <div style={pageStyle}>
      <PageHeader
        title="Invoices"
        description="Review your invoices and download available PDF copies."
      />

      <div>
        <button
          type="button"
          onClick={loadInvoices}
          disabled={loading}
          style={{ padding: "9px 14px", cursor: "pointer" }}
        >
          {loading ? "Refreshing…" : "Refresh"}
        </button>
      </div>

      {error && <PageMessage error>{error}</PageMessage>}

      {loading ? (
        <PageMessage>Loading invoices…</PageMessage>
      ) : invoices.length === 0 ? (
        <PageMessage>No invoices found for your account.</PageMessage>
      ) : (
        <DataTable
          headers={[
            "Invoice",
            "Date",
            "Amount",
            "Status",
            "Download",
          ]}
        >
          {invoices.map((invoice) => {
            const id = getId(invoice);

            return (
              <tr key={id}>
                <Cell>
                  <strong>
                    {invoice.invoiceNumber ||
                      invoice.invoiceCode ||
                      `Invoice ${id.slice(-6)}`}
                  </strong>
                </Cell>
                <Cell>
                  {formatDate(
                    invoice.invoiceDate ||
                    invoice.createdAt ||
                    invoice.createdOn
                  )}
                </Cell>
                <Cell>
                  {formatCurrency(
                    invoice.grandTotal ??
                    invoice.totalAmount ??
                    invoice.amount ??
                    invoice.total
                  )}
                </Cell>
                <Cell><Status value={invoice.status} /></Cell>
                <Cell>
                  <button
                    type="button"
                    onClick={() => handleDownload(invoice)}
                    disabled={!id || downloadingId === id}
                  >
                    {downloadingId === id
                      ? "Downloading…"
                      : "Download PDF"}
                  </button>
                </Cell>
              </tr>
            );
          })}
        </DataTable>
      )}
    </div>
  );
}
