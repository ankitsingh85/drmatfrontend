"use client";
import { API_URL } from "@/config/api";

import { useRouter } from "next/router";
import { useEffect, useState } from "react";
import styles from "@/styles/pages/clinicDetailPage.module.css";
import ClinicCard from "@/components/Layout/clinicCard";
import Footer from "@/components/Layout/Footer";
import Ratings from "@/components/Layout/Reviews";
import Topbar from "@/components/Layout/Topbar";
import { FaShoppingCart } from "react-icons/fa";
import { useCart } from "@/context/CartContext";

interface Clinic {
  _id: string;
  name: string;
  description?: string;
  address?: string;
  images?: string[];
  mobile?: string;
  whatsapp?: string;
  mapLink?: string;
  verified?: boolean;
  trusted?: boolean;
  reviews?: number;
}

interface Service {
  _id: string;
  serviceName: string;
  description: string;
  price: number;
  discountedPrice?: number;
  images?: string[];
  categories: { _id: string; name: string; image?: string }[];
  clinic: string;
}

interface Category {
  name: string;
  image?: string;
}

const ClinicDetailPage = () => {
  const router = useRouter();
  const { clinicId } = router.query;

  const { cartItems, addToCart } = useCart();

  const [clinic, setClinic] = useState<Clinic | null>(null);
  const [services, setServices] = useState<Service[]>([]);
  const [loadingClinic, setLoadingClinic] = useState(true);
  const [loadingServices, setLoadingServices] = useState(true);
  const [activeTab, setActiveTab] = useState<"Details" | "Services" | "Reviews">("Details");
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [error, setError] = useState("");
  const [activeCategory, setActiveCategory] = useState<string>("All");
  const [categories, setCategories] = useState<Category[]>([]);

  // const API_BASE = process.env.NEXT_PUBLIC_API_BASE || "http://localhost:5000/api";

  // Fetch clinic details
  useEffect(() => {
    if (!clinicId) return;
    const fetchClinic = async () => {
      setLoadingClinic(true);
      try {
        const res = await fetch(`${API_URL}/clinics/${clinicId}`);
        if (!res.ok) throw new Error("Failed to fetch clinic details");
        const data: Clinic = await res.json();
        setClinic(data);
        setSelectedImage(data.images?.[0] || null);
      } catch (err: any) {
        setError(err.message || "Error loading clinic");
      } finally {
        setLoadingClinic(false);
      }
    };
    fetchClinic();
  }, [clinicId, API_URL]);

  // Fetch services for this clinic
  useEffect(() => {
    if (!clinicId) return;
    const fetchServices = async () => {
      setLoadingServices(true);
      try {
        const res = await fetch(`${API_URL}/services?clinic=${clinicId}`);
        if (!res.ok) throw new Error("Failed to fetch services");
        const data: Service[] = await res.json();

        const clinicServices = data.filter((s) => s.clinic === clinicId);
        setServices(clinicServices);

        // Generate categories from services
        const catMap = new Map<string, Category>();
        clinicServices.forEach((service) => {
          service.categories.forEach((cat) => {
            if (!catMap.has(cat.name)) {
              catMap.set(cat.name, {
                name: cat.name,
                image: service.images?.[0]?.startsWith("data")
                  ? service.images[0]
                  : "/placeholder.png",
              });
            }
          });
        });

        setCategories([{ name: "All" }, ...Array.from(catMap.values())]);
      } catch (err) {
        console.error(err);
      } finally {
        setLoadingServices(false);
      }
    };
    fetchServices();
  }, [clinicId, API_URL]);

  const filteredServices =
    activeCategory === "All"
      ? services
      : services.filter((s) => s.categories.some((c) => c.name === activeCategory));

  if (loadingClinic) return <div className={styles.loading}>Loading clinic info...</div>;
  if (error) return <div className={styles.error}>{error}</div>;
  if (!clinic) return <div className={styles.error}>Clinic not found.</div>;

  return (
    <>
      <div className={styles.pageWrapper}>
        <Topbar />

        {/* Top Section */}
        <div className={styles.topSection}>
          <div className={styles.imageSection}>
            {(clinic.images || []).map((img, idx) => (
              <img
                key={idx}
                src={img.startsWith("data") ? img : `data:image/jpeg;base64,${img}`}
                onClick={() => setSelectedImage(img)}
                className={`${styles.sideImage} ${selectedImage === img ? styles.active : ""}`}
                alt={clinic.name}
              />
            ))}
          </div>

          <div className={styles.clinicCardSection}>
            <ClinicCard clinic={clinic} />
          </div>
        </div>

        {/* Tabs */}
        <div className={styles.tabContainer}>
          {["Details", "Services", "Reviews"].map((tab) => (
            <button
              key={tab}
              className={`${styles.tabButton} ${activeTab === tab ? styles.activeTab : ""}`}
              onClick={() => setActiveTab(tab as typeof activeTab)}
            >
              {tab}
            </button>
          ))}
        </div>

        {/* Tab Content */}
        {activeTab === "Details" && (
          <section className={styles.container}>
            <h2 className={styles.heading}>{clinic.name}</h2>
            <p className={styles.paragraph}>{clinic.description || "No description available"}</p>
            <h3 className={styles.subheading}>Address</h3>
            <p className={styles.paragraph}>{clinic.address || "Address not provided"}</p>
          </section>
        )}

        {activeTab === "Services" && (
          <section className={styles.servicesSection}>
            <aside className={styles.sidebar}>
              <h3 className={styles.categoryHeading}>Categories</h3>
              {categories.map((cat) => (
                <button
                  key={cat.name}
                  className={`${styles.categoryButton} ${
                    activeCategory === cat.name ? styles.activeCategory : ""
                  }`}
                  onClick={() => setActiveCategory(cat.name)}
                >
                  {cat.image && (
                    <img src={cat.image} alt={cat.name} className={styles.categoryImage} />
                  )}
                  <span>{cat.name}</span>
                </button>
              ))}
            </aside>

            <div className={styles.servicesContent}>
              {loadingServices ? (
                <p>Loading services...</p>
              ) : filteredServices.length === 0 ? (
                <p>No services available for this category.</p>
              ) : (
                filteredServices.map((service) => {
                  const inCart = cartItems.some((item) => item.id === service._id);

                  return (
                    <div key={service._id} className={styles.serviceCard}>
                      <img
                        src={
                          service.images?.[0]
                            ? service.images[0].startsWith("data")
                              ? service.images[0]
                              : `data:image/jpeg;base64,${service.images[0]}`
                            : "/placeholder.png"
                        }
                        alt={service.serviceName}
                        className={styles.serviceImage}
                      />

                      <div className={styles.serviceText}>
                        <h4>{service.serviceName}</h4>
                        <p dangerouslySetInnerHTML={{ __html: service.description }} />
                        {service.categories?.length > 0 && (
                          <p className={styles.categories}>
                            {service.categories.map((cat) => cat.name).join(", ")}
                          </p>
                        )}
                        <p className={styles.price}>
                          {service.discountedPrice ? (
                            <>
                              <span className={styles.originalPrice}>₹{service.price}</span>{" "}
                              <span className={styles.discountedPrice}>₹{service.discountedPrice}</span>
                            </>
                          ) : (
                            <>₹{service.price}</>
                          )}
                        </p>
                      </div>

                      <button
                        className={styles.addToCart}
                        onClick={() =>
                          inCart
                            ? router.push("/home/Cart")
                            : addToCart(
                                {
                                  id: service._id,
                                  name: service.serviceName,
                                  price: service.discountedPrice ?? service.price,
                                  mrp: service.price,
                                  discount: service.discountedPrice
                                    ? `${Math.round(
                                        ((service.price - service.discountedPrice) / service.price) *
                                          100
                                      )}% OFF`
                                    : undefined,
                                  discountPrice: service.discountedPrice,
                                  company: clinic.name,
                                  image: service.images?.[0] ?? "/placeholder.png",
                                },
                                1
                              )
                        }
                      >
                        <FaShoppingCart className={styles.icon} />
                        {inCart ? "Go to Cart" : "Add to Cart"}
                      </button>
                    </div>
                  );
                })
              )}
            </div>
          </section>
        )}

        {activeTab === "Reviews" && (
          <section>
            <div className={styles.reviewsContainer}>
              <Ratings />
              {clinic.reviews && clinic.reviews > 0 ? (
                <p>{clinic.reviews} people have reviewed this clinic.</p>
              ) : (
                <p>No reviews yet.</p>
              )}
            </div>
          </section>
        )}
      </div>

      <Footer />
    </>
  );
};

export default ClinicDetailPage;
