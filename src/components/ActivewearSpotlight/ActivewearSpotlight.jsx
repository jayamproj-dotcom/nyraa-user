import React, { useEffect, useState } from "react";
import { Row, Col } from "react-bootstrap";
import { FeaturedCategoryButton } from "../ui/Buttons";

const BASE_URL = "http://localhost:5000/"; // backend static files base

const ActivewearSpotlight = () => {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // -----------------------------
  // Fetch products
  // -----------------------------
  useEffect(() => {
    const fetchProducts = async () => {
      try {
        setLoading(true);
        setError(null);

        let allProducts = [];
        let page = 1;
        let totalPages = 1;

        while (page <= totalPages) {
          const response = await fetch(
            `http://localhost:5000/api/products?page=${page}`
          );

          if (!response.ok) {
            throw new Error(`Failed to fetch products`);
          }

          const data = await response.json();

          if (!data.success) {
            throw new Error(data.error || "API request failed");
          }

          const productArray = data.data?.products || [];
          allProducts = [...allProducts, ...productArray];

          totalPages = data.data?.pagination?.totalPages || 1;
          page++;
        }

        // -----------------------------
        // Pick latest Activewear product
        // -----------------------------
        const activewearProduct = allProducts
          .filter((item) => {
            const categoryName =
              typeof item.category === "object"
                ? item.category?.category
                : item.category;
            return categoryName?.toLowerCase() === "activewear";
          })
          .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
          .slice(0, 1);

        // -----------------------------
        // Pick latest Accessories product
        // -----------------------------
        const accessoriesProduct = allProducts
          .filter((item) => {
            const categoryName =
              typeof item.category === "object"
                ? item.category?.category
                : item.category;
            return categoryName?.toLowerCase() === "accessories";
          })
          .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
          .slice(0, 1);

        // -----------------------------
        // Transform data (USE VARIANT IMAGES)
        // -----------------------------
        const transformedData = [
          ...activewearProduct,
          ...accessoriesProduct,
        ].map((item) => {
          const variants = Array.isArray(item.variants) ? item.variants : [];
          const firstVariant = variants[0] || {};

          // 🔥 Variant image priority
          // const imageUrl =
          //   firstVariant.images?.[0]
          //     ? BASE_URL + firstVariant.images[0]
          //     : item.image
          //       ? BASE_URL + item.image
          //       : item.images?.[0]
          //         ? BASE_URL + item.images[0]
          //         : "https://via.placeholder.com/250";

          const imageUrl = firstVariant.images[0];

          const discountPrice =
            item.discount > 0
              ? `From ₹${firstVariant.price || item.price || 0}`
              : null;

          const categoryName =
            typeof item.category === "object"
              ? item.category?.category || "Uncategorized"
              : item.category || "Uncategorized";

          const categorySlug =
            typeof item.category === "object"
              ? item.category?.cat_slug || generateSlug(categoryName)
              : generateSlug(categoryName);

          return {
            title: categoryName,
            subtitle: item.name || "Unnamed Product",
            imageUrl,
            discountPrice,
            categorySlug,
          };
        });

        setItems(transformedData);
        setLoading(false);
      } catch (err) {
        console.error("ActivewearSpotlight Error:", err);
        setError(err.message);
        setItems([]);
        setLoading(false);
      }
    };

    fetchProducts();
  }, []);

  // -----------------------------
  // Slug generator
  // -----------------------------
  const generateSlug = (name) =>
    name
      .toLowerCase()
      .replace(/[^a-z0-9 -]/g, "")
      .replace(/\s+/g, "-")
      .replace(/-+/g, "-")
      .trim();

  // -----------------------------
  // UI States
  // -----------------------------
  if (loading) {
    return (
      <section className="py-3 px-3 mx-3">
        <div className="text-center py-5">
          <div className="spinner"></div>
        </div>
      </section>
    );
  }

  if (error) {
    return (
      <section className="py-3 px-3 mx-3">
        <div className="text-center py-5">
          <h5>Error: {error}</h5>
          <button
            className="btn btn-primary"
            onClick={() => window.location.reload()}
          >
            Retry
          </button>
        </div>
      </section>
    );
  }

  if (items.length === 0) {
    return (
      <section className="py-3 px-3 mx-3">
        <div className="text-center py-5">
          <h5>No Activewear or Accessories products available</h5>
        </div>
      </section>
    );
  }

  // -----------------------------
  // Render
  // -----------------------------
  return (
    <section className="py-3 px-3 mx-3">
      <h2 className="text-center mb-5">
        Activewear & Accessories Spotlight
      </h2>

      <Row className="g-3">
        {items.map((item, index) => (
          <Col md={6} xs={12} key={index}>
            <div className="d-flex flex-column-reverse flex-md-row bg-white shadow rounded overflow-hidden">
              {/* Text */}
              <div
                className="p-3 d-flex flex-column justify-content-center text-center"
                style={{ flex: "1 1 50%" }}
              >
                <small className="text-uppercase text-muted">
                  {item.title}
                </small>
                <h3 className="fw-bold">{item.subtitle}</h3>
                {item.discountPrice && (
                  <p className="discount-price">{item.discountPrice}</p>
                )}

                <div className="mt-3">
                  <FeaturedCategoryButton
                    link={item.categorySlug}
                    basePath="/collections"
                    label="Discover Now"
                  />
                </div>
              </div>

              {/* Image */}
              <div
                style={{
                  flex: "1 1 50%",
                  backgroundImage: `url(${item.imageUrl})`,
                  backgroundSize: "cover",
                  backgroundPosition: "center",
                  minHeight: "250px",
                }}
              />
            </div>
          </Col>
        ))}
      </Row>
    </section>
  );
};

export default ActivewearSpotlight;
