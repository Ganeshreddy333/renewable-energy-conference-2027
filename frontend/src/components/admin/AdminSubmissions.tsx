import { useCallback, useEffect, useState } from "react";
import { apiClient } from "@/integrations/api/client";
import type { Tables } from "@/integrations/api/types";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { useToast } from "@/hooks/use-toast";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Download, ExternalLink } from "lucide-react";

type RegistrationIntent = Tables<"registration_intents">;
type AbstractSubmission = Tables<"abstract_submissions">;
type ContactMessage = Tables<"contact_messages">;

type PaymentProviderStatus = {
  stripe: { configured: boolean; mode: string };
  paypal: { configured: boolean; mode: string };
  razorpay: { configured: boolean; mode: string };
  phonepe: { configured: boolean; mode: string };
};

const getAdminAuthHeaders = (): Record<string, string> => {
  try {
    const session = JSON.parse(window.localStorage.getItem("localAuthSession") || "null");
    return session?.access_token ? { Authorization: `Bearer ${session.access_token}` } : {};
  } catch {
    return {};
  }
};

const formatDate = (value: string | null) => {
  if (!value) return "-";
  return new Date(value).toLocaleString();
};

const getPaymentBadgeVariant = (status: string) => {
  const normalized = status.toLowerCase();
  if (["paid", "success", "successful", "completed"].includes(normalized)) return "default";
  if (["failed", "cancelled", "canceled"].includes(normalized)) return "destructive";
  return "secondary";
};

const getStoredFiles = (value: unknown): Array<{ name: string; path: string }> => {
  const parsedValue = typeof value === "string" && value.trim().startsWith("[")
    ? (() => {
        try {
          return JSON.parse(value) as unknown;
        } catch {
          return value;
        }
      })()
    : value;

  if (!Array.isArray(parsedValue)) return [];

  return parsedValue
    .map((item) => {
      if (typeof item === "string") return { name: item.split("/").pop() || "Download", path: item };
      if (item && typeof item === "object" && "path" in item) {
        const file = item as { name?: unknown; path?: unknown };
        return {
          name: typeof file.name === "string" ? file.name : "Download",
          path: typeof file.path === "string" ? file.path : "",
        };
      }
      return null;
    })
    .filter((item): item is { name: string; path: string } => Boolean(item?.path));
};

