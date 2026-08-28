"use client";

import { useEffect, useMemo, useState } from "react";
import { Button } from "./ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { apiClient } from "@/integrations/api/client";
import { type ImportantDateItem, type PricingRow, toLocalDate, useConferenceSettings } from "@/lib/conferenceSettings";
import CaptchaVerification from "@/components/CaptchaVerification";
import { Checkbox } from "@/components/ui/checkbox";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";

const PENDING_REGISTRATION_KEY = "pendingRegistration";
const SERVICE_CHARGE_RATE = 0.05;

type PaymentProvider = "stripe" | "paypal";

type CategoryKey =
  | "pre-speaker"
  | "pre-poster"
  | "pre-student"
  | "pre-delegate"
  | "pre-virtual"
  | "early-speaker"
  | "early-poster"
  | "early-student"
  | "early-delegate"
  | "early-virtual"
  | "mid-speaker"
  | "mid-poster"
  | "mid-student"
  | "mid-delegate"
  | "onspot-speaker"
  | "onspot-poster"
  | "onspot-student"
  | "onspot-delegate";

type RegistrationCategory = {
  key: CategoryKey;
  label: string;
  price: number;
};

type RegistrationGroup = {
  title: string;
  date: string;
  startDate?: Date;
  endDate: Date;
  categories: RegistrationCategory[];
};

const noAvailableCategories: RegistrationCategory[] = [];

type FormValues = {
  title: string;
  name: string;
  email: string;
  phone: string;
  altEmail: string;
  whatsApp: string;
  organization: string;
  country: string;
};

type AppliedCoupon = {
  code: string;
  discountPercent?: number | null;
  discountAmount?: number | null;
};

const titleOptions = ["Mr.", "Ms.", "Mrs.", "Dr.", "Prof."];

const countryOptions = [
  "Australia",
  "Brazil",
  "Canada",
  "China",
  "France",
  "Germany",
  "India",
  "Italy",
  "Japan",
  "Netherlands",
  "Singapore",
  "South Africa",
  "Spain",
  "United Arab Emirates",
  "United Kingdom",
  "United States",
  "Other",
];

const initialForm: FormValues = {
  title: "",
  name: "",
  email: "",
  phone: "",
  altEmail: "",
  whatsApp: "",
  organization: "",
  country: "",
};

const formatUsd = (value: number) => `$${value.toFixed(value % 1 === 0 ? 0 : 2)}`;

const appendPaymentParams = (
  paymentUrl: string,
  params: Record<string, string | number | null | undefined>,
) => {
  try {
    const url = new URL(paymentUrl);

    Object.entries(params).forEach(([key, value]) => {
      if (value !== null && value !== undefined && String(value).trim()) {
        url.searchParams.set(key, String(value));
      }
    });

    return url.toString();
  } catch {
    return paymentUrl;
  }
};

const buildMockPaymentRedirectUrl = (registrationId: string) => {
  if (typeof window === "undefined") {
    return "/registration/success";
  }

  const params = new URLSearchParams({
    provider: "mock",
    registration_id: registrationId,
  });

  return `${window.location.origin}/registration/success?${params.toString()}`;
};

const createStripeCheckoutSession = async (registrationId: string) => {
  const { data, error } = await apiClient.functions.invoke<{ url?: string; error?: string }>("create-stripe-checkout", {
    body: { registrationId },
  });

  if (error || !data?.url) {
    throw new Error(data?.error || error?.message || "Could not create Stripe checkout session");
  }

  return data.url;
};

const createPayPalOrder = async (registrationId: string) => {
  const { data, error } = await apiClient.functions.invoke<{ url?: string; error?: string }>("create-paypal-order", {
    body: { registrationId },
  });

  if (error || !data?.url) {
    throw new Error(data?.error || error?.message || "Could not create PayPal order");
  }

  return data.url;
};

const getToday = () => {
  const today = new Date();
  return new Date(today.getFullYear(), today.getMonth(), today.getDate());
};

const isGroupAvailable = (group: RegistrationGroup, today: Date) => {
  const startsOn = group.startDate ?? new Date(0);
  return today >= startsOn && today <= group.endDate;
};

