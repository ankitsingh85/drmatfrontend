"use client";

import React, { useEffect, useState } from "react";
import axios from "axios";
import { API_URL } from "@/config/api";
import styles from "@/styles/Dashboard/prescriptionModal.module.css";

type Medicine = {
  name: string;
  composition: string;
  dosage: string;
  duration: string;
};

const emptyMedicine = (): Medicine => ({
  name: "",
  composition: "",
  dosage: "",
  duration: "",
});

type PrescriptionModalProps = {
  doctorId: string;
  chatId: string;
  patientId: string;
  patientName: string;
  patientContactNo?: string;
  onClose: () => void;
  onSent: (message: any) => void;
};

const PrescriptionModal: React.FC<PrescriptionModalProps> = ({
  doctorId,
  chatId,
  patientId,
  patientName,
  patientContactNo,
  onClose,
  onSent,
}) => {
  const [doctorName, setDoctorName] = useState("");
  const [qualification, setQualification] = useState("");
  const [registrationNo, setRegistrationNo] = useState("");
  const [doctorEmail, setDoctorEmail] = useState("");
  const [clinicName, setClinicName] = useState("");
  const [clinicAddress, setClinicAddress] = useState("");

  const [patientAge, setPatientAge] = useState("");
  const [patientSex, setPatientSex] = useState("");
  const [contactNo, setContactNo] = useState(patientContactNo || "");

  const [symptoms, setSymptoms] = useState("");
  const [diagnosis, setDiagnosis] = useState("");
  const [labTests, setLabTests] = useState("");
  const [medicines, setMedicines] = useState<Medicine[]>([emptyMedicine()]);
  const [generalInstructions, setGeneralInstructions] = useState("");
  const [nextAppointment, setNextAppointment] = useState("");

  const [loadingDoctor, setLoadingDoctor] = useState(true);
  const [sending, setSending] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    const fetchDoctor = async () => {
      try {
        const res = await axios.get(`${API_URL}/doctors/${doctorId}`);
        const data = res.data || {};
        setDoctorName(data.name || "");
        setQualification(data.qualification || "");
        setRegistrationNo(data.registrationNo || "");
        setDoctorEmail(data.email || "");
        setClinicName(data.clinicName || "");
        setClinicAddress(data.clinicAddress || "");
      } catch {
        setError("Could not load your doctor profile. You can still fill the details manually.");
      } finally {
        setLoadingDoctor(false);
      }
    };

    fetchDoctor();
  }, [doctorId]);

  const updateMedicine = (index: number, field: keyof Medicine, value: string) => {
    setMedicines((prev) =>
      prev.map((med, i) => (i === index ? { ...med, [field]: value } : med))
    );
  };

  const addMedicine = () => setMedicines((prev) => [...prev, emptyMedicine()]);

  const removeMedicine = (index: number) =>
    setMedicines((prev) => prev.filter((_, i) => i !== index));

  const handleSend = async () => {
    if (!doctorName.trim()) {
      setError("Doctor name is required.");
      return;
    }

    const validMedicines = medicines
      .filter((med) => med.name.trim())
      .map((med) => ({
        name: med.name.trim(),
        composition: med.composition.trim() || undefined,
        dosage: med.dosage.trim() || undefined,
        duration: med.duration.trim() || undefined,
      }));

    try {
      setSending(true);
      setError("");

      const res = await axios.post(`${API_URL}/message/send-prescription`, {
        chatId,
        senderId: doctorId,
        receiverId: patientId,
        doctor: {
          name: doctorName.trim(),
          qualification: qualification.trim() || undefined,
          registrationNo: registrationNo.trim() || undefined,
          email: doctorEmail.trim() || undefined,
          clinicName: clinicName.trim() || undefined,
          clinicAddress: clinicAddress.trim() || undefined,
        },
        patient: {
          name: patientName,
          age: patientAge.trim() || undefined,
          sex: patientSex || undefined,
          contactNo: contactNo.trim() || undefined,
        },
        symptoms: symptoms.trim() || undefined,
        diagnosis: diagnosis.trim() || undefined,
        labTests: labTests.trim() || undefined,
        medicines: validMedicines,
        generalInstructions: generalInstructions.trim() || undefined,
        nextAppointment: nextAppointment.trim() || undefined,
      });

      onSent(res.data);
      onClose();
    } catch (err: any) {
      setError(err?.response?.data?.error || "Could not send the prescription. Please try again.");
    } finally {
      setSending(false);
    }
  };

  return (
    <div className={styles.overlay} onClick={onClose}>
      <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
        <div className={styles.header}>
          <div>
            <h3>Send Prescription</h3>
            <p>
              {loadingDoctor ? "Loading your profile..." : `To ${patientName}`}
            </p>
          </div>
          <button type="button" className={styles.closeBtn} onClick={onClose}>
            ×
          </button>
        </div>

        <p className={styles.sectionTitle}>Doctor Details</p>
        <div className={styles.grid}>
          <label className={styles.field}>
            Doctor Name
            <input value={doctorName} onChange={(e) => setDoctorName(e.target.value)} />
          </label>
          <label className={styles.field}>
            Qualification
            <input
              value={qualification}
              onChange={(e) => setQualification(e.target.value)}
              placeholder="e.g. MBBS"
            />
          </label>
          <label className={styles.field}>
            Registration No.
            <input value={registrationNo} onChange={(e) => setRegistrationNo(e.target.value)} />
          </label>
          <label className={styles.field}>
            Email
            <input value={doctorEmail} onChange={(e) => setDoctorEmail(e.target.value)} />
          </label>
          <label className={styles.field}>
            Clinic Name
            <input value={clinicName} onChange={(e) => setClinicName(e.target.value)} />
          </label>
          <label className={styles.field}>
            Clinic Address
            <input value={clinicAddress} onChange={(e) => setClinicAddress(e.target.value)} />
          </label>
        </div>

        <p className={styles.sectionTitle}>Patient Details</p>
        <div className={styles.grid}>
          <label className={styles.field}>
            Patient Name
            <input value={patientName} disabled />
          </label>
          <label className={styles.field}>
            Contact No.
            <input value={contactNo} onChange={(e) => setContactNo(e.target.value)} />
          </label>
          <label className={styles.field}>
            Patient Age
            <input value={patientAge} onChange={(e) => setPatientAge(e.target.value)} placeholder="e.g. 30 yrs" />
          </label>
          <label className={styles.field}>
            Patient Sex
            <select value={patientSex} onChange={(e) => setPatientSex(e.target.value)}>
              <option value="">Select</option>
              <option value="Male">Male</option>
              <option value="Female">Female</option>
              <option value="Other">Other</option>
            </select>
          </label>
        </div>

        <p className={styles.sectionTitle}>Consultation</p>
        <div className={styles.grid}>
          <label className={`${styles.field} ${styles.full}`}>
            Symptoms
            <textarea value={symptoms} onChange={(e) => setSymptoms(e.target.value)} />
          </label>
          <label className={`${styles.field} ${styles.full}`}>
            Provisional Diagnosis
            <textarea value={diagnosis} onChange={(e) => setDiagnosis(e.target.value)} />
          </label>
          <label className={`${styles.field} ${styles.full}`}>
            Lab Tests
            <textarea
              value={labTests}
              onChange={(e) => setLabTests(e.target.value)}
              placeholder="Leave blank if no tests prescribed"
            />
          </label>
        </div>

        <p className={styles.sectionTitle}>Medicines &amp; Treatment Plan</p>
        {medicines.map((med, index) => (
          <div key={index} className={styles.medicineRow}>
            {medicines.length > 1 && (
              <button
                type="button"
                className={styles.removeMedicineBtn}
                onClick={() => removeMedicine(index)}
              >
                ×
              </button>
            )}
            <label className={styles.field}>
              Medicine Name
              <input
                value={med.name}
                onChange={(e) => updateMedicine(index, "name", e.target.value)}
              />
            </label>
            <label className={styles.field}>
              Composition
              <input
                value={med.composition}
                onChange={(e) => updateMedicine(index, "composition", e.target.value)}
              />
            </label>
            <label className={styles.field}>
              Dosage
              <input
                value={med.dosage}
                onChange={(e) => updateMedicine(index, "dosage", e.target.value)}
                placeholder="e.g. Morning-1, Night-1"
              />
            </label>
            <label className={styles.field}>
              Duration
              <input
                value={med.duration}
                onChange={(e) => updateMedicine(index, "duration", e.target.value)}
                placeholder="e.g. Daily for 5 days"
              />
            </label>
          </div>
        ))}
        <button type="button" className={styles.addMedicineBtn} onClick={addMedicine}>
          + Add Medicine
        </button>

        <p className={styles.sectionTitle}>Additional Notes</p>
        <div className={styles.grid}>
          <label className={`${styles.field} ${styles.full}`}>
            General Instructions
            <textarea
              value={generalInstructions}
              onChange={(e) => setGeneralInstructions(e.target.value)}
            />
          </label>
          <label className={`${styles.field} ${styles.full}`}>
            Next Appointment
            <input
              value={nextAppointment}
              onChange={(e) => setNextAppointment(e.target.value)}
              placeholder="e.g. After 1 week"
            />
          </label>
        </div>

        {error ? <p className={styles.error}>{error}</p> : null}

        <div className={styles.actions}>
          <button type="button" className={styles.cancelBtn} onClick={onClose} disabled={sending}>
            Cancel
          </button>
          <button type="button" className={styles.sendBtn} onClick={handleSend} disabled={sending}>
            {sending ? "Sending..." : "Send Prescription"}
          </button>
        </div>
      </div>
    </div>
  );
};

export default PrescriptionModal;
