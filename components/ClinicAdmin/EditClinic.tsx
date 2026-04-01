"use client";

import React, { useEffect, useMemo, useState } from "react";
import Cookies from "js-cookie";
import { jwtDecode } from "jwt-decode";
import styles from "@/styles/clinicdashboard/editprofile.module.css";
import { API_URL } from "@/config/api";

type Doctor = {
  name: string;
  regNo: string;
  specialization: string;
};

type ClinicCategory = {
  _id: string;
  name: string;
};

type ClinicRecord = {
  _id: string;
  cuc?: string;
  slug?: string;
  clinicName?: string;
  clinicType?: string;
  ownerName?: string;
  website?: string;
  dermaCategory?: ClinicCategory | string;
  clinicLogo?: string;
  bannerImage?: string;
  specialOffers?: string[];
  rateCard?: string[];
  photos?: string[];
  video?: string;
  certifications?: string[];
  doctors?: Doctor[];
  address?: string;
  city?: string;
  services?: string;
  sector?: string;
  pincode?: string;
  mapLink?: string;
  contactNumber?: string;
  whatsapp?: string;
  email?: string;
  workingHours?: string;
  licenseNo?: string;
  experience?: string;
  treatmentsAvailable?: string;
  availableServices?: string;
  consultationFee?: string;
  bookingMode?: string;
  clinicDescription?: string;
  instagram?: string;
  linkedin?: string;
  facebook?: string;
  standardPlanLink?: string;
  clinicStatus?: string;
};

interface EditClinicProps {
  clinicId?: string;
  clinic?: any;
  onSaved?: (clinic: any) => void;
}

type JwtPayload = {
  id: string;
  role: string;
  exp: number;
};

const emptyDoctor: Doctor = {
  name: "",
  regNo: "",
  specialization: "",
};

const emptyForm = {
  cuc: "",
  slug: "",
  clinicName: "",
  clinicType: "",
  ownerName: "",
  website: "",
  dermaCategory: "",
  clinicLogo: "",
  bannerImage: "",
  specialOffers: "",
  rateCard: "",
  photos: "",
  video: "",
  certifications: "",
  address: "",
  city: "",
  services: "",
  sector: "",
  pincode: "",
  mapLink: "",
  contactNumber: "",
  whatsapp: "",
  email: "",
  workingHours: "",
  licenseNo: "",
  experience: "",
  treatmentsAvailable: "",
  availableServices: "",
  consultationFee: "",
  bookingMode: "",
  clinicDescription: "",
  instagram: "",
  linkedin: "",
  facebook: "",
  standardPlanLink: "",
  clinicStatus: "Open",
};

