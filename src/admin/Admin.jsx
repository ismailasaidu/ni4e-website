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
  ClipboardList,
  GraduationCap,
  Trash2,
} from "lucide-react";
import logo from "../assets/ni4e-logo.png";
import { useAuth } from "../firebase/auth";
import MembershipPolicySettings from "./MembershipPolicySettings";

const STATUS = [
  "pending",
  "under_review",
  "needs_information",
  "approved",
  "documents_submitted",
  "committee_review",
  "committee_verified",
  "approved_for_payment",
  "approved_pending_payment",
  "payment_pending",
  "active",
  "rejected",
];
const statusLabel = (value) =>
  ({
    pending: "Pending review",
    under_review: "Under review",
    needs_information: "Corrections requested",
    approved: "Approved — next step",
    documents_submitted: "Documents submitted",
    committee_review: "Committee verification",
    committee_verified: "Committee verified",
    approved_for_payment: "Final approval · payment due",
    approved_pending_payment: "Approved · payment due",
    rejected: "Rejected",
    payment_pending: "Payment pending",
    active: "Active",
  })[value] ||
  value ||
  "Pending";

export default function Admin({ setPage }) {
  const [side, setSide] = useState(() => typeof window !== "undefined" && window.innerWidth > 900);
  const closeMenu = () => setSide(false);
  const tabSlug = (value) => String(value || "Dashboard").toLowerCase().replace(/&/g, "and").replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
  const tabFromLocation = () => {
    if (typeof window === "undefined") return "Dashboard";
    const raw = window.location.hash.replace(/^#\/?admin\/?/, "").replace(/^#/, "");
    if (!raw) return "Dashboard";
    const slug = raw.split("?")[0].replace(/\/$/, "");
    const match = ["Dashboard", "Applications", "Members", "Fees & Membership", "Payments", "Events", "Event Registrations", "CPD Records", "News & Announcements", "Publications", "Technical Divisions", "Projects", "Committees", "Executives", "About Page", "Past Presidents", "Chapters", "Documents", "Messages", "Newsletter Subscribers", "Membership Policies", "Settings"].find((label) => tabSlug(label) === slug);
    return match || "Dashboard";
  };
  const selectTab = (nextTab) => {
    setTab(nextTab);
    if (typeof window !== "undefined") {
      const nextHash = `#/admin/${tabSlug(nextTab)}`;
      if (window.location.hash !== nextHash) window.history.pushState({ adminTab: nextTab }, "", nextHash);
    }
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
  const [tab, setTab] = useState(tabFromLocation);
  useEffect(() => {
    const expectedHash = `#/admin/${tabSlug(tab)}`;
    if (typeof window !== "undefined" && window.location.hash !== expectedHash) {
      window.history.replaceState({ adminTab: tab }, "", expectedHash);
    }
  }, [tab]);
  useEffect(() => {
    const syncTabFromLocation = () => setTab(tabFromLocation());
    window.addEventListener("popstate", syncTabFromLocation);
    window.addEventListener("hashchange", syncTabFromLocation);
    return () => {
      window.removeEventListener("popstate", syncTabFromLocation);
      window.removeEventListener("hashchange", syncTabFromLocation);
    };
  }, []);
  const [applications, setApplications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState("");
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [fees, setFees] = useState([]);
  const [feeDraft, setFeeDraft] = useState({
    category: "Student Member",
    amount: "",
    upgradeAmount: "",
    renewalAmount: "",
    active: true,
  });
  const [feeSaving, setFeeSaving] = useState(false);
  const [members, setMembers] = useState([]);
  const [memberNumberDrafts, setMemberNumberDrafts] = useState({});
  const [memberNumberSaving, setMemberNumberSaving] = useState("");
  const [payments, setPayments] = useState([]);
  const [eventPayments, setEventPayments] = useState([]);
  const [publicationPurchases, setPublicationPurchases] = useState([]);
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
  const [publicationUploadBusy, setPublicationUploadBusy] = useState(false);
  const [publicationUploadMessage, setPublicationUploadMessage] = useState("");
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
  const [newsletterRows, setNewsletterRows] = useState([]);
  const [newsletterLoading, setNewsletterLoading] = useState(false);
  const [eventRegistrations, setEventRegistrations] = useState([]);
  const [registrationsLoading, setRegistrationsLoading] = useState(false);
  const [cpdRows, setCpdRows] = useState([]);
  const [cpdLoading, setCpdLoading] = useState(false);
  const [cpdSaving, setCpdSaving] = useState(false);
  const [cpdDraft, setCpdDraft] = useState({ user_id: "", member_name: "", member_email: "", activity_title: "", provider: "", completion_date: new Date().toISOString().slice(0,10), hours: "", certificate_reference: "" });
  const [selected, setSelected] = useState(null);
  const [reviewNotes, setReviewNotes] = useState("");
  const [applicationTypeFilter, setApplicationTypeFilter] = useState("all");
  const [decisionIntent, setDecisionIntent] = useState("");
  const [confirmingApproval, setConfirmingApproval] = useState(null);
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
          "id,full_name,email,phone,membership_category,membership_status,membership_number,membership_expires_at,created_at",
        )
        .order("created_at", { ascending: false })
        .limit(300);
      if (error) throw error;
      setMembers(data || []);
    } catch (err) {
      setError(err.message || "Could not load members.");
    }
  };
  const saveMemberNumber = async (member) => {
    const value = String(memberNumberDrafts[member.id] ?? member.membership_number ?? "").trim();
    if (member.membership_status !== "active" || (member.membership_expires_at && new Date(member.membership_expires_at).getTime() <= Date.now())) { setError("Assign an official membership number only to a current active member following verified payment."); return; }
    if (!value) { setError("Enter the official NI4E membership number before saving."); return; }
    if (!/^[A-Za-z0-9][A-Za-z0-9._/-]{0,79}$/.test(value)) { setError("Use only letters, numbers, dots, underscores, slashes or hyphens in the membership number."); return; }
    if (value.length > 80) { setError("Membership number must be 80 characters or fewer."); return; }
    setMemberNumberSaving(member.id); setError("");
    try {
      requireSupabase();
      const { data: duplicate, error: duplicateError } = await supabase.from("profiles").select("id").ilike("membership_number", value).neq("id", member.id).limit(1).maybeSingle();
      if (duplicateError) throw duplicateError;
      if (duplicate) throw new Error("That membership number is already assigned to another profile.");
      const { error } = await supabase.from("profiles").update({ membership_number: value, updated_at: new Date().toISOString() }).eq("id", member.id);
      if (error) throw error;
      setMembers(old => old.map(row => row.id === member.id ? { ...row, membership_number: value } : row));
      setMemberNumberDrafts(old => ({ ...old, [member.id]: value }));
    } catch (e) { setError(e.message || "Could not save membership number. Confirm admin permissions and database policy."); }
    finally { setMemberNumberSaving(""); }
  };

  const loadPayments = async () => {
    setContentLoading(true);
    setError("");
    try {
      requireSupabase();
      const [{ data, error }, { data: eventData, error: eventError }, { data: publicationData, error: publicationError }] = await Promise.all([
        supabase.from("membership_payments")
          .select("id,user_id,application_id,category,amount_kobo,currency,provider,provider_reference,status,payment_type,created_at,paid_at")
          .order("created_at", { ascending: false }).limit(300),
        supabase.from("event_payments")
          .select("id,registration_id,event_id,event_title,attendee_email,amount_kobo,currency,provider,provider_reference,status,created_at,paid_at")
          .order("created_at", { ascending: false }).limit(300),
        supabase.from("publication_purchases")
          .select("id,user_id,publication_id,publication_title,amount_kobo,currency,provider_reference,status,created_at,paid_at")
          .order("created_at", { ascending: false }).limit(300),
      ]);
      if (error) throw error;
      setPayments(data || []);
      // A missing event-payment migration must not hide valid membership transactions.
      const eventTableMissing = Boolean(eventError && /event_payments|schema cache|does not exist|could not find the table/i.test(eventError.message || ''));
      setEventPayments(eventError ? [] : (eventData || []));
      const publicationTableMissing = Boolean(publicationError && /publication_purchases|schema cache|does not exist|could not find the table/i.test(publicationError.message || ''));
      setPublicationPurchases(publicationError ? [] : (publicationData || []));
      if (eventError && !eventTableMissing) throw new Error(`Membership payments loaded, but event payments could not load: ${eventError.message}`);
      if (publicationError && !publicationTableMissing) throw new Error(`Publication payment records could not load: ${publicationError.message}`);
      if (eventTableMissing) setError('Event payments are unavailable until the event payment migration is applied.');
      else if (publicationTableMissing) setError('Publication sales appear here after you apply supabase/migrations/20261029_publication_commerce.sql.');
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
    "About Page": "institutional_page",
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
  const loadNewsletterSubscribers = async () => {
    setNewsletterLoading(true);
    setError("");
    try {
      requireSupabase();
      const { data, error } = await supabase
        .from("newsletter_subscriptions")
        .select("id,email,status,created_at")
        .order("created_at", { ascending: false })
        .limit(1000);
      if (error) throw error;
      setNewsletterRows(data || []);
    } catch (e) {
      setError(e.message || "Could not load newsletter subscriptions. Run the NI4E repair migration and confirm admin access.");
    } finally {
      setNewsletterLoading(false);
    }
  };
  const updateNewsletterStatus = async (row, status) => {
    setError("");
    try {
      const { error } = await supabase
        .from("newsletter_subscriptions")
        .update({ status })
        .eq("id", row.id);
      if (error) throw error;
      setNewsletterRows(old => old.map(item => item.id === row.id ? { ...item, status } : item));
    } catch (e) {
      setError(e.message || "Could not update newsletter subscription.");
    }
  };
  const loadEventRegistrations = async () => {
    setRegistrationsLoading(true); setError("");
    try {
      requireSupabase();
      const { data, error } = await supabase.from("event_registrations").select("*").order("created_at", { ascending: false }).limit(500);
      if (error) throw error;
      setEventRegistrations(data || []);
    } catch (e) { setError(e.message || "Could not load event registrations. Run supabase-stage-3-membership-events-cpd.sql and confirm admin access."); }
    finally { setRegistrationsLoading(false); }
  };
  const updateEventRegistration = async (row, status) => {
    setError("");
    try {
      if (status === "confirmed" && row.payment_status && !["not_required", "success"].includes(row.payment_status)) throw new Error("This registration cannot be confirmed until its required payment is verified.");
      const { error } = await supabase.from("event_registrations").update({ status, updated_at: new Date().toISOString() }).eq("id", row.id);
      if (error) throw error;
      setEventRegistrations(old => old.map(item => item.id === row.id ? { ...item, status } : item));
    } catch (e) { setError(e.message || "Could not update registration status."); }
  };
  const loadCpd = async () => {
    setCpdLoading(true); setError("");
    try {
      requireSupabase();
      const { data, error } = await supabase.from("member_cpd_records").select("*").order("completion_date", { ascending: false }).limit(500);
      if (error) throw error;
      setCpdRows(data || []);
    } catch (e) { setError(e.message || "Could not load CPD records. Run the Stage 3 database migration."); }
    finally { setCpdLoading(false); }
  };
  const saveCpdRecord = async (event) => {
    event.preventDefault(); setCpdSaving(true); setError("");
    try {
      requireSupabase();
      const hours = Number(cpdDraft.hours);
      if (!cpdDraft.member_name.trim() || !cpdDraft.member_email.trim() || !cpdDraft.activity_title.trim() || !Number.isFinite(hours) || hours <= 0) throw new Error("Enter member name, email, activity title and positive CPD hours.");
      const { data, error } = await supabase.from("member_cpd_records").insert({ user_id: cpdDraft.user_id.trim() || null, member_name: cpdDraft.member_name.trim(), member_email: cpdDraft.member_email.trim().toLowerCase(), activity_title: cpdDraft.activity_title.trim(), provider: cpdDraft.provider.trim() || null, completion_date: cpdDraft.completion_date, hours, certificate_reference: cpdDraft.certificate_reference.trim() || null }).select().single();
      if (error) throw error;
      setCpdRows(old => [data, ...old]);
      setCpdDraft({ user_id: "", member_name: "", member_email: "", activity_title: "", provider: "", completion_date: new Date().toISOString().slice(0,10), hours: "", certificate_reference: "" });
    } catch (e) { setError(e.message || "Could not save CPD record."); }
    finally { setCpdSaving(false); }
  };
  const deleteCpdRecord = async (row) => {
    if (!window.confirm(`Delete the CPD record for ${row.member_name}?`)) return;
    try { const { error } = await supabase.from("member_cpd_records").delete().eq("id", row.id); if (error) throw error; setCpdRows(old => old.filter(item => item.id !== row.id)); }
    catch (e) { setError(e.message || "Could not delete CPD record."); }
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
    if (tab === "Newsletter Subscribers") loadNewsletterSubscribers();
    if (tab === "Event Registrations") loadEventRegistrations();
    if (tab === "CPD Records") loadCpd();
  }, [tab]);
  const updateEventMetadata = (key, value) => {
    let metadata = {};
    try { metadata = JSON.parse(contentDraft.metadata || "{}"); } catch { metadata = {}; }
    if (!metadata || typeof metadata !== "object" || Array.isArray(metadata)) metadata = {};
    metadata[key] = value;
    setContentDraft({ ...contentDraft, metadata: JSON.stringify(metadata, null, 2) });
  };
  const eventMetadataDraft = (() => { try { const parsed = JSON.parse(contentDraft.metadata || "{}"); return parsed && typeof parsed === "object" && !Array.isArray(parsed) ? parsed : {}; } catch { return {}; } })();
  const uploadPaidPublicationFile = async (file) => {
    if (!file) return;
    setPublicationUploadMessage("");
    if (file.type !== "application/pdf" && !file.name.toLowerCase().endsWith(".pdf")) { setPublicationUploadMessage("Upload a PDF file for the full publication."); return; }
    if (file.size > 50 * 1024 * 1024) { setPublicationUploadMessage("The PDF must be 50 MB or smaller."); return; }
    if (!contentDraft.title.trim()) { setPublicationUploadMessage("Enter the publication title before uploading its PDF."); return; }
    setPublicationUploadBusy(true);
    try {
      requireSupabase();
      const slug = (contentDraft.slug || contentDraft.title).toLowerCase().trim().replace(/[^a-z0-9]+/g,"-").replace(/^-|-$/g,"");
      const safeName = file.name.toLowerCase().replace(/[^a-z0-9._-]+/g,"-");
      const path = `${slug}/${Date.now()}-${safeName}`;
      const { error } = await supabase.storage.from("publication-files").upload(path, file, { upsert: true, contentType: "application/pdf" });
      if (error) throw error;
      updateEventMetadata("private_file_path", path);
      setPublicationUploadMessage(`Secure PDF uploaded: ${path}`);
    } catch (err) { setPublicationUploadMessage(err.message || "Could not upload the private publication PDF. Confirm admin storage permissions and retry."); }
    finally { setPublicationUploadBusy(false); }
  };
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
        body: type === "publication" && (metadata.is_paid === true || String(metadata.is_paid).toLowerCase() === "true")
          ? String(metadata.preview || contentDraft.summary || "").trim()
          : contentDraft.body.trim(),
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
      const renewal =
        feeDraft.renewalAmount === ""
          ? null
          : Math.round(Number(feeDraft.renewalAmount) * 100);
      if (
        !feeDraft.category.trim() ||
        !Number.isFinite(amount) ||
        amount <= 0 ||
        (upgrade !== null && (!Number.isFinite(upgrade) || upgrade <= 0)) ||
        (renewal !== null && (!Number.isFinite(renewal) || renewal <= 0))
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
            renewal_amount_kobo: renewal,
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
        renewalAmount: "",
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
      renewalAmount:
        fee.renewal_amount_kobo == null
          ? ""
          : (fee.renewal_amount_kobo / 100).toString(),
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
          (statusFilter === "all" || (statusFilter === "awaiting" ? (!a.status || ["pending","under_review","documents_submitted","committee_review","committee_verified"].includes(a.status)) : (a.status || "pending") === statusFilter)) &&
          (applicationTypeFilter === "all" || (a.application_type || "new") === applicationTypeFilter)
        );
      }),
    [applications, search, statusFilter, applicationTypeFilter],
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

  const openApplication = (app, intent = "") => {
    setSelected(app);
    setDecisionIntent(intent);
    setReviewNotes(app?.review_notes || "");
    setDocumentError("");
    loadApplicationDocuments(app);
  };

  const requestApproval = (app) => {
    setReviewNotes(app?.review_notes || "");
    setSelected(null);
    setDecisionIntent("");
    setConfirmingApproval(app);
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
    setNotice("");
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
      setDecisionIntent("");
      setConfirmingApproval(null);
      await loadApplications();
      const decisionLabel = ({ approved: app.application_type === "upgrade" ? "Initial upgrade approval recorded" : "Approved for payment", documents_submitted: "Documents marked submitted", committee_review: "Sent to committee verification", committee_verified: "Committee verification recorded", approved_for_payment: "Final upgrade approval recorded", rejected: "Request declined", needs_information: "Corrections requested", under_review: "Marked as under review" })[status] || "Application updated";
      setNotice(`${decisionLabel}. The member portal and notification centre will show the updated stage.`);
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
    ["Event Registrations", ClipboardList],
    ["CPD Records", GraduationCap],
    ["News & Announcements", Newspaper],
    ["Publications", BookOpen],
    ["Technical Divisions", Network],
    ["Projects", BookOpen],
    ["Committees", Users],
    ["Executives", Award],
    ["About Page", BookOpen],
    ["Past Presidents", Clock3],
    ["Chapters", Network],
    ["Documents", BookOpen],
    ["Messages", Mail],
    ["Newsletter Subscribers", Mail],
    ["Membership Policies", Settings],
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
        {notice && <div className="adminSuccessNotice" role="status">{notice}<button onClick={() => setNotice("")} aria-label="Dismiss notification">×</button></div>}
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
                value={applicationTypeFilter}
                onChange={(e) => setApplicationTypeFilter(e.target.value)}
                aria-label="Filter by request type"
              >
                <option value="all">All request types</option>
                <option value="new">New applications</option>
                <option value="renewal">Membership renewals</option>
                <option value="upgrade">Membership upgrades</option>
              </select>
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                aria-label="Filter by application status"
              >
                <option value="all">All statuses</option>
                <option value="awaiting">Awaiting action</option>
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
            <div className="applicationSummary applicationSummaryWide">
              <div><span>All requests</span><b>{applications.length}</b><small>New, renewal and upgrade</small></div>
              <div><span>Awaiting action</span><b>{pending}</b><small>Pending or under review</small></div>
              <div><span>New applications</span><b>{applications.filter((a) => !a.application_type || a.application_type === "new").length}</b><small>First-time membership</small></div>
              <div><span>Renewals</span><b>{applications.filter((a) => a.application_type === "renewal").length}</b><small>Existing members</small></div>
              <div><span>Upgrades</span><b>{applications.filter((a) => a.application_type === "upgrade").length}</b><small>Category change requests</small></div>
            </div>
            <section className="applicationPanel">
              <div className="applicationPanelHead">
                <div>
                  <h2>Membership applications</h2>
                  <p>
                    One queue for first-time applications, annual renewals and membership upgrades. Open a request to inspect its details and documents before making a decision.
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
                        <th>Request type</th>
                        <th>Membership category</th>
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
                          <td><span className={`applicationTypeTag ${(app.application_type || "new")}`}>{({new:"New application",renewal:"Renewal",upgrade:"Upgrade"})[app.application_type || "new"] || "New application"}</span></td>
                          <td>{app.category || "Not specified"}{app.application_type === "upgrade" && app.previous_category ? <small className="appPreviousCategory">From: {app.previous_category}</small> : null}</td>
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
                            <div className="applicationActions applicationActionsLabeled">
                              <button className="actionView" onClick={() => openApplication(app)}><Eye size={15}/> Review</button>
                              <button className="actionApprove" disabled={!!updating || app.status === "approved" || app.status === "documents_submitted" || app.status === "committee_review" || app.status === "committee_verified" || app.status === "approved_for_payment" || (app.application_type === "upgrade" && Boolean(app.documents_submitted_at)) || app.status === "rejected" || app.status === "active"} onClick={() => requestApproval(app)}><CheckCircle2 size={15}/> {app.application_type === "upgrade" ? "Initial approve" : "Approve"}</button>
                              <button className="actionDecline" disabled={!!updating || app.status === "rejected" || app.status === "active"} onClick={() => openApplication(app, "rejected")}><XCircle size={15}/> Decline</button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
              {!loading && filtered.length > 0 && <div className="applicationMobileList">
                {filtered.map((app) => <article className="applicationMobileCard" key={`mobile-${app.id}`}>
                  <div className="applicationMobileCardTop"><span className={`applicationTypeTag ${app.application_type || "new"}`}>{({new:"New application",renewal:"Renewal",upgrade:"Upgrade"})[app.application_type || "new"] || "New application"}</span><span className={`applicationStatus ${app.status || "pending"}`}>{statusLabel(app.status)}</span></div>
                  <h3>{app.fullName || app.name || "Applicant"}</h3>
                  <p>{app.email || "No email"}{app.phone ? ` · ${app.phone}` : ""}</p>
                  <div className="applicationMobileMeta"><span>Category</span><b>{app.category || "Not specified"}</b>{app.previous_category && <><span>Previous category</span><b>{app.previous_category}</b></>}<span>Submitted</span><b>{app.submittedAt ? new Date(app.submittedAt).toLocaleDateString() : "—"}</b></div>
                  <div className="applicationActions applicationActionsLabeled"><button className="actionView" onClick={() => openApplication(app)}><Eye size={15}/> Review</button><button className="actionApprove" disabled={!!updating || app.status === "approved" || app.status === "documents_submitted" || app.status === "committee_review" || app.status === "committee_verified" || app.status === "approved_for_payment" || (app.application_type === "upgrade" && Boolean(app.documents_submitted_at)) || app.status === "rejected" || app.status === "active"} onClick={() => requestApproval(app)}><CheckCircle2 size={15}/> {app.application_type === "upgrade" ? "Initial approve" : "Approve"}</button><button className="actionDecline" disabled={!!updating || app.status === "rejected" || app.status === "active"} onClick={() => openApplication(app, "rejected")}><XCircle size={15}/> Decline</button></div>
                </article>)}
              </div>}
            </section>
          </>
        ) : tab === "Dashboard" ? (
          <>
            <section className="dashboardMembershipOverview">
              <div className="dashboardSectionIntro"><div><span className="kicker">MEMBERSHIP OPERATIONS</span><h2>Requests requiring your attention</h2><p>Live counts from the membership application queue.</p></div><button className="adminRefresh" onClick={loadApplications} disabled={loading}><RefreshCw size={15}/>{loading ? "Refreshing…" : "Refresh queue"}</button></div>
              <div className="adminStats adminStatsMembership">
                <button onClick={() => {setApplicationTypeFilter("all");setStatusFilter("all");selectTab("Applications");}}><span>All requests</span><b>{applications.length}</b><small>New, renewal and upgrade</small></button>
                <button onClick={() => {setApplicationTypeFilter("all");setStatusFilter("awaiting");selectTab("Applications");}}><span>Awaiting review</span><b>{pending}</b><small>Needs administrative action</small></button>
                <button onClick={() => {setApplicationTypeFilter("new");setStatusFilter("all");selectTab("Applications");}}><span>New applications</span><b>{applications.filter(a => !a.application_type || a.application_type === "new").length}</b><small>First-time applicants</small></button>
                <button onClick={() => {setApplicationTypeFilter("renewal");setStatusFilter("all");selectTab("Applications");}}><span>Renewal requests</span><b>{applications.filter(a => a.application_type === "renewal").length}</b><small>Existing members</small></button>
                <button onClick={() => {setApplicationTypeFilter("upgrade");setStatusFilter("all");selectTab("Applications");}}><span>Upgrade requests</span><b>{applications.filter(a => a.application_type === "upgrade").length}</b><small>Membership category changes</small></button>
                <button onClick={() => {setApplicationTypeFilter("all");setStatusFilter("approved");selectTab("Applications");}}><span>Approved</span><b>{applications.filter(a => a.status === "approved").length}</b><small>Approved for payment</small></button>
              </div>
            </section>
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
                <button onClick={() => selectTab("Event Registrations")}>
                  <Users />
                  Event registrations <ChevronRight />
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
                        {app.email} · {app.category} · {{new:"New application",renewal:"Renewal",upgrade:"Upgrade"}[app.application_type || "new"]}
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
                  <select
                    required
                    value={feeDraft.category}
                    onChange={(e) =>
                      setFeeDraft({ ...feeDraft, category: e.target.value })
                    }
                  >
                    <option value="Student Member">Student Member</option>
                    <option value="Graduate Member">Graduate Member</option>
                    <option value="Associate Member">Associate Member</option>
                    <option value="Corporate Member">Corporate Member</option>
                  </select>
                </label>
                <label>
                  Membership fee (₦)
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
                <label>
                  Annual renewal fee (₦)
                  <input
                    type="number"
                    min="1"
                    step="0.01"
                    value={feeDraft.renewalAmount}
                    onChange={(e) => setFeeDraft({ ...feeDraft, renewalAmount: e.target.value })}
                    placeholder="Leave blank until approved"
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
                      <th>Annual renewal fee</th>
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
                          {f.renewal_amount_kobo == null
                            ? "Not set"
                            : `₦${(f.renewal_amount_kobo / 100).toLocaleString("en-NG", { minimumFractionDigits: 2 })}`}
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
                These values are saved to Supabase and read by the public Membership page and the secure Paystack payment function. Changing a fee here updates the amount shown to applicants; only active fees can be charged. Confirm each amount with NI4E before enabling it.
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
                    <th>Official membership number</th>
                    <th>Membership status / expiry</th>
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
                        <b>{m.membership_number || (m.membership_status === "active" ? "Awaiting database assignment" : "Assigned automatically on activation")}</b>
                        <small>Membership numbers are generated sequentially by the database when an approved, paid member becomes active. Staff do not type or edit numbers.</small>
                      </td>
                      <td>
                        <span
                          className={`applicationStatus ${m.membership_status === "active" && (!m.membership_expires_at || new Date(m.membership_expires_at).getTime() > Date.now()) ? "approved" : "pending"}`}
                        >
                          {m.membership_status === "active" && m.membership_expires_at && new Date(m.membership_expires_at).getTime() <= Date.now() ? "expired" : m.membership_status}
                        </span>{m.membership_expires_at && <small>Expires {new Date(m.membership_expires_at).toLocaleDateString()}</small>}
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
                <p>Create, edit, publish or unpublish institutional content. Changes publish to the matching public page when Published is enabled. Leadership records use metadata keys name, position, image, qualifications, experience and expertise. About Page uses one published record; metadata supports headline, introduction, vision, mission_heading, mission, objectives, history and professional_scope.</p>
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
              {(contentTypeForTab[tab] === "event" || contentTypeForTab[tab] === "publication") && (
                <section className="adminMediaMetadataPanel">
                  <div className="adminMediaMetadataIntro">
                    <b>{contentTypeForTab[tab] === "event" ? "Event artwork & programme" : "Publication details & files"}</b>
                    <p>{contentTypeForTab[tab] === "event" ? "Add the event flyer and event photograph/banner using a publicly accessible URL. The event agenda is managed below and appears inside the event modal." : "Classify journals, research papers, engineering books or reports and manage their access here. For paid publications, the public article body is saved as the abstract/preview only; store the full PDF in the private publication-files bucket and enter its storage path below."}</p>
                  </div>
                  {contentTypeForTab[tab] === "event" ? <div className="adminMediaMetadataGrid">
                    <label>Event image / photo URL<input type="url" value={eventMetadataDraft.image_url || ""} onChange={e=>updateEventMetadata("image_url",e.target.value)} placeholder="https://…/event-photo.jpg" /></label>
                    <label>Official flyer URL<input type="url" value={eventMetadataDraft.flyer_url || ""} onChange={e=>updateEventMetadata("flyer_url",e.target.value)} placeholder="https://…/official-event-flyer.pdf or .jpg" /></label>
                    <label>Registration URL (optional)<input type="url" value={eventMetadataDraft.registration_url || ""} onChange={e=>updateEventMetadata("registration_url",e.target.value)} placeholder="https://…" /></label>
                    <label>Organising institution<input value={eventMetadataDraft.organizer || ""} onChange={e=>updateEventMetadata("organizer",e.target.value)} placeholder="NI4E or official event organiser" /></label>
                    <label>Official event information URL<input type="url" value={eventMetadataDraft.source_url || ""} onChange={e=>updateEventMetadata("source_url",e.target.value)} placeholder="https://…/official-event-details" /></label>
                    <label>Who should attend<textarea rows={2} value={eventMetadataDraft.audience || ""} onChange={e=>updateEventMetadata("audience",e.target.value)} placeholder="Intended attendees and eligibility" /></label>
                    <label>Event highlights<textarea rows={3} value={eventMetadataDraft.highlights || ""} onChange={e=>updateEventMetadata("highlights",e.target.value)} placeholder="Key themes, benefits, exhibitors, speakers or practical details" /></label>
                    <label>Why attend<textarea rows={3} value={eventMetadataDraft.why_attend || ""} onChange={e=>updateEventMetadata("why_attend",e.target.value)} placeholder="Practical benefits, learning outcomes and networking value" /></label>
                    <label>Event format<input value={eventMetadataDraft.format || ""} onChange={e=>updateEventMetadata("format",e.target.value)} placeholder="In-person, virtual or hybrid" /></label>
                    <label>Duration<input value={eventMetadataDraft.duration || ""} onChange={e=>updateEventMetadata("duration",e.target.value)} placeholder="e.g. One day / 9:00 AM–4:00 PM" /></label>
                    <label>Registration deadline<input value={eventMetadataDraft.registration_deadline || ""} onChange={e=>updateEventMetadata("registration_deadline",e.target.value)} placeholder="e.g. 10 November 2026" /></label>
                    <label>Event time<input value={eventMetadataDraft.time || ""} onChange={e=>updateEventMetadata("time",e.target.value)} placeholder="e.g. 9:00 AM – 4:00 PM" /></label>
                    <label className="adminAgendaEditor">Event agenda (one session per line)<textarea rows={6} value={(Array.isArray(eventMetadataDraft.agenda)?eventMetadataDraft.agenda:[]).map(item=>[item.time||'',item.title||'',item.description||''].filter(Boolean).join(' | ')).join('\n')} onChange={e=>{const agenda=e.target.value.split('\n').map(line=>line.trim()).filter(Boolean).map(line=>{const [time='',title='',description='']=line.split('|').map(part=>part.trim());return {time,title:title||time||'Session',description};});updateEventMetadata('agenda',agenda);}} placeholder={'09:00 AM | Registration & welcome | Arrival and opening remarks\n10:00 AM | Keynote address | Main technical theme\n11:00 AM | Technical panel | Industry case studies'} /><small>Format: time | session title | short description. These items appear in the event details modal. No separate programme file is needed.</small></label>
                  </div> : <div className="adminMediaMetadataGrid">
                    <label>Resource type<input value={eventMetadataDraft.type || eventMetadataDraft.category || ""} onChange={e=>updateEventMetadata("type",e.target.value)} placeholder="Journal, research paper, engineering book, report…" /><small>Use a consistent type so the public filters classify this item correctly.</small></label>
                    <label>Publication subtype<select value={eventMetadataDraft.publication_type || ""} onChange={e=>updateEventMetadata("publication_type",e.target.value)}><option value="">Select subtype</option><option value="journal">Journal article</option><option value="research paper">Research paper</option><option value="proceedings">Conference proceedings</option><option value="book">Engineering book</option><option value="report">Technical report</option></select></label>
                    <label>Engineering discipline<input value={eventMetadataDraft.discipline || ""} onChange={e=>updateEventMetadata("discipline",e.target.value)} placeholder="Electrical, electronics, power, renewable energy…" /></label>
                    <label>Author / editor<input value={eventMetadataDraft.author || ""} onChange={e=>updateEventMetadata("author",e.target.value)} placeholder="Author(s) or NI4E unit" /></label>
                    <label>Publication year<input type="number" min="1900" max="2100" value={eventMetadataDraft.year || ""} onChange={e=>updateEventMetadata("year",e.target.value ? Number(e.target.value) : "")} placeholder="2026" /></label>
                    <label>Journal / publication name<input value={eventMetadataDraft.journal || ""} onChange={e=>updateEventMetadata("journal",e.target.value)} placeholder="Journal title or publisher" /></label>
                    <label>Volume<input value={eventMetadataDraft.volume || ""} onChange={e=>updateEventMetadata("volume",e.target.value)} placeholder="e.g. 12" /></label>
                    <label>Issue / edition<input value={eventMetadataDraft.issue || ""} onChange={e=>updateEventMetadata("issue",e.target.value)} placeholder="e.g. Issue 2" /></label>
                    <label>ISSN (if applicable)<input value={eventMetadataDraft.issn || ""} onChange={e=>updateEventMetadata("issn",e.target.value)} placeholder="Journal ISSN" /></label>
                    <label>ISBN (for books)<input value={eventMetadataDraft.isbn || ""} onChange={e=>updateEventMetadata("isbn",e.target.value)} placeholder="ISBN, if applicable" /></label>
                    <label>Format<input value={eventMetadataDraft.format || ""} onChange={e=>updateEventMetadata("format",e.target.value)} placeholder="PDF, journal article, web page…" /></label>
                    <label>Licence / distribution rights<input value={eventMetadataDraft.license || ""} onChange={e=>updateEventMetadata("license",e.target.value)} placeholder="Open licence, publisher permission, NI4E-owned" /><small>Record the permission basis before uploading or selling a document.</small></label>
                    <label>Book / publisher access URL<input type="url" value={eventMetadataDraft.book_url || ""} onChange={e=>updateEventMetadata("book_url",e.target.value)} placeholder="https://… official book or publisher page" /><small>For engineering books hosted by the author or publisher. Do not upload copyrighted books without distribution rights.</small></label>
                    <label>Cover image URL<input type="url" value={eventMetadataDraft.cover_url || ""} onChange={e=>updateEventMetadata("cover_url",e.target.value)} placeholder="https://…/cover.jpg" /></label>
                    {!(eventMetadataDraft.is_paid === true || String(eventMetadataDraft.is_paid).toLowerCase() === "true") && <label>PDF / full-text URL<input type="url" value={eventMetadataDraft.file_url || ""} onChange={e=>updateEventMetadata("file_url",e.target.value)} placeholder="https://…/open-access-publication.pdf" /></label>}
                    <label>DOI / ISBN / reference<input value={eventMetadataDraft.doi || eventMetadataDraft.isbn || ""} onChange={e=>updateEventMetadata("doi",e.target.value)} placeholder="DOI, ISBN or institutional reference" /></label>
                    <label>Keywords (comma-separated)<input value={Array.isArray(eventMetadataDraft.keywords) ? eventMetadataDraft.keywords.join(", ") : eventMetadataDraft.keywords || ""} onChange={e=>updateEventMetadata("keywords",e.target.value)} placeholder="Energy, power systems, safety" /></label>
                    <label className="check adminPaidPublicationToggle"><input type="checkbox" checked={eventMetadataDraft.is_paid === true || String(eventMetadataDraft.is_paid).toLowerCase() === "true"} onChange={e=>updateEventMetadata("is_paid",e.target.checked)} /> This publication requires payment</label>
                    {(eventMetadataDraft.is_paid === true || String(eventMetadataDraft.is_paid).toLowerCase() === "true") && <>
                      <label>Publication price (NGN)<input type="number" min="1" step="0.01" value={eventMetadataDraft.price_kobo ? (Number(eventMetadataDraft.price_kobo)/100).toString() : ""} onChange={e=>{const n=Number(e.target.value);updateEventMetadata("price_kobo",e.target.value.trim()===""?null:(Number.isFinite(n)&&n>=0?Math.round(n*100):null));}} placeholder="e.g. 2500" /></label>
                      <label className="adminPrivatePdfUpload">Upload full-text PDF (private storage)<input type="file" accept="application/pdf,.pdf" disabled={publicationUploadBusy} onChange={e=>{const file=e.target.files?.[0];if(file)uploadPaidPublicationFile(file);e.target.value="";}} /><small>PDF only, maximum 50 MB. The file is stored in a private bucket and is only delivered to verified purchasers using a short-lived link.</small>{publicationUploadBusy&&<small role="status">Uploading securely…</small>}{publicationUploadMessage&&<small role="status">{publicationUploadMessage}</small>}</label>
                      <label>Private PDF storage path<input value={eventMetadataDraft.private_file_path || ""} onChange={e=>updateEventMetadata("private_file_path",e.target.value.trim())} placeholder="Filled automatically after upload" /><small>Use the upload control above; avoid public URLs for paid full text.</small></label>
                      <label>Free preview / abstract<textarea rows={3} value={eventMetadataDraft.preview || ""} onChange={e=>updateEventMetadata("preview",e.target.value)} placeholder="Abstract or preview shown before purchase" /></label>
                    </>}
                  </div>}
                </section>
              )}
              {contentTypeForTab[tab] === "event" && (
                <fieldset className="adminEventPaymentSettings">
                  <legend>Registration & ticket payment</legend>
                  <label className="check"><input type="checkbox" checked={eventMetadataDraft.registration_open !== false && String(eventMetadataDraft.registration_open).toLowerCase() !== "false"} onChange={e => updateEventMetadata("registration_open", e.target.checked)} /> Registration open</label>
                  <label className="check"><input type="checkbox" checked={eventMetadataDraft.is_paid === true || String(eventMetadataDraft.is_paid).toLowerCase() === "true"} onChange={e => updateEventMetadata("is_paid", e.target.checked)} /> This is a paid event</label>
                  {(eventMetadataDraft.is_paid === true || String(eventMetadataDraft.is_paid).toLowerCase() === "true") && <label className="adminEventFeeField">Ticket fee per attendee (NGN)<input type="number" min="1" step="0.01" inputMode="decimal" value={eventMetadataDraft.fee_amount_kobo ? (Number(eventMetadataDraft.fee_amount_kobo) / 100).toString() : ""} onChange={e => { const n = Number(e.target.value); updateEventMetadata("fee_amount_kobo", e.target.value.trim() === "" ? null : (Number.isFinite(n) && n >= 0 ? Math.round(n * 100) : null)); }} placeholder="Enter NI4E-approved fee" /><small>Use the approved event fee only. Checkout validates the amount on the server. Leave blank until the fee is approved; paid checkout remains unavailable.</small></label>}
                  <small>These controls are saved with the event and determine registration availability and checkout behaviour on the public Events page.</small>
                </fieldset>
              )}
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
            <div className="applicationPanelHead eventPaymentsHead"><div><h2>Publication purchases</h2><p>Internal publication sales, buyer accounts and verified Paystack transactions.</p></div><span className="muted">{publicationPurchases.filter(p => p.status === "success").length} verified purchases</span></div>
            {contentLoading ? <div className="adminEmpty">Loading publication purchases…</div> : publicationPurchases.length === 0 ? <div className="adminEmpty"><BookOpen size={24}/><b>No publication purchases yet</b><span>Paid publication purchases will appear here after the commerce migration is applied.</span></div> : <div className="applicationTableWrap"><table className="applicationTable"><thead><tr><th>Date</th><th>Publication / Buyer</th><th>Amount</th><th>Reference</th><th>Status</th></tr></thead><tbody>{publicationPurchases.map(purchase => <tr key={purchase.id}><td>{new Date(purchase.created_at).toLocaleString()}</td><td><b>{purchase.publication_title}</b><small>Account: {purchase.user_id}</small></td><td>₦{(Number(purchase.amount_kobo||0)/100).toLocaleString("en-NG",{minimumFractionDigits:2})}</td><td>{purchase.provider_reference}</td><td><span className={`applicationStatus ${purchase.status === "success" ? "approved" : "pending"}`}>{purchase.status}</span></td></tr>)}</tbody></table></div>}
            <div className="applicationPanelHead eventPaymentsHead"><div><h2>Event ticket payments</h2><p>Paid event registrations and Paystack verification results, connected to Events and Event Registrations.</p></div><span className="muted">{eventPayments.filter(p => p.status === "success").length} verified transactions</span></div>
            {contentLoading ? <div className="adminEmpty">Loading event payments…</div> : eventPayments.length === 0 ? <div className="adminEmpty"><CreditCard size={24}/><b>No event payment records yet</b><span>Ticket payments appear here after a paid event is configured and checkout is started.</span></div> : <div className="applicationTableWrap"><table className="applicationTable"><thead><tr><th>Date</th><th>Event / Attendee</th><th>Amount</th><th>Reference</th><th>Status</th></tr></thead><tbody>{eventPayments.map(payment => <tr key={payment.id}><td>{new Date(payment.created_at).toLocaleString()}</td><td><b>{payment.event_title}</b><small>{payment.attendee_email}</small><small>Registration: {payment.registration_id}</small></td><td>{payment.amount_kobo == null ? "—" : `₦${(payment.amount_kobo / 100).toLocaleString("en-NG", { minimumFractionDigits: 2 })}`}</td><td>{payment.provider_reference}</td><td><span className={`applicationStatus ${payment.status === "success" ? "approved" : "pending"}`}>{payment.status}</span></td></tr>)}</tbody></table></div>}
          </section>
        ) : tab === "Membership Policies" ? (
          <MembershipPolicySettings />
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
        ) : tab === "Newsletter Subscribers" ? (
          <section className="applicationPanel">
            <div className="applicationPanelHead">
              <div>
                <h2>Newsletter subscriptions</h2>
                <p>Manage email addresses submitted through the public newsletter form. Status changes are saved to Supabase; this screen does not send campaigns or expose email-service credentials.</p>
              </div>
              <button className="adminRefresh" onClick={loadNewsletterSubscribers} disabled={newsletterLoading}>
                <RefreshCw size={16}/>{newsletterLoading ? "Refreshing…" : "Refresh"}
              </button>
            </div>
            <div className="adminSummaryCards">
              <article><span>All addresses</span><b>{newsletterRows.length}</b></article>
              <article><span>Subscribed</span><b>{newsletterRows.filter(row => row.status === "subscribed").length}</b></article>
              <article><span>Unsubscribed</span><b>{newsletterRows.filter(row => row.status === "unsubscribed").length}</b></article>
            </div>
            {newsletterLoading ? <p className="muted">Loading newsletter subscribers…</p> : (
              <div className="applicationTableWrap">
                <table className="applicationTable">
                  <thead><tr><th>Email address</th><th>Subscribed</th><th>Status</th><th>Action</th></tr></thead>
                  <tbody>{newsletterRows.map(row => <tr key={row.id || row.email}>
                    <td><b>{row.email}</b></td>
                    <td>{row.created_at ? new Date(row.created_at).toLocaleString() : "—"}</td>
                    <td><span className={`applicationStatus ${row.status === "subscribed" ? "approved" : "pending"}`}>{row.status || "subscribed"}</span></td>
                    <td><select aria-label={`Newsletter status for ${row.email}`} value={row.status || "subscribed"} onChange={event => updateNewsletterStatus(row, event.target.value)}><option value="subscribed">Subscribed</option><option value="unsubscribed">Unsubscribed</option></select></td>
                  </tr>)}</tbody>
                </table>
                {!newsletterRows.length && <p className="muted">No newsletter subscribers have been recorded yet.</p>}
              </div>
            )}
          </section>
        ) : tab === "Event Registrations" ? (
          <section className="applicationPanel">
            <div className="applicationPanelHead"><div><h2>Event attendee registrations</h2><p>Review attendee details and update registration status. Access is restricted to administrators.</p></div><button className="adminRefresh" onClick={loadEventRegistrations} disabled={registrationsLoading}><RefreshCw size={16}/> {registrationsLoading ? "Refreshing…" : "Refresh"}</button></div>
            {registrationsLoading ? <p className="muted">Loading registrations…</p> : <div className="applicationTableWrap"><table className="applicationTable"><thead><tr><th>Attendee</th><th>Event</th><th>Registration / payment</th><th>Registered</th><th>Attendance status</th></tr></thead><tbody>{eventRegistrations.map(row => <tr key={row.id}><td><b>{row.full_name}</b><small>{row.email}</small>{row.phone && <small>{row.phone}</small>}</td><td><b>{row.event_title}</b><small>Event ID: {row.event_id}</small></td><td><span className={`applicationStatus ${row.payment_status === "success" || row.payment_status === "not_required" ? "approved" : "pending"}`}>{row.payment_status || "not_required"}</span>{row.amount_kobo != null && <small>₦{(Number(row.amount_kobo)/100).toLocaleString("en-NG",{minimumFractionDigits:2})}</small>}{row.payment_reference&&<small>{row.payment_reference}</small>}{row.attendee_count>1&&<small>{row.attendee_count} attendees</small>}</td><td>{row.created_at ? new Date(row.created_at).toLocaleString() : "—"}</td><td><select aria-label={`Status for ${row.full_name}`} value={row.status || "new"} onChange={e=>updateEventRegistration(row,e.target.value)}><option value="new">New</option><option value="contacted">Contacted</option><option value="confirmed" disabled={Boolean(row.payment_status && !["not_required","success"].includes(row.payment_status))}>Confirmed</option><option value="cancelled">Cancelled</option></select></td></tr>)}</tbody></table>{!eventRegistrations.length && <p className="muted">No event registrations found yet.</p>}</div>}
          </section>
        ) : tab === "CPD Records" ? (
          <section className="applicationPanel">
            <div className="applicationPanelHead"><div><h2>Continuing Professional Development</h2><p>Create and maintain member CPD records. Use the member’s account UUID to link a record to their portal; email alone is not used as an authentication identifier.</p></div><button className="adminRefresh" onClick={loadCpd} disabled={cpdLoading}><RefreshCw size={16}/> Refresh</button></div>
            <form className="formBox" onSubmit={saveCpdRecord}><div className="formGrid"><label>Member name<input required value={cpdDraft.member_name} onChange={e=>setCpdDraft({...cpdDraft,member_name:e.target.value})}/></label><label>Member email<input required type="email" value={cpdDraft.member_email} onChange={e=>setCpdDraft({...cpdDraft,member_email:e.target.value})}/></label><label>Member account UUID (optional)<input value={cpdDraft.user_id} onChange={e=>setCpdDraft({...cpdDraft,user_id:e.target.value})} placeholder="Supabase auth user UUID"/></label><label>Activity title<input required value={cpdDraft.activity_title} onChange={e=>setCpdDraft({...cpdDraft,activity_title:e.target.value})}/></label><label>Provider / organiser<input value={cpdDraft.provider} onChange={e=>setCpdDraft({...cpdDraft,provider:e.target.value})}/></label><label>Completion date<input required type="date" value={cpdDraft.completion_date} onChange={e=>setCpdDraft({...cpdDraft,completion_date:e.target.value})}/></label><label>CPD hours<input required type="number" min="0.25" step="0.25" value={cpdDraft.hours} onChange={e=>setCpdDraft({...cpdDraft,hours:e.target.value})}/></label><label>Certificate reference (optional)<input value={cpdDraft.certificate_reference} onChange={e=>setCpdDraft({...cpdDraft,certificate_reference:e.target.value})}/></label></div><div className="formActions"><button className="gold" disabled={cpdSaving}>{cpdSaving ? "Saving…" : "Add CPD record"}</button></div></form>
            <div className="applicationTableWrap"><table className="applicationTable"><thead><tr><th>Member</th><th>Activity</th><th>Completed</th><th>Hours</th><th>Reference</th><th>Action</th></tr></thead><tbody>{cpdRows.map(row=><tr key={row.id}><td><b>{row.member_name}</b><small>{row.member_email}</small></td><td><b>{row.activity_title}</b><small>{row.provider || "—"}</small></td><td>{row.completion_date || "—"}</td><td>{row.hours}</td><td>{row.certificate_reference || "—"}</td><td><button type="button" className="textbtn" onClick={()=>deleteCpdRecord(row)} aria-label={`Delete CPD record for ${row.member_name}`}><Trash2 size={16}/> Delete</button></td></tr>)}</tbody></table>{!cpdRows.length && !cpdLoading && <p className="muted">No CPD records yet. Add the first record above.</p>}</div>
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
      {confirmingApproval && (
        <div className="applicationModalBackdrop" role="presentation" onMouseDown={(e) => e.target === e.currentTarget && setConfirmingApproval(null)}>
          <section className="applicationConfirmDialog" role="dialog" aria-modal="true" aria-labelledby="approveRequestTitle">
            <div className="applicationConfirmIcon"><CheckCircle2 size={25}/></div>
            <span className="kicker">CONFIRM ADMINISTRATIVE DECISION</span>
            {error && <div className="adminAlert" role="alert">{error}</div>}
            <h2 id="approveRequestTitle">{confirmingApproval.application_type === "upgrade" ? "Approve the initial upgrade review?" : `Approve this ${confirmingApproval.application_type === "renewal" ? "renewal" : "membership application"}?`}</h2>
            <p>You are approving <b>{confirmingApproval.fullName || confirmingApproval.name || "this applicant"}</b> for <b>{confirmingApproval.category || "the requested membership category"}</b>.</p>
            <div className="applicationConfirmInfo"><span>Request type</span><b>{{new:"New application",renewal:"Membership renewal",upgrade:"Membership upgrade"}[confirmingApproval.application_type || "new"]}</b>{confirmingApproval.previous_category && <><span>Previous category</span><b>{confirmingApproval.previous_category}</b></>}</div>
            <p className="muted">{confirmingApproval.application_type === "upgrade" ? "This is initial approval only. The member must upload the required evidence, the committee must verify it, and NI4E must record final approval before payment becomes available." : "This records approval for payment. It does not activate membership or confirm payment. Payment and activation remain subject to the existing verified payment process."}</p>
            <div className="applicationModalActions"><button className="outlineDark" onClick={() => setConfirmingApproval(null)} disabled={!!updating}>Go back</button><button className="gold" disabled={!!updating} onClick={() => changeStatus(confirmingApproval, "approved")}>{updating === confirmingApproval.id ? "Saving…" : confirmingApproval.application_type === "upgrade" ? "Confirm initial approval" : "Confirm approval"}</button></div>
          </section>
        </div>
      )}
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
            <span className="kicker">MEMBERSHIP REQUEST · {{new:"NEW APPLICATION",renewal:"RENEWAL",upgrade:"UPGRADE"}[selected.application_type || "new"]}</span>
            {error && <div className="adminAlert" role="alert">{error}</div>}
            <h2 id="applicationModalTitle">
              {selected.fullName || selected.name || "Applicant"}
            </h2>
            <p className="muted">Reference: {selected.id}</p>
            <div className="applicationDetailGrid">
              {[
                ["Email", selected.email],
                ["Phone", selected.phone],
                ["Request type", ({new:"New application",renewal:"Membership renewal",upgrade:"Membership upgrade"})[selected.application_type || "new"]],
                ["Membership number", selected.membership_number],
                ["Current membership expiry", selected.membership_expires_at ? new Date(selected.membership_expires_at).toLocaleDateString() : null],
                ["Current / requested category", selected.category],
                ["Previous category", selected.previous_category],
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
            {decisionIntent === "rejected" && <div className="applicationDecisionNotice"><b>Declining this request</b><span>Enter a clear reason below. The decision will be saved to the request and reflected in the member portal.</span></div>}
            {selected.application_type === "upgrade" && <div className="applicationDecisionNotice"><b>Controlled membership upgrade</b><span>Initial approval opens document submission. The member must submit evidence, the committee must verify it, and only a separate final approval releases payment. The existing membership grade and number remain unchanged until verified payment.</span></div>}
            {selected.application_type === "renewal" && <div className="applicationDecisionNotice"><b>Annual membership renewal</b><span>Review the member's current grade, membership number and expiry date. Approval releases the configured annual renewal fee; successful payment extends validity without changing the membership number or grade.</span></div>}
            <label className="reviewNotesField">
              Review notes / reason
              <textarea rows={3} value={reviewNotes} onChange={(e) => setReviewNotes(e.target.value)} placeholder="Record the decision, reason or instructions. Required for corrections and rejection." />
            </label>
            <div className="applicationModalActions">
              <button className="outlineDark" onClick={() => { setSelected(null); setDecisionIntent(""); setReviewNotes(""); }}>Close</button>
              <button className="adminRefresh" disabled={!!updating || ["approved", "approved_for_payment", "rejected", "active"].includes(selected.status) || (selected.application_type === "upgrade" && !["pending", "under_review"].includes(selected.status))} onClick={() => changeStatus(selected, "under_review")}>Mark reviewing</button>
              <button className="adminRefresh" disabled={!!updating || ["rejected", "active"].includes(selected.status)} onClick={() => changeStatus(selected, "needs_information")}>Request corrections</button>
              {selected.application_type === "upgrade" ? <>
                { (["pending", "under_review"].includes(selected.status) || (selected.status === "needs_information" && !selected.documents_submitted_at)) && <button className="gold" disabled={!!updating} onClick={() => requestApproval(selected)}>Approve initial review</button> }
                { selected.status === "documents_submitted" && <button className="gold" disabled={!!updating} onClick={() => changeStatus(selected, "committee_review")}>Send to committee</button> }
                { selected.status === "committee_review" && <button className="gold" disabled={!!updating} onClick={() => changeStatus(selected, "committee_verified")}>Verify documents</button> }
                { selected.status === "committee_verified" && <button className="gold" disabled={!!updating} onClick={() => changeStatus(selected, "approved_for_payment")}>Final approval · release payment</button> }
              </> : <button className="gold" disabled={!!updating || selected.status === "approved" || selected.status === "rejected" || selected.status === "active"} onClick={() => requestApproval(selected)}>Approve for payment</button>}
              <button className="dangerButton" disabled={!!updating || selected.status === "rejected" || selected.status === "active"} onClick={() => changeStatus(selected, "rejected")}>Reject request</button>
            </div>
          </section>
        </div>
      )}
    </div>
  );
}