const AdminSubmissions = () => {
  const [registrations, setRegistrations] = useState<RegistrationIntent[]>([]);
  const [abstracts, setAbstracts] = useState<AbstractSubmission[]>([]);
  const [messages, setMessages] = useState<ContactMessage[]>([]);
  const [providerStatus, setProviderStatus] = useState<PaymentProviderStatus | null>(null);
  const [updatingAbstractId, setUpdatingAbstractId] = useState<string | null>(null);
  const { toast } = useToast();

  const fetchData = useCallback(async () => {
    const [registrationsResult, abstractsResult, messagesResult] = await Promise.all([
      apiClient.from("registration_intents").select("*").order("created_at", { ascending: false }),
      apiClient.from("abstract_submissions").select("*").order("created_at", { ascending: false }),
      apiClient.from("contact_messages").select("*").order("created_at", { ascending: false }),
    ]);

    if (registrationsResult.error || abstractsResult.error || messagesResult.error) {
      toast({
        title: "Could not load submissions",
        description:
          registrationsResult.error?.message ||
          abstractsResult.error?.message ||
          messagesResult.error?.message ||
          "Unknown error",
        variant: "destructive",
      });
      return;
    }

    setRegistrations(registrationsResult.data || []);
    setAbstracts(abstractsResult.data || []);
    setMessages(messagesResult.data || []);

    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001"}/functions/payment-provider-status`, {
        headers: getAdminAuthHeaders(),
      });
      if (response.ok) {
        const data = (await response.json()) as PaymentProviderStatus;
        setProviderStatus(data);
      }
    } catch {
      setProviderStatus(null);
    }
  }, [toast]);

  const openStoredFile = async (path: string) => {
    const { data, error } = await apiClient.storage.from("abstract-assets").createSignedUrl(path, 60 * 10);

    if (error || !data?.signedUrl) {
      toast({
        title: "Could not open file",
        description: error?.message || "No download URL was created.",
        variant: "destructive",
      });
      return;
    }

    window.open(data.signedUrl, "_blank", "noopener,noreferrer");
  };

  const downloadReceipt = async (registrationId: string) => {
    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001"}/functions/receipt/${registrationId}`, {
        headers: getAdminAuthHeaders(),
      });
      if (!response.ok) {
        throw new Error("Receipt could not be generated");
      }

      const data = (await response.json()) as { pdfBase64?: string; receiptNumber?: string; acknowledgementNumber?: string };
      if (!data.pdfBase64) {
        throw new Error("Receipt content missing");
      }

      const file = new Blob([Uint8Array.from(atob(data.pdfBase64), (char) => char.charCodeAt(0))], {
        type: "application/pdf",
      });
      const url = URL.createObjectURL(file);
      const link = document.createElement("a");
      link.href = url;
      link.download = `${data.receiptNumber || registrationId}.pdf`;
      link.click();
      URL.revokeObjectURL(url);
    } catch (error) {
      toast({
        title: "Could not download receipt",
        description: error instanceof Error ? error.message : "Unknown error",
        variant: "destructive",
      });
    }
  };

  const openExternalUrl = (url: string) => {
    window.open(url, "_blank", "noopener,noreferrer");
  };

  const updateAbstractStatus = async (id: string, status: "approved" | "rejected") => {
    setUpdatingAbstractId(id);

    const { error } = await apiClient
      .from("abstract_submissions")
      .update({ status })
      .eq("id", id);

    if (error) {
      toast({
        title: "Could not update abstract",
        description: error.message,
        variant: "destructive",
      });
    } else {
      setAbstracts((current) => current.map((item) => (item.id === id ? { ...item, status } : item)));
      toast({ title: `Abstract ${status}`, description: `The submission has been ${status}.` });
    }

    setUpdatingAbstractId(null);
  };

  const registrationCounts = registrations.reduce(
    (counts, item) => {
      const status = item.payment_status.toLowerCase();
      if (["paid", "success", "successful", "completed"].includes(status)) counts.successful += 1;
      else if (["failed", "cancelled", "canceled"].includes(status)) counts.failed += 1;
      else counts.processing += 1;
      return counts;
    },
    { successful: 0, failed: 0, processing: 0 },
  );

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  return (
    <Card>
      <CardHeader>
        <CardTitle className="font-display">Submissions & Attendees</CardTitle>
      </CardHeader>
      <CardContent>
        <Tabs defaultValue="registrations" className="space-y-6">
          <TabsList className="grid w-full grid-cols-4 max-w-3xl">
            <TabsTrigger value="registrations">Registrations</TabsTrigger>
            <TabsTrigger value="payments">Payments</TabsTrigger>
            <TabsTrigger value="abstracts">Abstracts</TabsTrigger>
            <TabsTrigger value="messages">Messages</TabsTrigger>
          </TabsList>

          <TabsContent value="registrations">
            <div className="mb-4 grid gap-3 md:grid-cols-3">
              <div className="rounded-md border border-border p-4">
                <p className="text-sm text-muted-foreground">Successful</p>
                <p className="font-display text-2xl font-bold text-foreground">{registrationCounts.successful}</p>
              </div>
              <div className="rounded-md border border-border p-4">
                <p className="text-sm text-muted-foreground">Failed / Cancelled</p>
                <p className="font-display text-2xl font-bold text-foreground">{registrationCounts.failed}</p>
              </div>
              <div className="rounded-md border border-border p-4">
                <p className="text-sm text-muted-foreground">Processing</p>
                <p className="font-display text-2xl font-bold text-foreground">{registrationCounts.processing}</p>
              </div>
            </div>
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Attendee</TableHead>
                    <TableHead className="hidden md:table-cell">Affiliation</TableHead>
                    <TableHead>Plan</TableHead>
                    <TableHead>Payment</TableHead>
                    <TableHead className="hidden lg:table-cell">Created</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {registrations.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={5} className="text-center text-muted-foreground py-8">
                        No registrations yet.
                      </TableCell>
                    </TableRow>
                  ) : (
                    registrations.map((item) => (
                      <TableRow key={item.id}>
                        <TableCell>
                          <div className="font-medium">{item.full_name}</div>
                          <div className="text-sm text-muted-foreground">{item.email}</div>
                          <div className="text-sm text-muted-foreground">{item.phone}</div>
                        </TableCell>
                        <TableCell className="hidden md:table-cell">
                          <div>{item.affiliation || "-"}</div>
                          <div className="text-sm text-muted-foreground">{item.country || item.designation || "-"}</div>
                        </TableCell>
                        <TableCell>{item.plan_name}</TableCell>
                        <TableCell>
                          <div className="font-medium capitalize">{item.payment_provider}</div>
                          <Badge variant={getPaymentBadgeVariant(item.payment_status)}>{item.payment_status}</Badge>
                          <div className="mt-1 text-sm text-muted-foreground">{item.status}</div>
                          <div className="text-sm text-muted-foreground">{item.payment_reference || item.payment_session_id || item.payment_order_id || "-"}</div>
                        </TableCell>
                        <TableCell className="hidden lg:table-cell">{formatDate(item.created_at)}</TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </div>
          </TabsContent>

          <TabsContent value="payments">
            <div className="mb-4 grid gap-3 md:grid-cols-4">
              {providerStatus ? (
                Object.entries(providerStatus).map(([provider, config]) => (
                  <div key={provider} className="rounded-md border border-border p-4">
                    <p className="text-sm uppercase tracking-wide text-muted-foreground">{provider}</p>
                    <p className="mt-2 font-display text-xl font-bold text-foreground">{config.configured ? "Configured" : "Not configured"}</p>
                    <p className="text-sm text-muted-foreground">Mode: {config.mode}</p>
                  </div>
                ))
              ) : (
                <div className="rounded-md border border-border p-4 md:col-span-4">
                  <p className="text-sm text-muted-foreground">Payment provider status is unavailable until the API is reachable.</p>
                </div>
              )}
            </div>
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Attendee</TableHead>
                    <TableHead>Provider</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Receipt</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {registrations.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={4} className="text-center text-muted-foreground py-8">
                        No payment records yet.
                      </TableCell>
                    </TableRow>
                  ) : (
                    registrations.map((item) => (
                      <TableRow key={item.id}>
                        <TableCell>
                          <div className="font-medium">{item.full_name}</div>
                          <div className="text-sm text-muted-foreground">{item.email}</div>
                        </TableCell>
                        <TableCell>{item.payment_provider || "-"}</TableCell>
                        <TableCell>
                          <Badge variant={getPaymentBadgeVariant(item.payment_status)}>{item.payment_status}</Badge>
                        </TableCell>
                        <TableCell>
                          {item.payment_status?.toLowerCase() === "paid" ? (
                            <Button type="button" size="sm" variant="outline" onClick={() => downloadReceipt(item.id)}>
                              <Download className="mr-1 h-3 w-3" /> Receipt
                            </Button>
                          ) : (
                            <span className="text-sm text-muted-foreground">Pending</span>
                          )}
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </div>
          </TabsContent>

          <TabsContent value="abstracts">
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Author</TableHead>
                    <TableHead>Title</TableHead>
                    <TableHead className="hidden md:table-cell">Type</TableHead>
                    <TableHead className="hidden md:table-cell">Assets</TableHead>
                    <TableHead>Review</TableHead>
                    <TableHead className="hidden lg:table-cell">Created</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {abstracts.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={6} className="text-center text-muted-foreground py-8">
                        No abstract submissions yet.
                      </TableCell>
                    </TableRow>
                  ) : (
                    abstracts.map((item) => {
                      const storedFiles = getStoredFiles(item.file_paths);

                      return (
                        <TableRow key={item.id}>
                          <TableCell className="min-w-[220px] align-top">
                            <div className="font-medium">{item.full_name || "-"}</div>
                            <div className="text-sm text-muted-foreground">{item.email || "-"}</div>
                            <div className="text-sm text-muted-foreground">{item.phone || "-"}</div>
                            <div className="text-sm text-muted-foreground">{item.affiliation || "-"}</div>
                            <div className="text-sm text-muted-foreground">{item.country || "-"}</div>
                          </TableCell>
                          <TableCell className="min-w-[280px] align-top">
                            <div className="font-medium">{item.abstract_title || "-"}</div>
                            <div className="mt-1 text-sm text-muted-foreground">{item.keywords || "-"}</div>
                            <div className="mt-2 max-w-xl whitespace-pre-wrap text-sm text-muted-foreground">
                              {item.abstract_text || item.supporting_text || "-"}
                            </div>
                          </TableCell>
                          <TableCell className="hidden md:table-cell align-top">
                            <div>{item.presentation_type || "-"}</div>
                            <Badge className="mt-2" variant="secondary">{item.status || "submitted"}</Badge>
                          </TableCell>
                          <TableCell className="hidden md:table-cell min-w-[240px] align-top">
                            <div className="text-sm text-muted-foreground">
                              {[
                                item.website_url ? "Website" : null,
                                item.drive_url ? "Drive" : null,
                                item.supporting_text ? "Text" : null,
                                item.voice_file_name ? "Voice" : null,
                                storedFiles.length > 0 ? "Files" : null,
                              ]
                                .filter(Boolean)
                                .join(", ") || "-"}
                            </div>
                            <div className="mt-2 flex flex-wrap gap-2">
                              {item.website_url ? (
                                <Button type="button" size="sm" variant="outline" onClick={() => openExternalUrl(item.website_url || "")}>
                                  <ExternalLink className="mr-1 h-3 w-3" />
                                  Website
                                </Button>
                              ) : null}
                              {item.drive_url ? (
                                <Button type="button" size="sm" variant="outline" onClick={() => openExternalUrl(item.drive_url || "")}>
                                  <ExternalLink className="mr-1 h-3 w-3" />
                                  Drive
                                </Button>
                              ) : null}
                              {storedFiles.map((file) => (
                                <Button key={file.path} type="button" size="sm" variant="outline" onClick={() => openStoredFile(file.path)}>
                                  <Download className="mr-1 h-3 w-3" />
                                  {file.name}
                                </Button>
                              ))}
                              {item.voice_file_path ? (
                                <Button type="button" size="sm" variant="outline" onClick={() => openStoredFile(item.voice_file_path || "")}>
                                  <Download className="mr-1 h-3 w-3" />
                                  {item.voice_file_name || "Voice"}
                                </Button>
                              ) : null}
                            </div>
                          </TableCell>
                          <TableCell className="min-w-[180px] align-top">
                            <div className="flex flex-col gap-2 sm:flex-row">
                              <Button
                                type="button"
                                size="sm"
                                disabled={updatingAbstractId === item.id || item.status === "approved"}
                                onClick={() => updateAbstractStatus(item.id, "approved")}
                              >
                                {updatingAbstractId === item.id ? "Saving..." : "Approve"}
                              </Button>
                              <Button
                                type="button"
                                size="sm"
                                variant="destructive"
                                disabled={updatingAbstractId === item.id || item.status === "rejected"}
                                onClick={() => updateAbstractStatus(item.id, "rejected")}
                              >
                                Reject
                              </Button>
                            </div>
                          </TableCell>
                          <TableCell className="hidden lg:table-cell align-top">{formatDate(item.created_at)}</TableCell>
                        </TableRow>
                      );
                    })
                  )}
                </TableBody>
              </Table>
            </div>
          </TabsContent>

          <TabsContent value="messages">
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Sender</TableHead>
                    <TableHead>Subject</TableHead>
                    <TableHead className="hidden md:table-cell">Message</TableHead>
                    <TableHead className="hidden lg:table-cell">Created</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {messages.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={4} className="text-center text-muted-foreground py-8">
                        No contact messages yet.
                      </TableCell>
                    </TableRow>
                  ) : (
                    messages.map((item) => (
                      <TableRow key={item.id}>
                        <TableCell>
                          <div className="font-medium">{item.name}</div>
                          <div className="text-sm text-muted-foreground">{item.email}</div>
                        </TableCell>
                        <TableCell>{item.subject}</TableCell>
                        <TableCell className="hidden md:table-cell max-w-[380px] truncate">{item.message}</TableCell>
                        <TableCell className="hidden lg:table-cell">{formatDate(item.created_at)}</TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </div>
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
};

export default AdminSubmissions;