const labelForPricingRow = (row: PricingRow) =>
  row.id === "speaker"
    ? "Speaker Presentation"
    : row.id === "poster"
      ? "Poster Presentation"
      : row.id === "student"
        ? "Student Delegate (Listener)"
        : row.category;

const buildRegistrationGroups = (pricingRows: PricingRow[], importantDates: ImportantDateItem[]): RegistrationGroup[] => {
  const dateById = new Map(importantDates.map((date) => [date.id, date]));
  const groupConfigs = [
    { id: "early", prefix: "early", priceKey: "earlyBird" as const, fallbackTitle: "Early Bird Registration" },
    { id: "mid", prefix: "mid", priceKey: "midterm" as const, fallbackTitle: "Mid Term Registration" },
    { id: "onspot", prefix: "onspot", priceKey: "onSpot" as const, fallbackTitle: "On-spot Registration" },
  ];

  return groupConfigs.map((config) => {
    const date = dateById.get(config.id);

    return {
      title: date?.title || config.fallbackTitle,
      date: date?.date || "",
      startDate: toLocalDate(date?.startDate),
      endDate: toLocalDate(date?.endDate) ?? new Date(8640000000000000),
      categories: pricingRows.map((row) => ({
        key: `${config.prefix}-${row.id}` as CategoryKey,
        label: labelForPricingRow(row),
        price: row[config.priceKey],
      })),
    };
  });
};

