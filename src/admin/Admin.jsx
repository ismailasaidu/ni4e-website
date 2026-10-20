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
      const [{ data, error }, { data: eventData, error: eventError }] = await Promise.all([
        supabase.from("membership_payments")
          .select("id,user_id,application_id,category,amount_kobo,currency,provider,provider_reference,status,payment_type,created_at,paid_at")
          .order("created_at", { ascending: false }).limit(300),
        supabase.from("event_payments")
          .select("id,registration_id,event_id,event_title,attendee_email,amount_kobo,currency,provider,provider_reference,status,created_at,paid_at")
          .order("created_at", { ascending: false }).limit(300),
      ]);
      if (error) throw error;
      setPayments(data || []);
      // A missing event-payment migration must not hide valid membership transactions.
      const eventTableMissing = Boolean(eventError && /event_payments|schema cache|does not exist|could not find the table/i.test(eventError.message || ''));
      setEventPayments(eventError ? [] : (eventData || []));
      if (eventError && !eventTableMissing) throw new Error(`Membership payments loaded, but event payments could not load: ${eventError.message}`);
      if (eventTableMissing) setError('Membership payments loaded. Event payments are unavailable until the reviewed supabase-stage-3-integrated-event-payments.sql migration is applied.');
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
                <p>Create, edit, publish or unpublish institutional content. For leadership use structured JSON metadata; for About Page edit the headline, summary, main body and optional metadata.secondParagraph / metadata.closingStatement.</p>
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
