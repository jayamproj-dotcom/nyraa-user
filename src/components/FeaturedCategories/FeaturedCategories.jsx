import React, { useEffect, useRef, useState } from 'react';
import { Row, Col } from 'react-bootstrap';
import { FeaturedCategoryButton } from '../ui/Buttons';
import './FeaturedCategories.css';

const FeaturedCategories = () => {
  const leftCardRef = useRef(null);
  const rightContainerRef = useRef(null);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Fetch featured categories from API
  // useEffect(() => {
  //   const fetchCategories = async () => {
  //     try {
  //       setLoading(true);
  //       setError(null);
  //       let allProducts = [];
  //       let page = 1;
  //       let totalPages = 1;

  //       while (page <= totalPages) {
  //         const response = await fetch(`http://localhost:5000/api/products?page=${page}`);
  //         if (!response.ok) {
  //           throw new Error(`Failed to fetch products: ${response.statusText}`);
  //         }
  //         const data = await response.json();
  //         if (!data.success) {
  //           throw new Error(data.error || "API request failed");
  //         }
  //         const productArray = data.data?.products || [];
  //         if (!Array.isArray(productArray)) {
  //           throw new Error("Could not extract product array from API response");
  //         }
  //         allProducts = [...allProducts, ...productArray];
  //         totalPages = data.data?.pagination?.totalPages || 1;
  //         page++;
  //       }

  //       // Transform API data to match expected structure for FeaturedCategories
  //       const transformedData = allProducts
  //         .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
  //         .slice(0, 3)
  //         .map((item, index) => {
  //           const variants = Array.isArray(item.variants) ? item.variants : [];
  //           const firstVariant = variants[0] || {};
  //           const discountPrice = item.discount > 0 ? `From ₹${firstVariant.price || item.price || 0}` : null;
  //           const categoryName = typeof item.category === 'object' ? item.category?.category || 'Uncategorized' : item.category || 'Uncategorized';
  //           const categorySlug = typeof item.category === 'object' ? item.category?.cat_slug || generateSlug(categoryName) : generateSlug(categoryName);
  //           const titleName = typeof item.name === 'string' ? item.name : 'Unnamed Product';
  //           return {
  //             largeImage: index === 0 ? item.image || item.images?.[0] || 'https://via.placeholder.com/740' : null,
  //             mediumImage1: index === 1 ? item.image || item.images?.[0] || 'https://via.placeholder.com/740' : null,
  //             mediumImage2: index === 2 ? item.image || item.images?.[0] || 'https://via.placeholder.com/740' : null,
  //             subTitle: categoryName,
  //             title: titleName,
  //             link: categorySlug,
  //             discountPrice,
  //           };
  //         });

  //       setCategories(transformedData);
  //       setLoading(false);
  //     } catch (err) {
  //       console.error("FeaturedCategories: Failed to load products:", err.message);
  //       setError(err.message);
  //       setCategories([]);
  //       setLoading(false);
  //     }
  //   };

  //   fetchCategories();
  // }, []);

  useEffect(() => {
    const fetchCategories = async () => {
      try {
        setLoading(true);
        setError(null);
        let allProducts = [];
        let page = 1;
        let totalPages = 1;

        while (page <= totalPages) {
          const response = await fetch(`http://localhost:5000/api/products?page=${page}`);
          if (!response.ok) {
            throw new Error(`Failed to fetch products: ${response.statusText}`);
          }
          const data = await response.json();
          if (!data.success) {
            throw new Error(data.error || "API request failed");
          }
          const productArray = data.data?.products || [];
          if (!Array.isArray(productArray)) {
            throw new Error("Could not extract product array from API response");
          }
          allProducts = [...allProducts, ...productArray];
          totalPages = data.data?.pagination?.totalPages || 1;
          page++;
        }

        const BASE_URL = "http://localhost:5000"; // adjust for production

        // Transform API data for FeaturedCategories with variant images
        const transformedData = allProducts
          .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
          .slice(0, 3)
          .map((item, index) => {
            const variants = Array.isArray(item.variants) ? item.variants : [];
            const firstVariant = variants[0] || {};

            // Use first variant image or fallback
            const variantImage = firstVariant.images && firstVariant.images.length > 0
              ? firstVariant.images[0].startsWith("http")
                ? firstVariant.images[0]
                : `${BASE_URL}/uploads/variants/${firstVariant.images[0]}`
              : item.image || item.images?.[0] || 'https://via.placeholder.com/740';

            const categoryName = typeof item.category === 'object' ? item.category?.category || 'Uncategorized' : item.category || 'Uncategorized';
            const categorySlug = typeof item.category === 'object' ? item.category?.cat_slug || generateSlug(categoryName) : generateSlug(categoryName);
            const titleName = typeof item.name === 'string' ? item.name : 'Unnamed Product';
            const discountPrice = item.discount > 0 ? `From ₹${firstVariant.price || item.price || 0}` : null;

            return {
              largeImage: index === 0 ? variantImage : null,
              mediumImage1: index === 1 ? variantImage : null,
              mediumImage2: index === 2 ? variantImage : null,
              subTitle: categoryName,
              title: titleName,
              link: categorySlug,
              discountPrice,
            };
          });

        setCategories(transformedData);
        setLoading(false);
      } catch (err) {
        console.error("FeaturedCategories: Failed to load products:", err.message);
        setError(err.message);
        setCategories([]);
        setLoading(false);
      }
    };

    fetchCategories();
  }, []);


  const generateSlug = (name) => {
    return name
      .toLowerCase()
      .replace(/[^a-z0-9 -]/g, '')
      .replace(/\s+/g, '-')
      .replace(/-+/g, '-')
      .trim();
  };

  useEffect(() => {
    const handleMargin = () => {
      const leftCard = leftCardRef.current;
      const rightContainer = rightContainerRef.current;

      if (!leftCard || !rightContainer) return;

      if (window.innerWidth < 768) {
        leftCard.style.marginTop = '0px';
        leftCard.style.height = 'auto';
        rightContainer.style.height = 'auto';
        return;
      }

      const leftHeight = leftCard.offsetHeight;
      const rightHeight = rightContainer.offsetHeight;
      const maxHeight = Math.max(leftHeight, rightHeight);

      leftCard.style.height = `${maxHeight}px`;
      rightContainer.style.height = `${maxHeight}px`;

      const offset = (rightHeight - leftHeight) / 2;
      leftCard.style.marginTop = `${offset > 0 ? offset : 0}px`;
    };

    handleMargin();
    window.addEventListener('resize', handleMargin);

    return () => window.removeEventListener('resize', handleMargin);
  }, [categories]);

  if (loading) {
    return (
      <section className="featured-section">
        <div className="text-center py-5">
          <div className="spinner"></div>
        </div>
      </section>
    );
  }

  if (error) {
    return (
      <section className="featured-section">
        <div className="text-center py-5">
          <h5>Error: {error}</h5>
          <button type="button" className="btn btn-primary" onClick={() => window.location.reload()}>
            Retry
          </button>
        </div>
      </section>
    );
  }

  if (categories.length === 0) {
    return (
      <section className="featured-section">
        <div className="text-center py-5">
          <h5>No featured products available</h5>
        </div>
      </section>
    );
  }

  return (
    <section className="featured-section">
      <div className="featured-wrapper">
        <h2 className="featured-heading text-center mb-5">Featured Clothing Collections</h2>
        <Row className="g-4">
          <Col md={6} xs={12} ref={leftCardRef}>
            <div className="featured-card shadow rounded overflow-hidden mt-4">
              <div
                className="image-hover"
                style={{
                  backgroundImage: categories[0]?.largeImage ? `url(${categories[0].largeImage})` : 'url(https://via.placeholder.com/740)',
                  backgroundSize: 'cover',
                  backgroundPosition: 'center',
                  minHeight: '450px',
                  width: '100%',
                }}
                onError={(e) => {
                  e.currentTarget.style.backgroundImage = 'url(https://via.placeholder.com/740)';
                }}
              ></div>
              <div className="p-4 text-center">
                <small className="text-uppercase text-muted sub-title">{categories[0]?.subTitle}</small>
                <h3 className="fw-bold title">{categories[0]?.title}</h3>
                {categories[0]?.discountPrice && <p className="discount-price">{categories[0].discountPrice}</p>}
                <div className="mt-3">
                  <FeaturedCategoryButton
                    link={categories[0]?.link}
                    basePath="/collections"
                    label="Discover Now"
                  />
                </div>
              </div>
            </div>
          </Col>

          <Col md={6} xs={12} ref={rightContainerRef}>
            <Row className="g-4">
              <Col md={12} xs={12}>
                <div className="d-flex flex-column-reverse flex-md-row bg-white shadow rounded overflow-hidden featured-card">
                  <div className="p-4 d-flex flex-column justify-content-center text-center" style={{ flex: '1 1 50%' }}>
                    <small className="text-uppercase text-muted sub-title">{categories[1]?.subTitle}</small>
                    <h3 className="fw-bold title">{categories[1]?.title}</h3>
                    {categories[1]?.discountPrice && <p className="discount-price">{categories[1].discountPrice}</p>}
                    <div className="mt-3">
                      <FeaturedCategoryButton
                        link={categories[1]?.link}
                        basePath="/collections"
                        label="Discover Now"
                      />
                    </div>
                  </div>
                  <div
                    className="image-hover"
                    style={{
                      flex: '1 1 50%',
                      backgroundImage: categories[1]?.mediumImage1 ? `url(${categories[1].mediumImage1})` : 'url(https://via.placeholder.com/740)',
                      backgroundSize: 'cover',
                      backgroundPosition: 'center',
                      minHeight: '300px',
                      width: '100%',
                    }}
                    onError={(e) => {
                      e.currentTarget.style.backgroundImage = 'url(https://via.placeholder.com/740)';
                    }}
                  ></div>
                </div>
              </Col>

              <Col md={12} xs={12}>
                <div className="d-flex flex-column flex-md-row bg-white shadow rounded overflow-hidden featured-card mt-3">
                  <div
                    className="image-hover"
                    style={{
                      flex: '1 1 50%',
                      backgroundImage: categories[2]?.mediumImage2 ? `url(${categories[2].mediumImage2})` : 'url(https://via.placeholder.com/740)',
                      backgroundSize: 'cover',
                      backgroundPosition: 'center',
                      minHeight: '300px',
                      width: '100%',
                    }}
                    onError={(e) => {
                      e.currentTarget.style.backgroundImage = 'url(https://via.placeholder.com/740)';
                    }}
                  ></div>
                  <div className="p-4 d-flex flex-column justify-content-center text-center" style={{ flex: '1 1 50%' }}>
                    <small className="text-uppercase text-muted sub-title">{categories[2]?.subTitle}</small>
                    <h3 className="fw-bold title">{categories[2]?.title}</h3>
                    {categories[2]?.discountPrice && <p className="discount-price">{categories[2].discountPrice}</p>}
                    <div className="mt-3">
                      <FeaturedCategoryButton
                        link={categories[2]?.link}
                        basePath="/collections"
                        label="Discover Now"
                      />
                    </div>
                  </div>
                </div>
              </Col>
            </Row>
          </Col>
        </Row>
      </div>
    </section>
  );
};

export default FeaturedCategories;