const PricingSection = () => {
  const { toast } = useToast();
  const { importantDates, pricingRows } = useConferenceSettings();
  const [formValues, setFormValues] = useState<FormValues>(initialForm);
  const [selectedCategoryKey, setSelectedCategoryKey] = useState<CategoryKey>("early-speaker");
  const [participants, setParticipants] = useState(1);
  const [couponCode, setCouponCode] = useState("");
  const [appliedCoupon, setAppliedCoupon] = useState<AppliedCoupon | null>(null);
  const [paymentProvider, setPaymentProvider] = useState<PaymentProvider>("stripe");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isCaptchaVerified, setIsCaptchaVerified] = useState(false);
  const [hasAcceptedTerms, setHasAcceptedTerms] = useState(false);
  const [isTermsDialogOpen, setIsTermsDialogOpen] = useState(false);
  const [captchaResetKey, setCaptchaResetKey] = useState(0);
  const [countrySearch, setCountrySearch] = useState("");
  const [otherCountry, setOtherCountry] = useState("");
  const filteredCountries = countryOptions.filter((country) =>
    country.toLowerCase().includes(countrySearch.trim().toLowerCase()),
  );

  const today = useMemo(getToday, []);
  const registrationGroups = useMemo(
    () => buildRegistrationGroups(pricingRows, importantDates),
    [importantDates, pricingRows],
  );
  const activeGroup = registrationGroups.find((group) => isGroupAvailable(group, today));
  const availableCategories = activeGroup?.categories ?? noAvailableCategories;
  const allCategories = registrationGroups.flatMap((group) => group.categories);
  const selectedCategory = allCategories.find((category) => category.key === selectedCategoryKey) ?? availableCategories[0] ?? allCategories[0];
  const registrationPrice = selectedCategory.price;
  const subtotalPrice = registrationPrice * participants;
  const discount = appliedCoupon
    ? appliedCoupon.discountAmount && appliedCoupon.discountAmount > 0
      ? Math.min(appliedCoupon.discountAmount, subtotalPrice)
      : appliedCoupon.discountPercent && appliedCoupon.discountPercent > 0
        ? Math.min((subtotalPrice * appliedCoupon.discountPercent) / 100, subtotalPrice)
        : 0
    : 0;
  const totalRegistrationPrice = Math.max(subtotalPrice - discount, 0);
  const serviceCharge = totalRegistrationPrice * SERVICE_CHARGE_RATE;
  const totalPrice = totalRegistrationPrice + serviceCharge;

  const paymentLinks = useMemo(() => {
    const providerLinks = {
      stripe: {
        speaker: process.env.NEXT_PUBLIC_STRIPE_PAYMENT_LINK_SPEAKER || process.env.NEXT_PUBLIC_STRIPE_PAYMENT_LINK_ACADEMIC,
        poster: process.env.NEXT_PUBLIC_STRIPE_PAYMENT_LINK_POSTER || process.env.NEXT_PUBLIC_STRIPE_PAYMENT_LINK_BUSINESS,
        student: process.env.NEXT_PUBLIC_STRIPE_PAYMENT_LINK_STUDENT,
        delegate: process.env.NEXT_PUBLIC_STRIPE_PAYMENT_LINK_DELEGATE || process.env.NEXT_PUBLIC_STRIPE_PAYMENT_LINK_BUSINESS,
        virtual: process.env.NEXT_PUBLIC_STRIPE_PAYMENT_LINK_VIRTUAL,
      },
      paypal: {
        speaker: process.env.NEXT_PUBLIC_PAYPAL_PAYMENT_LINK_SPEAKER,
        poster: process.env.NEXT_PUBLIC_PAYPAL_PAYMENT_LINK_POSTER,
        student: process.env.NEXT_PUBLIC_PAYPAL_PAYMENT_LINK_STUDENT,
        delegate: process.env.NEXT_PUBLIC_PAYPAL_PAYMENT_LINK_DELEGATE,
        virtual: process.env.NEXT_PUBLIC_PAYPAL_PAYMENT_LINK_VIRTUAL,
      },
    };

    const buildCategoryLinks = (provider: PaymentProvider) => ({
      "pre-speaker": providerLinks[provider].speaker,
      "pre-poster": providerLinks[provider].poster,
      "pre-student": providerLinks[provider].student,
      "pre-delegate": providerLinks[provider].delegate,
      "pre-virtual": providerLinks[provider].virtual,
      "early-speaker": providerLinks[provider].speaker,
      "early-poster": providerLinks[provider].poster,
      "early-student": providerLinks[provider].student,
      "early-delegate": providerLinks[provider].delegate,
      "early-virtual": providerLinks[provider].virtual,
      "mid-speaker": providerLinks[provider].speaker,
      "mid-poster": providerLinks[provider].poster,
      "mid-student": providerLinks[provider].student,
      "mid-delegate": providerLinks[provider].delegate,
      "onspot-speaker": providerLinks[provider].speaker,
      "onspot-poster": providerLinks[provider].poster,
      "onspot-student": providerLinks[provider].student,
      "onspot-delegate": providerLinks[provider].delegate,
    });

    return {
      stripe: buildCategoryLinks("stripe"),
      paypal: buildCategoryLinks("paypal"),
    };
  }, []);

  const paymentTestProvider = process.env.NEXT_PUBLIC_PAYMENT_TEST_PROVIDER;
  const razorpayTestPaymentLink = process.env.NEXT_PUBLIC_RAZORPAY_TEST_PAYMENT_LINK;

  useEffect(() => {
    if (availableCategories.length && !availableCategories.some((category) => category.key === selectedCategoryKey)) {
      setSelectedCategoryKey(availableCategories[0].key);
    }
  }, [availableCategories, selectedCategoryKey]);

  const updateFormValue = (field: keyof FormValues, value: string) => {
    setFormValues((current) => ({ ...current, [field]: value }));
  };

  const validateCoupon = async (code: string) => {
    const trimmedCode = code.trim();

    if (!trimmedCode) {
      setAppliedCoupon(null);
      toast({
        title: "Enter coupon code",
        description: "Please enter a coupon code before applying.",
        variant: "destructive",
      });
      return null;
    }

    const { data, error } = await (apiClient as any).rpc("validate_registration_coupon", {
      p_code: trimmedCode,
      p_email: "",
      p_amount_usd: subtotalPrice,
    });

    const result = data;

    if (error || !result || !result.valid || Number(result.discount_amount ?? 0) <= 0) {
      setAppliedCoupon(null);
      toast({
        title: "Coupon code wrong",
        description: error?.message || result?.message || "Please enter a valid coupon code",
        variant: "destructive",
      });
      return null;
    }

    setAppliedCoupon({
      code: result.code ?? result.coupon?.code,
      discountPercent: result.discount_percent ?? null,
      discountAmount: result.discount_amount ?? null,
    });

    const discountLabel = result.discount_amount
      ? formatUsd(result.discount_amount)
      : result.discount_percent
        ? `${result.discount_percent}%`
        : "discount";

    toast({
      title: "Coupon applied",
      description: `${discountLabel} applied to your registration amount.`,
    });

    return result;
  };

  const handleApplyCoupon = () => {
    if (!couponCode.trim()) {
      setAppliedCoupon(null);
      return;
    }

    void validateCoupon(couponCode);
  };

  const handleReset = () => {
    setFormValues(initialForm);
    setOtherCountry("");
    setSelectedCategoryKey(availableCategories[0]?.key ?? "early-speaker");
    setParticipants(1);
    setCouponCode("");
    setAppliedCoupon(null);
    setIsCaptchaVerified(false);
    setHasAcceptedTerms(false);
    setCaptchaResetKey((current) => current + 1);
  };

  const handleProceed = async () => {
    const requiredFields: Array<keyof FormValues> = ["title", "name", "email", "organization", "country"];
    const hasMissingField = requiredFields.some((field) => !formValues[field].trim());
    const hasMissingOtherCountry = formValues.country === "Other" && !otherCountry.trim();

    if (!availableCategories.some((category) => category.key === selectedCategoryKey)) {
      toast({
        title: "Registration period is not available",
        description: "Please select an option from the currently open registration period.",
        variant: "destructive",
      });
      return;
    }

    if (hasMissingField || hasMissingOtherCountry) {
      toast({
        title: "Complete required fields",
        description: "Title, Name, Email, Organization, and Country are required.",
        variant: "destructive",
      });
      return;
    }

    if (!formValues.email.includes("@")) {
      toast({
        title: "Enter a valid email",
        description: "Email must include @.",
        variant: "destructive",
      });
      return;
    }

    if (!isCaptchaVerified) {
      toast({
        title: "Captcha required",
        description: "Please complete captcha verification before proceeding to register.",
        variant: "destructive",
      });
      return;
    }

    if (!hasAcceptedTerms) {
      toast({
        title: "Terms acceptance required",
        description: "Please accept the Terms & Conditions before proceeding to register.",
        variant: "destructive",
      });
      return;
    }

    setIsSubmitting(true);

    let effectiveCoupon = appliedCoupon;

    if (couponCode.trim()) {
      const couponResult = await validateCoupon(couponCode);

      if (!couponResult) {
        setIsSubmitting(false);
        return;
      }

      effectiveCoupon = {
        code: couponResult.code,
        discountPercent: couponResult.discount_percent ?? null,
        discountAmount: couponResult.discount_amount ?? null,
      };
    } else {
      effectiveCoupon = null;
      setAppliedCoupon(null);
    }

    let paymentLink = paymentLinks[paymentProvider][selectedCategory.key];
    const useRazorpayTestLink = paymentTestProvider === "razorpay" && razorpayTestPaymentLink?.trim();

    if (useRazorpayTestLink) {
      paymentLink = razorpayTestPaymentLink;
    }

    const effectiveDiscount = effectiveCoupon
      ? effectiveCoupon.discountAmount && effectiveCoupon.discountAmount > 0
        ? Math.min(effectiveCoupon.discountAmount, subtotalPrice)
        : effectiveCoupon.discountPercent && effectiveCoupon.discountPercent > 0
          ? Math.min((subtotalPrice * effectiveCoupon.discountPercent) / 100, subtotalPrice)
          : 0
      : 0;
    const effectiveRegistrationTotal = Math.max(subtotalPrice - effectiveDiscount, 0);
    const effectiveServiceCharge = effectiveRegistrationTotal * SERVICE_CHARGE_RATE;
    const effectiveTotalPrice = effectiveRegistrationTotal + effectiveServiceCharge;
    const useMockPaymentFlow = process.env.NEXT_PUBLIC_PAYMENT_DEV_MODE === "true" || (process.env.NODE_ENV !== "production" && !paymentLink);
    const discountDescription = effectiveCoupon
      ? effectiveCoupon.discountAmount && effectiveCoupon.discountAmount > 0
        ? formatUsd(effectiveCoupon.discountAmount)
        : effectiveCoupon.discountPercent
          ? `${effectiveCoupon.discountPercent}%`
          : formatUsd(effectiveDiscount)
      : "0";
    const notes = [
      formValues.altEmail ? `Alt Email: ${formValues.altEmail}` : "",
      formValues.whatsApp ? `WhatsApp Number: ${formValues.whatsApp}` : "",
      `Participants: ${participants}`,
      `Discount: ${discountDescription}`,
      `Service Charge: ${formatUsd(effectiveServiceCharge)}`,
      `Total Price: ${formatUsd(effectiveTotalPrice)}`,
      couponCode.trim() ? `Coupon: ${couponCode.trim()}` : "",
    ]
      .filter(Boolean)
      .join("\n");

    const { data, error } = await (apiClient as any)
      .from("registration_intents")
      .insert({
        full_name: [formValues.title, formValues.name].filter(Boolean).join(" "),
        email: formValues.email.trim(),
        phone: formValues.phone.trim() || formValues.whatsApp.trim() || "Not provided",
        affiliation: formValues.organization.trim(),
        country: formValues.country === "Other" ? otherCountry.trim() : formValues.country,
        coupon_code: effectiveCoupon?.code || null,
        designation: selectedCategory.label,
        notes,
        plan_key: selectedCategory.key,
        plan_name: selectedCategory.label,
        payment_provider: paymentProvider,
        amount_usd: effectiveTotalPrice,
        currency: "USD",
        payment_status: "pending",
        status: paymentLink ? "payment_pending" : "initiated",
        redirect_url: paymentLink || null,
        redirected_at: paymentLink ? new Date().toISOString() : null,
      })
      .select("id")
      .single();

    if (error || !data) {
      setIsSubmitting(false);
      toast({
        title: "Could not start registration",
        description: error?.message || "Unknown error",
        variant: "destructive",
      });
      return;
    }

    localStorage.setItem(
      PENDING_REGISTRATION_KEY,
      JSON.stringify({
        registrationId: data.id,
        provider: paymentProvider,
        planKey: selectedCategory.key,
        planName: selectedCategory.label,
        email: formValues.email.trim(),
        couponCode: effectiveCoupon?.code,
        createdAt: new Date().toISOString(),
      }),
    );

    toast({
      title: "Registration started",
      description: `Redirecting to ${paymentProvider}.`,
    });

    if (useRazorpayTestLink && paymentLink) {
      window.location.href = paymentLink;
      return;
    }

    if (useMockPaymentFlow) {
      window.location.href = buildMockPaymentRedirectUrl(data.id);
      return;
    }

    if (paymentProvider === "stripe") {
      try {
        const checkoutUrl = await createStripeCheckoutSession(data.id);
        window.location.href = checkoutUrl;
      } catch (checkoutError) {
        setIsSubmitting(false);
        toast({
          title: "Could not open Stripe checkout",
          description: checkoutError instanceof Error ? checkoutError.message : "Please try again.",
          variant: "destructive",
        });
      }
      return;
    }

    if (paymentProvider === "paypal") {
      try {
        const paypalUrl = await createPayPalOrder(data.id);
        window.location.href = paypalUrl;
      } catch (paypalError) {
        setIsSubmitting(false);
        toast({
          title: "Could not open PayPal checkout",
          description: paypalError instanceof Error ? paypalError.message : "Please try again.",
          variant: "destructive",
        });
      }
      return;
    }

    if (paymentLink) {
      window.location.href = appendPaymentParams(paymentLink, {
        registration_id: data.id,
        plan_key: selectedCategory.key,
        provider: paymentProvider,
        email: formValues.email.trim(),
        amount: effectiveTotalPrice.toFixed(2),
      });
      return;
    }

    setIsSubmitting(false);
  };

  return (
    <section className="bg-gradient-to-b from-background via-teal/5 to-background py-12">
      <div className="container mx-auto max-w-6xl px-4">
        <div className="space-y-9">
          <div className="overflow-hidden rounded-md border border-border bg-card shadow-lg shadow-black/5">
            <div className="border-b border-border bg-gradient-to-r from-teal/20 via-gold/10 to-transparent px-5 py-4 md:px-6">
              <p className="text-sm font-extrabold uppercase tracking-wider text-teal">Participant Details</p>
              <h2 className="mt-1 font-display text-3xl font-bold text-card-foreground">Registration</h2>
            </div>

            <div className="grid gap-4 p-5 md:grid-cols-2 md:p-6">
              <div>
                <label className="mb-2 block text-sm font-semibold text-foreground">Title*</label>
                <Select value={formValues.title} onValueChange={(value) => updateFormValue("title", value)}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select" />
                  </SelectTrigger>
                  <SelectContent>
                    {titleOptions.map((title) => (
                      <SelectItem key={title} value={title}>
                        {title}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <label className="mb-2 block text-sm font-semibold text-foreground">Name*</label>
                <Input placeholder="Name" value={formValues.name} onChange={(event) => updateFormValue("name", event.target.value)} />
              </div>
              <div>
                <label className="mb-2 block text-sm font-semibold text-foreground">Email*</label>
                <Input type="email" placeholder="Email" value={formValues.email} onChange={(event) => updateFormValue("email", event.target.value)} />
              </div>
              <div>
                <label className="mb-2 block text-sm font-semibold text-foreground">Phone</label>
                <Input placeholder="Phone" value={formValues.phone} onChange={(event) => updateFormValue("phone", event.target.value)} />
              </div>
              <div>
                <label className="mb-2 block text-sm font-semibold text-foreground">Alt Email</label>
                <Input type="email" placeholder="Email" value={formValues.altEmail} onChange={(event) => updateFormValue("altEmail", event.target.value)} />
              </div>
              <div>
                <label className="mb-2 block text-sm font-semibold text-foreground">WhatsApp Number</label>
                <Input placeholder="WhatsApp Number" value={formValues.whatsApp} onChange={(event) => updateFormValue("whatsApp", event.target.value)} />
              </div>
              <div>
                <label className="mb-2 block text-sm font-semibold text-foreground">Organization*</label>
                <Input placeholder="Organization" value={formValues.organization} onChange={(event) => updateFormValue("organization", event.target.value)} />
              </div>
              <div>
                <label className="mb-2 block text-sm font-semibold text-foreground">Country*</label>
                <Select
                  value={formValues.country}
                  onValueChange={(value) => {
                    updateFormValue("country", value);
                    setCountrySearch("");
                    if (value !== "Other") setOtherCountry("");
                  }}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select" />
                  </SelectTrigger>
                  <SelectContent>
                    <div className="sticky top-0 z-10 bg-popover p-2">
                      <Input
                        autoFocus
                        value={countrySearch}
                        onChange={(event) => setCountrySearch(event.target.value)}
                        onKeyDown={(event) => event.stopPropagation()}
                        placeholder="Search country"
                        aria-label="Search country"
                      />
                    </div>
                    {filteredCountries.map((country) => (
                      <SelectItem key={country} value={country}>
                        {country}
                      </SelectItem>
                    ))}
                    {filteredCountries.length === 0 && (
                      <p className="px-2 py-3 text-sm text-muted-foreground">No countries found.</p>
                    )}
                  </SelectContent>
                </Select>
                {formValues.country === "Other" && (
                  <Input
                    className="mt-2"
                    value={otherCountry}
                    onChange={(event) => setOtherCountry(event.target.value)}
                    placeholder="Enter country name"
                    aria-label="Enter country name"
                    required
                  />
                )}
              </div>
            </div>
          </div>

          <div className="grid items-start gap-5 lg:grid-cols-3">
              {registrationGroups.map((group) => (
                <div
                  key={group.title}
                  className={`overflow-hidden rounded-md border shadow-sm transition-all ${
                    isGroupAvailable(group, today)
                      ? "border-teal/50 bg-card shadow-teal/10"
                      : "border-border bg-muted/30 opacity-60"
                  }`}
                >
                  <div className={isGroupAvailable(group, today) ? "bg-teal px-5 py-4 text-white" : "bg-muted px-5 py-4"}>
                    <h3 className={`font-display text-xl font-bold ${isGroupAvailable(group, today) ? "text-white" : "text-foreground"}`}>{group.title}</h3>
                    <p className={isGroupAvailable(group, today) ? "text-sm font-semibold text-white/80" : "text-sm font-semibold text-muted-foreground"}>{group.date}</p>
                  </div>
                  <div className="divide-y divide-border px-5 py-1">
                    {group.categories.map((category) => {
                      const isAvailable = isGroupAvailable(group, today);

                      return (
                      <label
                        key={category.key}
                        className={`flex items-center justify-between gap-4 py-3 text-sm ${
                          isAvailable ? "cursor-pointer text-foreground hover:text-teal" : "cursor-not-allowed text-muted-foreground"
                        }`}
                      >
                        <span className="flex items-center gap-3">
                          <input
                            type="radio"
                            name="registration-category"
                            checked={selectedCategoryKey === category.key}
                            onChange={() => setSelectedCategoryKey(category.key)}
                            disabled={!isAvailable}
                            className="h-4 w-4 accent-teal"
                          />
                          <span>{category.label}</span>
                        </span>
                        <span className="font-display text-lg font-bold">{formatUsd(category.price)}</span>
                      </label>
                    )})}
                  </div>
                </div>
              ))}
            </div>

            <div className="rounded-md border border-teal/30 bg-gradient-to-br from-teal/15 via-card to-gold/10 p-5 shadow-lg shadow-teal/10 md:p-6">
              <label className="mb-2 block text-sm font-semibold text-foreground">
                No. of Participants ( $ under category )
              </label>
              <Input
                min={1}
                type="number"
                value={participants}
                onChange={(event) => setParticipants(Math.max(Number(event.target.value) || 1, 1))}
              />

              <div className="mt-4 grid gap-3 sm:grid-cols-[1fr_auto]">
                <Input
                  placeholder="Apply Coupon"
                  value={couponCode}
                  onChange={(event) => {
                    setCouponCode(event.target.value);
                    setAppliedCoupon(null);
                  }}
                />
                <Button type="button" variant="outline" onClick={handleApplyCoupon}>
                  Apply Coupon
                </Button>
              </div>
              {appliedCoupon ? (
                <p className="mt-2 text-sm font-medium text-teal">
                  {appliedCoupon.code} applied for {appliedCoupon.discountPercent}% discount.
                </p>
              ) : null}

              <div className="mt-6 rounded-md border border-border bg-card p-4">
                <h3 className="mb-4 font-display text-2xl font-bold text-card-foreground">Registration Summary</h3>
                <div className="mb-5">
                  <label className="mb-2 block text-sm font-semibold text-foreground">Payment Gateway</label>
                  <Select value={paymentProvider} onValueChange={(value) => setPaymentProvider(value as PaymentProvider)}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select payment gateway" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="stripe">Stripe</SelectItem>
                      <SelectItem value="paypal">PayPal</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-3 text-sm text-muted-foreground">
                  <p className="flex justify-between gap-4">
                    <span>A. Registration Price:</span>
                    <span className="font-semibold text-foreground">{formatUsd(registrationPrice)}</span>
                  </p>
                  <p className="flex justify-between gap-4">
                    <span>B. Participants:</span>
                    <span className="font-semibold text-foreground">{participants}</span>
                  </p>
                  <p className="flex justify-between gap-4">
                    <span>C. Discount:</span>
                    <span className="font-semibold text-foreground">-{formatUsd(discount)}</span>
                  </p>
                  <p className="flex justify-between gap-4">
                    <span>D. Total Registration Price:</span>
                    <span className="font-semibold text-foreground">{formatUsd(totalRegistrationPrice)}</span>
                  </p>
                  <p className="flex justify-between gap-4">
                    <span>I. Service Charge:</span>
                    <span className="font-semibold text-foreground">{formatUsd(serviceCharge)}</span>
                  </p>
                  <p className="flex justify-between gap-4 border-t border-border pt-3 text-lg font-bold text-foreground">
                    <span>Total Price:</span>
                    <span>{formatUsd(totalPrice)}</span>
                  </p>
                </div>
              </div>


              <div className="mt-5">
                <CaptchaVerification
                  verified={isCaptchaVerified}
                  onVerifiedChange={setIsCaptchaVerified}
                  resetKey={captchaResetKey}
                />
              </div>

              <div className="mt-4 flex items-start gap-3 rounded-md border border-border bg-muted/30 p-4 text-sm leading-relaxed text-muted-foreground">
                <Checkbox
                  checked={hasAcceptedTerms}
                  onCheckedChange={(checked) => setHasAcceptedTerms(checked === true)}
                  aria-label="Accept Terms & Conditions"
                  className="mt-0.5"
                />
                <span>
                  I have read and agree to the{" "}
                  <button
                    type="button"
                    onClick={() => setIsTermsDialogOpen(true)}
                    className="font-semibold text-blue-600 underline underline-offset-2 hover:text-blue-700"
                  >
                    Terms &amp; Conditions
                  </button>
                  .
                </span>
              </div>

              <Dialog open={isTermsDialogOpen} onOpenChange={setIsTermsDialogOpen}>
                <DialogContent className="max-h-[85vh] max-w-3xl overflow-y-auto">
                  <DialogHeader>
                    <DialogTitle>Terms &amp; Conditions</DialogTitle>
                    <DialogDescription>Please review the conference policies before continuing with registration.</DialogDescription>
                  </DialogHeader>
                  <div className="space-y-5 text-sm leading-relaxed text-muted-foreground">
                    <section className="space-y-2"><h3 className="font-semibold text-foreground">Important Note</h3><p>If the virtual conference is postponed due to unavoidable circumstances beyond the organizers&apos; control, including technical disruptions, force majeure events, government restrictions, cyber incidents, or other emergency situations, refunds will not be applicable. In such cases, registrations will remain valid for the rescheduled event or future conference edition.</p></section>
                    <section className="space-y-2"><h3 className="font-semibold text-foreground">Terms &amp; Conditions</h3><p>By registering for the virtual conference, participants agree to all conference terms and policies.</p><p>The organizers reserve the right to modify the conference program, speakers, schedule, or virtual platform if necessary.</p><p>Participants are responsible for ensuring stable internet connectivity and access to the required virtual meeting platform.</p><p>Conference access links and participation details will be shared with registered participants before the event.</p><p>Recording, redistribution, or unauthorized sharing of conference materials or access links is strictly prohibited.</p><p>In unavoidable circumstances, the conference may be postponed or rescheduled without prior notice.</p><p>If the conference is postponed, registrations will remain valid for the rescheduled event or future edition.</p><p>Participants are advised to regularly check the official conference website and registered email for updates and announcements.</p></section>
                    <section className="space-y-2"><h3 className="font-semibold text-foreground">Refund &amp; Cancellation Policy</h3><p>All cancellation requests must be submitted in writing via email to the Conference Secretariat.</p><p>Cancellation before 50 days of the conference: 50% refund</p><p>Cancellation before 40 days of the conference: 30% refund</p><p>Cancellation within 30 days of the conference: No refund</p><p>Registration may be transferred to another participant if the registered attendee is unable to participate.</p><p>Eligible refunds will be processed within 4 weeks after the completion of the conference.</p></section>
                    <section className="space-y-2"><h3 className="font-semibold text-foreground">Registration Includes</h3><h4 className="font-semibold text-foreground">For Virtual Speakers &amp; Participants</h4><p>Present your research from anywhere (home or workplace)</p><p>Access to all live/recorded conference sessions</p><p>E-copy of the Abstract Book and Program</p><p>E-Certificate of Participation/Presentation</p><p>Publication of accepted papers in Conference Proceedings (with ISBN/e-ISBN)</p></section>
                  </div>
                  <DialogFooter>
                    <Button type="button" variant="outline" onClick={() => { setHasAcceptedTerms(false); setIsTermsDialogOpen(false); }}>Deny</Button>
                    <Button type="button" className="bg-teal text-white hover:bg-teal/85" onClick={() => { setHasAcceptedTerms(true); setIsTermsDialogOpen(false); }}>Agree</Button>
                  </DialogFooter>
                </DialogContent>
              </Dialog>

              <p className="mt-6 text-xs leading-relaxed text-muted-foreground">
                By clicking "Proceed to Register", you agree to the privacy policy, terms & conditions and cancellation
                policy.
              </p>

              <div className="mt-5 flex flex-col gap-3 sm:flex-row">
                <Button type="button" variant="outline" onClick={handleReset} className="flex-1">
                  reset
                </Button>
                <Button
                  type="button"
                  onClick={handleProceed}
                  disabled={isSubmitting || !isCaptchaVerified || !hasAcceptedTerms}
                  className="flex-1 bg-teal text-white hover:bg-teal/85"
                >
                  proceed to register
                </Button>
              </div>
            </div>
          </div>
      </div>
    </section>
  );
};

export default PricingSection;
