import { useCallback, useEffect, useMemo, useState } from "react";
import {
  approveInvoice,
  rejectInvoice,
  shareInvoice,
  payInvoice,
  approveVendorBill,
  rejectVendorBill,
  shareVendorBill,
  payVendorBill,
  downloadInvoicePdf,
  downloadVendorBillPdf,
  getClientInvoices,
  getVendorBills,
} from "../../api/billing.api";
import { getApiErrorMessage } from "../../utils/errorHandler";
import "../../styles/management-pages.css";

const STATUSES = [
  "DRAFT",
  "UNDER_REVIEW",
  "APPROVED",
  "REJECTED",
  "SHARED",
  "PAID",
];

const PAYMENT_MODES = ["CASH", "CHEQUE", "UPI", "NEFT", "RTGS"];

const unwrap = (response) =>
  response?.data?.data ?? response?.data ?? response ?? [];

const getId = (item) => String(item?._id ?? item?.id ?? "");

const getRelationName = (value, fields = []) => {
  if (!value) return "—";
  if (typeof value !== "object") return String(value);

  for (const field of fields) {
    if (value[field]) return value[field];
  }

  return value._id ? String(value._id).slice(-6) : "—";
};

const formatDate = (value) => {
  if (!value) return "—";
  const date = new Date(value);
  return Number.isNaN(date.getTime())
    ? "—"
    : date.toLocaleDateString("en-IN");
};

const formatCurrency = (value) => {
  const amount = Number(value);
  if (!Number.isFinite(amount)) return "—";

  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 2,
  }).format(amount);
};

