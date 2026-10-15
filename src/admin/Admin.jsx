import React, { useEffect, useMemo, useState } from "react";
import { supabase, requireSupabase } from "../firebase/config";
import {
  ChevronRight,
  Users,
  Award,
  BookOpen,
  CalendarDays,
  FileText,
  CreditCard,
  Bell,
  BarChart3,
  Settings,
  LogOut,
  Mail,
  Clock3,
  Newspaper,
  Network,
  PanelLeftClose,
  PanelLeft,
  Search,
  RefreshCw,
  CheckCircle2,
  XCircle,
  Eye,
  ShieldCheck,
} from "lucide-react";
import logo from "../assets/ni4e-logo.png";
import { useAuth } from "../firebase/auth";

const STATUS = [
  "pending",
  "under_review",
  "needs_information",
  "approved",
  "rejected",
];
const statusLabel = (value) =>
  ({
    pending: "Pending review",
    under_review: "Under review",
    needs_information: "Corrections requested",
    approved: "Approved for payment",
    rejected: "Rejected",
    payment_pending: "Payment pending",
    active: "Active",
  })[value] ||
  value ||
  "Pending";

export default function Admin({ setPage }) {
  const [side, setSide] = useState(false);
  const closeMenu = () => setSide(false);
  const selectTab = (nextTab) => {
    setTab(nextTab);
    closeMenu();
  };
  useEffect(() => {
    if (!side) return undefined;
    const onKeyDown = (event) => {
      if (event.key === "Escape") closeMenu();
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [side]);
  const [tab, setTab] = useState("Dashboard");
  const [applications, setApplications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState("");
  const [error, setError] = useState("");
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [fees, setFees] = useState([]);
  const [feeDraft, setFeeDraft] = useState({
    category: "Student Member",
    amount: "",
    upgradeAmount: "",
    active: true,
  });
  const [feeSaving, setFeeSaving] = useState(false);
  const [members, setMembers] = useState([]);
  const [payments, setPayments] = useState([]);
  const [settings, setSettings] = useState([]);
  const [settingDraft, setSettingDraft] = useState({
    setting_key: "",
    setting_value: "",
    description: "",
  });
  const [settingsSaving, setSettingsSaving] = useState(false);
  const [contentRows, setContentRows] = useState([]);
  const [contentLoading, setContentLoading] = useState(false);
  const [contentSaving, setContentSaving] = useState(false);
  const [contentDraft, setContentDraft] = useState({
    id: "",
    title: "",
    slug: "",
    summary: "",
    body: "",
    published: false,
    metadata: "{}",
    event_start: "",
    event_end: "",
  });
  const [enquiries, setEnquiries] = useState([]);
  const [selected, setSelected] = useState(null);
  const [reviewNotes, setReviewNotes] = useState("");
  const [applicationDocuments, setApplicationDocuments] = useState([]);
  const [documentsLoading, setDocumentsLoading] = useState(false);
  const [documentError, setDocumentError] = useState("");
  const { logout, profile } = useAuth();

  const loadApplications = async () => {
    setLoading(true);
    setError("");
    try {
      requireSupabase();
      const { data, error: queryError } = await supabase
        .from("membership_applications")
        .select("*")
        .order("submitted_at", { ascending: false })
        .limit(200);
      if (queryError) throw queryError;
      setApplications(
        (data || []).map((item) => ({
          ...item.application_data,
          ...item,
          uid: item.user_id,
          fullName: item.full_name || item.application_data?.name || "",
          submittedAt: item.submitted_at,
          category: item.category || item.application_data?.category,
        })),
      );
    } catch (err) {
      const message = err.message || "Could not load applications.";
      setError(
        err.code === "42501" || /permission|policy|row-level/i.test(message)
          ? "Supabase denied access. Confirm this account has role=admin in public.profiles and run supabase-repair-migration.sql."
          : /schema cache|column .* does not exist|PGRST20/i.test(
                `${message} ${err.code || ""}`,
              )
            ? "The Supabase database schema is behind this website. Run supabase-repair-migration.sql in the project SQL Editor, then refresh the schema cache."
            : message,
      );
    } finally {
      setLoading(false);
    }
  };

  const loadFees = async () => {
    setError("");
    try {
      requireSupabase();
      const { data, error } = await supabase
        .from("membership_fee_schedule")
        .select("*")
        .order("category");
      if (error) throw error;
      setFees(data || []);
    } catch (err) {
      setError(
        /schema cache|column .* does not exist|PGRST20/i.test(
          `${err.message || ""} ${err.code || ""}`,
        )
          ? "The Supabase database schema is behind this website. Run supabase-repair-migration.sql, then reload the page."
          : err.message || "Could not load fee schedule.",
      );
    }
  };
  const loadMembers = async () => {
    setError("");
    try {
      requireSupabase();
      const { data, error } = await supabase
        .from("profiles")
        .select(
          "id,full_name,email,phone,membership_category,membership_status,created_at",
        )
        .order("created_at", { ascending: false })
        .limit(300);
      if (error) throw error;
      setMembers(data || []);
    } catch (err) {
      setError(err.message || "Could not load members.");
    }
  };
  const loadPayments = async () => {
    setContentLoading(true);
    setError("");
    try {
      requireSupabase();
      const { data, error } = await supabase
        .from("membership_payments")
        .select(
          "id,user_id,application_id,category,amount_kobo,currency,provider,provider_reference,status,payment_type,created_at,paid_at",
        )
        .order("created_at", { ascending: false })
        .limit(300);
      if (error) throw error;
      setPayments(data || []);
    } catch (err) {
      setError(err.message || "Could not load payment records.");
    } finally {
      setContentLoading(false);
    }
  };
  const loadSettings = async () => {
    setContentLoading(true);
    setError("");
    try {
      requireSupabase();
      const { data, error } = await supabase
        .from("site_settings")
        .select("setting_key,setting_value,description,updated_at")
        .order("setting_key");
      if (error) throw error;
      setSettings(
        (data || []).map((row) => ({
          ...row,
          display_value:
            typeof row.setting_value === "string"
              ? row.setting_value
              : JSON.stringify(row.setting_value ?? ""),
        })),
      );
    } catch (err) {
      setError(err.message || "Could not load settings.");
    } finally {
      setContentLoading(false);
    }
  };
  const saveSetting = async (event) => {
    event.preventDefault();
    setSettingsSaving(true);
    setError("");
    try {
      requireSupabase();
      const key = settingDraft.setting_key
        .trim()
        .toLowerCase()
        .replace(/[^a-z0-9_]+/g, "_");
      if (!key) throw new Error("Enter a setting key.");
      let value;
      try {
        value = JSON.parse(settingDraft.setting_value);
      } catch {
        value = settingDraft.setting_value;
      }
      const { error } = await supabase
        .from("site_settings")
        .upsert(
          {
            setting_key: key,
            setting_value: value,
            description: settingDraft.description.trim(),
            updated_by: profile?.id || profile?.uid || null,
            updated_at: new Date().toISOString(),
          },
          { onConflict: "setting_key" },
        );
      if (error) throw error;
      setSettingDraft({ setting_key: "", setting_value: "", description: "" });
      await loadSettings();
    } catch (err) {
      setError(err.message || "Could not save setting.");
    } finally {
      setSettingsSaving(false);
    }
  };
  const deleteSetting = async (key) => {
    if (!window.confirm(`Delete setting “${key}”?`)) return;
    const { error } = await supabase
      .from("site_settings")
      .delete()
      .eq("setting_key", key);
    if (error) setError(error.message || "Could not delete setting.");
    else await loadSettings();
  };
  useEffect(() => {
    loadApplications();
  }, []);
  const contentTypeForTab = {
    Events: "event",
    "News & Announcements": "news",
    Publications: "publication",
    Executives: "executive",
    "Past Presidents": "past_president",
    Chapters: "chapter",
    Documents: "document",
    "Technical Divisions": "technical_division",
    Projects: "project",
    Committees: "committee",
  };
  const loadContent = async (type) => {
    setContentLoading(true);
    setError("");
    try {
      requireSupabase();
      const { data, error } = await supabase
        .from("site_content")
        .select("*")
        .eq("content_type", type)
        .order("created_at", { ascending: false });
      if (error) throw error;
      setContentRows(data || []);
    } catch (e) {
      setError(
        /schema cache|column .* does not exist|PGRST20|relation .* does not exist/i.test(
          `${e.message || ""} ${e.code || ""}`,
        )
          ? "The content database is missing required NI4E fields or tables. Run supabase-repair-migration.sql in Supabase SQL Editor, then refresh."
          : e.message || "Could not load content records.",
      );
    } finally {
      setContentLoading(false);
    }
  };
  const loadEnquiries = async () => {
    setContentLoading(true);
    setError("");
    try {
      requireSupabase();
      const { data, error } = await supabase
        .from("contact_enquiries")
        .select("*")
        .order("created_at", { ascending: false })
        .limit(300);
      if (error) throw error;
      setEnquiries(data || []);
    } catch (e) {
      setError(
        /schema cache|column .* does not exist|PGRST20|relation .* does not exist/i.test(
          `${e.message || ""} ${e.code || ""}`,
        )
          ? "The enquiries database table or columns are missing. Run supabase-repair-migration.sql in Supabase SQL Editor, then refresh."
          : e.message || "Could not load enquiries.",
      );
    } finally {
      setContentLoading(false);
    }
  };
  useEffect(() => {
    if (tab === "Fees & Membership") loadFees();
    if (tab === "Members") loadMembers();
    if (tab === "Payments") loadPayments();
    if (tab === "Settings") loadSettings();
    if (contentTypeForTab[tab]) loadContent(contentTypeForTab[tab]);
    if (tab === "Messages") loadEnquiries();
  }, [tab]);
  const saveContent = async (e) => {
    e.preventDefault();
    setContentSaving(true);
    setError("");
    try {
      const type = contentTypeForTab[tab];
      const slug = (contentDraft.slug || contentDraft.title)
        .toLowerCase()
        .trim()
        .replace(/[^a-z0-9]+/g, "-")
        .replace(/^-|-$/g, "");
      if (!contentDraft.title.trim() || !slug)
        throw new Error("Enter a title and valid slug.");
      let metadata = {};
      try {
        metadata = JSON.parse(contentDraft.metadata || "{}");
        if (
          !metadata ||
          Array.isArray(metadata) ||
          typeof metadata !== "object"
        )
          throw new Error("Metadata must be a JSON object.");
      } catch (parseError) {
        throw new Error(
          'Extra details must be valid JSON, for example: {\"venue\":\"Abuja\",\"event_type\":\"Conference\"}.',
        );
      }
      const payload = {
        content_type: type,
        title: contentDraft.title.trim(),
        slug,
        summary: contentDraft.summary.trim(),
        body: contentDraft.body.trim(),
        metadata,
        published: !!contentDraft.published,
        event_start: contentDraft.event_start
          ? new Date(contentDraft.event_start).toISOString()
          : null,
        event_end: contentDraft.event_end
          ? new Date(contentDraft.event_end).toISOString()
          : null,
        updated_at: new Date().toISOString(),
        created_by: profile?.id || null,
      };
      const result = contentDraft.id
        ? await supabase
            .from("site_content")
            .update(payload)
            .eq("id", contentDraft.id)
        : await supabase.from("site_content").insert(payload);
      if (result.error) throw result.error;
      setContentDraft({
        id: "",
        title: "",
        slug: "",
        summary: "",
        body: "",
        published: false,
        metadata: "{}",
        event_start: "",
        event_end: "",
      });
      await loadContent(type);
    } catch (e) {
      setError(e.message || "Could not save content.");
    } finally {
      setContentSaving(false);
    }
  };
  const deleteContent = async (row) => {
    if (!window.confirm(`Delete “${row.title}”? This cannot be undone.`))
      return;
    const { error } = await supabase
      .from("site_content")
      .delete()
      .eq("id", row.id);
    if (error) setError(error.message);
    else loadContent(contentTypeForTab[tab]);
  };
  const updateEnquiry = async (row, status) => {
    const { error } = await supabase
      .from("contact_enquiries")
      .update({ status, updated_at: new Date().toISOString() })
      .eq("id", row.id);
    if (error) setError(error.message);
    else loadEnquiries();
  };
  const saveFee = async (event) => {
    event.preventDefault();
    setFeeSaving(true);
    setError("");
    try {
      const amount = Math.round(Number(feeDraft.amount) * 100);
      const upgrade =
        feeDraft.upgradeAmount === ""
          ? null
          : Math.round(Number(feeDraft.upgradeAmount) * 100);
      if (
        !feeDraft.category.trim() ||
        !Number.isFinite(amount) ||
        amount <= 0 ||
        (upgrade !== null && (!Number.isFinite(upgrade) || upgrade <= 0))
      )
        throw new Error(
          "Enter a category and valid positive fee amounts in naira.",
        );
      const { error } = await supabase
        .from("membership_fee_schedule")
        .upsert(
          {
            category: feeDraft.category.trim(),
            amount_kobo: amount,
            upgrade_amount_kobo: upgrade,
            currency: "NGN",
            active: !!feeDraft.active,
            updated_at: new Date().toISOString(),
          },
          { onConflict: "category" },
        );
      if (error) throw error;
      await loadFees();
      setFeeDraft({
        category: "",
        amount: "",
        upgradeAmount: "",
        active: true,
      });
    } catch (e) {
      setError(e.message || "Unable to save fee.");
    } finally {
      setFeeSaving(false);
    }
  };
  const editFee = (fee) =>
    setFeeDraft({
      category: fee.category,
      amount: fee.amount_kobo == null ? "" : (fee.amount_kobo / 100).toString(),
      upgradeAmount:
        fee.upgrade_amount_kobo == null
          ? ""
          : (fee.upgrade_amount_kobo / 100).toString(),
      active: fee.active,
    });
  const updateMemberStatus = async (member, status) => {
    setError("");
    if (status === "active") {
      setError(
        "Membership activation is controlled by the server-side payment verification workflow. Do not activate members manually.",
      );
      return;
    }
    const { error } = await supabase
      .from("profiles")
      .update({
        membership_status: status,
        updated_at: new Date().toISOString(),
      })
      .eq("id", member.id);
    if (error) setError(error.message);
    else await loadMembers();
  };
  const filtered = useMemo(
    () =>
      applications.filter((a) => {
        const needle = search.trim().toLowerCase();
        const matches =
          !needle ||
          [a.fullName, a.email, a.phone, a.category, a.id].some((v) =>
            String(v || "")
              .toLowerCase()
              .includes(needle),
          );
        return (
          matches &&
          (statusFilter === "all" || (a.status || "pending") === statusFilter)
        );
      }),
    [applications, search, statusFilter],
  );

  const loadApplicationDocuments = async (app) => {
    setApplicationDocuments([]);
    setDocumentError("");
    if (!app?.id) return;
    setDocumentsLoading(true);
    try {
      requireSupabase();
      const { data, error } = await supabase
        .from("membership_documents")
        .select(
          "id,user_id,application_id,document_type,file_name,storage_path,mime_type,size_bytes,created_at",
        )
        .eq("application_id", app.id)
        .order("created_at", { ascending: false });
      if (error) throw error;
      const docs = await Promise.all(
        (data || []).map(async (doc) => {
          const { data: signed, error: signedError } = await supabase.storage
            .from("membership-documents")
            .createSignedUrl(doc.storage_path, 60);
          return {
            ...doc,
            signedUrl: signedError ? "" : signed?.signedUrl || "",
            signedUrlError: signedError?.message || "",
          };
        }),
      );
      setApplicationDocuments(docs);
    } catch (err) {
      setDocumentError(err.message || "Could not load supporting documents.");
    } finally {
      setDocumentsLoading(false);
    }
  };

  const openApplication = (app) => {
    setSelected(app);
    setReviewNotes(app?.review_notes || "");
    loadApplicationDocuments(app);
  };

  const changeStatus = async (app, status) => {
    if (
      ["rejected", "needs_information"].includes(status) &&
      !reviewNotes.trim()
    ) {
      setError(
        status === "rejected"
          ? "Add a reason before rejecting this application."
          : "Explain what information the applicant needs to provide.",
      );
      return;
    }
    setUpdating(app.id);
    setError("");
    try {
      requireSupabase();
      const { error: reviewError } = await supabase.rpc(
        "admin_review_membership_application",
        {
          p_application_id: app.id,
          p_status: status,
          p_review_notes: reviewNotes.trim() || null,
        },
      );
      if (reviewError) {
        const details = `${reviewError.message || ""} ${reviewError.code || ""}`;
        if (
          /admin_review_membership_application|schema cache|function .* not found|PGRST202/i.test(
            details,
          )
        ) {
          throw new Error(
            "Supabase cannot find the membership review function in this project's API schema. Confirm the SQL migration was run in the exact Supabase project used by this site, then refresh the schema cache (Supabase SQL Editor: NOTIFY pgrst, 'reload schema';) and reload this page.",
          );
        }
        if (/review_notes|schema cache|PGRST204/i.test(details)) {
          throw new Error(
            "Supabase is missing the membership review columns. Run supabase-repair-migration.sql, then reload the schema cache and retry.",
          );
        }
        throw reviewError;
      }
      const notes = reviewNotes.trim() || null;
      setApplications((old) =>
        old.map((a) =>
          a.id === app.id ? { ...a, status, review_notes: notes } : a,
        ),
      );
      setSelected((old) =>
        old?.id === app.id ? { ...old, status, review_notes: notes } : old,
      );
      setReviewNotes("");
      setSelected(null);
    } catch (err) {
      setError(err.message || "Unable to update application status.");
    } finally {
      setUpdating("");
    }
  };

  const nav = [
    ["Dashboard", BarChart3],
    ["Applications", FileText],
    ["Members", Users],
    ["Fees & Membership", CreditCard],
    ["Payments", CreditCard],
    ["Events", CalendarDays],
    ["News & Announcements", Newspaper],
    ["Publications", BookOpen],
    ["Technical Divisions", Network],
    ["Projects", BookOpen],
    ["Committees", Users],
    ["Executives", Award],
    ["Past Presidents", Clock3],
    ["Chapters", Network],
    ["Documents", BookOpen],
    ["Messages", Mail],
    ["Settings", Settings],
  ];
  const pending = applications.filter(
    (a) => !a.status || a.status === "pending" || a.status === "under_review",
  ).length;

  return (
    <div className="dashboard adminResponsive">
      {side && (
        <button
          type="button"
          className="adminNavBackdrop"
          aria-label="Close admin navigation"
          onClick={closeMenu}
        />
      )}
      <aside
        id="ni4e-admin-navigation"
        aria-label="Admin navigation"
        className={`dashSide adminNavDrawer ${side ? "expanded" : "collapsed"}`}
      >
        <div className="dashBrand">
          <img src={logo} alt="NI4E" />
          {side && (
            <b>
              NI4E
              <br />
              <small>Admin Panel</small>
            </b>
          )}
        </div>
        {nav.map(([label, Icon]) => (
          <button
            title={label}
            aria-label={label}
            className={tab === label ? "active" : ""}
            key={label}
            onClick={() => selectTab(label)}
          >
            <Icon size={17} />
            <span className="adminNavLabel">{label}</span>
          </button>
        ))}
        <button
          className="logout"
          onClick={async () => {
            closeMenu();
            await logout();
            setPage("home");
          }}
        >
          <LogOut size={17} />
          <span className="adminNavLabel">Logout</span>
        </button>
      </aside>
      <main className="dashMain">
        <div className="dashTop">
          <div className="dashTitle">
            <button
              className="collapseBtn adminMenuToggle"
              onClick={() => setSide(!side)}
              aria-label={
                side ? "Close admin navigation" : "Open admin navigation"
              }
              aria-expanded={side}
              aria-controls="ni4e-admin-navigation"
            >
              {side ? <PanelLeftClose /> : <PanelLeft />}
            </button>
            <div>
              <span className="kicker">NI4E ADMINISTRATION</span>
              <h1>{tab}</h1>
            </div>
          </div>
          <div className="dashUser">
            <span className="adminGreeting">
              {profile?.fullName || profile?.email || "Administrator"}
            </span>
            <ShieldCheck size={20} />
          </div>
        </div>
        {error && (
          <div className="adminAlert" role="alert">
            {error}
          </div>
        )}
        {tab === "Applications" ? (
          <>
            <div className="applicationToolbar">
              <label className="applicationSearch">
                <Search size={17} />
                <input
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="Search name, email, phone or reference"
                />
              </label>
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                aria-label="Filter by application status"
              >
                <option value="all">All statuses</option>
                {STATUS.map((s) => (
                  <option key={s} value={s}>
                    {statusLabel(s)}
                  </option>
                ))}
              </select>
              <button
                className="adminRefresh"
                onClick={loadApplications}
                disabled={loading}
              >
                <RefreshCw size={16} />
                {loading ? "Loading" : "Refresh"}
              </button>
            </div>
            <div className="applicationSummary">
              <div>
                <span>Total applications</span>
                <b>{applications.length}</b>
              </div>
              <div>
                <span>Awaiting review</span>
                <b>{pending}</b>
              </div>
              <div>
                <span>Approved</span>
                <b>
                  {applications.filter((a) => a.status === "approved").length}
                </b>
              </div>
            </div>
            <section className="applicationPanel">
              <div className="applicationPanelHead">
                <div>
                  <h2>Membership applications</h2>
                  <p>
                    Review submitted membership applications and update their
                    status.
                  </p>
                </div>
                <span>{filtered.length} results</span>
              </div>
              {loading ? (
                <div className="adminEmpty">
                  <span className="buttonSpinner" /> Loading applications…
                </div>
              ) : filtered.length === 0 ? (
                <div className="adminEmpty">
                  <FileText size={30} />
                  <b>No applications found</b>
                  <span>
                    New submissions will appear here once saved to Supabase.
                  </span>
                </div>
              ) : (
                <div className="applicationTableWrap">
                  <table className="applicationTable">
                    <thead>
                      <tr>
                        <th>Applicant</th>
                        <th>Category</th>
                        <th>Submitted</th>
                        <th>Status</th>
                        <th>Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {filtered.map((app) => (
                        <tr key={app.id}>
                          <td>
                            <b>{app.fullName || app.name || "Applicant"}</b>
                            <small>
                              {app.email || "No email"} ·{" "}
                              {app.phone || "No phone"}
                            </small>
                            <small className="appRef">Ref: {app.id}</small>
                          </td>
                          <td>{app.category || "Not specified"}</td>
                          <td>
                            {app.submittedAt
                              ? new Date(app.submittedAt).toLocaleDateString()
                              : "—"}
                          </td>
                          <td>
                            <span
                              className={`applicationStatus ${app.status || "pending"}`}
                            >
                              {statusLabel(app.status)}
                            </span>
                          </td>
                          <td>
                            <div className="applicationActions">
                              <button
                                aria-label="View application"
                                title="View details"
                                onClick={() => openApplication(app)}
                              >
                                <Eye size={16} />
                              </button>
                              <button
                                aria-label="Approve application"
                                title="Approve"
                                disabled={
                                  updating === app.id ||
                                  app.status === "approved"
                                }
                                onClick={() => openApplication(app)}
                              >
                                <CheckCircle2 size={16} />
                              </button>
                              <button
                                aria-label="Mark under review"
                                title="Under review"
                                disabled={updating === app.id}
                                onClick={() => {
                                  openApplication(app);
                                  setReviewNotes(app.review_notes || "");
                                }}
                              >
                                <RefreshCw size={16} />
                              </button>
                              <button
                                aria-label="Reject application"
                                title="Reject"
                                disabled={
                                  updating === app.id ||
                                  app.status === "rejected"
                                }
                                onClick={() => openApplication(app)}
                              >
                                <XCircle size={16} />
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </section>
          </>
        ) : tab === "Dashboard" ? (
          <>
            <div className="adminStats">
              <div>
                <span>Total Applications</span>
                <b>{applications.length}</b>
                <small>Saved in Supabase</small>
              </div>
              <div>
                <span>Awaiting Review</span>
                <b>{pending}</b>
                <small>Requires action</small>
              </div>
              <div>
                <span>Approved</span>
                <b>
                  {applications.filter((a) => a.status === "approved").length}
                </b>
                <small>Applications approved</small>
              </div>
              <div>
                <span>Rejected</span>
                <b>
                  {applications.filter((a) => a.status === "rejected").length}
                </b>
                <small>Applications declined</small>
              </div>
            </div>
            <div className="adminGrid">
              <section className="quick">
                <h2>Quick actions</h2>
                <button onClick={() => selectTab("Applications")}>
                  <FileText />
                  Review applications <ChevronRight />
                </button>
                <button onClick={() => selectTab("Members")}>
                  <Users />
                  Member records <ChevronRight />
                </button>
                <button onClick={() => selectTab("Payments")}>
                  <CreditCard />
                  Payment records <ChevronRight />
                </button>
                <button onClick={() => selectTab("Events")}>
                  <CalendarDays />
                  Manage events <ChevronRight />
                </button>
                <button onClick={() => selectTab("Settings")}>
                  <Settings />
                  Site settings <ChevronRight />
                </button>
                <button onClick={loadApplications}>
                  <RefreshCw />
                  Refresh data <ChevronRight />
                </button>
              </section>
              <section className="chart">
                <div className="sectionHead">
                  <h2>Application workflow</h2>
                  <span>Live Supabase data</span>
                </div>
                <p className="muted">
                  Applications move from submission to administrative review,
                  approval for payment, server-verified payment and member
                  activation. Approval alone never activates membership.
                </p>
              </section>
            </div>
            <section className="applicationPanel">
              <div className="applicationPanelHead">
                <div>
                  <h2>Recent applications</h2>
                  <p>Latest records received from the membership form.</p>
                </div>
                <button
                  className="textbtn"
                  onClick={() => selectTab("Applications")}
                >
                  View all <ChevronRight size={16} />
                </button>
              </div>
              {loading ? (
                <div className="adminEmpty">Loading records…</div>
              ) : (
                applications.slice(0, 5).map((app) => (
                  <div className="recentApplication" key={app.id}>
                    <div className="avatar">
                      {(app.fullName || "A")
                        .split(/\s+/)
                        .map((x) => x[0])
                        .join("")
                        .slice(0, 2)}
                    </div>
                    <div className="recentApplicationInfo">
                      <b>{app.fullName || app.name || "Applicant"}</b>
                      <small>
                        {app.email} · {app.category}
                      </small>
                    </div>
                    <span
                      className={`applicationStatus ${app.status || "pending"}`}
                    >
                      {statusLabel(app.status)}
                    </span>
                    <button
                      onClick={() => {
                        setTab("Applications");
                        openApplication(app);
                      }}
                      aria-label="View application"
                    >
                      <ChevronRight size={17} />
                    </button>
                  </div>
                ))
              )}
            </section>
          </>
        ) : tab === "Fees & Membership" ? (
          <>
            <section className="applicationPanel">
              <div className="applicationPanelHead">
                <div>
                  <h2>Membership fee schedule</h2>
                  <p>
                    Set official fees in naira. Paystack checkout uses these
                    server-side values.
                  </p>
                </div>
                <button className="adminRefresh" onClick={loadFees}>
                  <RefreshCw size={16} />
                  Refresh
                </button>
              </div>
              <form
                onSubmit={saveFee}
                className="applicationToolbar"
                style={{ alignItems: "end", flexWrap: "wrap" }}
              >
                <label>
                  Membership category
                  <input
                    required
                    value={feeDraft.category}
                    onChange={(e) =>
                      setFeeDraft({ ...feeDraft, category: e.target.value })
                    }
                    placeholder="e.g. Graduate Member"
                  />
                </label>
                <label>
                  Application fee (₦)
                  <input
                    required
                    type="number"
                    min="1"
                    step="0.01"
                    value={feeDraft.amount}
                    onChange={(e) =>
                      setFeeDraft({ ...feeDraft, amount: e.target.value })
                    }
                    placeholder="0.00"
                  />
                </label>
                <label>
                  Upgrade fee (₦)
                  <input
                    type="number"
                    min="1"
                    step="0.01"
                    value={feeDraft.upgradeAmount}
                    onChange={(e) =>
                      setFeeDraft({
                        ...feeDraft,
                        upgradeAmount: e.target.value,
                      })
                    }
                    placeholder="Leave blank if unset"
                  />
                </label>
                <label
                  style={{ display: "flex", gap: 8, alignItems: "center" }}
                >
                  <input
                    type="checkbox"
                    checked={feeDraft.active}
                    onChange={(e) =>
                      setFeeDraft({ ...feeDraft, active: e.target.checked })
                    }
                  />{" "}
                  Active for payments
                </label>
                <button className="gold" disabled={feeSaving}>
                  {feeSaving ? "Saving…" : "Save fee"}
                </button>
              </form>
              <div className="applicationTableWrap">
                <table className="applicationTable">
                  <thead>
                    <tr>
                      <th>Category</th>
                      <th>Application fee</th>
                      <th>Upgrade fee</th>
                      <th>Status</th>
                      <th>Action</th>
                    </tr>
                  </thead>
                  <tbody>
                    {fees.map((f) => (
                      <tr key={f.id}>
                        <td>
                          <b>{f.category}</b>
                        </td>
                        <td>
                          {f.amount_kobo == null
                            ? "Not set"
                            : `₦${(f.amount_kobo / 100).toLocaleString("en-NG", { minimumFractionDigits: 2 })}`}
                        </td>
                        <td>
                          {f.upgrade_amount_kobo == null
                            ? "Not set"
                            : `₦${(f.upgrade_amount_kobo / 100).toLocaleString("en-NG", { minimumFractionDigits: 2 })}`}
                        </td>
                        <td>
                          <span
                            className={`applicationStatus ${f.active ? "approved" : "pending"}`}
                          >
                            {f.active ? "Active" : "Disabled"}
                          </span>
                        </td>
                        <td>
                          <button
                            className="adminRefresh"
                            onClick={() => editFee(f)}
                          >
                            Edit
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              <p className="muted">
                No fee is assumed by the system. Configure the amount and
                activate the category only after NI4E confirms its official fee.
              </p>
            </section>
          </>
        ) : tab === "Members" ? (
          <section className="applicationPanel">
            <div className="applicationPanelHead">
              <div>
                <h2>Member and applicant records</h2>
                <p>
                  Membership status is managed here; only active members should
                  access the full member portal.
                </p>
              </div>
              <button className="adminRefresh" onClick={loadMembers}>
                <RefreshCw size={16} />
                Refresh
              </button>
            </div>
            <div className="applicationTableWrap">
              <table className="applicationTable">
                <thead>
                  <tr>
                    <th>Name / Email</th>
                    <th>Category</th>
                    <th>Status</th>
                    <th>Admin action</th>
                  </tr>
                </thead>
                <tbody>
                  {members.map((m) => (
                    <tr key={m.id}>
                      <td>
                        <b>{m.full_name || "User"}</b>
                        <small>{m.email}</small>
                      </td>
                      <td>{m.membership_category}</td>
                      <td>
                        <span
                          className={`applicationStatus ${m.membership_status === "active" ? "approved" : "pending"}`}
                        >
                          {m.membership_status}
                        </span>
                      </td>
                      <td>
                        <select
                          value={m.membership_status || "application_pending"}
                          onChange={(e) =>
                            updateMemberStatus(m, e.target.value)
                          }
                        >
                          <option value="application_pending">
                            Application pending
                          </option>
                          <option value="approved_pending_payment">
                            Approved — unpaid
                          </option>
                          <option value="active" disabled>
                            Active member (verified payment)
                          </option>
                          <option value="rejected">Rejected</option>
                          <option value="suspended">Suspended</option>
                        </select>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <p className="muted">
              Use the Applications tab to approve or reject applications. Do not
              manually mark someone active unless NI4E has verified the required
              approval and payment.
            </p>
          </section>
        ) : contentTypeForTab[tab] ? (
          <section className="applicationPanel">
            <div className="applicationPanelHead">
              <div>
                <h2>Manage {tab}</h2>
                <p>Create, edit, publish or unpublish institutional content.</p>
              </div>
              <button
                className="adminRefresh"
                onClick={() => loadContent(contentTypeForTab[tab])}
              >
                <RefreshCw size={16} />
                Refresh
              </button>
            </div>
            <form onSubmit={saveContent} className="contentEditor">
              <input
                placeholder="Title"
                required
                value={contentDraft.title}
                onChange={(e) =>
                  setContentDraft({ ...contentDraft, title: e.target.value })
                }
              />
              <input
                placeholder="URL slug (optional)"
                value={contentDraft.slug}
                onChange={(e) =>
                  setContentDraft({ ...contentDraft, slug: e.target.value })
                }
              />
              <input
                placeholder="Short summary"
                value={contentDraft.summary}
                onChange={(e) =>
                  setContentDraft({ ...contentDraft, summary: e.target.value })
                }
              />
              <textarea
                rows={4}
                placeholder="Main content / details"
                value={contentDraft.body}
                onChange={(e) =>
                  setContentDraft({ ...contentDraft, body: e.target.value })
                }
              />
              <label className="adminContentLabel">
                Extra details (JSON) — include resource_for to attach published
                Documents to matching public pages
                <textarea
                  rows={4}
                  placeholder={
                    '{\"venue\":\"Abuja\",\"event_type\":\"Conference\"}'
                  }
                  value={contentDraft.metadata}
                  onChange={(e) =>
                    setContentDraft({
                      ...contentDraft,
                      metadata: e.target.value,
                    })
                  }
                />
              </label>
              {contentTypeForTab[tab] === "event" && (
                <div className="adminDateFields">
                  <label>
                    Event starts
                    <input
                      type="datetime-local"
                      value={contentDraft.event_start}
                      onChange={(e) =>
                        setContentDraft({
                          ...contentDraft,
                          event_start: e.target.value,
                        })
                      }
                    />
                  </label>
                  <label>
                    Event ends
                    <input
                      type="datetime-local"
                      value={contentDraft.event_end}
                      onChange={(e) =>
                        setContentDraft({
                          ...contentDraft,
                          event_end: e.target.value,
                        })
                      }
                    />
                  </label>
                </div>
              )}
              <label className="check">
                <input
                  type="checkbox"
                  checked={contentDraft.published}
                  onChange={(e) =>
                    setContentDraft({
                      ...contentDraft,
                      published: e.target.checked,
                    })
                  }
                />{" "}
                Published on public site
              </label>
              <div className="formActions">
                <button
                  type="button"
                  className="outlineDark"
                  onClick={() =>
                    setContentDraft({
                      id: "",
                      title: "",
                      slug: "",
                      summary: "",
                      body: "",
                      published: false,
                      metadata: "{}",
                      event_start: "",
                      event_end: "",
                    })
                  }
                >
                  Clear
                </button>
                <button className="gold" disabled={contentSaving}>
                  {contentSaving
                    ? "Saving…"
                    : contentDraft.id
                      ? "Update entry"
                      : "Create entry"}
                </button>
              </div>
            </form>
            {contentLoading ? (
              "Loading content…"
            ) : (
              <div className="applicationTableWrap">
                <table className="applicationTable">
                  <thead>
                    <tr>
                      <th>Title</th>
                      <th>Visibility</th>
                      <th>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {contentRows.map((row) => (
                      <tr key={row.id}>
                        <td>
                          <b>{row.title}</b>
                          <small>{row.slug}</small>
                          <small>{row.summary}</small>
                        </td>
                        <td>
                          <span
                            className={`applicationStatus ${row.published ? "approved" : "pending"}`}
                          >
                            {row.published ? "Published" : "Draft"}
                          </span>
                        </td>
                        <td>
                          <div className="applicationActions">
                            <button
                              onClick={() =>
                                setContentDraft({
                                  id: row.id,
                                  title: row.title,
                                  slug: row.slug,
                                  summary: row.summary || "",
                                  body: row.body || "",
                                  published: row.published,
                                  metadata: JSON.stringify(
                                    row.metadata || {},
                                    null,
                                    2,
                                  ),
                                  event_start: row.event_start
                                    ? new Date(row.event_start)
                                        .toISOString()
                                        .slice(0, 16)
                                    : "",
                                  event_end: row.event_end
                                    ? new Date(row.event_end)
                                        .toISOString()
                                        .slice(0, 16)
                                    : "",
                                })
                              }
                            >
                              Edit
                            </button>
                            <button
                              onClick={() => deleteContent(row)}
                              title="Delete entry"
                            >
                              <XCircle size={16} />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </section>
        ) : tab === "Payments" ? (
          <section className="applicationPanel">
            <div className="applicationPanelHead">
              <div>
                <h2>Membership payment records</h2>
                <p>
                  Records returned by Supabase. A payment is successful only
                  after server-side provider verification.
                </p>
              </div>
              <button
                className="adminRefresh"
                onClick={loadPayments}
                disabled={contentLoading}
              >
                <RefreshCw size={16} />
                Refresh
              </button>
            </div>
            {contentLoading ? (
              <div className="adminEmpty">Loading payments…</div>
            ) : payments.length === 0 ? (
              <div className="adminEmpty">
                <CreditCard size={28} />
                <b>No payment records yet</b>
                <span>
                  Verified and pending checkout records will appear here.
                </span>
              </div>
            ) : (
              <div className="applicationTableWrap">
                <table className="applicationTable">
                  <thead>
                    <tr>
                      <th>Date</th>
                      <th>Member / Application</th>
                      <th>Type</th>
                      <th>Amount</th>
                      <th>Provider reference</th>
                      <th>Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {payments.map((payment) => (
                      <tr key={payment.id}>
                        <td>{new Date(payment.created_at).toLocaleString()}</td>
                        <td>
                          <b>{payment.category}</b>
                          <small>{payment.user_id}</small>
                          <small>
                            {payment.application_id || "No linked application"}
                          </small>
                        </td>
                        <td>{payment.payment_type || "membership"}</td>
                        <td>
                          {payment.amount_kobo == null
                            ? "—"
                            : `₦${(payment.amount_kobo / 100).toLocaleString("en-NG", { minimumFractionDigits: 2 })}`}
                        </td>
                        <td>{payment.provider_reference || "Not assigned"}</td>
                        <td>
                          <span
                            className={`applicationStatus ${payment.status === "success" ? "approved" : "pending"}`}
                          >
                            {payment.status}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </section>
        ) : tab === "Settings" ? (
          <section className="applicationPanel">
            <div className="applicationPanelHead">
              <div>
                <h2>Site settings</h2>
                <p>
                  Manage key/value configuration records stored in Supabase.
                  Never store payment secrets here.
                </p>
              </div>
              <button
                className="adminRefresh"
                onClick={loadSettings}
                disabled={contentLoading}
              >
                <RefreshCw size={16} />
                Refresh
              </button>
            </div>
            <form className="contentEditor" onSubmit={saveSetting}>
              <input
                required
                placeholder="Setting key, e.g. public_contact_email"
                value={settingDraft.setting_key}
                onChange={(e) =>
                  setSettingDraft({
                    ...settingDraft,
                    setting_key: e.target.value,
                  })
                }
              />
              <input
                placeholder="Value (plain text or valid JSON)"
                value={settingDraft.setting_value}
                onChange={(e) =>
                  setSettingDraft({
                    ...settingDraft,
                    setting_value: e.target.value,
                  })
                }
              />
              <input
                placeholder="Description (optional)"
                value={settingDraft.description}
                onChange={(e) =>
                  setSettingDraft({
                    ...settingDraft,
                    description: e.target.value,
                  })
                }
              />
              <div className="formActions">
                <button className="gold" disabled={settingsSaving}>
                  {settingsSaving ? "Saving…" : "Save setting"}
                </button>
              </div>
            </form>
            {contentLoading ? (
              <div className="adminEmpty">Loading settings…</div>
            ) : settings.length === 0 ? (
              <div className="adminEmpty">
                <Settings size={28} />
                <b>No settings saved yet</b>
                <span>
                  Create a setting above. This table does not store payment
                  secrets.
                </span>
              </div>
            ) : (
              <div className="applicationTableWrap">
                <table className="applicationTable">
                  <thead>
                    <tr>
                      <th>Key</th>
                      <th>Value</th>
                      <th>Description</th>
                      <th>Updated</th>
                      <th>Action</th>
                    </tr>
                  </thead>
                  <tbody>
                    {settings.map((setting) => (
                      <tr key={setting.setting_key}>
                        <td>
                          <b>{setting.setting_key}</b>
                        </td>
                        <td>
                          <code>{setting.display_value}</code>
                        </td>
                        <td>{setting.description}</td>
                        <td>
                          {setting.updated_at
                            ? new Date(setting.updated_at).toLocaleString()
                            : "—"}
                        </td>
                        <td>
                          <div className="applicationActions">
                            <button
                              type="button"
                              onClick={() =>
                                setSettingDraft({
                                  setting_key: setting.setting_key,
                                  setting_value: setting.display_value,
                                  description: setting.description || "",
                                })
                              }
                            >
                              Edit
                            </button>
                            <button
                              type="button"
                              onClick={() => deleteSetting(setting.setting_key)}
                              title="Delete setting"
                            >
                              <XCircle size={16} />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </section>
        ) : tab === "Messages" ? (
          <section className="applicationPanel">
            <div className="applicationPanelHead">
              <div>
                <h2>Contact enquiries</h2>
                <p>Messages submitted through the public contact form.</p>
              </div>
              <button className="adminRefresh" onClick={loadEnquiries}>
                <RefreshCw size={16} />
                Refresh
              </button>
            </div>
            {contentLoading ? (
              "Loading enquiries…"
            ) : (
              <div className="applicationTableWrap">
                <table className="applicationTable">
                  <thead>
                    <tr>
                      <th>Sender</th>
                      <th>Subject / Message</th>
                      <th>Received</th>
                      <th>Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {enquiries.map((row) => (
                      <tr key={row.id}>
                        <td>
                          <b>{row.full_name}</b>
                          <small>{row.email}</small>
                        </td>
                        <td>
                          <b>{row.subject}</b>
                          <small>{row.message}</small>
                        </td>
                        <td>{new Date(row.created_at).toLocaleString()}</td>
                        <td>
                          <select
                            value={row.status}
                            onChange={(e) => updateEnquiry(row, e.target.value)}
                          >
                            <option value="new">New</option>
                            <option value="in_progress">In progress</option>
                            <option value="resolved">Resolved</option>
                            <option value="archived">Archived</option>
                          </select>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </section>
        ) : (
          <section className="applicationPanel">
            <h2>{tab}</h2>
            <p className="muted">
              This module is not yet connected to persistent data.
            </p>
          </section>
        )}
      </main>
      {selected && (
        <div
          className="applicationModalBackdrop"
          role="presentation"
          onMouseDown={(e) => {
            if (e.target === e.currentTarget) setSelected(null);
          }}
        >
          <section
            className="applicationModal"
            role="dialog"
            aria-modal="true"
            aria-labelledby="applicationModalTitle"
          >
            <button
              className="applicationModalClose"
              onClick={() => setSelected(null)}
              aria-label="Close details"
            >
              ×
            </button>
            <span className="kicker">MEMBERSHIP APPLICATION</span>
            <h2 id="applicationModalTitle">
              {selected.fullName || selected.name || "Applicant"}
            </h2>
            <p className="muted">Reference: {selected.id}</p>
            <div className="applicationDetailGrid">
              {[
                ["Email", selected.email],
                ["Phone", selected.phone],
                ["Category", selected.category],
                ["Date of birth", selected.dateOfBirth],
                ["Nationality", selected.nationality],
                ["State of residence", selected.stateOfResidence],
                ["Address", selected.address],
                ["Qualification", selected.qualification],
                ["Institution", selected.institution],
                ["Graduation year", selected.graduationYear],
                ["Organisation", selected.organisation],
              ]
                .filter(([k, v]) => v)
                .map(([k, v]) => (
                  <div key={k}>
                    <span>{k}</span>
                    <b>{v}</b>
                  </div>
                ))}
            </div>
            <section className="applicationDocumentsReview">
              <div className="applicationPanelHead">
                <div>
                  <h3>Supporting documents</h3>
                  <p>
                    Private links expire after 60 seconds. Open a document only
                    when needed for review.
                  </p>
                </div>
                <button
                  className="adminRefresh"
                  type="button"
                  onClick={() => loadApplicationDocuments(selected)}
                  disabled={documentsLoading}
                >
                  <RefreshCw size={15} />
                  {documentsLoading ? "Loading…" : "Refresh documents"}
                </button>
              </div>
              {documentsLoading ? (
                <p className="muted">Loading documents…</p>
              ) : documentError ? (
                <p className="adminAlert" role="alert">
                  {documentError}
                </p>
              ) : applicationDocuments.length === 0 ? (
                <p className="muted">
                  No documents are linked to this application yet.
                </p>
              ) : (
                <div className="applicationDocumentList">
                  {applicationDocuments.map((doc) => (
                    <div key={doc.id} className="applicationDocumentRow">
                      <FileText size={18} />
                      <div>
                        <b>{doc.document_type || "Supporting document"}</b>
                        <small>
                          {doc.file_name} ·{" "}
                          {(doc.size_bytes / 1024 / 1024).toFixed(2)} MB ·{" "}
                          {new Date(doc.created_at).toLocaleDateString()}
                        </small>
                      </div>
                      {doc.signedUrl ? (
                        <a
                          href={doc.signedUrl}
                          target="_blank"
                          rel="noreferrer"
                        >
                          Open securely <ChevronRight size={14} />
                        </a>
                      ) : (
                        <span className="muted">Link unavailable</span>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </section>
            <label className="reviewNotesField">
              Review notes / reason
              <textarea
                rows={3}
                value={reviewNotes}
                onChange={(e) => setReviewNotes(e.target.value)}
                placeholder="Record review notes. Required when requesting corrections or rejecting."
              />
            </label>
            <div className="applicationModalActions">
              <button
                className="outlineDark"
                onClick={() => {
                  setSelected(null);
                  setReviewNotes("");
                }}
              >
                Close
              </button>
              <button
                className="adminRefresh"
                disabled={!!updating}
                onClick={() => changeStatus(selected, "under_review")}
              >
                {updating === selected.id ? "Saving…" : "Mark reviewing"}
              </button>
              <button
                className="adminRefresh"
                disabled={!!updating}
                onClick={() => changeStatus(selected, "needs_information")}
              >
                Request corrections
              </button>
              <button
                className="gold"
                disabled={!!updating}
                onClick={() => changeStatus(selected, "approved")}
              >
                Approve for payment
              </button>
              <button
                className="dangerButton"
                disabled={!!updating}
                onClick={() => changeStatus(selected, "rejected")}
              >
                Reject application
              </button>
            </div>
          </section>
        </div>
      )}
    </div>
  );
}