const resolveMediaUrl = (value?: string) => {
  if (!value) return "";
  if (/^https?:\/\//i.test(value)) return value;
  if (value.startsWith("data:")) return value;
  return value.startsWith("/")
    ? `${API_URL.replace(/\/api$/, "")}${value}`
    : value;
};

const toTextareaValue = (value?: string[] | string | null) => {
  if (Array.isArray(value)) return value.join("\n");
  if (typeof value === "string") return value;
  return "";
};

const parseDoctors = (value: unknown): Doctor[] => {
  if (Array.isArray(value)) {
    return value
      .map((item) => ({
        name: String((item as any)?.name ?? "").trim(),
        regNo: String((item as any)?.regNo ?? "").trim(),
        specialization: String((item as any)?.specialization ?? "").trim(),
      }))
      .filter((item) => item.name && item.regNo && item.specialization);
  }

  if (typeof value !== "string" || !value.trim()) return [];

  try {
    const parsed = JSON.parse(value);
    return parseDoctors(parsed);
  } catch {
    return [];
  }
};

const getCategoryId = (category?: ClinicCategory | string) => {
  if (!category) return "";
  if (typeof category === "string") return category;
  return category._id || "";
};

export default function EditClinic({
  clinicId,
  clinic,
  onSaved,
}: EditClinicProps) {
  const [categories, setCategories] = useState<ClinicCategory[]>([]);
  const [form, setForm] = useState(emptyForm);
  const [doctors, setDoctors] = useState<Doctor[]>([emptyDoctor]);
  const [logoFile, setLogoFile] = useState<File | null>(null);
  const [bannerFile, setBannerFile] = useState<File | null>(null);
  const [specialOfferFiles, setSpecialOfferFiles] = useState<File[]>([]);
  const [rateCardFiles, setRateCardFiles] = useState<File[]>([]);
  const [photoFiles, setPhotoFiles] = useState<File[]>([]);
  const [certificationFiles, setCertificationFiles] = useState<File[]>([]);
  const [logoPreview, setLogoPreview] = useState("");
  const [bannerPreview, setBannerPreview] = useState("");
  const [specialOfferPreview, setSpecialOfferPreview] = useState<string[]>([]);
  const [rateCardPreview, setRateCardPreview] = useState<string[]>([]);
  const [photoPreview, setPhotoPreview] = useState<string[]>([]);
  const [certificationPreview, setCertificationPreview] = useState<string[]>([]);
  const [saving, setSaving] = useState(false);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState("");

  const decodedClinicId = useMemo(() => {
    if (clinicId) return clinicId;

    const token = Cookies.get("token");
    if (!token) return "";

    try {
      const decoded = jwtDecode<JwtPayload>(token);
      return decoded?.id || "";
    } catch {
      return "";
    }
  }, [clinicId]);

  useEffect(() => {
    const fetchCategories = async () => {
      try {
        const res = await fetch(`${API_URL}/clinic-categories`);
        const data = await res.json();
        if (Array.isArray(data)) setCategories(data);
      } catch (error) {
        console.error("Failed to fetch clinic categories:", error);
      }
    };

    fetchCategories();
  }, []);

  useEffect(() => {
    const hydrate = (data: ClinicRecord | null) => {
      if (!data) return;

      setForm({
        cuc: data.cuc || "",
        slug: data.slug || "",
        clinicName: data.clinicName || "",
        clinicType: data.clinicType || "",
        ownerName: data.ownerName || "",
        website: data.website || "",
        dermaCategory: getCategoryId(data.dermaCategory),
        clinicLogo: data.clinicLogo || "",
        bannerImage: data.bannerImage || "",
        specialOffers: toTextareaValue(data.specialOffers),
        rateCard: toTextareaValue(data.rateCard),
        photos: toTextareaValue(data.photos),
        video: data.video || "",
        certifications: toTextareaValue(data.certifications),
        address: data.address || "",
        city: data.city || "",
        services: data.services || "",
        sector: data.sector || "",
        pincode: data.pincode || "",
        mapLink: data.mapLink || "",
        contactNumber: data.contactNumber || "",
        whatsapp: data.whatsapp || "",
        email: data.email || "",
        workingHours: data.workingHours || "",
        licenseNo: data.licenseNo || "",
        experience: data.experience || "",
        treatmentsAvailable: data.treatmentsAvailable || "",
        availableServices: data.availableServices || "",
        consultationFee: data.consultationFee || "",
        bookingMode: data.bookingMode || "",
        clinicDescription: data.clinicDescription || "",
        instagram: data.instagram || "",
        linkedin: data.linkedin || "",
        facebook: data.facebook || "",
        standardPlanLink: data.standardPlanLink || "",
        clinicStatus: data.clinicStatus || "Open",
      });

      setDoctors(
        data.doctors && data.doctors.length > 0
          ? data.doctors.map((doctor) => ({
              name: doctor.name || "",
              regNo: doctor.regNo || "",
              specialization: doctor.specialization || "",
            }))
          : [emptyDoctor]
      );

      setLogoPreview(resolveMediaUrl(data.clinicLogo));
      setBannerPreview(resolveMediaUrl(data.bannerImage));
      setSpecialOfferPreview((data.specialOffers || []).map((item) => resolveMediaUrl(item)));
      setRateCardPreview((data.rateCard || []).map((item) => resolveMediaUrl(item)));
      setPhotoPreview((data.photos || []).map((item) => resolveMediaUrl(item)));
      setCertificationPreview((data.certifications || []).map((item) => resolveMediaUrl(item)));
      setLogoFile(null);
      setBannerFile(null);
      setSpecialOfferFiles([]);
      setRateCardFiles([]);
      setPhotoFiles([]);
      setCertificationFiles([]);
      setMessage("");
      setLoading(false);
    };

    if (clinic) {
      hydrate(clinic);
      return;
    }

    const loadClinic = async () => {
      if (!decodedClinicId) {
        setLoading(false);
        return;
      }

      try {
        const res = await fetch(`${API_URL}/clinics/${decodedClinicId}`);
        if (!res.ok) throw new Error("Failed to fetch clinic profile");
        const data = await res.json();
        hydrate(data);
      } catch (error) {
        console.error("Error fetching clinic:", error);
        setMessage("Failed to load clinic profile");
        setLoading(false);
      }
    };

    loadClinic();
  }, [clinic, decodedClinicId]);

  const handleTextChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
  ) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  const handleDoctorChange = (
    index: number,
    field: keyof Doctor,
    value: string
  ) => {
    setDoctors((prev) =>
      prev.map((doctor, doctorIndex) =>
        doctorIndex === index ? { ...doctor, [field]: value } : doctor
      )
    );
  };

  const addDoctor = () => {
    setDoctors((prev) => [...prev, { ...emptyDoctor }]);
  };

  const removeDoctor = (index: number) => {
    setDoctors((prev) => {
      const next = prev.filter((_, doctorIndex) => doctorIndex !== index);
      return next.length > 0 ? next : [{ ...emptyDoctor }];
    });
  };

  const handleSingleFilePreview =
    (setter: React.Dispatch<React.SetStateAction<File | null>>, previewSetter: React.Dispatch<React.SetStateAction<string>>) =>
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0] || null;
      setter(file);
      previewSetter(file ? URL.createObjectURL(file) : "");
    };

  const handleMultiFilePreview =
    (setter: React.Dispatch<React.SetStateAction<File[]>>, previewSetter: React.Dispatch<React.SetStateAction<string[]>>) =>
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const files = Array.from(e.target.files || []);
      setter(files);
      previewSetter(files.map((file) => URL.createObjectURL(file)));
    };

  const logoInputChange = handleSingleFilePreview(setLogoFile, setLogoPreview);
  const bannerInputChange = handleSingleFilePreview(setBannerFile, setBannerPreview);
  const specialOffersInputChange = handleMultiFilePreview(
    setSpecialOfferFiles,
    setSpecialOfferPreview
  );
  const rateCardInputChange = handleMultiFilePreview(setRateCardFiles, setRateCardPreview);
  const photosInputChange = handleMultiFilePreview(setPhotoFiles, setPhotoPreview);
  const certificationsInputChange = handleMultiFilePreview(
    setCertificationFiles,
    setCertificationPreview
  );

  const appendValue = (formData: FormData, key: string, value: unknown) => {
    if (value === undefined || value === null) return;
    formData.append(key, String(value));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!decodedClinicId) {
      setMessage("Clinic session expired. Please login again.");
      return;
    }

    if (!form.clinicName.trim() || !form.dermaCategory || !form.address.trim() || !form.email.trim()) {
      setMessage("Clinic name, category, address and email are required.");
      return;
    }

    setSaving(true);
    setMessage("");

    try {
      const formData = new FormData();

      appendValue(formData, "cuc", form.cuc);
      appendValue(formData, "slug", form.slug);
      appendValue(formData, "clinicName", form.clinicName.trim());
      appendValue(formData, "clinicType", form.clinicType);
      appendValue(formData, "ownerName", form.ownerName);
      appendValue(formData, "website", form.website);
      appendValue(formData, "dermaCategory", form.dermaCategory);
      appendValue(formData, "address", form.address.trim());
      appendValue(formData, "city", form.city);
      appendValue(formData, "services", form.services);
      appendValue(formData, "sector", form.sector);
      appendValue(formData, "pincode", form.pincode);
      appendValue(formData, "mapLink", form.mapLink);
      appendValue(formData, "contactNumber", form.contactNumber);
      appendValue(formData, "whatsapp", form.whatsapp);
      appendValue(formData, "email", form.email.trim());
      appendValue(formData, "workingHours", form.workingHours);
      appendValue(formData, "licenseNo", form.licenseNo);
      appendValue(formData, "experience", form.experience);
      appendValue(formData, "treatmentsAvailable", form.treatmentsAvailable);
      appendValue(formData, "availableServices", form.availableServices);
      appendValue(formData, "consultationFee", form.consultationFee);
      appendValue(formData, "bookingMode", form.bookingMode);
      appendValue(formData, "clinicDescription", form.clinicDescription);
      appendValue(formData, "instagram", form.instagram);
      appendValue(formData, "linkedin", form.linkedin);
      appendValue(formData, "facebook", form.facebook);
      appendValue(formData, "standardPlanLink", form.standardPlanLink);
      appendValue(formData, "clinicStatus", form.clinicStatus);
      appendValue(formData, "video", form.video);

      if (logoFile) formData.append("clinicLogo", logoFile);
      if (bannerFile) formData.append("bannerImage", bannerFile);
      specialOfferFiles.forEach((file) => formData.append("specialOffers", file));
      rateCardFiles.forEach((file) => formData.append("rateCard", file));
      photoFiles.forEach((file) => formData.append("photos", file));
      certificationFiles.forEach((file) => formData.append("certifications", file));
      formData.append("doctors", JSON.stringify(parseDoctors(doctors)));

      const res = await fetch(`${API_URL}/clinics/${decodedClinicId}`, {
        method: "PUT",
        body: formData,
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data?.message || "Failed to update clinic");
      }

      setMessage("Clinic profile updated successfully.");
      const updatedClinic = data || {};
      onSaved?.(updatedClinic);
      setLogoFile(null);
      setBannerFile(null);
      if (updatedClinic?.clinicLogo) setLogoPreview(resolveMediaUrl(updatedClinic.clinicLogo));
      if (updatedClinic?.bannerImage) setBannerPreview(resolveMediaUrl(updatedClinic.bannerImage));
    } catch (error: any) {
      console.error("Update failed:", error);
      setMessage(error?.message || "Failed to update clinic");
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return <div className={styles.loadingState}>Loading clinic profile...</div>;
  }

  return (
    <form className={styles.form} onSubmit={handleSubmit}>
      {message && <div className={styles.message}>{message}</div>}

      <section className={styles.section}>
        <div className={styles.sectionHeader}>
          <div>
            <p className={styles.sectionKicker}>Identity</p>
            <h3 className={styles.sectionTitle}>Clinic Identity</h3>
          </div>
        </div>

        <div className={styles.grid}>
          <div className={styles.field}>
            <label>CUC</label>
            <input name="cuc" value={form.cuc} disabled className={styles.readOnly} />
          </div>

          <div className={styles.field}>
            <label>Slug</label>
            <input name="slug" value={form.slug} disabled className={styles.readOnly} />
          </div>

          <div className={styles.field}>
            <label>Clinic Name</label>
            <input name="clinicName" value={form.clinicName} onChange={handleTextChange} />
          </div>

          <div className={styles.field}>
            <label>Clinic Type</label>
            <input name="clinicType" value={form.clinicType} onChange={handleTextChange} />
          </div>

          <div className={styles.field}>
            <label>Owner Name</label>
            <input name="ownerName" value={form.ownerName} onChange={handleTextChange} />
          </div>

          <div className={styles.field}>
            <label>Website</label>
            <input name="website" value={form.website} onChange={handleTextChange} />
          </div>

          <div className={styles.field}>
            <label>Category</label>
            <select name="dermaCategory" value={form.dermaCategory} onChange={handleTextChange} required>
              <option value="">Select category</option>
              {categories.map((category) => (
                <option key={category._id} value={category._id}>
                  {category.name}
                </option>
              ))}
            </select>
          </div>

          <div className={styles.field}>
            <label>Status</label>
            <select name="clinicStatus" value={form.clinicStatus} onChange={handleTextChange}>
              <option value="Open">Open</option>
              <option value="Closed">Closed</option>
              <option value="Paused">Paused</option>
            </select>
          </div>
        </div>
      </section>

      <section className={styles.section}>
        <div className={styles.sectionHeader}>
          <div>
            <p className={styles.sectionKicker}>Contact</p>
            <h3 className={styles.sectionTitle}>Location & Contact</h3>
          </div>
        </div>

        <div className={styles.grid}>
          <div className={styles.field}>
            <label>Contact Number</label>
            <input
              name="contactNumber"
              value={form.contactNumber}
              onChange={handleTextChange}
            />
          </div>

          <div className={styles.field}>
            <label>WhatsApp Number</label>
            <input name="whatsapp" value={form.whatsapp} onChange={handleTextChange} />
          </div>

          <div className={styles.field}>
            <label>Email</label>
            <input name="email" type="email" value={form.email} onChange={handleTextChange} />
          </div>

          <div className={styles.field}>
            <label>Working Hours</label>
            <input name="workingHours" value={form.workingHours} onChange={handleTextChange} />
          </div>

          <div className={styles.field}>
            <label>Address</label>
            <textarea name="address" value={form.address} onChange={handleTextChange} rows={3} />
          </div>

          <div className={styles.field}>
            <label>City</label>
            <input name="city" value={form.city} onChange={handleTextChange} />
          </div>

          <div className={styles.field}>
            <label>Sector</label>
            <input name="sector" value={form.sector} onChange={handleTextChange} />
          </div>

          <div className={styles.field}>
            <label>Pin Code</label>
            <input name="pincode" value={form.pincode} onChange={handleTextChange} />
          </div>

          <div className={styles.field}>
            <label>Google Map Link</label>
            <input name="mapLink" value={form.mapLink} onChange={handleTextChange} />
          </div>

          <div className={styles.field}>
            <label>Services</label>
            <input name="services" value={form.services} onChange={handleTextChange} />
          </div>
        </div>
      </section>

      <section className={styles.section}>
        <div className={styles.sectionHeader}>
          <div>
            <p className={styles.sectionKicker}>Branding</p>
            <h3 className={styles.sectionTitle}>Branding & Media</h3>
          </div>
        </div>

        <div className={styles.grid}>
          <div className={styles.field}>
            <label>Clinic Logo</label>
            <input type="file" accept="image/*" onChange={logoInputChange} />
            <p className={styles.helperText}>Choose or upload an image.</p>
            {logoPreview && (
              <img src={logoPreview} alt="Clinic logo preview" className={styles.previewImage} />
            )}
          </div>

          <div className={styles.field}>
            <label>Banner Image</label>
            <input type="file" accept="image/*" onChange={bannerInputChange} />
            <p className={styles.helperText}>Choose or upload an image.</p>
            {bannerPreview && (
              <img src={bannerPreview} alt="Banner preview" className={styles.previewImage} />
            )}
          </div>

          <div className={styles.field}>
            <label>Special Offers</label>
            <input
              type="file"
              accept="image/*"
              multiple
              onChange={specialOffersInputChange}
            />
            <p className={styles.helperText}>Choose or upload images for special offers.</p>
            {!!specialOfferPreview.length && (
              <div className={styles.previewStrip}>
                {specialOfferPreview.map((src, index) => (
                  <img key={index} src={src} alt={`Special offer ${index + 1}`} className={styles.previewThumb} />
                ))}
              </div>
            )}
          </div>

          <div className={styles.field}>
            <label>Rate Card</label>
            <input type="file" accept="image/*" multiple onChange={rateCardInputChange} />
            <p className={styles.helperText}>Choose or upload rate card images.</p>
            {!!rateCardPreview.length && (
              <div className={styles.previewStrip}>
                {rateCardPreview.map((src, index) => (
                  <img key={index} src={src} alt={`Rate card ${index + 1}`} className={styles.previewThumb} />
                ))}
              </div>
            )}
          </div>

          <div className={styles.field}>
            <label>Photos</label>
            <input type="file" accept="image/*" multiple onChange={photosInputChange} />
            <p className={styles.helperText}>Choose or upload clinic photos.</p>
            {!!photoPreview.length && (
              <div className={styles.previewStrip}>
                {photoPreview.map((src, index) => (
                  <img key={index} src={src} alt={`Photo ${index + 1}`} className={styles.previewThumb} />
                ))}
              </div>
            )}
          </div>

          <div className={styles.field}>
            <label>Video</label>
            <input name="video" value={form.video} onChange={handleTextChange} />
            <p className={styles.helperText}>Video should be a URL only.</p>
          </div>

          <div className={styles.field}>
            <label>Certifications</label>
            <input
              type="file"
              accept="image/*"
              multiple
              onChange={certificationsInputChange}
            />
            <p className={styles.helperText}>Choose or upload certification images.</p>
            {!!certificationPreview.length && (
              <div className={styles.previewStrip}>
                {certificationPreview.map((src, index) => (
                  <img key={index} src={src} alt={`Certification ${index + 1}`} className={styles.previewThumb} />
                ))}
              </div>
            )}
          </div>
        </div>
      </section>

      <section className={styles.section}>
        <div className={styles.sectionHeader}>
          <div>
            <p className={styles.sectionKicker}>Doctors</p>
            <h3 className={styles.sectionTitle}>Doctors & Expertise</h3>
          </div>
          <button type="button" className={styles.secondaryBtn} onClick={addDoctor}>
            + Add Doctor
          </button>
        </div>

        <div className={styles.stack}>
          {doctors.map((doctor, index) => (
            <div key={`${doctor.name}-${index}`} className={styles.doctorCard}>
              <div className={styles.grid}>
                <div className={styles.field}>
                  <label>Doctor Name</label>
                  <input
                    value={doctor.name}
                    onChange={(e) => handleDoctorChange(index, "name", e.target.value)}
                  />
                </div>
                <div className={styles.field}>
                  <label>Registration No</label>
                  <input
                    value={doctor.regNo}
                    onChange={(e) => handleDoctorChange(index, "regNo", e.target.value)}
                  />
                </div>
                <div className={styles.field}>
                  <label>Specialization</label>
                  <input
                    value={doctor.specialization}
                    onChange={(e) =>
                      handleDoctorChange(index, "specialization", e.target.value)
                    }
                  />
                </div>
              </div>

              <div className={styles.rowActions}>
                <button
                  type="button"
                  className={styles.secondaryBtn}
                  onClick={() => removeDoctor(index)}
                >
                  Remove
                </button>
              </div>
            </div>
          ))}
        </div>
      </section>

      <section className={styles.section}>
        <div className={styles.sectionHeader}>
          <div>
            <p className={styles.sectionKicker}>Operations</p>
            <h3 className={styles.sectionTitle}>Operations & Legal</h3>
          </div>
        </div>

        <div className={styles.grid}>
          <div className={styles.field}>
            <label>License No</label>
            <input name="licenseNo" value={form.licenseNo} onChange={handleTextChange} />
          </div>
          <div className={styles.field}>
            <label>Experience</label>
            <input name="experience" value={form.experience} onChange={handleTextChange} />
          </div>
          <div className={styles.field}>
            <label>Consultation Fee</label>
            <input
              name="consultationFee"
              value={form.consultationFee}
              onChange={handleTextChange}
            />
          </div>
          <div className={styles.field}>
            <label>Booking Mode</label>
            <input name="bookingMode" value={form.bookingMode} onChange={handleTextChange} />
          </div>
        </div>
      </section>

      <section className={styles.section}>
        <div className={styles.sectionHeader}>
          <div>
            <p className={styles.sectionKicker}>Content</p>
            <h3 className={styles.sectionTitle}>Services & Description</h3>
          </div>
        </div>

        <div className={styles.grid}>
          <div className={styles.field}>
            <label>Treatments Available</label>
            <textarea
              name="treatmentsAvailable"
              value={form.treatmentsAvailable}
              onChange={handleTextChange}
              rows={4}
            />
          </div>

          <div className={styles.field}>
            <label>Available Services</label>
            <textarea
              name="availableServices"
              value={form.availableServices}
              onChange={handleTextChange}
              rows={4}
            />
          </div>

          <div className={styles.field}>
            <label>Clinic Description</label>
            <textarea
              name="clinicDescription"
              value={form.clinicDescription}
              onChange={handleTextChange}
              rows={4}
            />
          </div>
        </div>
      </section>

      <section className={styles.section}>
        <div className={styles.sectionHeader}>
          <div>
            <p className={styles.sectionKicker}>Social</p>
            <h3 className={styles.sectionTitle}>Social Presence</h3>
          </div>
        </div>

        <div className={styles.grid}>
          <div className={styles.field}>
            <label>Instagram</label>
            <input name="instagram" value={form.instagram} onChange={handleTextChange} />
          </div>
          <div className={styles.field}>
            <label>LinkedIn</label>
            <input name="linkedin" value={form.linkedin} onChange={handleTextChange} />
          </div>
          <div className={styles.field}>
            <label>Facebook</label>
            <input name="facebook" value={form.facebook} onChange={handleTextChange} />
          </div>
          <div className={styles.field}>
            <label>Standard Plan Link</label>
            <input
              name="standardPlanLink"
              value={form.standardPlanLink}
              onChange={handleTextChange}
            />
          </div>
        </div>
      </section>

      <div className={styles.actions}>
        <button type="submit" className={styles.primaryBtn} disabled={saving}>
          {saving ? "Saving..." : "Save Changes"}
        </button>
      </div>
    </form>
  );
}