function downloadBlob(blob, filename) {
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");

  anchor.href = url;
  anchor.download = filename;
  document.body.appendChild(anchor);
  anchor.click();
  anchor.remove();

  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

export default function BillingManagement() {
  const [tab, setTab] = useState("INVOICES");
  const [invoices, setInvoices] = useState([]);
  const [vendorBills, setVendorBills] = useState([]);
  const [loading, setLoading] = useState(true);
  const [busyId, setBusyId] = useState("");
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("ALL");
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");

  const loadBilling = useCallback(async () => {
    setLoading(true);
    setError("");

    try {
      const [invoiceResponse, billResponse] = await Promise.all([
        getClientInvoices(),
        getVendorBills(),
      ]);

      const invoiceData = unwrap(invoiceResponse);
      const billData = unwrap(billResponse);

      setInvoices(Array.isArray(invoiceData) ? invoiceData : []);
      setVendorBills(Array.isArray(billData) ? billData : []);
    } catch (err) {
      setError(getApiErrorMessage(err));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadBilling();
  }, [loadBilling]);

  const records = tab === "INVOICES" ? invoices : vendorBills;

  const filteredRecords = useMemo(() => {
    const query = search.trim().toLowerCase();

    return records.filter((item) => {
      const relatedName =
        tab === "INVOICES"
          ? getRelationName(item.client, ["companyName", "name", "clientName"])
          : getRelationName(item.vendor, ["companyName", "name"]);

      const searchable = [
        item.invoiceNumber,
        item.billNumber,
        item.status,
        relatedName,
        item.totalAmount,
        item.totalKm,
        item.remarks,
      ]
        .filter(Boolean)
        .join(" ")
        .toLowerCase();

      return (
        (!query || searchable.includes(query)) &&
        (statusFilter === "ALL" || item.status === statusFilter)
      );
    });
  }, [records, search, statusFilter, tab]);

  async function performAction(item, action, actionName) {
    const id = getId(item);

    if (!id) {
      setError("This record has no valid identifier.");
      return;
    }

    setError("");
    setNotice("");
    setBusyId(id);

    try {
      if (actionName === "approve" || actionName === "reject") {
        const remarks = window.prompt(
          actionName === "approve"
            ? "Approval remarks (optional):"
            : "Reason for rejection:"
        );

        if (remarks === null) return;

        if (actionName === "reject" && !remarks.trim()) {
          setError("Please enter a reason before rejecting.");
          return;
        }

        await action(id, remarks.trim());
      } else if (actionName === "paid") {
        const paymentMode = window.prompt(
          `Payment method: ${PAYMENT_MODES.join(", ")}`,
          "NEFT"
        );

        if (paymentMode === null) return;

        const normalizedMode = paymentMode.trim().toUpperCase();

        if (!PAYMENT_MODES.includes(normalizedMode)) {
          setError(`Choose a valid payment method: ${PAYMENT_MODES.join(", ")}.`);
          return;
        }

        const paymentReference = window.prompt(
          "Payment reference (optional):",
          ""
        );

        if (paymentReference === null) return;

        await action(id, normalizedMode, paymentReference.trim());
      } else {
        await action(id);
      }

      setNotice("Billing record updated successfully.");
      await loadBilling();
    } catch (err) {
      setError(getApiErrorMessage(err));
    } finally {
      setBusyId("");
    }
  }

  async function handleDownload(item) {
    const id = getId(item);

    if (!id) {
      setError("This record has no valid identifier.");
      return;
    }

    setError("");
    setNotice("");
    setBusyId(id);

    try {
      const blob =
        tab === "INVOICES"
          ? await downloadInvoicePdf(id)
          : await downloadVendorBillPdf(id);

      const number =
        item.invoiceNumber || item.billNumber || id.slice(-6);

      downloadBlob(
        blob,
        `${tab === "INVOICES" ? "invoice" : "vendor-bill"}-${number}.pdf`
      );

      setNotice("PDF download started.");
    } catch (err) {
      setError(getApiErrorMessage(err));
    } finally {
      setBusyId("");
    }
  }

  function renderActions(item) {
    const status = item.status;
    const id = getId(item);
    const busy = busyId === id;

    const actions =
      tab === "INVOICES"
        ? {
            approve: approveInvoice,
            reject: rejectInvoice,
            share: shareInvoice,
            paid: payInvoice,
          }
        : {
            approve: approveVendorBill,
            reject: rejectVendorBill,
            share: shareVendorBill,
            paid: payVendorBill,
          };

    return (
      <div className="management-actions">
        {(status === "DRAFT" || status === "UNDER_REVIEW") && (
          <>
            <button
              type="button"
              className="management-button management-button--primary"
              disabled={busy}
              onClick={() =>
                performAction(item, actions.approve, "approve")
              }
            >
              Approve
            </button>

            <button
              type="button"
              className="management-button management-button--danger"
              disabled={busy}
              onClick={() =>
                performAction(item, actions.reject, "reject")
              }
            >
              Reject
            </button>
          </>
        )}

        {status === "APPROVED" && (
          <button
            type="button"
            className="management-button"
            disabled={busy}
            onClick={() => performAction(item, actions.share, "share")}
          >
            Mark shared
          </button>
        )}

        {status === "SHARED" && (
          <button
            type="button"
            className="management-button management-button--primary"
            disabled={busy}
            onClick={() => performAction(item, actions.paid, "paid")}
          >
            Mark paid
          </button>
        )}

        <button
          type="button"
          className="management-button"
          disabled={busy}
          onClick={() => handleDownload(item)}
        >
          {busy ? "Working…" : "PDF"}
        </button>
      </div>
    );
  }

  return (
    <section className="management-page">
      <header className="management-page__header">
        <div>
          <p className="management-page__eyebrow">FINANCE</p>
          <h1>Billing Management</h1>
          <p>Review invoices and vendor bills, record decisions and track payments.</p>
        </div>

        <button
          type="button"
          className="management-button"
          onClick={loadBilling}
          disabled={loading}
        >
          {loading ? "Refreshing…" : "Refresh"}
        </button>
      </header>

      <div className="management-stats">
        <div className="management-stat">
          <span>Client invoices</span>
          <strong>{invoices.length}</strong>
        </div>
        <div className="management-stat">
          <span>Vendor bills</span>
          <strong>{vendorBills.length}</strong>
        </div>
        <div className="management-stat">
          <span>Awaiting review</span>
          <strong>
            {[...invoices, ...vendorBills].filter((item) =>
              ["DRAFT", "UNDER_REVIEW"].includes(item.status)
            ).length}
          </strong>
        </div>
        <div className="management-stat">
          <span>Shared / awaiting payment</span>
          <strong>
            {[...invoices, ...vendorBills].filter(
              (item) => item.status === "SHARED"
            ).length}
          </strong>
        </div>
      </div>

      {error && (
        <div
          className="management-alert management-alert--error"
          role="alert"
        >
          {error}
          <button type="button" onClick={() => setError("")}>Dismiss</button>
        </div>
      )}

      {notice && (
        <div
          className="management-alert management-alert--success"
          role="status"
        >
          {notice}
          <button type="button" onClick={() => setNotice("")}>Dismiss</button>
        </div>
      )}

      <div className="management-card">
        <div className="management-toolbar">
          <button
            type="button"
            className={`management-button ${tab === "INVOICES" ? "management-button--primary" : ""}`}
            onClick={() => {
              setTab("INVOICES");
              setStatusFilter("ALL");
            }}
          >
            Client invoices ({invoices.length})
          </button>

          <button
            type="button"
            className={`management-button ${tab === "VENDOR_BILLS" ? "management-button--primary" : ""}`}
            onClick={() => {
              setTab("VENDOR_BILLS");
              setStatusFilter("ALL");
            }}
          >
            Vendor bills ({vendorBills.length})
          </button>

          <input
            aria-label="Search billing records"
            placeholder="Search number, client, vendor or status…"
            value={search}
            onChange={(event) => setSearch(event.target.value)}
          />

          <select
            aria-label="Filter billing status"
            value={statusFilter}
            onChange={(event) => setStatusFilter(event.target.value)}
          >
            <option value="ALL">All statuses</option>
            {STATUSES.map((status) => (
              <option key={status} value={status}>{status.replaceAll("_", " ")}</option>
            ))}
          </select>
        </div>

        {loading ? (
          <div className="management-empty">Loading billing records…</div>
        ) : filteredRecords.length === 0 ? (
          <div className="management-empty">No billing records match your filters.</div>
        ) : (
          <div className="management-table-wrap">
            <table className="management-table">
              <thead>
                <tr>
                  <th>Record</th>
                  <th>{tab === "INVOICES" ? "Client" : "Vendor"}</th>
                  <th>Date</th>
                  <th>Amount</th>
                  <th>Status</th>
                  <th>Payment</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredRecords.map((item) => {
                  const id = getId(item);
                  const party =
                    tab === "INVOICES"
                      ? getRelationName(item.client, ["companyName", "name", "clientName"])
                      : getRelationName(item.vendor, ["companyName", "name"]);

                  return (
                    <tr key={id}>
                      <td>
                        <strong>
                          {item.invoiceNumber ||
                            item.billNumber ||
                            `${tab === "INVOICES" ? "Invoice" : "Vendor bill"} ${id.slice(-6)}`}
                        </strong>
                        <small>{id.slice(-8)}</small>
                      </td>
                      <td>{party}</td>
                      <td>
                        {formatDate(
                          item.invoiceDate || item.billDate || item.createdAt
                        )}
                      </td>
                      <td>
                        {formatCurrency(item.totalAmount)}
                      </td>
                      <td>
                        <span className={`management-status management-status--${String(item.status || "unknown").toLowerCase()}`}>
                          {String(item.status || "UNKNOWN").replaceAll("_", " ")}
                        </span>
                      </td>
                      <td>
                        <div>{item.paymentMode || "—"}</div>
                        <small>{item.paymentReference || ""}</small>
                        {item.paymentDate && (
                          <small>Paid: {formatDate(item.paymentDate)}</small>
                        )}
                      </td>
                      <td>{renderActions(item)}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </section>
  );
}